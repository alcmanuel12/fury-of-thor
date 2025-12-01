import { jest } from "@jest/globals";

global.window = {
    _isMuted: false,
    _currentSound: null,
    _soundAlertShown: false,
    _gameEnded: false,
    _winnerName: null
};

jest.unstable_mockModule("../../src/core/state.js", () => ({
    state: {
        clearVikings: jest.fn(),
        resetAvailableRunes: jest.fn()
    }
}));

jest.unstable_mockModule("../../src/ui/vikings-list.js", () => ({
    renderVikingsList: jest.fn()
}));

jest.unstable_mockModule("../../src/ui/screens/ingame-screen.js", () => ({
    resetGameState: jest.fn()
}));

jest.unstable_mockModule("../../src/core/sound-manager.js", () => ({
    soundManager: {
        stop: jest.fn(),
        play: jest.fn()
    }
}));

jest.unstable_mockModule("../../src/core/persistence.js", () => ({
    persistence: {
        clear: jest.fn(),
        save: jest.fn()
    }
}));

const { initCreditScreen } = await import("../../src/ui/screens/credit-screen.js");
const { state } = await import("../../src/core/state.js");
const { renderVikingsList } = await import("../../src/ui/vikings-list.js");
const { resetGameState } = await import("../../src/ui/screens/ingame-screen.js");
const { soundManager } = await import("../../src/core/sound-manager.js");
const { persistence } = await import("../../src/core/persistence.js");

describe("credit-screen UI", () => {

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="credit-screen" style="display:flex"></div>
            <button id="credit-home-button"></button>
            <div id="home-screen" style="display:none"></div>
        `;
    });

    test("al hacer click en credit-home-button vuelve al home y limpia el estado", () => {
        initCreditScreen();

        const btn = document.getElementById("credit-home-button");
        btn.click();

        expect(state.clearVikings).toHaveBeenCalled();
        expect(state.resetAvailableRunes).toHaveBeenCalled();
        expect(renderVikingsList).toHaveBeenCalled();
        expect(resetGameState).toHaveBeenCalled();

        const creditScreen = document.getElementById("credit-screen");
        const homeScreen = document.getElementById("home-screen");

        expect(creditScreen.style.display).toBe("none");
        expect(homeScreen.style.display).toBe("flex");

        expect(soundManager.stop).toHaveBeenCalledWith("ingame");
        expect(soundManager.play).toHaveBeenCalledWith("forest");

        expect(persistence.clear).toHaveBeenCalled();
        expect(persistence.save).toHaveBeenCalled();
    });
});
