import { jest } from '@jest/globals';

global.window = {
    _isMuted: false,
    _currentSound: null,
    _soundAlertShown: false,
    _gameEnded: false,
    _winnerName: null
};

jest.unstable_mockModule("../../src/ui/runes-circle.js", () => ({
    renderRunesCircle: jest.fn(),
    selectRandomViking: jest.fn(),
    breakChosenRune: jest.fn(),
    resetChosenRune: jest.fn()
}));

jest.unstable_mockModule("../../src/core/persistence.js", () => ({
    persistence: {
        save: jest.fn(),
        load: jest.fn(() => ({})),
        clear: jest.fn(),
        setGameEnded: jest.fn(),
        setWinnerName: jest.fn()
    }
}));

jest.unstable_mockModule("../../src/core/state.js", () => ({
    state: {
        clearVikings: jest.fn(),
        clearRuneElements: jest.fn(),
        clearVikingToRune: jest.fn(),
        resetAvailableRunes: jest.fn(),
        getRuneElements: jest.fn(() => []),
        getVikings: jest.fn(() => [])
    }
}));

const { resetGameState } = await import("../../src/ui/screens/ingame-screen.js");
const { state } = await import("../../src/core/state.js");
const { persistence } = await import("../../src/core/persistence.js");
const { resetChosenRune, breakChosenRune } = await import("../../src/ui/runes-circle.js");

describe("resetGameState()", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = `
            <div id="runesCircleContainer"></div>
            <div id="chosenVikingName"></div>
        `;
    });

    test("resetea elementos del estado", () => {
        resetGameState();

        expect(persistence.setGameEnded).toHaveBeenCalledWith(false);
        expect(persistence.setWinnerName).toHaveBeenCalledWith(null);
    });

    test("ejecuta resetChosenRune()", () => {
        resetGameState();
        expect(resetChosenRune).toHaveBeenCalled();
    });

    test("ejecuta persistence.setGameEnded y setWinnerName", () => {
        resetGameState();

        expect(persistence.setGameEnded).toHaveBeenCalledWith(false);
        expect(persistence.setWinnerName).toHaveBeenCalledWith(null);
    });

    test("no llama breakChosenRune (solo se llama al romper la runa)", () => {
        resetGameState();
        expect(breakChosenRune).not.toHaveBeenCalled();
    });
});
