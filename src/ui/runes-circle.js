import { state } from '../core/state.js';
import { runes, brokenRunes } from '../core/runes.js';
import { persistence } from '../core/persistence.js';

export function renderRunesCircle() {
    const runesCircleContainer = document.getElementById('runesCircleContainer');
    if (!runesCircleContainer) return;

    runesCircleContainer.innerHTML = '';
    state.clearRuneElements();
    state.clearVikingToRune();

    const vikings = state.getVikings();
    const total = vikings.length;
    if (total === 0) return;

    let scale = 1.0;
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    if (windowHeight <= 900 && windowWidth > 768) {
        scale = 0.75;
    } else if (windowWidth <= 768) {
        scale = 0.5;
    }

    const minRadius = 150 * scale;
    const maxRadius = 260 * scale;
    const radius = Math.min(maxRadius, minRadius + total * 6 * scale);
    const centerX = 250;
    const centerY = 250;
    const runeSize = 90 * scale;
    const runeOffset = runeSize / 2;

    const runeElements = [];
    const vikingToRune = {};

    vikings.forEach((name, index) => {
        const angle = (index * (2 * Math.PI)) / total - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        const rune = runes[index % runes.length];
        vikingToRune[name] = rune;

        const runeDiv = document.createElement('div');
        runeDiv.classList.add('rune-item');
        runeDiv.style.backgroundImage = `url(${rune.url})`;
        runeDiv.style.width = `${runeSize}px`;
        runeDiv.style.height = `${runeSize}px`;
        runeDiv.style.left = `${x - runeOffset}px`;
        runeDiv.style.top = `${y - runeOffset}px`;
        runeDiv.dataset.vikingName = name;
        runeDiv.dataset.runeId = rune.id;

        runesCircleContainer.appendChild(runeDiv);
        runeElements.push(runeDiv);
    });

    state.setRuneElements(runeElements);
    state.setVikingToRune(vikingToRune);

    runesCircleContainer.classList.remove('visible');
    setTimeout(() => {
        runesCircleContainer.classList.add('visible');
        persistence.save();
    }, 100);
}

export function selectRandomViking() {
    const runeElements = state.getRuneElements();
    if (runeElements.length === 0) return;

    runeElements.forEach(r => {
        r.classList.remove('chosen', 'dimmed');
    });

    const chosenNameEl = document.getElementById('chosenVikingName');
    if (chosenNameEl) {
        chosenNameEl.textContent = '';
        chosenNameEl.classList.remove('visible');
    }

    const selectable = runeElements.filter(el => !el.classList.contains('broken'));
    if (selectable.length === 0) return;

    const selIndex = Math.floor(Math.random() * selectable.length);
    const chosenRune = selectable[selIndex];
    const chosenName = chosenRune.dataset.vikingName;

    const originalIndex = runeElements.indexOf(chosenRune)

    setTimeout(() => {
        runeElements.forEach((r, i) => {
            if (i !== originalIndex) r.classList.add('dimmed');
        });
        chosenRune.classList.add('chosen');

        setTimeout(() => {
            if (chosenNameEl) {
                chosenNameEl.textContent = chosenName;
                chosenNameEl.classList.add('visible');
            }
        }, 1300);
    }, 300);
}

export function breakChosenRune() {
    const chosen = document.querySelector('.rune-item.chosen');
    if (!chosen) return null;
    const runeId = parseInt(chosen.dataset.runeId, 10);
    if (isNaN(runeId)) return null;
    const broken = brokenRunes.find(r => r.id === runeId);
    if (!broken) return null;
    chosen.style.backgroundImage = `url(${broken.url})`;
    chosen.classList.add('broken');
    
    persistence.save();

    return chosen.dataset.vikingName;
}

export function breakMultipleRunes(count) {
    const runeElements = state.getRuneElements();
    const unbroken = runeElements.filter(el => !el.classList.contains('broken'));
    
    if (unbroken.length === 0) return [];
    
    const toBreak = Math.min(count, unbroken.length);
    const shuffled = [...unbroken].sort(() => Math.random() - 0.5);
    const broken = shuffled.slice(0, toBreak);
    const eliminatedVikings = [];
    
    broken.forEach(rune => {
        const runeId = parseInt(rune.dataset.runeId, 10);
        if (isNaN(runeId)) return;
        const brokenRune = brokenRunes.find(r => r.id === runeId);
        if (!brokenRune) return;
        rune.style.backgroundImage = `url(${brokenRune.url})`;
        rune.classList.add('broken');
        eliminatedVikings.push(rune.dataset.vikingName);
    });
    
    persistence.save();
    
    return eliminatedVikings;
}

export function resetChosenRune() {
    const runeElements = state.getRuneElements();
    if (runeElements.length === 0) return;

    runeElements.forEach(r => {
        r.classList.remove('chosen', 'dimmed');
    });

    const chosenNameEl = document.getElementById('chosenVikingName');
    if (chosenNameEl) {
        chosenNameEl.textContent = '';
        chosenNameEl.classList.remove('visible');
    }
}

