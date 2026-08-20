const { chromium } = require('playwright');
const path = require('path');
const readline = require('readline');
const fs = require('fs');

// --- KONFIGURATION ---
const TARGET_PLAYLIST_NAME = "Mundart Release DJ";
const TARGET_PLAYLIST_URL = "https://open.spotify.com/playlist/3Hg6UFbvhpiUCBoIqoGLET";

function warteAufEnter(frage) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(frage, () => {
        rl.close();
        resolve();
    }));
}

function parseReleaseDatum(txt) {
    if (!txt) return null;
    const monate = {
        'januar': 0, 'jan': 0, 'jan.': 0,
        'februar': 1, 'feb': 1, 'feb.': 1,
        'märz': 2, 'mär': 2, 'mär.': 2,
        'april': 3, 'apr': 3, 'apr.': 3,
        'mai': 4,
        'juni': 5, 'jun': 5, 'jun.': 5,
        'juli': 6, 'jul': 6, 'jul.': 6,
        'august': 7, 'aug': 7, 'aug.': 7,
        'september': 8, 'sep': 8, 'sep.': 8,
        'oktober': 9, 'okt': 9, 'okt.': 9,
        'november': 10, 'nov': 10, 'nov.': 10,
        'dezember': 11, 'dez': 11, 'dez.': 11
    };

    const clean = txt.toLowerCase().trim();
    const match = clean.match(/(\d{1,2})\.\s*([a-zäöü\.]+)\s*(\d{4})/i);
    if (match) {
        const tag = parseInt(match[1], 10);
        const monat = monate[match[2].replace('.', '')];
        const jahr = parseInt(match[3], 10);
        if (monat !== undefined) return new Date(jahr, monat, tag);
    }

    const parsed = Date.parse(txt);
    if (!isNaN(parsed)) return new Date(parsed);

    return null;
}

// Track zu Ziel-Playlist hinzufügen
async function fuegeTrackZuPlaylistHinzu(page, trackRow, zielPlaylistName) {
    await trackRow.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    const moreBtn = trackRow.locator('button[data-testid="more-button"], button[aria-haspopup="menu"]').first();
    if (await moreBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await moreBtn.click();
    } else {
        await trackRow.click({ button: 'right' });
    }
    await page.waitForTimeout(500);

    const addToPlaylist = page.getByText(/Zu Playlist hinzufügen|Add to playlist/i).first();
    if (await addToPlaylist.isVisible({ timeout: 3000 })) {
        await addToPlaylist.hover();
        await page.waitForTimeout(500);

        const targetBtn = page.getByText(new RegExp(zielPlaylistName, 'i')).last();
        if (await targetBtn.isVisible({ timeout: 3000 })) {
            await targetBtn.click({ force: true });
            await page.waitForTimeout(700);
            return true;
        }
    }
    await page.keyboard.press('Escape');
    return false;
}

