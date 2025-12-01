import { jest } from "@jest/globals";

global.window = {
    _isMuted: false,
    _currentSound: null
};

const mockSave = jest.fn();
const mockPersistence = {
    save: mockSave
};

jest.unstable_mockModule("../../src/core/persistence.js", () => ({
    persistence: mockPersistence
}));

const { soundManager } = await import("../../src/core/sound-manager.js");

soundManager.saveState = jest.fn(() => {
    mockSave();
});

describe("soundManager", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        soundManager.isMuted = false;
        soundManager.sounds = {};
        soundManager.activeSounds = [];
        soundManager.soundTypes = {};
        window._isMuted = false;
        window._currentSound = null;
    });

    describe("Sound registration", () => {
        test("registerSound() creates and stores audio object", () => {
            const audio = soundManager.registerSound("test", "test.mp3");
            expect(audio).toBeInstanceOf(Audio);
            expect(audio.src).toContain("test.mp3");
            expect(soundManager.sounds["test"]).toBe(audio);
        });

        test("registerSound() sets loop property", () => {
            const audio = soundManager.registerSound("test", "test.mp3", true);
            expect(audio.loop).toBe(true);
        });

        test("registerSound() sets volume property", () => {
            const audio = soundManager.registerSound("test", "test.mp3", false, "background", 0.5);
            expect(audio.volume).toBe(0.5);
        });

        test("registerSound() stores sound type", () => {
            soundManager.registerSound("test", "test.mp3", false, "effect");
            expect(soundManager.soundTypes["test"]).toBe("effect");
        });

        test("registerSound() defaults to background type", () => {
            soundManager.registerSound("test", "test.mp3");
            expect(soundManager.soundTypes["test"]).toBe("background");
        });
    });

    describe("Sound playback", () => {
        beforeEach(() => {
            const mockAudio = {
                play: jest.fn().mockResolvedValue(undefined),
                pause: jest.fn(),
                currentTime: 0,
                loop: false,
                volume: 1
            };
            soundManager.sounds["test"] = mockAudio;
            soundManager.soundTypes["test"] = "background";
        });

        test("play() adds sound to activeSounds if not already present", () => {
            soundManager.play("test");
            expect(soundManager.activeSounds).toContain("test");
        });

        test("play() does not duplicate sound in activeSounds", () => {
            soundManager.play("test");
            soundManager.play("test");
            expect(soundManager.activeSounds.filter(s => s === "test").length).toBe(1);
        });

        test("play() calls audio.play() when not muted", () => {
            soundManager.isMuted = false;
            soundManager.play("test");
            expect(soundManager.sounds["test"].play).toHaveBeenCalled();
        });

        test("play() does not call audio.play() when muted", () => {
            soundManager.isMuted = true;
            soundManager.play("test");
            expect(soundManager.sounds["test"].play).not.toHaveBeenCalled();
        });

        test("play() sets window._currentSound for background sounds", () => {
            soundManager.play("test");
            expect(window._currentSound).toBe("test");
        });

        test("play() calls saveState() for background sounds", () => {
            soundManager.play("test");
            expect(mockSave).toHaveBeenCalled();
        });

        test("play() does not set currentSound for effect sounds", () => {
            soundManager.soundTypes["test"] = "effect";
            window._currentSound = null;
            soundManager.play("test");
            expect(window._currentSound).toBe(null);
        });

        test("play() handles non-existent sound gracefully", () => {
            expect(() => soundManager.play("nonexistent")).not.toThrow();
        });

        test("play() handles play() promise rejection", async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            soundManager.sounds["test"].play.mockRejectedValue(new Error("Play failed"));
            soundManager.play("test");
            await new Promise(resolve => setTimeout(resolve, 10));
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe("Sound pausing", () => {
        test("pause() calls audio.pause()", () => {
            const mockAudio = {
                pause: jest.fn()
            };
            soundManager.sounds["test"] = mockAudio;
            soundManager.pause("test");
            expect(mockAudio.pause).toHaveBeenCalled();
        });

        test("pause() handles non-existent sound gracefully", () => {
            expect(() => soundManager.pause("nonexistent")).not.toThrow();
        });
    });

    describe("Sound stopping", () => {
        beforeEach(() => {
            const mockAudio = {
                pause: jest.fn(),
                currentTime: 10
            };
            soundManager.sounds["test"] = mockAudio;
            soundManager.activeSounds = ["test"];
            soundManager.soundTypes["test"] = "background";
            window._currentSound = "test";
        });

        test("stop() pauses audio and resets currentTime", () => {
            soundManager.stop("test");
            expect(soundManager.sounds["test"].pause).toHaveBeenCalled();
            expect(soundManager.sounds["test"].currentTime).toBe(0);
        });

        test("stop() removes sound from activeSounds", () => {
            soundManager.stop("test");
            expect(soundManager.activeSounds).not.toContain("test");
        });

        test("stop() clears window._currentSound for background sounds", () => {
            soundManager.stop("test");
            expect(window._currentSound).toBe(null);
        });

        test("stop() calls saveState() for background sounds", () => {
            soundManager.stop("test");
            expect(mockSave).toHaveBeenCalled();
        });

        test("stop() does not clear currentSound if it's not the current sound", () => {
            window._currentSound = "other";
            soundManager.stop("test");
            expect(window._currentSound).toBe("other");
        });

        test("stop() handles non-existent sound gracefully", () => {
            expect(() => soundManager.stop("nonexistent")).not.toThrow();
        });
    });

    describe("Mute functionality", () => {
        beforeEach(() => {
            const mockAudio = {
                play: jest.fn().mockResolvedValue(undefined),
                pause: jest.fn(),
                currentTime: 0
            };
            soundManager.sounds["bg"] = mockAudio;
            soundManager.sounds["effect"] = mockAudio;
            soundManager.soundTypes["bg"] = "background";
            soundManager.soundTypes["effect"] = "effect";
            soundManager.activeSounds = ["bg", "effect"];
        });

        test("setMuted(true) sets muted state", () => {
            soundManager.setMuted(true);
            expect(soundManager.isMuted).toBe(true);
            expect(window._isMuted).toBe(true);
        });

        test("setMuted(false) unsets muted state", () => {
            soundManager.isMuted = true;
            soundManager.setMuted(false);
            expect(soundManager.isMuted).toBe(false);
            expect(window._isMuted).toBe(false);
        });

        test("setMuted() returns current muted state", () => {
            const result = soundManager.setMuted(true);
            expect(result).toBe(true);
        });

        test("setMuted() does nothing if state is already set", () => {
            soundManager.isMuted = true;
            const result = soundManager.setMuted(true);
            expect(result).toBe(true);
            expect(mockSave).not.toHaveBeenCalled();
        });

        test("setMuted(true) pauses background sounds", () => {
            soundManager.setMuted(true);
            expect(soundManager.sounds["bg"].pause).toHaveBeenCalled();
        });

        test("setMuted(true) stops effect sounds", () => {
            soundManager.setMuted(true);
            expect(soundManager.sounds["effect"].pause).toHaveBeenCalled();
            expect(soundManager.sounds["effect"].currentTime).toBe(0);
        });

        test("setMuted(false) plays background sounds", () => {
            soundManager.isMuted = true;
            soundManager.setMuted(false);
            expect(soundManager.sounds["bg"].play).toHaveBeenCalled();
        });

        test("setMuted() calls saveState()", () => {
            soundManager.setMuted(true);
            expect(mockSave).toHaveBeenCalled();
        });

        test("toggleMute() toggles muted state", () => {
            soundManager.isMuted = false;
            const result1 = soundManager.toggleMute();
            expect(result1).toBe(true);
            expect(soundManager.isMuted).toBe(true);

            const result2 = soundManager.toggleMute();
            expect(result2).toBe(false);
            expect(soundManager.isMuted).toBe(false);
        });
    });

    describe("Initialization", () => {
        test("soundManager initializes with correct default values", () => {
            expect(soundManager.isMuted).toBe(false);
            expect(soundManager.sounds).toEqual({});
            expect(soundManager.activeSounds).toEqual([]);
            expect(soundManager.soundTypes).toEqual({});
        });
    });
});
