import { jest } from "@jest/globals";

global.window = {
    _isMuted: false,
    _currentSound: null,
    _soundAlertShown: false,
    _gameEnded: false,
    _winnerName: null
};

const mockState = {
    getVikings: jest.fn(() => []),
    getAvailableRunes: jest.fn(() => []),
    resetAvailableRunes: jest.fn(),
    removeRune: jest.fn()
};

jest.unstable_mockModule("../../src/core/state.js", () => ({
    state: mockState
}));

jest.unstable_mockModule("../../src/core/runes.js", () => ({
    runes: [
        { id: 1, url: "rune1.png" },
        { id: 2, url: "rune2.png" },
        { id: 3, url: "rune3.png" }
    ]
}));

const mockPersistence = {
    save: jest.fn()
};

jest.unstable_mockModule("../../src/core/persistence.js", () => ({
    persistence: mockPersistence
}));

const { renderVikingsList } = await import("../../src/ui/vikings-list.js");

describe("vikings-list", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '<ul id="vikingsList"></ul>';
    });

    test("renders vikings list with runes", () => {
        mockState.getVikings.mockReturnValue(["Viking1", "Viking2"]);
        mockState.getAvailableRunes.mockReturnValue([
            { id: 1, url: "rune1.png" },
            { id: 2, url: "rune2.png" }
        ]);
        mockState.removeRune.mockImplementation((index) => {
            const runes = mockState.getAvailableRunes();
            return runes[index];
        });
        
        renderVikingsList();
        
        const list = document.getElementById("vikingsList");
        expect(list.children.length).toBe(2);
        expect(mockState.resetAvailableRunes).toHaveBeenCalled();
        expect(mockState.removeRune).toHaveBeenCalledTimes(2);
        expect(mockPersistence.save).toHaveBeenCalled();
    });

    test("returns early when list element is missing", () => {
        document.body.innerHTML = "";
        mockState.getVikings.mockReturnValue(["Viking1"]);
        
        renderVikingsList();
        
        expect(mockState.removeRune).not.toHaveBeenCalled();
    });

    test("handles empty vikings list", () => {
        mockState.getVikings.mockReturnValue([]);
        
        renderVikingsList();
        
        const list = document.getElementById("vikingsList");
        expect(list.children.length).toBe(0);
        expect(mockState.resetAvailableRunes).toHaveBeenCalled();
    });

    test("creates viking items with correct structure", () => {
        mockState.getVikings.mockReturnValue(["Viking1"]);
        mockState.getAvailableRunes.mockReturnValue([
            { id: 1, url: "rune1.png" }
        ]);
        mockState.removeRune.mockReturnValue({ id: 1, url: "rune1.png" });
        
        renderVikingsList();
        
        const list = document.getElementById("vikingsList");
        const item = list.children[0];
        expect(item.classList.contains("viking-item")).toBe(true);
        expect(item.innerHTML).toContain("Viking1");
        expect(item.innerHTML).toContain("rune1.png");
    });

    test("handles case when no available runes", () => {
        mockState.getVikings.mockReturnValue(["Viking1"]);
        mockState.getAvailableRunes.mockReturnValue([]);
        
        renderVikingsList();
        
        const list = document.getElementById("vikingsList");
        expect(list.children.length).toBe(0);
    });

    test("clears list before rendering", () => {
        const list = document.getElementById("vikingsList");
        list.innerHTML = "<div>Old content</div>";
        
        mockState.getVikings.mockReturnValue(["Viking1"]);
        mockState.getAvailableRunes.mockReturnValue([
            { id: 1, url: "rune1.png" }
        ]);
        mockState.removeRune.mockReturnValue({ id: 1, url: "rune1.png" });
        
        renderVikingsList();
        
        expect(list.innerHTML).not.toContain("Old content");
        expect(list.children.length).toBe(1);
    });
});

