const SpotifyWebApi = require('spotify-web-api-node');
const http = require('http');
const { exec } = require('child_process');

// --- KONFIGURATION ---
const CLIENT_ID = 'bb21ed24402546a8a7428884dfff672a';
const CLIENT_SECRET = 'dca03a3a0fcd47f89d3432c5918607bf';
const REDIRECT_URI = 'http://127.0.0.1:8888/callback';
const TARGET_PLAYLIST_ID = '3Hg6UFbvhpiUCBoIqoGLET'; // Die ID deiner Ziel-Playlist
const RELEASE_RADAR_PLAYLIST_ID = '37i9dQZEVXbjY02oGpDKVH'; // Deine Release Radar ID hier einfügen


const spotifyApi = new SpotifyWebApi({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUri: REDIRECT_URI
});

// 1. Lokaler Server für die Autorisierung
async function authenticateUser() {
    return new Promise((resolve, reject) => {
        const scopes = [
            'playlist-read-private',
            'playlist-modify-public',
            'playlist-modify-private'
        ];
        const authorizeURL = spotifyApi.createAuthorizeURL(scopes, 'radar-state');

        const server = http.createServer(async (req, res) => {
            const reqUrl = new URL(req.url, `http://${req.headers.host}`);
            if (reqUrl.pathname === '/callback') {
                const code = reqUrl.searchParams.get('code');
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h2>Erfolgreich angemeldet! Du kannst diesen Tab schliessen.</h2>');
                server.close();

                try {
                    const data = await spotifyApi.authorizationCodeGrant(code);
                    spotifyApi.setAccessToken(data.body['access_token']);
                    spotifyApi.setRefreshToken(data.body['refresh_token']);
                    resolve();
                } catch (err) {
                    reject(err);
                }
            }
        }).listen(8888, () => {
            console.log("🌐 Öffne Browser zur Spotify-Autorisierung...");
            const startCmd = process.platform === 'win32' ? 'start' : 'open';
            exec(`${startCmd} "${authorizeURL}"`);
        });
    });
}

// 2. Release Radar ID ermitteln
async function getReleaseRadarId() {
    if (RELEASE_RADAR_PLAYLIST_ID && RELEASE_RADAR_PLAYLIST_ID.trim() !== '') {
        return RELEASE_RADAR_PLAYLIST_ID.trim();
    }

    console.log("🔍 Suche deinen persönlichen 'Release Radar'...");
    const userPlaylists = await spotifyApi.getUserPlaylists({ limit: 50 });
    const radar = userPlaylists.body.items.find(p =>
        p.name.toLowerCase().includes('release radar') ||
        p.name.toLowerCase().includes('radar der neuerscheinungen')
    );

    if (radar) {
        return radar.id;
    }

    // Fallback über globale Suche
    const searchRes = await spotifyApi.searchPlaylists('Release Radar', { limit: 5 });
    if (searchRes.body.playlists.items.length > 0) {
        return searchRes.body.playlists.items[0].id;
    }

    throw new Error("Release Radar Playlist konnte nicht gefunden werden. Bitte trage die ID manuell bei 'RELEASE_RADAR_PLAYLIST_ID' ein.");
}

// 3. Hauptlogik
async function starteRadarAgent() {
    try {
        console.log("🤖 Release-Radar-Agent gestartet...");
        await authenticateUser();
        console.log("🔓 Login erfolgreich!");

        // Zeitfenster: Letzte 7 Tage
        const now = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);

        console.log(`📅 Zeitfilter: ${oneWeekAgo.toISOString().split('T')[0]} bis ${now.toISOString().split('T')[0]}`);

        const radarId = await getReleaseRadarId();
        console.log(`📡 Release Radar ID gefunden: ${radarId}`);

        // Tracks aus Release Radar abrufen
        const radarTracksRes = await spotifyApi.getPlaylistTracks(radarId);
        const radarItems = radarTracksRes.body.items;

        console.log(`🎧 ${radarItems.length} Tracks im Release Radar analysieren...`);

        const validTrackUris = [];

        for (const item of radarItems) {
            if (!item.track || !item.track.album) continue;

            const track = item.track;
            const releaseDate = new Date(track.album.release_date);
            const artistNames = track.artists.map(a => a.name).join(', ');

            // Prüfen, ob Track in den letzten 7 Tagen erschienen ist
            if (releaseDate >= oneWeekAgo && releaseDate <= now) {
                console.log(`  ✨ [${track.album.release_date}] ${artistNames} - "${track.name}"`);
                validTrackUris.push(track.uri);
            }
        }

        console.log(`\n🎵 ${validTrackUris.length} qualifizierte Tracks der letzten Woche gefunden.`);

        // 4. Ziel-Playlist leeren
        console.log("🧹 Leere vorherigen Inhalt der Ziel-Playlist...");
        const targetPlaylist = await spotifyApi.getPlaylistTracks(TARGET_PLAYLIST_ID, { fields: 'items(track(uri))' });
        const tracksToRemove = targetPlaylist.body.items
            .filter(item => item.track && item.track.uri)
            .map(item => ({ uri: item.track.uri }));

        if (tracksToRemove.length > 0) {
            for (let i = 0; i < tracksToRemove.length; i += 100) {
                const chunk = tracksToRemove.slice(i, i + 100);
                await spotifyApi.removeTracksFromPlaylist(TARGET_PLAYLIST_ID, chunk);
            }
            console.log("🗑️ Alte Tracks entfernt.");
        }

        // 5. Neue Tracks einfügen
        if (validTrackUris.length > 0) {
            console.log("📥 Füge neue Releases in die Playlist ein...");
            for (let i = 0; i < validTrackUris.length; i += 100) {
                const chunk = validTrackUris.slice(i, i + 100);
                await spotifyApi.addTracksToPlaylist(TARGET_PLAYLIST_ID, chunk);
            }
            console.log("🎉 Playlist erfolgreich aktualisiert!");
        } else {
            console.log("ℹ️ Keine neuen Releases aus den letzten 7 Tagen im Radar vorhanden.");
        }

    } catch (error) {
        console.error("❌ Fehler:", error.message || error);
    }
}

starteRadarAgent();