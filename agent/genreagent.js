const { chromium } = require('playwright');
const fs = require('fs');

// 1. Apple Music Künstler-Link hier eintragen
const APPLE_MUSIC_URL = "https://music.apple.com/ch/artist/morow/1304726590";

async function starteAppleMusicAgent(artistUrl) {
    console.log("🤖 Apple Music KI-Agent gestartet. Starte Browser...");

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        locale: 'de-DE',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    try {
        console.log(`🔎 Lade Künstlerseite: ${artistUrl}`);
        await page.goto(artistUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Cookie-Banner automatisch akzeptieren
        try {
            const cookieBtn = page.locator('button:has-text("Akzeptieren"), button:has-text("Accept")').first();
            if (await cookieBtn.isVisible({ timeout: 3000 })) {
                await cookieBtn.click();
            }
        } catch (e) {
            // Ignorieren
        }

        await page.waitForTimeout(3000);

        // 2. NEU: Releases auf der Künstlerseite direkt einordnen (Vor dem Klick)
        const releaseLinks = await page.evaluate(() => {
            const results = [];
            const uniqueUrls = new Set();

            // Wir suchen alle Überschriften auf dem Künstlerprofil
            const headings = Array.from(document.querySelectorAll('h2, h3'));

            for (const heading of headings) {
                const title = heading.innerText.toLowerCase();
                let typ = '';
                let gewicht = 0;

                // Anhand der Überschrift erkennen wir, was in diesem Abschnitt liegt
                if (title.includes('alben') || title.includes('albums') || title.includes('live')) {
                    typ = 'Album';
                    gewicht = 10;
                } else if (title.includes('single') || title.includes('ep')) {
                    typ = 'Single/EP';
                    gewicht = 3;
                } else if (title.includes('enthalten in') || title.includes('appears on') || title.includes('kompilation')) {
                    typ = 'Enthalten in';
                    gewicht = 1;
                }

                // Wenn wir einen gültigen Abschnitt gefunden haben, holen wir uns alle Links darin
                if (typ !== '') {
                    // Gehe im HTML nach oben, um den gesamten Block dieser Sektion zu fassen
                    let sectionEl = heading.closest('div.section') || heading.closest('section') || heading.closest('div[role="region"]') || heading.parentElement.parentElement.parentElement;

                    if (sectionEl) {
                        const links = Array.from(sectionEl.querySelectorAll('a[href*="/album/"]'));
                        for (const a of links) {
                            const cleanUrl = a.href.split('?')[0].split('#')[0];

                            // Speichern, falls Link neu ist
                            if (!uniqueUrls.has(cleanUrl)) {
                                uniqueUrls.add(cleanUrl);
                                results.push({
                                    url: cleanUrl,
                                    typ: typ,
                                    gewicht: gewicht
                                });
                            }
                        }
                    }
                }
            }

            // Wir geben nur die ersten 10 gefundenen Releases zurück
            return results.slice(0, 10);
        });

        if (releaseLinks.length === 0) {
            console.log("❌ Keine Veröffentlichungen gefunden.");
            await browser.close();
            return;
        }

        console.log(`📦 ${releaseLinks.length} Releases auf der Profilseite zugeordnet. Öffne Detailseiten für Genres...`);

        const releasesDetail = [];
        const genrePunkte = {};

        // 3. In die gefundenen Seiten navigieren (Nur noch fürs Genre)
        for (let i = 0; i < releaseLinks.length; i++) {
            const release = releaseLinks[i];
            const relPage = await context.newPage();

            try {
                await relPage.goto(release.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
                await relPage.waitForSelector('a[href*="/genre/"]', { timeout: 5000 }).catch(() => { });
                await relPage.waitForTimeout(1000);

                const releaseInfo = await relPage.evaluate(() => {
                    // Titel bereinigen
                    const titleMeta = document.querySelector('meta[property="og:title"]');
                    const ogTitle = titleMeta ? titleMeta.getAttribute('content') : '';
                    const title = ogTitle.replace('- Apple Music', '').replace(' - Single', '').replace(' - EP', '').trim();

                    // Genre auslesen
                    let genre = 'Unbekannt';
                    const genreLink = document.querySelector('a[href*="/genre/"]');

                    if (genreLink && genreLink.innerText) {
                        genre = genreLink.innerText.trim();
                    } else {
                        // Fallback 1: JSON-Metadaten
                        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
                        for (const script of scripts) {
                            try {
                                const data = JSON.parse(script.innerText);
                                if (data['@type'] === 'MusicAlbum' && data.genre) {
                                    genre = Array.isArray(data.genre) ? data.genre[0] : data.genre;
                                    break;
                                }
                            } catch (e) { }
                        }
                    }

                    if (genre === 'Unbekannt') {
                        // Fallback 2: Textbereich
                        const möglicheMetas = document.querySelectorAll('.product-meta, .headings__metadata-bottom, h3, h2, p');
                        for (const el of möglicheMetas) {
                            const text = el.innerText;
                            if (text && text.includes('·')) {
                                const teile = text.split('·');
                                if (teile[0].trim().length < 30) {
                                    genre = teile[0].trim();
                                    break;
                                }
                            }
                        }
                    }

                    return {
                        titel: title || 'Unbekannter Titel',
                        genre: genre
                    };
                });

                // Punkte verrechnen
                if (releaseInfo.genre !== 'Unbekannt') {
                    genrePunkte[releaseInfo.genre] = (genrePunkte[releaseInfo.genre] || 0) + release.gewicht;
                }

                releasesDetail.push({
                    nr: i + 1,
                    titel: releaseInfo.titel,
                    typ: release.typ,
                    genre: releaseInfo.genre,
                    gewichtung: `${release.gewicht}x (${release.typ})`,
                    url: release.url
                });

                console.log(`  ✅ [${i + 1}/10] "${releaseInfo.titel}" | Typ: ${release.typ} (${release.gewicht}x) | Genre: ${releaseInfo.genre}`);

            } catch (err) {
                console.error(`  ❌ Fehler bei Release ${i + 1}: Konnte Detailseite nicht laden.`);
            } finally {
                await relPage.close();
            }
        }

        // 4. Meistvorkommendes Genre berechnen
        let meistVorkommendesGenre = 'Kein eindeutiges Genre ermittelt';
        let hoechstePunkte = 0;

        for (const [genre, punkte] of Object.entries(genrePunkte)) {
            if (punkte > hoechstePunkte) {
                hoechstePunkte = punkte;
                meistVorkommendesGenre = genre;
            }
        }

        const endErgebnis = {
            kuenstlerUrl: artistUrl,
            meistVorkommendesGenre: meistVorkommendesGenre,
            genreGewichtungPunkte: genrePunkte,
            letzte10Releases: releasesDetail
        };

        // 5. Speichern
        fs.writeFileSync('applemusic-analyse.json', JSON.stringify(endErgebnis, null, 2));

        console.log("\n--------------------------------------------------");
        console.log(`🏆 Dominantes Genre (10x Album, 3x Single, 1x Enthalten in): ${meistVorkommendesGenre}`);
        console.log("📊 Punkte-Verteilung:", genrePunkte);
        console.log("🎉 Fertig! Ergebnisse wurden in 'applemusic-analyse.json' gespeichert.");

    } catch (error) {
        console.error(`❌ Fehler bei der Ausführung: ${error.message}`);
    } finally {
        await browser.close();
    }
}

// Skript ausführen
starteAppleMusicAgent(APPLE_MUSIC_URL);