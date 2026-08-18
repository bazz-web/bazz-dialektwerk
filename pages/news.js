document.addEventListener("DOMContentLoaded", () => {
    const createNewsBtn = document.getElementById("createNewsBtn");

    if (createNewsBtn) {
        createNewsBtn.addEventListener("click", () => {
            window.location.href = "editor.html";
        });
    } else {
        console.error("Button 'createNewsBtn' wurde im DOM nicht gefunden!");
    }
});