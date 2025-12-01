import { jest } from "@jest/globals";

const mockSave = jest.fn();

global.document = {
    getElementById: jest.fn(() => null)
};

global.window = {
    _currentSound: null,
    _isMuted: false,
    _soundAlertShown: false,
    _gameEnded: false,
    _winnerName: null
};

jest.unstable_mockModule("../../src/core/persistence.js", () => ({
    persistence: {
        isRestoring: () => false,
        save: mockSave,
        load: () => {},
        getCurrentScreen: () => null
    }
}));

const { state } = await import("../../src/core/state.js");

describe("state object", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        state.setVikings([]);
        state.resetAvailableRunes();
        state.clearRuneElements();
        state.clearVikingToRune();
    });

    describe("Vikings management", () => {
        test("setVikings() sets the vikings list", () => {
            state.setVikings(["Ragnar", "Loki"]);
            expect(state.getVikings()).toEqual(["Ragnar", "Loki"]);
            expect(mockSave).toHaveBeenCalled();
        });

        test("getVikings() returns empty array by default", () => {
            expect(state.getVikings()).toEqual([]);
        });

        test("addViking() adds a viking to the list", () => {
            state.addViking("Floki");
            expect(state.getVikings()).toEqual(["Floki"]);
            expect(mockSave).toHaveBeenCalled();
        });

        test("addViking() appends to existing list", () => {
            state.setVikings(["Ragnar"]);
            state.addViking("Loki");
            expect(state.getVikings()).toEqual(["Ragnar", "Loki"]);
        });

        test("removeViking() removes viking by index", () => {
            state.setVikings(["Ragnar", "Loki", "Floki"]);
            state.removeViking(1);
            expect(state.getVikings()).toEqual(["Ragnar", "Floki"]);
            expect(mockSave).toHaveBeenCalled();
        });

        test("removeViking() handles out of bounds index gracefully", () => {
            state.setVikings(["Ragnar"]);
            state.removeViking(10);
            expect(state.getVikings()).toEqual(["Ragnar"]);
        });

        test("popViking() removes last viking", () => {
            state.setVikings(["Ragnar", "Loki"]);
            state.popViking();
            expect(state.getVikings()).toEqual(["Ragnar"]);
            expect(mockSave).toHaveBeenCalled();
        });

        test("popViking() handles empty list", () => {
            state.setVikings([]);
            state.popViking();
            expect(state.getVikings()).toEqual([]);
        });

        test("clearVikings() clears the list", () => {
            state.setVikings(["A", "B"]);
            state.clearVikings();
            expect(state.getVikings()).toEqual([]);
            expect(mockSave).toHaveBeenCalled();
        });
    });

    describe("Available runes management", () => {
        test("getAvailableRunes() returns array of runes", () => {
            const available = state.getAvailableRunes();
            expect(Array.isArray(available)).toBe(true);
            expect(available.length).toBeGreaterThan(0);
        });

        test("resetAvailableRunes() resets to all runes", () => {
            state.resetAvailableRunes();
            const initial = state.getAvailableRunes();
            const initialLength = initial.length;
            state.removeRune(0);
            expect(state.getAvailableRunes().length).toBe(initialLength - 1);
            
            state.resetAvailableRunes();
            expect(state.getAvailableRunes().length).toBe(initialLength);
        });

        test("removeRune() removes and returns rune by index", () => {
            state.resetAvailableRunes();
            const initial = state.getAvailableRunes();
            const initialLength = initial.length;
            const removed = state.removeRune(0);
            expect(state.getAvailableRunes().length).toBe(initialLength - 1);
            expect(removed).toHaveProperty("id");
            expect(removed).toHaveProperty("url");
        });

        test("removeRune() does not affect original runes array", () => {
            const before = state.getAvailableRunes().length;
            state.removeRune(0);
            state.resetAvailableRunes();
            expect(state.getAvailableRunes().length).toBe(before);
        });
    });

    describe("Rune elements management", () => {
        test("getRuneElements() returns empty array by default", () => {
            expect(state.getRuneElements()).toEqual([]);
        });

        test("setRuneElements() sets the rune elements", () => {
            const mockElements = [
                { dataset: { vikingName: "Ragnar", runeId: "1" } },
                { dataset: { vikingName: "Loki", runeId: "2" } }
            ];
            state.setRuneElements(mockElements);
            expect(state.getRuneElements()).toEqual(mockElements);
            expect(mockSave).toHaveBeenCalled();
        });

        test("clearRuneElements() clears the rune elements", () => {
            const mockElements = [{ dataset: { vikingName: "Ragnar" } }];
            state.setRuneElements(mockElements);
            state.clearRuneElements();
            expect(state.getRuneElements()).toEqual([]);
            expect(mockSave).toHaveBeenCalled();
        });
    });

    describe("Viking to rune mapping", () => {
        test("getVikingToRune() returns empty object by default", () => {
            expect(state.getVikingToRune()).toEqual({});
        });

        test("setVikingToRune() sets the mapping", () => {
            const mapping = { Ragnar: { id: 1, url: "test.png" } };
            state.setVikingToRune(mapping);
            expect(state.getVikingToRune()).toEqual(mapping);
            expect(mockSave).toHaveBeenCalled();
        });

        test("getVikingRune() returns rune for viking", () => {
            const rune = { id: 1, url: "test.png" };
            state.setVikingToRune({ Ragnar: rune });
            expect(state.getVikingRune("Ragnar")).toEqual(rune);
        });

        test("getVikingRune() returns undefined for non-existent viking", () => {
            expect(state.getVikingRune("NonExistent")).toBeUndefined();
        });

        test("clearVikingToRune() clears the mapping", () => {
            state.setVikingToRune({ Ragnar: { id: 1, url: "test.png" } });
            state.clearVikingToRune();
            expect(state.getVikingToRune()).toEqual({});
            expect(mockSave).toHaveBeenCalled();
        });

        test("setVikingToRune() can update existing mappings", () => {
            state.setVikingToRune({ Ragnar: { id: 1, url: "test1.png" } });
            state.setVikingToRune({ Ragnar: { id: 2, url: "test2.png" }, Loki: { id: 3, url: "test3.png" } });
            const mapping = state.getVikingToRune();
            expect(mapping.Ragnar.id).toBe(2);
            expect(mapping.Loki.id).toBe(3);
        });
    });

    describe("State persistence", () => {
        test("state operations trigger save when not restoring", () => {
            jest.clearAllMocks();
            state.setVikings(["Ragnar"]);
            expect(mockSave).toHaveBeenCalled();
        });
    });
});
