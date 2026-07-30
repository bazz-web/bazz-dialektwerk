document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("navbar-placeholder");
    if (!container) return;

    fetch("/common/navbar.html")
        .then((response) => {
            if (!response.ok) throw new Error("Navbar konnte nicht geladen werden.");
            return response.text();
        })
        .then((data) => {
            container.innerHTML = data;

            // Aktiven Link hervorheben
            const currentPath = window.location.pathname.split("/").pop() || "index.html";
            const navItems = container.querySelectorAll(".nav-item");

            navItems.forEach((item) => {
                if (item.getAttribute("href") === currentPath) {
                    item.classList.add("active");
                }
            });

            // Lucide Icons rendern
            if (typeof lucide !== "undefined") {
                lucide.createIcons();
            }
        })
        .catch((error) => console.error("Fehler beim Laden der Navbar:", error));
});

// Klick-Event GLOBAL auf dem Document
document.addEventListener("click", (e) => {
    const toggleBtn = e.target.closest("#nav-toggle");
    const navbar = document.getElementById("floating-navbar");

    if (toggleBtn && navbar) {
        e.preventDefault();
        e.stopPropagation();
        // Klasse toggle n
        navbar.classList.toggle("is-open");
        console.log("Navbar geklickt! Ist offen:", navbar.classList.contains("is-open"));
        return;
    }

    // Ausserhalb klicken schliesst die Leiste
    if (navbar && !navbar.contains(e.target)) {
        navbar.classList.remove("is-open");
    }
});