import { jest } from "@jest/globals";

global.window = {
    _isMuted: false,
    _currentSound: null,
    _soundAlertShown: false,
    _gameEnded: false,
    _winnerName: null
};

jest.unstable_mockModule("../../src/core/sound-manager.js", () => ({
    soundManager: {
        toggleMute: jest.fn(),
        play: jest.fn()
    }
}));

jest.unstable_mockModule("../../src/core/persistence.js", () => ({
    persistence: {
        save: jest.fn()
    }
}));

const { soundManager } = await import("../../src/core/sound-manager.js");
const { persistence } = await import("../../src/core/persistence.js");
const { initHomeScreen } = await import("../../src/ui/screens/home-screen.js");

describe("Home Screen UI", () => {

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="home-screen"></div>
            <div id="player-selection-screen" style="display:none"></div>

            <button id="mute-button" class="sound-icon"></button>
            <button id="play-button"></button>

            <button id="info-button"></button>
            <div id="info-popup" class="hidden"></div>

            <div class="info-content"></div>
        `;
    });

    test("mute-button activa soundManager.toggleMute() y cambia clases", () => {
        initHomeScreen();

        const btn = document.getElementById("mute-button");

        btn.click();

        expect(soundManager.toggleMute).toHaveBeenCalled();

        expect(btn.classList.contains("mute-icon")).toBe(true);
        expect(btn.classList.contains("sound-icon")).toBe(false);
    });

    test("play-button oculta home-screen, muestra player-selection y guarda estado", () => {
        initHomeScreen();

        const playBtn = document.getElementById("play-button");
        const home = document.getElementById("home-screen");
        const selection = document.getElementById("player-selection-screen");

        playBtn.click();

        expect(home.style.display).toBe("none");
        expect(selection.style.display).toBe("flex");

        expect(soundManager.play).toHaveBeenCalledWith("forest");
        expect(persistence.save).toHaveBeenCalled();
    });

    test("info-button muestra el popup", () => {
        initHomeScreen();

        const infoBtn = document.getElementById("info-button");
        const popup = document.getElementById("info-popup");

        infoBtn.click();

        expect(popup.classList.contains("hidden")).toBe(false);
    });

    test("clic en info-popup lo oculta, pero clic en .info-content NO lo oculta", () => {
        initHomeScreen();

        const popup = document.getElementById("info-popup");
        const infoBtn = document.getElementById("info-button");
        const content = document.querySelector(".info-content");

        infoBtn.click();
        expect(popup.classList.contains("hidden")).toBe(false);

        content.click();
        expect(popup.classList.contains("hidden")).toBe(false);

        popup.click();
        expect(popup.classList.contains("hidden")).toBe(true);
    });
});
