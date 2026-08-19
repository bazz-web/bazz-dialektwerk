const { chromium } = require('playwright');
const path = require('path');

// --- KONFIGURATION ---
const RELEASE_RADAR_URL = "https://open.spotify.com/playlist/37i9dQZEVXbjY02oGpDKVH";
// Der EXAKTE Name deiner Ziel-Playlist auf Spotify (wie er in der Seitenleiste/Menü heisst):
const TARGET_PLAYLIST_NAME = "Mundart Release DJ";
// Der Link zu deiner Ziel-Playlist (zum Leeren der alten Tracks):
const TARGET_PLAYLIST_URL = "https://open.spotify.com/playlist/3Hg6UFbvhpiUCBoIqoGLET";

// Hilfsfunktion: Prüft 7-Tage-Fenster
function isWithinLast7Days(dateText) {
    if (!dateText) return true;
    const txt = dateText.toLowerCase();

    if (txt.includes('minut') || txt.includes('stund') || txt.includes('hour') || txt.includes('gestern') || txt.includes('yesterday')) {
        return true;
    }

    const matchTage = txt.match(/vor (\d+) tag/i) || txt.match(/(\d+) day/i);
    if (matchTage) {
        return parseInt(matchTage[1], 10) <= 7;
    }

    const parsed = Date.parse(dateText);
    if (!isNaN(parsed)) {
        const diffDays = (new Date() - new Date(parsed)) / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
    }

    return true;
}

async function starteVollautomatischerSync() {
    console.log("🤖 Vollautomatischer Spotify Agent gestartet...");

    const userDataDir = path.join(__dirname, '.spotify-user-data');
    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        args: ['--start-maximized'],
        viewport: null,
        locale: 'de-CH'
    });

    const page = context.pages()[0] || await context.newPage();

    try {
        // --- SCHRITT 1: ALTE TRACKS AUS DER ZIELPLAYLIST LÖSCHEN ---
        console.log("🧹 Öffne Ziel-Playlist zum Leeren...");
        await page.goto(TARGET_PLAYLIST_URL, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        const firstTrack = page.locator('div[data-testid="tracklist-row"]').first();
        if (await firstTrack.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log("🗑️ Lösche bisherige Songs...");
            await firstTrack.click();
            await page.keyboard.press('Control+A');
            await page.waitForTimeout(500);
            await page.keyboard.press('Delete');
            await page.waitForTimeout(2000);
            console.log("✅ Ziel-Playlist erfolgreich geleert!");
        } else {
            console.log("ℹ️ Ziel-Playlist war bereits leer.");
        }

        // --- SCHRITT 2: NEUE TRACKS IM RELEASE RADAR FINDEN & HINZUFÜGEN ---
        console.log("\n📡 Öffne Release Radar...");
        await page.goto(RELEASE_RADAR_URL, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('div[data-testid="tracklist-row"]', { timeout: 30000 });
        await page.waitForTimeout(3000);

        const rows = page.locator('div[data-testid="tracklist-row"]');
        const count = await rows.count();
        console.log(`🔎 Analysiere ${count} Tracks im Release Radar...`);

        let addedCount = 0;

        for (let i = 0; i < count; i++) {
            const row = rows.nth(i);

            // Datum auslesen
            const dateCell = row.locator('div[role="gridcell"]').nth(3);
            const dateText = await dateCell.innerText().catch(() => '');

            const titleEl = row.locator('div[dir="auto"]').first();
            const trackTitle = await titleEl.innerText().catch(() => `Track ${i + 1}`);

            if (isWithinLast7Days(dateText)) {
                console.log(`  ➕ [${i + 1}] Füge hinzu: "${trackTitle}" (${dateText || 'diese Woche'})`);

                // Track fokussieren & Rechtsklick / Menü öffnen
                await row.scrollIntoViewIfNeeded();
                await row.click({ button: 'right' });
                await page.waitForTimeout(400);

                // Im Kontextmenü auf "Zu Playlist hinzufügen" hovern
                const addToPlaylistOption = page.locator('span:has-text("Zu Playlist hinzufügen"), span:has-text("Add to playlist")').first();
                if (await addToPlaylistOption.isVisible({ timeout: 3000 })) {
                    await addToPlaylistOption.hover();
                    await page.waitForTimeout(500);

                    // Name deiner Ziel-Playlist anklicken
                    const targetOption = page.locator(`button:has-text("${TARGET_PLAYLIST_NAME}"), span:has-text("${TARGET_PLAYLIST_NAME}")`).first();
                    if (await targetOption.isVisible({ timeout: 3000 })) {
                        await targetOption.click();
                        addedCount++;
                        await page.waitForTimeout(600);
                    } else {
                        // Klick ins Leere zum Schliessen des Menüs
                        await page.keyboard.press('Escape');
                    }
                } else {
                    await page.keyboard.press('Escape');
                }
            } else {
                console.log(`  ⏭️ [${i + 1}] Übersprungen (älter als 7 Tage): "${trackTitle}" (${dateText})`);
            }
        }

        console.log(`\n🎉 Fertig! Insgesamt wurden ${addedCount} neue Releases in "${TARGET_PLAYLIST_NAME}" hinzugefügt.`);

    } catch (err) {
        console.error("❌ Fehler im Ablauf:", err.message);
    } finally {
        await page.waitForTimeout(2000);
        await context.close();
    }
}

starteVollautomatischerSync();