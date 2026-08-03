const { chromium } = require('playwright');
const fs = require('fs');

// 1. Hier hinterlegst du die genauen Spotify-Links deiner Künstler
const kuenstlerListe = [
    { name: "Polo Hofer", url: "https://open.spotify.com/intl-de/artist/5J0q4JXRlR7EjwTU8gThxF" },
    { name: "Mani Matter", url: "https://open.spotify.com/intl-de/artist/7wkPBPwF9oOZJ8lEbQjIVt" },
    { name: "Patent Ochsner", url: "https://open.spotify.com/intl-de/artist/4Cfx9c45o8GigUIYzDie9B" },
    { name: "Gölä", url: "https://open.spotify.com/intl-de/artist/4F1AR2riVsph5RX9fmmem6" },
    { name: "Züri West", url: "https://open.spotify.com/intl-de/artist/5whb6si9KY0ywOL5zeRlV9" },
    { name: "Stiller Has", url: "https://open.spotify.com/intl-de/artist/7Dx5lvBjcVJqVVrzh12BaQ" },
    { name: "Lo & Leduc", url: "https://open.spotify.com/intl-de/artist/4VxxrJptDJKGOsKvb8jcVe" },
    { name: "Sina", url: "https://open.spotify.com/intl-de/artist/247FRQa4LHRl35cojaAxTh" },
    { name: "Kunz", url: "https://open.spotify.com/intl-de/artist/30RSfdFlYhqrXr6c4c2xJJ" },
    { name: "Hecht", url: "https://open.spotify.com/intl-de/artist/5WesSfZwdtLI1iy05rJF0S" },
    { name: "LUUK", url: "https://open.spotify.com/intl-de/artist/0gmyQ8yVCO4u4QZgwTnw2P" },
    { name: "Chico Chicago", url: "https://open.spotify.com/intl-de/artist/1Fihq9AFMB4uYoe4JkvbV2" },
    { name: "Jule X", url: "https://open.spotify.com/intl-de/artist/1TSeKOGQXY1ERc745kFTJ0" },
    { name: "Nativ", url: "https://open.spotify.com/intl-de/artist/7ufLkxlHrq3NRaS1fCHOgq" },
    { name: "Z The Freshman", url: "https://open.spotify.com/intl-de/artist/3YshwEx2EoJtYkJILG1Bl0" },
    { name: "KAUZ", url: "https://open.spotify.com/intl-de/artist/7oMT69ON0BvZiRaTZp16QU" },
    { name: "Chaostruppe", url: "https://open.spotify.com/intl-de/artist/1vNymQH7ttHE5VM9oi6vqF" },
    { name: "Nemo (CH)", url: "https://open.spotify.com/intl-de/artist/1KbDYbNErlTGfWPENELJgM" },
    { name: "Rumpelstilz", url: "https://open.spotify.com/intl-de/artist/0Awxx6UQ6PYbjhn0FeXaIP" },
    { name: "Bligg", url: "https://open.spotify.com/intl-de/artist/1q4LHoD7IzquqGQR4YZRQr" },
    { name: "Stereo Luchs", url: "https://open.spotify.com/intl-de/artist/5FK3qokBQYxr7ZLkr8GVFn" },
    { name: "L Loko", url: "https://open.spotify.com/intl-de/artist/6iI54kPtuDGxFe6T3eIR53" },
    { name: "Drini", url: "https://open.spotify.com/intl-de/artist/5tRlhg6J2lBxI7Qb4IfL00" },
    { name: "Subzonic", url: "https://open.spotify.com/intl-de/artist/6OxIKvbAId3V5L5wlaKsLg" },
    { name: "Slime Spidey", url: "https://open.spotify.com/intl-de/artist/1CeTDGxQnhhakZoR3PHAI4" },
    { name: "Ty P", url: "https://open.spotify.com/intl-de/artist/7qO1smpzAoEBntT1QmoRAU" },
    { name: "N!vel", url: "https://open.spotify.com/intl-de/artist/6gnaRQCyxmb47BvZj5W9mT" },
    { name: "sonny", url: "https://open.spotify.com/intl-de/artist/1ffoFshgL2hKB98JlFp5yu" },
    { name: "gino", url: "https://open.spotify.com/intl-de/artist/2ko9XBQJQreb5d0lgEPkb5" },
    { name: "Un210known", url: "https://open.spotify.com/intl-de/artist/00WlywmoGTwmHuep1zdaxT" },
    { name: "Codec o", url: "https://open.spotify.com/intl-de/artist/5gQwfL3I4UsNAX72JtDPDL" },
    { name: "Reyan.Rami", url: "https://open.spotify.com/intl-de/artist/5sVxspHS0hLzIGnwJzyAw0" },
    { name: "Young Ars", url: "https://open.spotify.com/intl-de/artist/1SJ3f9se0Myb2Pmq9K3INj" },
    { name: "JK", url: "https://open.spotify.com/intl-de/artist/3aSHfoyZSOMBfu6RndUvJN" },
    { name: "LeRou", url: "https://open.spotify.com/intl-de/artist/1fvOwXI2Jw1JJFHMXHOuP7" },
    { name: "Moony", url: "https://open.spotify.com/intl-de/artist/38DHYfSalpiP9m0Ayhew2C" },
    { name: "Saimon Disko", url: "https://open.spotify.com/intl-de/artist/0VlCiMAdIJQezwrsreI1A0" },
    { name: "J-Roum", url: "https://open.spotify.com/intl-de/artist/1BbsfjrXVWvH9F7UHw8cWP" },
    { name: "Skip", url: "https://open.spotify.com/intl-de/artist/1sWe2nEb4VOOvCFBphBjkd" },
    { name: "ELIA", url: "https://open.spotify.com/intl-de/artist/3u0Nk9jfAH3jMOprtt0yY1" },
    { name: "Spittinheart", url: "https://open.spotify.com/intl-de/artist/4QQnV5hej3qHp48rBocpA7" },
    { name: "Projekt ET", url: "https://open.spotify.com/intl-de/artist/3hUFjTYTJU2m7I3lmwoDYk" },
    { name: "Venti", url: "https://open.spotify.com/intl-de/artist/6EyHukp19OesixXqBxvEdl" },
    { name: "Misandope", url: "https://open.spotify.com/intl-de/artist/3W2tGcu1gWov9Wn4nwCIGz" },
    { name: "KimBo", url: "https://open.spotify.com/intl-de/artist/12NFUdDp9qgA0HLlGwIK07" },
    { name: "Gimu", url: "https://open.spotify.com/artist/2muKkob1qrnt9ueJCcDrH3" },
    { name: "Visu", url: "https://open.spotify.com/intl-de/artist/4I7srhuM6k8L3cwMOj2fTp" },
    { name: "Arkenoa", url: "https://open.spotify.com/artist/3gPkLPsASd2DGRPeyPLp2E" },
    { name: "Dysto", url: "https://open.spotify.com/intl-de/artist/5Q9VlSBrRiOEcmsVGAl0MD" },
    { name: "amos.", url: "https://open.spotify.com/intl-de/artist/6OYVOGhu8NRz4O6rFd7d01" },
    { name: "Mimiks", url: "https://open.spotify.com/intl-de/artist/4Bg4oUbN39ECtRSb4xRSFw" },
    { name: "Steff la Cheffe", url: "https://open.spotify.com/intl-de/artist/0Wz7fR8K35NKtz7of2BdIU" },
    { name: "Midas", url: "https://open.spotify.com/intl-de/artist/6JaMzYQxHHPK8sF9AXizJd" },
    { name: "Mephisto", url: "https://open.spotify.com/artist/0iEMHL4sEepoqZdwdWqZeJ" },
    { name: "11Ä", url: "https://open.spotify.com/intl-de/artist/5XKVtIVxWu65G8SocPigqL" },
    { name: "Acid T", url: "https://open.spotify.com/intl-de/artist/1tpt41bQsiQxYNpdj34xRR" },
    { name: "ND Light", url: "https://open.spotify.com/intl-de/artist/0ew8hAboYAZPc8utFN3Ycf" },
    { name: "Morow", url: "https://open.spotify.com/intl-de/artist/4ZqnorBpjVLBQSwiRksOcZ" },
    { name: "Limmitt", url: "https://open.spotify.com/intl-de/artist/6hoLC247P0nYV2gDW13HbA" },
    { name: "REEVAH", url: "https://open.spotify.com/intl-de/artist/03OsW78fVC6X4Cltc178QN" },
    { name: "Saiizo", url: "https://open.spotify.com/artist/2XbObDPefRTeu1Fe67q7qq" },
    { name: "Jordan Parat", url: "https://open.spotify.com/intl-de/artist/4QHGxRolrlEEfAOdvhx0ko" },
    { name: "Hydrant Clique", url: "https://open.spotify.com/intl-de/artist/1fivUWDoxxj8Jhkapqp01Q" },
    { name: "4.0.5.8", url: "https://open.spotify.com/intl-de/artist/109vfUEA5smkZpaZ3ysLmn" },
    { name: "Comandantche", url: "https://open.spotify.com/intl-de/artist/7Fzq86V8eyWRFv7lDRqgAp" },
    { name: "Chilli Mari", url: "https://open.spotify.com/intl-de/artist/7w6AUKmYD57eVzS4kldhSt" },
    { name: "KPR", url: "https://open.spotify.com/intl-de/artist/2JqMveRphOz7HrFzPl6Nze" },
    { name: "TRUWVE", url: "https://open.spotify.com/artist/18Ag67Rt4yEWhqYRJcni4p" },
    { name: "Smo", url: "https://open.spotify.com/intl-de/artist/6ctNyTMnWNPnsT3Q3YxWvx" },
    { name: "Begi Jones", url: "https://open.spotify.com/intl-de/artist/3TFIupSNFmlwKWwn1T7tSY" },
    { name: "Distrust", url: "https://open.spotify.com/intl-de/artist/05nAXpxVQ2WooS4NMnezEz" },
    { name: "YT", url: "https://open.spotify.com/intl-de/artist/4ryXnepy2I2lInrDfGqnEV" },
    { name: "Jiggo267", url: "https://open.spotify.com/artist/1UafVMeoTGsYvzTOC9oNhZ" },
    { name: "Chlyklass", url: "https://open.spotify.com/artist/1qBjtwUEeQ3Ub1ABCbRgUT" },
    { name: "Equal", url: "https://open.spotify.com/artist/4KylxwmrTvWkgBWjLtCLbQ" },
    { name: "Misan", url: "https://open.spotify.com/intl-de/artist/3CVUQG6eeBIfpd6xLOyqqs" },
    { name: "jokesson", url: "https://open.spotify.com/intl-de/artist/5m7NDA0gGENBnuez6YHf8k" },
    { name: "Emporia", url: "https://open.spotify.com/intl-de/artist/1ah2GIfsCSuCpK1y1NOV4O" },
    { name: "Uest", url: "https://open.spotify.com/intl-de/artist/4Ax1WckPWf09kcpjulDrty" },
    { name: "Ill Padrino", url: "https://open.spotify.com/intl-de/artist/72OBHskNYbfbjWRt52Bvkz" },
    { name: "Damous", url: "https://open.spotify.com/intl-de/artist/43Dv7Ih4HnPC10IwEWqRXL" },
    { name: "Neza21", url: "https://open.spotify.com/intl-de/artist/4wLWXSXmClwG8DPN8LQjHn" },
    { name: "san mattia", url: "https://open.spotify.com/intl-de/artist/1cisvq85CCxyU1EPjLH3OK" },
    { name: "J.JKR", url: "https://open.spotify.com/intl-de/artist/1MCoeTCpYs0QJsZCCspymg" },
    { name: "RIO", url: "https://open.spotify.com/intl-de/artist/3m8ednDOE6bs8umbbO9ePI" },
    { name: "Mehdi", url: "https://open.spotify.com/intl-de/artist/4Q024fygtKoy7H6djhb0IV" },
    { name: "NATE", url: "https://open.spotify.com/intl-de/artist/6dsNtXb5ofuGFY83ypKmn5" },
    { name: "Loftus & Rose", url: "https://open.spotify.com/intl-de/artist/6M59DjcEay4k042b5E7Fc4" },
    { name: "Jaru", url: "https://open.spotify.com/intl-de/artist/1aOqjUJVTxFje62SwfOq7M" },
    { name: "S.M.D Music", url: "https://open.spotify.com/intl-de/artist/57Bnm5iok722OBhRW8BvHA" },
    { name: "LIV", url: "https://open.spotify.com/intl-de/artist/4pw7Mbk0DDfe90FRWlXIzA" },
    { name: "Nikn", url: "https://open.spotify.com/artist/00j6CgtPwkBd1lauSjUQFF" },
    { name: "Randnotiz", url: "https://open.spotify.com/intl-de/artist/5WEAFzR4J34zo1T1BK2wRZ" },
    { name: "Schingeli", url: "https://open.spotify.com/intl-de/artist/6MCwUIisNB2N2EB9Bbzq60" },
    { name: "Süde", url: "https://open.spotify.com/artist/3yCLPO417ZWP3Dk8eEgBDn" },
    { name: "Kater Karlo", url: "https://open.spotify.com/intl-de/artist/213ucbjZlUrpeRKiErg6Ha" },
    { name: "MzumO", url: "https://open.spotify.com/intl-de/artist/71Y5BVR2HPFrz2wBttFtvu" },
    { name: "SGB", url: "https://open.spotify.com/intl-de/artist/34qU3tniwguPrspGwdtBwO" },
    { name: "ZAYAX", url: "https://open.spotify.com/intl-de/artist/4GATxrAECI0a3CJd7Nbmp1" },
    { name: "WiiTundBreiT", url: "https://open.spotify.com/intl-de/artist/2G4ZlIX2FmgoYLj7irSxl8" }
];

