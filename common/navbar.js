document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("navbar-placeholder");
    if (!container) return;

    // 1. navbar.html nachladen
    fetch("../common/navbar.html")
        .then((response) => {
            if (!response.ok) throw new Error("Navbar konnte nicht geladen werden.");
            return response.text();
        })
        .then((data) => {
            container.innerHTML = data;

            // 2. Aktiven Link basierend auf der aktuellen URL hervorheben
            const currentPath = window.location.pathname.split("/").pop() || "index.html";
            const navItems = container.querySelectorAll(".nav-item");

            navItems.forEach((item) => {
                const href = item.getAttribute("href");
                if (href === currentPath) {
                    item.classList.add("active");
                } else if (href !== "#top") {
                    item.classList.remove("active");
                }
            });

            // 3. Lucide-Icons rendern
            if (window.lucide) {
                lucide.createIcons();
            }
        })
        .catch((error) => console.error("Fehler beim Laden der Navbar:", error));
});