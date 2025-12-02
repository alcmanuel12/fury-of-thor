import { runes } from './runes.js';
import { persistence } from './persistence.js';

let vikings = [];
let availableRunes = [...runes];
let runeElements = [];
let vikingToRune = {};

function saveState() {
    if (!persistence.isRestoring()) {
        persistence.save();
    }
}

export const state = {
    getVikings() {
        return vikings;
    },

    setVikings(newVikings) {
        vikings = newVikings;
        saveState();
    },

    addViking(name) {
        vikings.push(name);
        saveState();
    },

    removeViking(index) {
        vikings.splice(index, 1);
        saveState();
    },

    popViking() {
        vikings.pop();
        saveState();
    },

    clearVikings() {
        vikings = [];
        saveState();
    },

    getAvailableRunes() {
        return availableRunes;
    },

    resetAvailableRunes() {
        availableRunes = [...runes];
    },

    removeRune(index) {
        return availableRunes.splice(index, 1)[0];
    },

    getRuneElements() {
        return runeElements;
    },

    setRuneElements(elements) {
        runeElements = elements;
        saveState();
    },

    clearRuneElements() {
        runeElements = [];
        saveState();
    },

    getVikingToRune() {
        return vikingToRune;
    },

    setVikingToRune(mapping) {
        vikingToRune = mapping;
        saveState();
    },

    getVikingRune(vikingName) {
        return vikingToRune[vikingName];
    },

    clearVikingToRune() {
        vikingToRune = {};
        saveState();
    }
};