async function starteAgent() {
    console.log("🤖 Lokaler KI-Agent mit Playwright gestartet. Starte Browser...");

    // Browser im Hintergrund öffnen (headless: true bedeutet, du siehst den Browser nicht)
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        // Wir setzen die Sprache auf Deutsch, damit Spotify "monatliche Hörer" anzeigt
        locale: 'de-DE'
    });
    const page = await context.newPage();

    const ergebnisse = [];

    // 2. Gehe jeden Künstler in der Liste nacheinander durch
    for (const kuenstler of kuenstlerListe) {
        try {
            console.log(`Lade Daten für ${kuenstler.name}...`);
            await page.goto(kuenstler.url, { waitUntil: 'domcontentloaded' });

            // Suche auf der Seite nach dem Text "monatliche Hörer" (oder "monthly listeners" als Backup)
            const listenersLocator = page.locator('text=monatliche Hörer').or(page.locator('text=monthly listeners')).first();

            // Gib der Seite maximal 5 Sekunden Zeit, das Element zu laden
            await listenersLocator.waitFor({ timeout: 5000 });

            // Lese den gefundenen Text aus
            const textInhalt = await listenersLocator.innerText();

            // Filtere nur die Zahlen heraus (z.B. "355.000 monatliche Hörer" -> 355000)
            const hoererZahl = parseInt(textInhalt.replace(/[^0-9]/g, ''), 10);

            ergebnisse.push({
                name: kuenstler.name,
                listeners: isNaN(hoererZahl) ? null : hoererZahl
            });

            console.log(`✅ ${kuenstler.name}: ${hoererZahl} Hörer`);

            // Eine kurze Pause von 2 Sekunden, um Spotify nicht mit Anfragen zu überfluten
            await page.waitForTimeout(2000);

        } catch (error) {
            console.error(`❌ Fehler bei ${kuenstler.name}: Konnte Hörerzahl nicht finden.`);
            ergebnisse.push({ name: kuenstler.name, listeners: null });
        }
    }

    // Browser schließen, wenn alle Künstler abgefragt wurden
    await browser.close();

    // 3. Daten in eine JSON-Datei speichern
    fs.writeFileSync('spotify-daten.json', JSON.stringify(ergebnisse, null, 2));
    console.log("\n🎉 Fertig! Die Daten wurden in 'spotify-daten.json' gespeichert.");
}

// Skript ausführen
starteAgent();