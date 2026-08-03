// Elemente aus dem DOM holen
const modal = document.getElementById("instructionModal");
const addNewsBtn = document.getElementById("addNewsBtn");
const closeBtn = document.querySelector(".close-btn");
const createNewsBtn = document.getElementById("createNewsBtn");

// 1. Klick auf den Plus-Button öffnet das Modal
addNewsBtn.addEventListener("click", () => {
    modal.style.display = "flex";
});

// 2. Klick auf das 'X' schliesst das Modal
closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
});

// 3. Klick irgendwo neben die Box schliesst das Modal ebenfalls
window.addEventListener("click", (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
    }
});

// 4. Klick auf "Erstellen" leitet zur Editor-Seite weiter
createNewsBtn.addEventListener("click", () => {
    // Hier geben wir den Pfad zur neuen Seite an, die wir noch programmieren
    window.location.href = "editor.html";
});