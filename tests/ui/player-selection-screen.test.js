import { jest } from "@jest/globals";

global.window = {
    _isMuted: false,
    _currentSound: null,
    _soundAlertShown: false,
    _gameEnded: false,
    _winnerName: null,
    innerWidth: 1000
};

const mockState = {
    vikings: [],
    getVikings: jest.fn(() => []),
    addViking: jest.fn(),
    removeViking: jest.fn(),
    popViking: jest.fn(),
    clearVikings: jest.fn(),
    resetAvailableRunes: jest.fn()
};

jest.unstable_mockModule("../../src/core/state.js", () => ({
    state: mockState
}));

jest.unstable_mockModule("../../src/core/runes.js", () => ({
    runes: [
        { id: 1, url: "rune1.png" },
        { id: 2, url: "rune2.png" }
    ]
}));

jest.unstable_mockModule("../../src/ui/vikings-list.js", () => ({
    renderVikingsList: jest.fn()
}));

jest.unstable_mockModule("../../src/ui/runes-circle.js", () => ({
    renderRunesCircle: jest.fn(),
    resetChosenRune: jest.fn()
}));

jest.unstable_mockModule("../../src/ui/screens/ingame-screen.js", () => ({
    resetGameState: jest.fn()
}));

jest.unstable_mockModule("../../src/ui/alert-popup.js", () => ({
    alertPopup: {
        alert: jest.fn(() => Promise.resolve()),
        confirm: jest.fn(() => Promise.resolve(true))
    }
}));

jest.unstable_mockModule("../../src/core/sound-manager.js", () => ({
    soundManager: {
        play: jest.fn(),
        stop: jest.fn()
    }
}));

jest.unstable_mockModule("../../src/core/persistence.js", () => ({
    persistence: {
        clear: jest.fn(),
        save: jest.fn()
    }
}));

const { state } = await import("../../src/core/state.js");
const { renderVikingsList } = await import("../../src/ui/vikings-list.js");
const { alertPopup } = await import("../../src/ui/alert-popup.js");
const { initPlayerSelectionScreen } = await import("../../src/ui/screens/player-selection-screen.js");
const { soundManager } = await import("../../src/core/sound-manager.js");
const { persistence } = await import("../../src/core/persistence.js");
const { runes } = await import("../../src/core/runes.js");

describe("player-selection-screen UI", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = `
            <input id="vikingName" />
            <button id="btn-add"></button>
            <button id="btn-remove"></button>
            <button id="back-button"></button>
            <button id="game-start-button"></button>
            <div id="home-screen" style="display:none"></div>
            <div id="player-selection-screen" style="display:flex"></div>
            <div id="ingame-screen" style="display:none"></div>
            <video id="ingame-background-video"></video>
            <video id="ingame-background-video-mobile"></video>
        `;

        // Mock video.play() for jsdom
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            video.play = jest.fn().mockResolvedValue(undefined);
        });

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

    test("agrega vikingo cuando se presiona Enter", () => {
        initPlayerSelectionScreen();

        const input = document.getElementById("vikingName");
        input.value = "Loki";

        const event = new KeyboardEvent("keydown", { key: "Enter" });
        input.dispatchEvent(event);

        expect(state.addViking).toHaveBeenCalledWith("Loki");
    });

    test("no agrega vikingo cuando input está vacío", () => {
        initPlayerSelectionScreen();

        const input = document.getElementById("vikingName");
        const addBtn = document.getElementById("btn-add");

        input.value = "   ";

        addBtn.click();

        expect(state.addViking).not.toHaveBeenCalled();
    });

    test("muestra alerta cuando se alcanza el máximo de vikingos", () => {
        state.getVikings.mockReturnValue(new Array(runes.length).fill("Viking"));
        initPlayerSelectionScreen();

        const input = document.getElementById("vikingName");
        const addBtn = document.getElementById("btn-add");

        input.value = "ExtraViking";

        addBtn.click();

        expect(alertPopup.alert).toHaveBeenCalledWith("No more players allowed!");
        expect(state.addViking).not.toHaveBeenCalled();
    });

    test("muestra alerta cuando el nombre es inválido", () => {
        initPlayerSelectionScreen();

        const input = document.getElementById("vikingName");
        const addBtn = document.getElementById("btn-add");

        input.value = "123Invalid";

        addBtn.click();

        expect(alertPopup.alert).toHaveBeenCalled();
        expect(state.addViking).not.toHaveBeenCalled();
    });

    test("filtra caracteres inválidos en input", () => {
        initPlayerSelectionScreen();

        const input = document.getElementById("vikingName");
        input.value = "Test123";

        const event = new Event("input");
        input.dispatchEvent(event);

        expect(input.value).toBe("Test");
    });

    test("limita longitud del nombre a 15 caracteres", () => {
        initPlayerSelectionScreen();

        const input = document.getElementById("vikingName");
        input.value = "A".repeat(20);

        const event = new Event("input");
        input.dispatchEvent(event);

        expect(input.value.length).toBe(15);
    });

    test("elimina vikingo cuando se hace click en btn-remove con nombre", () => {
        state.getVikings.mockReturnValue(["Ragnar", "Loki"]);
        initPlayerSelectionScreen();

        const input = document.getElementById("vikingName");
        const removeBtn = document.getElementById("btn-remove");

        input.value = "Ragnar";

        removeBtn.click();

        expect(state.removeViking).toHaveBeenCalled();
        expect(renderVikingsList).toHaveBeenCalled();
    });

    test("elimina último vikingo cuando input está vacío", () => {
        state.getVikings.mockReturnValue(["Ragnar", "Loki"]);
        initPlayerSelectionScreen();

        const input = document.getElementById("vikingName");
        const removeBtn = document.getElementById("btn-remove");

        input.value = "";

        removeBtn.click();

        expect(state.popViking).toHaveBeenCalled();
    });

    test("maneja back button click", async () => {
        initPlayerSelectionScreen();

        const backButton = document.getElementById("back-button");
        backButton.click();

        await Promise.resolve();

        expect(alertPopup.confirm).toHaveBeenCalled();
    });

    test("maneja game start button click con suficientes vikingos", () => {
        state.getVikings.mockReturnValue(["Ragnar", "Loki"]);
        initPlayerSelectionScreen();

        const gameStartButton = document.getElementById("game-start-button");
        gameStartButton.click();

        const ingameScreen = document.getElementById("ingame-screen");
        const playerSelectionScreen = document.getElementById("player-selection-screen");

        expect(ingameScreen.style.display).toBe("flex");
        expect(playerSelectionScreen.style.display).toBe("none");
        expect(soundManager.stop).toHaveBeenCalledWith("forest");
        expect(soundManager.play).toHaveBeenCalledWith("ingame");
    });

    test("muestra alerta cuando hay menos de 2 vikingos", () => {
        state.getVikings.mockReturnValue(["Ragnar"]);
        initPlayerSelectionScreen();

        const gameStartButton = document.getElementById("game-start-button");
        gameStartButton.click();

        expect(alertPopup.alert).toHaveBeenCalledWith("You must add at least two vikings before continuing.");
    });

    test("game start button retorna early cuando screens faltan", () => {
        document.body.innerHTML = `
            <button id="game-start-button"></button>
        `;
        state.getVikings.mockReturnValue(["Ragnar", "Loki"]);

        initPlayerSelectionScreen();

        const gameStartButton = document.getElementById("game-start-button");
        gameStartButton.click();

        expect(soundManager.stop).not.toHaveBeenCalled();
    });
});