// ZWANGS-LÖSCHEN
async function leereZielPlaylist(page, targetUrl, playlistName) {
    console.log(`🧹 Öffne Playlist "${playlistName}" zum vollständigen Leeren...`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('main h1', { timeout: 15000 }).catch(() => { });
    await page.waitForTimeout(3000);

    const mainArea = page.locator('main');
    const trackRows = mainArea.locator('div[data-testid="tracklist-row"]');

    let failCount = 0;
    let geloescht = 0;

    console.log("  -> Lösche jeden Song einzeln...");

    while (true) {
        let count = await trackRows.count();
        if (count === 0) {
            await page.waitForTimeout(1500);
            count = await trackRows.count();
            if (count === 0) {
                console.log(`\n✅ Playlist ist absolut leer. Der Bot macht automatisch weiter!`);
                break;
            }
        }

        if (failCount > 5) {
            console.log("\n⚠️ Bot hängt beim Löschen. Lade Playlist neu...");
            await page.reload({ waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(3500);
            failCount = 0;
            continue;
        }

        const row = trackRows.first();
        await row.hover();
        await page.waitForTimeout(300);

        const moreBtn = row.locator('button[data-testid="more-button"]').last();
        if (await moreBtn.isVisible({ timeout: 1500 })) {
            await moreBtn.click({ force: true });
        } else {
            await row.click({ button: 'right' });
        }
        await page.waitForTimeout(500);

        const deleteOption = page.getByText(/Aus (dieser )?Playlist entfernen|Remove from (this )?playlist/i).last();

        if (await deleteOption.isVisible({ timeout: 2000 })) {
            await deleteOption.click({ force: true });
            failCount = 0;
            geloescht++;
            process.stdout.write(`\r  🗑️ ${geloescht} Song(s) entfernt...`);
            await page.waitForTimeout(1000);
        } else {
            await page.keyboard.press('Escape');
            failCount++;
            await page.waitForTimeout(500);
        }
    }
}

async function starteFeedAgent() {
    console.log("🤖 Starte Spotify 'Zuletzt erschienen' Agent...");

    const userDataDir = path.join(__dirname, '.spotify-user-data');
    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        args: ['--start-maximized'],
        viewport: null,
        locale: 'de-CH'
    });

    const page = context.pages()[0] || await context.newPage();
    let instaStoryLines = [];

    try {
        console.log("🌐 Öffne Spotify...");
        await page.goto("https://open.spotify.com", { waitUntil: 'domcontentloaded' });

        await warteAufEnter("\n👉 Bitte sicherstellen, dass du eingeloggt bist.\nDrücke danach hier ENTER... ");
        console.log("\n🚀 Gestartet!");

        await leereZielPlaylist(page, TARGET_PLAYLIST_URL, TARGET_PLAYLIST_NAME);

        console.log("\n🏠 Gehe auf Startseite -> Musik -> Gefolgt...");
        await page.goto("https://open.spotify.com", { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        const musikBtn = page.locator('button:has-text("Musik"), a:has-text("Musik")').first();
        if (await musikBtn.isVisible({ timeout: 5000 })) await musikBtn.click();
        await page.waitForTimeout(1000);

        const gefolgtBtn = page.locator('button:has-text("Gefolgt"), a:has-text("Gefolgt")').first();
        if (await gefolgtBtn.isVisible({ timeout: 5000 })) await gefolgtBtn.click();
        await page.waitForTimeout(2500);

        console.log("🔎 Lese Neuerscheinungen sicher aus dem Feed aus...");

        const seenUrls = new Set();

        // Sanftes Scrollen und Sammeln der Links
        for (let s = 0; s < 12; s++) {
            const currentLinks = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('main a[href*="/album/"]'));
                return links.map(a => a.href.split('?')[0]);
            });

            currentLinks.forEach(url => seenUrls.add(url));

            await page.mouse.wheel(0, 800);
            await page.waitForTimeout(1000);
        }

        const releaseLinks = Array.from(seenUrls);
        console.log(`📦 ${releaseLinks.length} Releases lückenlos gefunden. Prüfe Release-Daten...\n`);

        const heute = new Date();
        const vor7Tagen = new Date();
        vor7Tagen.setDate(heute.getDate() - 7);
        vor7Tagen.setHours(0, 0, 0, 0);

        let hinzugefuegtCount = 0;

        for (let i = 0; i < releaseLinks.length; i++) {
            const relUrl = releaseLinks[i];
            try {
                await page.goto(relUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

                // WICHTIG: Warten explizit auf den Titel im HAUPTFENSTER (main)
                await page.waitForSelector('main h1', { timeout: 10000 }).catch(() => { });
                await page.waitForTimeout(1000);

                const releaseInfo = await page.evaluate(() => {
                    // FIX: "Bibliothek" wird konsequent ignoriert
                    const mainH1 = document.querySelector('main h1');
                    let title = 'Unbekannt';

                    if (mainH1 && mainH1.innerText.trim() !== 'Bibliothek') {
                        title = mainH1.innerText.trim();
                    } else {
                        // Fallback: Sucht alle H1s, aber ignoriert "Bibliothek"
                        const fallbackH1 = Array.from(document.querySelectorAll('h1')).find(el => el.innerText.trim() !== 'Bibliothek' && el.innerText.trim() !== '');
                        if (fallbackH1) title = fallbackH1.innerText.trim();
                    }

                    const allTexts = Array.from(document.querySelectorAll('span, p, div')).map(el => el.innerText.trim());

                    let dateStr = '';
                    let type = 'Single';

                    for (const txt of allTexts) {
                        if (/(\d{1,2}\.\s+[a-zäöü\.]+\s+\d{4})/i.test(txt)) dateStr = txt;
                        if (txt === 'Album' || txt === 'EP' || txt === 'Single') type = txt;
                    }
                    return { title, dateStr, type };
                });

                const parsedDate = parseReleaseDatum(releaseInfo.dateStr);

                if (parsedDate && parsedDate >= vor7Tagen && parsedDate <= heute) {

                    const mainArea = page.locator('main');
                    await mainArea.locator('div[data-testid="tracklist-row"]').first().waitFor({ timeout: 8000 });
                    const firstTrackRow = mainArea.locator('div[data-testid="tracklist-row"]').first();

                    // INSTAGRAM-KÜNSTLER
                    const trackArtists = await firstTrackRow.evaluate(row => {
                        const artistEls = Array.from(row.querySelectorAll('a[href*="/artist/"]'));
                        return artistEls.map(a => a.innerText.trim()).filter(a => a !== '');
                    });

                    const artistsString = trackArtists.length > 0 ? trackArtists.slice(0, 3).join(' x ') : 'Unbekannt';

                    console.log(`  ✅ [NEU - ${releaseInfo.dateStr}] ${artistsString} - "${releaseInfo.title}" (${releaseInfo.type})`);

                    const erfolg = await fuegeTrackZuPlaylistHinzu(page, firstTrackRow, TARGET_PLAYLIST_NAME);

                    if (erfolg) {
                        hinzugefuegtCount++;

                        let displayTitle = releaseInfo.title;
                        if (releaseInfo.type === 'EP' || releaseInfo.type === 'Album') {
                            displayTitle = `${releaseInfo.title} (${releaseInfo.type})`;
                        }
                        instaStoryLines.push(`• ${artistsString} - ${displayTitle}`);
                    }

                } else if (parsedDate && parsedDate < vor7Tagen) {
                    console.log(`  🛑 [ALT - ${releaseInfo.dateStr}] "${releaseInfo.title}" ist älter als 7 Tage. Wir sind am Ende der Neuheiten! Stoppe Suche.`);
                    break;
                } else {
                    console.log(`  ⏭️ Überspringe "${releaseInfo.title}" (Datum: ${releaseInfo.dateStr || 'nicht gefunden'})`);
                }

            } catch (err) {
                console.log(`  ⚠️ Fehler beim Verarbeiten von ${relUrl}: ${err.message}`);
            }
        }

        console.log(`\n🎉 Fertig! Insgesamt wurden ${hinzugefuegtCount} Songs in "${TARGET_PLAYLIST_NAME}" hinzugefügt.`);

        // --- INSTAGRAM TEXT AUSGEBEN & SPEICHERN ---
        if (instaStoryLines.length > 0) {
            const storyText = instaStoryLines.join('\n');
            console.log("\n--- KOPIEREN FÜR INSTAGRAM ---");
            console.log(storyText);
            console.log("------------------------------\n");

            const filePath = path.join(__dirname, 'Insta-Story-Releases.txt');
            fs.writeFileSync(filePath, storyText, 'utf-8');
            console.log(`💾 Der fertige Text wurde für dein Handy gespeichert unter:\n   ${filePath}`);
        }

    } catch (err) {
        console.error("❌ Fehler:", err.message);
    } finally {
        await page.waitForTimeout(2000);
        await context.close();
    }
}

starteFeedAgent();