// Funktion um ein Modal zu öffnen oder zu schliessen (beibehalten)
function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal.classList.contains('show-modal')) {
        modal.classList.remove('show-modal');
    } else {
        modal.classList.add('show-modal');
    }
}

// Schliesst das Modal beim Klick auf den Hintergrund (beibehalten)
window.onclick = function (event) {
    if (event.target.classList.contains('modal-overlay')) {
        event.target.classList.remove('show-modal');
    }
}

// --- UNSER ANGEPASSTES SKRIPT ---
function openModalFromHash() {
    // Holt das Wort aus der URL (z. B. "#modal-claim")
    const targetHash = window.location.hash;

    if (targetHash) {
        // Sucht das Element mit dieser ID auf der Seite
        const targetElement = document.querySelector(targetHash);

        if (targetElement) {
            // 1. Zuerst räumen wir auf: Schließe alle evtl. offenen Modals
            document.querySelectorAll('.show-modal').forEach(el => {
                el.classList.remove('show-modal');
            });

            // 2. Jetzt geben wir dem Ziel-Element die richtige Klasse zum Öffnen
            targetElement.classList.add('show-modal');
        } else {
            console.warn("Modal mit der ID " + targetHash + " wurde nicht gefunden.");
        }
    }
}

// Führt das Skript aus, sobald die Seite geladen ist
document.addEventListener("DOMContentLoaded", openModalFromHash);

// Führt das Skript aus, falls sich der #Hash ändert
window.addEventListener("hashchange", openModalFromHash);