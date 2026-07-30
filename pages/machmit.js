// Funktion um ein Modal zu öffnen oder zu schliessen
function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal.classList.contains('show-modal')) {
        modal.classList.remove('show-modal');
    } else {
        modal.classList.add('show-modal');
    }
}

// Schliesst das Modal, wenn man ausserhalb des weissen Kastens (auf den Hintergrund) klickt
window.onclick = function (event) {
    if (event.target.classList.contains('modal-overlay')) {
        event.target.classList.remove('show-modal');
    }
}