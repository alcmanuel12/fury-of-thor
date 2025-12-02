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
    getRuneElements: jest.fn(() => []),
    clearRuneElements: jest.fn(),
    setRuneElements: jest.fn(),
    clearVikingToRune: jest.fn(),
    setVikingToRune: jest.fn(),
    getAvailableRunes: jest.fn(() => [])
};

jest.unstable_mockModule("../../src/core/state.js", () => ({
    state: mockState
}));

jest.unstable_mockModule("../../src/core/runes.js", () => ({
    runes: [
        { id: 1, url: "rune1.png" },
        { id: 2, url: "rune2.png" },
        { id: 3, url: "rune3.png" }
    ],
    brokenRunes: [
        { id: 1, url: "broken1.png" },
        { id: 2, url: "broken2.png" },
        { id: 3, url: "broken3.png" }
    ]
}));

const mockPersistence = {
    save: jest.fn()
};

jest.unstable_mockModule("../../src/core/persistence.js", () => ({
    persistence: mockPersistence
}));

const { renderRunesCircle, selectRandomViking, breakChosenRune, resetChosenRune } = await import("../../src/ui/runes-circle.js");
const { brokenRunes } = await import("../../src/core/runes.js");

describe("runes-circle", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        
        document.body.innerHTML = `
            <div id="runesCircleContainer"></div>
            <div id="chosenVikingName"></div>
        `;
        
        Object.defineProperty(window, 'innerHeight', { value: 1000, writable: true });
        Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe("renderRunesCircle()", () => {
        test("renders runes circle with vikings", () => {
            mockState.getVikings.mockReturnValue(["Viking1", "Viking2"]);
            
            renderRunesCircle();
            
            const container = document.getElementById("runesCircleContainer");
            expect(container.children.length).toBe(2);
            expect(mockState.clearRuneElements).toHaveBeenCalled();
            expect(mockState.clearVikingToRune).toHaveBeenCalled();
        });

        test("returns early when container is missing", () => {
            document.body.innerHTML = "";
            mockState.getVikings.mockReturnValue(["Viking1"]);
            
            renderRunesCircle();
            
            expect(mockState.setRuneElements).not.toHaveBeenCalled();
        });

        test("returns early when no vikings", () => {
            mockState.getVikings.mockReturnValue([]);
            
            renderRunesCircle();
            
            expect(mockState.setRuneElements).not.toHaveBeenCalled();
        });

        test("applies scale for small window height", () => {
            Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
            Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true });
            mockState.getVikings.mockReturnValue(["Viking1"]);
            
            renderRunesCircle();
            
            expect(mockState.setRuneElements).toHaveBeenCalled();
        });

        test("applies scale for mobile width", () => {
            Object.defineProperty(window, 'innerHeight', { value: 1000, writable: true });
            Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });
            mockState.getVikings.mockReturnValue(["Viking1"]);
            
            renderRunesCircle();
            
            expect(mockState.setRuneElements).toHaveBeenCalled();
        });

        test("saves state after timeout", () => {
            mockState.getVikings.mockReturnValue(["Viking1"]);
            
            renderRunesCircle();
            
            jest.advanceTimersByTime(100);
            expect(mockPersistence.save).toHaveBeenCalled();
        });

        test("creates rune elements with correct attributes", () => {
            mockState.getVikings.mockReturnValue(["Viking1"]);
            
            renderRunesCircle();
            
            const runeElements = mockState.setRuneElements.mock.calls[0][0];
            expect(runeElements[0].dataset.vikingName).toBe("Viking1");
            expect(runeElements[0].dataset.runeId).toBe("1");
            expect(runeElements[0].classList.contains("rune-item")).toBe(true);
        });
    });

    describe("selectRandomViking()", () => {
        test("selects a random viking", () => {
            const container = document.getElementById("runesCircleContainer");
            const rune1 = document.createElement("div");
            rune1.classList.add("rune-item");
            rune1.dataset.vikingName = "Viking1";
            rune1.dataset.runeId = "1";
            container.appendChild(rune1);
            
            const rune2 = document.createElement("div");
            rune2.classList.add("rune-item");
            rune2.dataset.vikingName = "Viking2";
            rune2.dataset.runeId = "2";
            container.appendChild(rune2);
            
            mockState.getRuneElements.mockReturnValue([rune1, rune2]);
            
            selectRandomViking();
            
            jest.advanceTimersByTime(300);
            const chosen = document.querySelector(".rune-item.chosen");
            expect(chosen).toBeTruthy();
        });

        test("returns early when no rune elements", () => {
            mockState.getRuneElements.mockReturnValue([]);
            
            selectRandomViking();
            
            expect(document.querySelector(".rune-item.chosen")).toBeNull();
        });

        test("skips broken runes when selecting", () => {
            const rune1 = document.createElement("div");
            rune1.classList.add("rune-item", "broken");
            rune1.dataset.vikingName = "Viking1";
            
            const rune2 = document.createElement("div");
            rune2.classList.add("rune-item");
            rune2.dataset.vikingName = "Viking2";
            
            mockState.getRuneElements.mockReturnValue([rune1, rune2]);
            
            selectRandomViking();
            
            jest.advanceTimersByTime(300);
            const chosen = document.querySelector(".rune-item.chosen");
            expect(chosen).not.toBe(rune1);
        });

        test("returns early when all runes are broken", () => {
            const rune1 = document.createElement("div");
            rune1.classList.add("rune-item", "broken");
            rune1.dataset.vikingName = "Viking1";
            
            mockState.getRuneElements.mockReturnValue([rune1]);
            
            selectRandomViking();
            
            expect(document.querySelector(".rune-item.chosen")).toBeNull();
        });

        test("displays chosen viking name after delay", () => {
            const rune1 = document.createElement("div");
            rune1.classList.add("rune-item");
            rune1.dataset.vikingName = "Viking1";
            
            mockState.getRuneElements.mockReturnValue([rune1]);
            
            selectRandomViking();
            
            jest.advanceTimersByTime(1800);
            const chosenNameEl = document.getElementById("chosenVikingName");
            expect(chosenNameEl.textContent).toBe("Viking1");
            expect(chosenNameEl.classList.contains("visible")).toBe(true);
        });
    });

    describe("breakChosenRune()", () => {
        test("breaks chosen rune and returns viking name", () => {
            const rune = document.createElement("div");
            rune.classList.add("rune-item", "chosen");
            rune.dataset.vikingName = "Viking1";
            rune.dataset.runeId = "1";
            rune.style.backgroundImage = "";
            
            document.body.appendChild(rune);
            
            const result = breakChosenRune();
            
            expect(result).toBe("Viking1");
            expect(rune.classList.contains("broken")).toBe(true);
            expect(rune.style.backgroundImage).toContain(brokenRunes[0].url);
            expect(mockPersistence.save).toHaveBeenCalled();
        });

        test("returns null when no chosen rune", () => {
            const result = breakChosenRune();
            expect(result).toBeNull();
        });

        test("returns null when runeId is invalid", () => {
            const rune = document.createElement("div");
            rune.classList.add("rune-item", "chosen");
            rune.dataset.vikingName = "Viking1";
            rune.dataset.runeId = "invalid";
            
            document.body.appendChild(rune);
            
            const result = breakChosenRune();
            expect(result).toBeNull();
        });

        test("returns null when broken rune not found", () => {
            const rune = document.createElement("div");
            rune.classList.add("rune-item", "chosen");
            rune.dataset.vikingName = "Viking1";
            rune.dataset.runeId = "999";
            
            document.body.appendChild(rune);
            
            const result = breakChosenRune();
            expect(result).toBeNull();
        });
    });

    describe("resetChosenRune()", () => {
        test("resets chosen rune styling", () => {
            const rune1 = document.createElement("div");
            rune1.classList.add("rune-item", "chosen", "dimmed");
            const rune2 = document.createElement("div");
            rune2.classList.add("rune-item", "dimmed");
            
            mockState.getRuneElements.mockReturnValue([rune1, rune2]);
            
            resetChosenRune();
            
            expect(rune1.classList.contains("chosen")).toBe(false);
            expect(rune1.classList.contains("dimmed")).toBe(false);
            expect(rune2.classList.contains("dimmed")).toBe(false);
        });

        test("clears chosen viking name", () => {
            const chosenNameEl = document.getElementById("chosenVikingName");
            chosenNameEl.textContent = "Viking1";
            chosenNameEl.classList.add("visible");
            
            const rune1 = document.createElement("div");
            rune1.classList.add("rune-item");
            mockState.getRuneElements.mockReturnValue([rune1]);
            
            resetChosenRune();
            
            expect(chosenNameEl.textContent).toBe("");
            expect(chosenNameEl.classList.contains("visible")).toBe(false);
        });

        test("returns early when no rune elements", () => {
            mockState.getRuneElements.mockReturnValue([]);
            
            resetChosenRune();
            
            const chosenNameEl = document.getElementById("chosenVikingName");
            expect(chosenNameEl.textContent).toBe("");
        });
    });
});

