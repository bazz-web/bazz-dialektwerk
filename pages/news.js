// Elemente aus dem DOM holen
const createNewsBtn = document.getElementById("createNewsBtn");

// 4. Klick auf "Erstellen" leitet zur Editor-Seite weiter
createNewsBtn.addEventListener("click", () => {
    // Hier geben wir den Pfad zur neuen Seite an, die wir noch programmieren
    window.location.href = "editor.html";
});