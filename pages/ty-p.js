async function loadReleaseFromJSON() {
    try {
        const response = await fetch('./release.json');
        if (!response.ok) throw new Error('release.json konnte nicht geladen werden');

        const data = await response.json();

        // 1. Titel & Artist setzen
        const titleEl = document.getElementById("release-title");
        const artistEl = document.getElementById("release-artist");
        if (titleEl) titleEl.textContent = data.title;
        if (artistEl) artistEl.textContent = data.artist;

        // 2. Spotify Embed einfügen
        const spotifyContainer = document.getElementById("spotify-container");
        if (spotifyContainer && data.spotifyTrackId) {
            spotifyContainer.innerHTML = `
        <iframe 
          src="https://open.spotify.com/embed/track/${data.spotifyTrackId}?utm_source=generator&theme=0" 
          width="100%" 
          height="152" 
          frameborder="0" 
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
          loading="lazy">
        </iframe>
      `;
        }

        // 3. Platform Links einfügen
        const platformContainer = document.getElementById("platform-links");
        if (platformContainer && data.links) {
            platformContainer.innerHTML = ""; // Container leeren

            data.links.forEach(link => {
                const a = document.createElement("a");
                a.className = "platform-btn";
                a.href = link.url;
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                a.textContent = link.label;
                platformContainer.appendChild(a);
            });
        }

    } catch (err) {
        console.error("Fehler beim Verarbeiten der release.json:", err);
    }
}
