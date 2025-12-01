import { jest } from "@jest/globals";

global.window = {
    _isMuted: false,
    _currentSound: null,
    _soundAlertShown: false,
    _gameEnded: false,
    _winnerName: null
};

jest.unstable_mockModule("../../src/ui/runes-circle.js", () => ({
    resetChosenRune: jest.fn(),
    breakChosenRune: jest.fn(),
    selectRandomViking: jest.fn()
}));

jest.unstable_mockModule("../../src/core/persistence.js", () => ({
    persistence: {
        setGameEnded: jest.fn(),
        setWinnerName: jest.fn(),
        save: jest.fn()
    }
}));

const { resetGameState } = await import("../../src/ui/screens/ingame-screen.js");
const { persistence } = await import("../../src/core/persistence.js");
const { resetChosenRune } = await import("../../src/ui/runes-circle.js");

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="chosenVikingName" class="visible">Thor</div>
            <button id="sacrifice-action" disabled style="pointer-events: none"></button>
        `;
    });

    test("resetea variables internas y limpia el DOM", () => {
        resetGameState();

        const chosenNameEl = document.getElementById("chosenVikingName");
        const btn = document.getElementById("sacrifice-action");
        
        expect(chosenNameEl.textContent).toBe("");
        expect(chosenNameEl.classList.contains("visible")).toBe(false);
        expect(btn.disabled).toBe(false);
        expect(btn.style.pointerEvents).toBe("auto");
        expect(persistence.setGameEnded).toHaveBeenCalledWith(false);
        expect(persistence.setWinnerName).toHaveBeenCalledWith(null);
        expect(resetChosenRune).toHaveBeenCalled();
    });

