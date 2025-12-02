import { jest } from "@jest/globals";

global.window = {
    _isMuted: false,
    _currentSound: null,
    _soundAlertShown: false,
    _gameEnded: false,
    _winnerName: null,
    innerWidth: 1000,
    innerHeight: 1000
};

const mockResetChosenRune = jest.fn();
const mockBreakChosenRune = jest.fn();
const mockSelectRandomViking = jest.fn();
const mockRenderVikingsList = jest.fn();
const mockRenderRunesCircle = jest.fn();

jest.unstable_mockModule("../../src/ui/runes-circle.js", () => ({
    resetChosenRune: mockResetChosenRune,
    breakChosenRune: mockBreakChosenRune,
    selectRandomViking: mockSelectRandomViking,
    renderRunesCircle: mockRenderRunesCircle
}));

jest.unstable_mockModule("../../src/ui/vikings-list.js", () => ({
    renderVikingsList: mockRenderVikingsList
}));

jest.unstable_mockModule("../../src/ui/alert-popup.js", () => ({
    alertPopup: {
        confirm: jest.fn(() => Promise.resolve(true)),
        show: jest.fn(() => Promise.resolve(true))
    }
}));

const mockState = {
    getVikings: jest.fn(() => []),
    clearVikings: jest.fn(),
    resetAvailableRunes: jest.fn(),
    removeViking: jest.fn(),
    getVikingRune: jest.fn(() => ({ id: 1, url: "rune1.png" })),
    getRuneElements: jest.fn(() => [])
};

jest.unstable_mockModule("../../src/core/state.js", () => ({
    state: mockState
}));

jest.unstable_mockModule("../../src/core/persistence.js", () => ({
    persistence: {
        setGameEnded: jest.fn(),
        setWinnerName: jest.fn(),
        save: jest.fn(),
        clear: jest.fn()
    }
}));

jest.unstable_mockModule("../../src/core/sound-manager.js", () => ({
    soundManager: {
        stop: jest.fn(),
        play: jest.fn()
    }
}));

const { resetGameState, setGameEnded, getGameEnded, restoreWinner, initIngameScreen } = await import("../../src/ui/screens/ingame-screen.js");
const { persistence } = await import("../../src/core/persistence.js");
const { resetChosenRune } = await import("../../src/ui/runes-circle.js");
const { state } = await import("../../src/core/state.js");
const { soundManager } = await import("../../src/core/sound-manager.js");
const { alertPopup } = await import("../../src/ui/alert-popup.js");

describe("ingame-screen", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        document.body.innerHTML = `
            <div id="chosenVikingName" class="visible">Thor</div>
            <button id="sacrifice-action" disabled style="pointer-events: none"></button>
            <button id="ingame-home-button"></button>
            <div id="ingame-screen" style="display:flex"></div>
            <div id="home-screen" style="display:none"></div>
            <div id="credit-screen" style="display:none"></div>
            <div id="thor-character"></div>
            <div id="lightning-animation" class="hidden">
                <img src="" />
            </div>
            <video id="ingame-background-video"></video>
            <video id="ingame-background-video-mobile"></video>
            <div class="bubble right"></div>
        `;

        // Mock video.play() for jsdom
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            video.play = jest.fn().mockResolvedValue(undefined);
        });
    });

    afterEach(() => {
        jest.useRealTimers();
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

    test("setGameEnded() sets game ended state", () => {
        setGameEnded(true);
        expect(getGameEnded()).toBe(true);
        setGameEnded(false);
        expect(getGameEnded()).toBe(false);
    });

    test("restoreWinner() restores winner state", async () => {
        const runeElement = document.createElement("div");
        runeElement.dataset.vikingName = "Winner";
        runeElement.classList.add = jest.fn();
        runeElement.classList.remove = jest.fn();
        
        mockState.getVikingRune.mockReturnValue({ id: 1, url: "rune1.png" });
        mockState.getRuneElements.mockReturnValue([runeElement]);
        
        await restoreWinner("Winner");
        
        expect(runeElement.classList.add).toHaveBeenCalledWith("chosen");
        expect(alertPopup.show).toHaveBeenCalled();
    });

    test("restoreWinner() returns early when no rune found", async () => {
        mockState.getVikingRune.mockReturnValue(null);
        
        await restoreWinner("NonExistent");
        
        expect(alertPopup.show).not.toHaveBeenCalled();
    });

    test("initIngameScreen() initializes screen", () => {
        initIngameScreen();
        
        const ingameScreen = document.getElementById("ingame-screen");
        expect(ingameScreen).toBeTruthy();
    });

    test("initIngameScreen() handles home button click", async () => {
        alertPopup.confirm.mockResolvedValue(true);
        initIngameScreen();
        
        const homeButton = document.getElementById("ingame-home-button");
        if (homeButton) {
            homeButton.click();
            await Promise.resolve();
            
            expect(state.clearVikings).toHaveBeenCalled();
            expect(soundManager.stop).toHaveBeenCalledWith("ingame");
        }
    });

    test("initIngameScreen() handles sacrifice button click", () => {
        mockState.getVikings.mockReturnValue(["Viking1", "Viking2"]);
        mockBreakChosenRune.mockReturnValue("Viking1");
        initIngameScreen();
        
        const sacrificeButton = document.getElementById("sacrifice-action");
        if (sacrificeButton) {
            sacrificeButton.click();
            
            jest.advanceTimersByTime(100);
            expect(mockSelectRandomViking).toHaveBeenCalled();
        }
    });

    test("initIngameScreen() handles game end when one viking remains", () => {
        mockState.getVikings.mockReturnValue(["Viking1", "Viking2"]);
        mockBreakChosenRune.mockReturnValue("Viking1");
        initIngameScreen();
        
        const sacrificeButton = document.getElementById("sacrifice-action");
        if (sacrificeButton) {
            sacrificeButton.click();
            
            mockState.getVikings.mockReturnValue(["Viking2"]);
            jest.advanceTimersByTime(6000);
            
            expect(persistence.setGameEnded).toHaveBeenCalledWith(true);
        }
    });
});
