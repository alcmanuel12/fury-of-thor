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
        vikings: [],
        getVikings: jest.fn(() => []),
        addViking: jest.fn(),
        removeViking: jest.fn(),
        popViking: jest.fn(),
    }
}));

jest.unstable_mockModule("../../src/ui/vikings-list.js", () => ({
    renderVikingsList: jest.fn()
}));

jest.unstable_mockModule("../../src/ui/alert-popup.js", () => ({
    alertPopup: {
        alert: jest.fn(),
        confirm: jest.fn(() => Promise.resolve(true))
    }
}));

jest.unstable_mockModule("../../src/core/sound-manager.js", () => ({
    soundManager: {
        play: jest.fn(),
        stop: jest.fn()
    }
}));

const { state } = await import("../../src/core/state.js");
const { renderVikingsList } = await import("../../src/ui/vikings-list.js");
const { alertPopup } = await import("../../src/ui/alert-popup.js");
const { initPlayerSelectionScreen } = await import("../../src/ui/screens/player-selection-screen.js");

describe("player-selection-screen UI", () => {

    beforeEach(() => {
        document.body.innerHTML = `
            <input id="vikingName" />
            <button id="btn-add"></button>
        `;

        state.getVikings.mockReturnValue([]);
    });

    test("agrega un vikingo cuando se hace click en btn-add", () => {
        initPlayerSelectionScreen();

        const input = document.getElementById("vikingName");
        const addBtn = document.getElementById("btn-add");

        input.value = "Ragnar";

        addBtn.click();

        expect(state.addViking).toHaveBeenCalledWith("Ragnar");
        expect(renderVikingsList).toHaveBeenCalled();
        expect(input.value).toBe("");
    });

});
