// Funktion zum Nachladen des HTMLs und Initialisieren aller Skripte
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById('filter-modal-container');

    if (container) {
        fetch('../common/filter.html')
            .then(response => response.text())
            .then(html => {
                container.innerHTML = html;
                // Erst wenn das HTML im DOM ist, starten wir die Logik
                initFilterModule();
            })
            .catch(error => console.error('Fehler beim Laden des Filter-Modals:', error));
    }
});

function initFilterModule() {
    // ==========================================
    // 1. MODAL ÖFFNEN / SCHLIESSEN LOGIK
    // ==========================================
    const openBtn = document.getElementById('open-filter-btn');
    const closeBtn = document.getElementById('close-filter-btn');
    const modal = document.getElementById('filter-modal');

    if (openBtn && modal) {
        openBtn.addEventListener('click', () => modal.classList.add('active'));
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    }

    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) modal.classList.remove('active');
        });
    }

    // ==========================================
    // 2. CUSTOM DROPDOWNS
    // ==========================================
    document.querySelectorAll('.custom-select-wrapper').forEach(wrapper => {
        const trigger = wrapper.querySelector('.custom-select-trigger');
        const triggerText = trigger ? trigger.querySelector('span') : null;
        const options = wrapper.querySelectorAll('.custom-option');
        const hiddenInput = wrapper.querySelector('.hidden-val');

        if (trigger) {
            trigger.addEventListener('click', function (e) {
                e.stopPropagation();
                document.querySelectorAll('.custom-select-wrapper').forEach(w => {
                    if (w !== wrapper) w.classList.remove('open');
                });
                wrapper.classList.toggle('open');
            });
        }

        options.forEach(option => {
            option.addEventListener('click', function (e) {
                e.stopPropagation();
                if (triggerText) {
                    triggerText.textContent = this.textContent;
                    triggerText.style.color = "var(--text-main)";
                }
                if (hiddenInput) hiddenInput.value = this.dataset.value;
                wrapper.classList.remove('open');
                if (typeof triggerRandomGlow === 'function') triggerRandomGlow();
            });
        });
    });

    // Klick außerhalb schließt Dropdowns
    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-select-wrapper').forEach(w => w.classList.remove('open'));
    });

    // ==========================================
    // 3. HISTOGRAMM & SLIDER LOGIK
    // ==========================================
    const histogram = document.getElementById('histogram');
    const sliderMin = document.getElementById('slider-min');
    const sliderMax = document.getElementById('slider-max');
    const inputMin = document.getElementById('input-min');
    const inputMax = document.getElementById('input-max');
    const sliderFill = document.getElementById('slider-fill');

    if (!histogram || !sliderMin || !sliderMax) return;

    // Histogramm-Balken erzeugen
    histogram.innerHTML = ''; // Falls bereits Balken da waren, leeren
    const barHeights = [4, 8, 18, 30, 45, 60, 75, 90, 98, 100, 88, 75, 65, 55, 45, 38, 32, 28, 24, 20, 16, 13, 11, 9, 7, 5, 4, 3, 2, 2];
    const bars = [];

    barHeights.forEach(h => {
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = h + '%';
        histogram.appendChild(bar);
        bars.push(bar);
    });

    // Hilfsfunktionen
    function sliderToReal(val) {
        if (val <= 100) return Math.round((val / 100) * 1000);
        if (val <= 200) return Math.round(1000 + ((val - 100) / 100) * 9000);
        return Math.round(10000 + ((val - 200) / 100) * 290000);
    }

    function realToSlider(val) {
        if (typeof val === 'string') {
            val = val.toLowerCase().replace('+', '');
            if (val.includes('k')) val = parseFloat(val.replace('k', '')) * 1000;
            else val = parseFloat(val);
        }
        if (isNaN(val) || val < 0) val = 0;
        if (val > 300000) val = 300000;
        if (val <= 1000) return (val / 1000) * 100;
        if (val <= 10000) return 100 + ((val - 1000) / 9000) * 100;
        return 200 + ((val - 10000) / 290000) * 100;
    }

    function formatNumber(num) {
        return num >= 1000 ? (num / 1000) + 'k' : num;
    }

    function updateUI(source) {
        let sMin, sMax;
        if (source === 'input') {
            sMin = realToSlider(inputMin.value);
            sMax = realToSlider(inputMax.value);
            if (sMin > sMax) sMin = sMax;
            sliderMin.value = sMin;
            sliderMax.value = sMax;
        } else {
            sMin = parseInt(sliderMin.value);
            sMax = parseInt(sliderMax.value);
            if (sMin > sMax - 5) {
                if (document.activeElement === sliderMin) sMin = sMax - 5;
                else sMax = sMin + 5;
                sliderMin.value = sMin;
                sliderMax.value = sMax;
            }
        }

        if (source !== 'input') {
            inputMin.value = formatNumber(sliderToReal(sMin));
            inputMax.value = formatNumber(sliderToReal(sMax));
        }

        const percent1 = (sMin / 300) * 100;
        const percent2 = (sMax / 300) * 100;
        if (sliderFill) {
            sliderFill.style.left = percent1 + "%";
            sliderFill.style.width = (percent2 - percent1) + "%";
        }

        bars.forEach((bar, index) => {
            const barStart = index * 10;
            const barEnd = barStart + 10;
            if (barEnd > sMin && barStart < sMax) bar.classList.add('active');
            else bar.classList.remove('active');
        });
    }

    // Event Listener für Slider & Inputs
    sliderMin.addEventListener('input', () => { updateUI('slider'); if (typeof triggerRandomGlow === 'function') triggerRandomGlow(); });
    sliderMax.addEventListener('input', () => { updateUI('slider'); if (typeof triggerRandomGlow === 'function') triggerRandomGlow(); });
    if (inputMin) inputMin.addEventListener('input', () => { updateUI('input'); if (typeof triggerRandomGlow === 'function') triggerRandomGlow(); });
    if (inputMax) inputMax.addEventListener('input', () => { updateUI('input'); if (typeof triggerRandomGlow === 'function') triggerRandomGlow(); });

    // Initialer Aufruf
    updateUI('slider');
}

// Hilfsfunktionen außerhalb von init, falls diese global genutzt werden
function toggleFilter(btn) {
    btn.classList.toggle('active');
    if (typeof triggerRandomGlow === 'function') triggerRandomGlow();
}

function initiateDiscovery() {
    const orb = document.getElementById('master-orb');
    if (orb) {
        orb.classList.add('searching');
        orb.style.pointerEvents = 'none';
        setTimeout(() => {
            orb.classList.remove('searching');
            orb.style.pointerEvents = 'auto';
        }, 2000);
    }
}