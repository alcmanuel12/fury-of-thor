import { jest } from "@jest/globals";

const storageData = {};

const mockGetItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(function(key) {
    return storageData[key] || null;
});

const mockSetItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(function(key, value) {
    storageData[key] = value;
});

const mockRemoveItem = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(function(key) {
    delete storageData[key];
});

const mockClear = jest.spyOn(Storage.prototype, 'clear').mockImplementation(function() {
    Object.keys(storageData).forEach(key => delete storageData[key]);
});

const mockLocalStorage = {
    getItem: mockGetItem,
    setItem: mockSetItem,
    removeItem: mockRemoveItem,
    clear: mockClear,
    storage: storageData
};

const mockDocument = {
    getElementById: jest.fn((id) => {
        const screens = ['home-screen', 'player-selection-screen', 'ingame-screen', 'credit-screen'];
        if (screens.includes(id)) {
            return {
                id: id,
                style: { display: 'none' },
                classList: { contains: jest.fn(() => false) }
            };
        }
        return null;
    })
};

global.document = mockDocument;

global.window = {
    _currentSound: null,
    _isMuted: false,
    _soundAlertShown: false,
    _gameEnded: false,
    _winnerName: null
};

jest.unstable_mockModule("../../src/core/runes.js", () => ({
    runes: [
        { id: 1, url: "rune1.png" },
        { id: 2, url: "rune2.png" }
    ],
    brokenRunes: [
        { id: 1, url: "broken1.png" },
        { id: 2, url: "broken2.png" }
    ]
}));

const mockState = {
    getVikings: jest.fn(() => []),
    getRuneElements: jest.fn(() => []),
    getVikingToRune: jest.fn(() => ({})),
    clearRuneElements: jest.fn(),
    setRuneElements: jest.fn()
};

jest.unstable_mockModule("../../src/core/state.js", () => ({
    state: mockState
}));

const { persistence } = await import("../../src/core/persistence.js");

describe("persistence", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        Object.keys(storageData).forEach(key => delete storageData[key]);
        mockDocument.getElementById.mockImplementation((id) => {
            const screens = ['home-screen', 'player-selection-screen', 'ingame-screen', 'credit-screen'];
            if (screens.includes(id)) {
                return {
                    id: id,
                    style: { display: 'none' },
                    classList: { contains: jest.fn(() => false) }
                };
            }
            return null;
        });
        window._currentSound = null;
        window._isMuted = false;
        window._soundAlertShown = false;
        window._gameEnded = false;
        window._winnerName = null;
    });

    test("save() stores game state in localStorage", () => {
        persistence.setIsRestoring(false);
        
        persistence.save();
        
        expect(mockSetItem).toHaveBeenCalled();
        const callArgs = mockSetItem.mock.calls[0];
        expect(callArgs[0]).toBe('fury-of-thor-game-state');
        
        const savedState = JSON.parse(callArgs[1]);
        expect(savedState).toHaveProperty('currentScreen');
        expect(savedState).toHaveProperty('vikings');
        expect(savedState).toHaveProperty('timestamp');
    });

    test("load() retrieves game state from localStorage", () => {
        const testState = {
            vikings: ["Ragnar"],
            currentScreen: "home-screen",
            timestamp: Date.now()
        };
        
        storageData['fury-of-thor-game-state'] = JSON.stringify(testState);
        
        const loaded = persistence.load();
        expect(mockGetItem).toHaveBeenCalledWith('fury-of-thor-game-state');
        expect(loaded).toEqual(testState);
    });

    test("load() returns null when no saved state exists", () => {
        Object.keys(storageData).forEach(key => delete storageData[key]);
        const loaded = persistence.load();
        expect(loaded).toBe(null);
        expect(mockGetItem).toHaveBeenCalledWith('fury-of-thor-game-state');
    });

    test("load() handles invalid JSON gracefully", () => {
        storageData['fury-of-thor-game-state'] = "invalid json";
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const loaded = persistence.load();
        expect(loaded).toBe(null);
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    test("clear() removes game state from localStorage", () => {
        storageData['fury-of-thor-game-state'] = 'test';
        persistence.clear();
        expect(mockRemoveItem).toHaveBeenCalledWith('fury-of-thor-game-state');
    });

    test("getCurrentScreen() returns home-screen when no screen is visible", () => {
        const screen = persistence.getCurrentScreen();
        expect(screen).toBe('home-screen');
    });

    test("getCurrentScreen() returns correct screen when visible", () => {
        const getElementByIdSpy = jest.spyOn(document, 'getElementById');
        
        getElementByIdSpy.mockImplementation((id) => {
            const screens = ['home-screen', 'player-selection-screen', 'ingame-screen', 'credit-screen'];
            if (!screens.includes(id)) {
                return null;
            }
            
            if (id === 'ingame-screen') {
                return {
                    id: 'ingame-screen',
                    style: { display: 'flex' },
                    classList: { 
                        contains: jest.fn(() => false)
                    }
                };
            }
            
            return {
                id: id,
                style: { display: 'none' },
                classList: { contains: jest.fn(() => false) }
            };
        });
        
        const screen = persistence.getCurrentScreen();
        expect(screen).toBe('ingame-screen');
        
        getElementByIdSpy.mockRestore();
    });

    test("isRestoring() returns false by default", () => {
        expect(persistence.isRestoring()).toBe(false);
    });

    test("setIsRestoring() updates the restoring state", () => {
        persistence.setIsRestoring(true);
        expect(persistence.isRestoring()).toBe(true);
        persistence.setIsRestoring(false);
        expect(persistence.isRestoring()).toBe(false);
    });

    test("save() does not save when isRestoring is true", () => {
        persistence.setIsRestoring(true);
        persistence.save();
        expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
        persistence.setIsRestoring(false);
    });

    test("getCurrentSound() returns null when no sound is set", () => {
        window._currentSound = null;
        expect(persistence.getCurrentSound()).toBe(null);
    });

    test("getCurrentSound() returns valid sound names", () => {
        window._currentSound = 'forest';
        expect(persistence.getCurrentSound()).toBe('forest');
        
        window._currentSound = 'ingame';
        expect(persistence.getCurrentSound()).toBe('ingame');
    });

    test("getMuteState() returns mute state", () => {
        window._isMuted = true;
        expect(persistence.getMuteState()).toBe(true);
        
        window._isMuted = false;
        expect(persistence.getMuteState()).toBe(false);
    });

    test("getSoundAlertShown() returns alert state", () => {
        window._soundAlertShown = true;
        expect(persistence.getSoundAlertShown()).toBe(true);
        
        window._soundAlertShown = false;
        expect(persistence.getSoundAlertShown()).toBe(false);
    });

    test("setSoundAlertShown() updates alert state", () => {
        persistence.setSoundAlertShown(true);
        expect(window._soundAlertShown).toBe(true);
        
        persistence.setSoundAlertShown(false);
        expect(window._soundAlertShown).toBe(false);
    });

    test("getGameEnded() returns game ended state", () => {
        window._gameEnded = true;
        expect(persistence.getGameEnded()).toBe(true);
        
        window._gameEnded = false;
        expect(persistence.getGameEnded()).toBe(false);
    });

    test("setGameEnded() updates game ended state", () => {
        persistence.setGameEnded(true);
        expect(window._gameEnded).toBe(true);
        
        persistence.setGameEnded(false);
        expect(window._gameEnded).toBe(false);
    });

    test("getWinnerName() returns winner name", () => {
        window._winnerName = "Ragnar";
        expect(persistence.getWinnerName()).toBe("Ragnar");
        
        window._winnerName = null;
        expect(persistence.getWinnerName()).toBe(null);
    });

    test("setWinnerName() updates winner name", () => {
        persistence.setWinnerName("Loki");
        expect(window._winnerName).toBe("Loki");
        
        persistence.setWinnerName(null);
        expect(window._winnerName).toBe(null);
    });

    test("save() includes broken runes in allVikings", () => {
        persistence.setIsRestoring(false);
        
        const brokenRuneElement = {
            classList: { contains: jest.fn((cls) => cls === 'broken') },
            dataset: { vikingName: "BrokenViking", runeId: "1" }
        };
        
        mockState.getVikings.mockReturnValue(["ActiveViking"]);
        mockState.getRuneElements.mockReturnValue([brokenRuneElement]);
        mockState.getVikingToRune.mockReturnValue({});
        
        persistence.save();
        
        const callArgs = mockSetItem.mock.calls[0];
        const savedState = JSON.parse(callArgs[1]);
        expect(savedState.allVikings).toContain("BrokenViking");
        expect(savedState.allVikings).toContain("ActiveViking");
    });

    test("save() processes runeElements to build fullVikingToRune", () => {
        persistence.setIsRestoring(false);
        
        const runeElement = {
            dataset: { vikingName: "TestViking", runeId: "1" },
            classList: { contains: jest.fn(() => false) }
        };
        
        mockState.getVikings.mockReturnValue(["TestViking"]);
        mockState.getRuneElements.mockReturnValue([runeElement]);
        mockState.getVikingToRune.mockReturnValue({});
        
        persistence.save();
        
        const callArgs = mockSetItem.mock.calls[0];
        const savedState = JSON.parse(callArgs[1]);
        expect(savedState.vikingToRune.TestViking).toEqual({ id: 1, url: "rune1.png" });
    });

    test("save() handles invalid runeId in runeElements", () => {
        persistence.setIsRestoring(false);
        
        const runeElement = {
            dataset: { vikingName: "TestViking", runeId: "invalid" },
            classList: { contains: jest.fn(() => false) }
        };
        
        mockState.getVikings.mockReturnValue([]);
        mockState.getRuneElements.mockReturnValue([runeElement]);
        mockState.getVikingToRune.mockReturnValue({});
        
        persistence.save();
        
        const callArgs = mockSetItem.mock.calls[0];
        const savedState = JSON.parse(callArgs[1]);
        expect(savedState.vikingToRune.TestViking).toBeUndefined();
    });

    test("save() handles error gracefully", () => {
        persistence.setIsRestoring(false);
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        mockSetItem.mockImplementation(() => {
            throw new Error("Storage error");
        });
        
        expect(() => persistence.save()).not.toThrow();
        expect(consoleSpy).toHaveBeenCalled();
        
        consoleSpy.mockRestore();
        mockSetItem.mockImplementation(function(key, value) {
            storageData[key] = value;
        });
    });

    test("clear() handles error gracefully", () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        mockRemoveItem.mockImplementation(() => {
            throw new Error("Storage error");
        });
        
        expect(() => persistence.clear()).not.toThrow();
        expect(consoleSpy).toHaveBeenCalled();
        
        consoleSpy.mockRestore();
        mockRemoveItem.mockImplementation(function(key) {
            delete storageData[key];
        });
    });

    test("getBrokenRunes() returns broken runes", () => {
        const brokenRuneElement = {
            classList: { contains: jest.fn((cls) => cls === 'broken') },
            dataset: { vikingName: "BrokenViking", runeId: "1" }
        };
        
        const normalRuneElement = {
            classList: { contains: jest.fn(() => false) },
            dataset: { vikingName: "NormalViking", runeId: "2" }
        };
        
        mockState.getRuneElements.mockReturnValue([brokenRuneElement, normalRuneElement]);
        
        const broken = persistence.getBrokenRunes();
        expect(broken).toHaveLength(1);
        expect(broken[0]).toEqual({ vikingName: "BrokenViking", runeId: 1 });
    });

    test("getCurrentSound() returns null for invalid sound", () => {
        window._currentSound = "invalid-sound";
        expect(persistence.getCurrentSound()).toBe(null);
    });

    test("restoreScreen() shows correct screen and hides others", () => {
        const screens = {};
        ['home-screen', 'player-selection-screen', 'ingame-screen', 'credit-screen'].forEach(id => {
            screens[id] = {
                id: id,
                style: { display: 'none' },
                classList: { 
                    remove: jest.fn(),
                    contains: jest.fn(() => false)
                }
            };
        });
        
        const originalGetElementById = document.getElementById;
        document.getElementById = jest.fn((id) => screens[id]);
        
        persistence.restoreScreen('ingame-screen');
        
        expect(screens['ingame-screen'].style.display).toBe('flex');
        expect(screens['ingame-screen'].classList.remove).toHaveBeenCalledWith('hidden');
        expect(screens['home-screen'].style.display).toBe('none');
        expect(screens['player-selection-screen'].style.display).toBe('none');
        expect(screens['credit-screen'].style.display).toBe('none');
        
        document.getElementById = originalGetElementById;
    });

    test("restoreBrokenRunes() restores broken runes", async () => {
        const { brokenRunes } = await import("../../src/core/runes.js");
        
        const runeElement = {
            dataset: { vikingName: "TestViking", runeId: "1" },
            style: {},
            classList: { add: jest.fn() }
        };
        
        mockState.getRuneElements.mockReturnValue([runeElement]);
        
        persistence.restoreBrokenRunes([{ vikingName: "TestViking", runeId: 1 }]);
        
        expect(runeElement.style.backgroundImage).toBe(`url(${brokenRunes[0].url})`);
        expect(runeElement.classList.add).toHaveBeenCalledWith('broken');
    });

    test("restoreBrokenRunes() handles empty list", () => {
        mockState.getRuneElements.mockReturnValue([]);
        expect(() => persistence.restoreBrokenRunes([])).not.toThrow();
    });

    test("restoreBrokenRunes() handles missing rune element", () => {
        mockState.getRuneElements.mockReturnValue([]);
        expect(() => persistence.restoreBrokenRunes([{ vikingName: "Missing", runeId: 1 }])).not.toThrow();
    });

    test("restoreAllRunes() creates runes circle", () => {
        const container = document.createElement('div');
        container.id = 'runesCircleContainer';
        container.classList.add = jest.fn();
        container.classList.remove = jest.fn();
        container.innerHTML = '';
        document.body.appendChild(container);
        
        mockDocument.getElementById.mockImplementation((id) => {
            if (id === 'runesCircleContainer') return container;
            return null;
        });
        
        const allVikings = ["Viking1", "Viking2"];
        const vikingToRune = {
            "Viking1": { id: 1, url: "rune1.png" },
            "Viking2": { id: 2, url: "rune2.png" }
        };
        
        // Mock window dimensions
        Object.defineProperty(window, 'innerHeight', { value: 1000, writable: true });
        Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true });
        
        persistence.restoreAllRunes(allVikings, vikingToRune, []);
        
        expect(mockState.clearRuneElements).toHaveBeenCalled();
        expect(mockState.setRuneElements).toHaveBeenCalled();
        expect(container.children.length).toBeGreaterThan(0);
    });

    test("restoreAllRunes() handles missing container", () => {
        mockDocument.getElementById.mockImplementation(() => null);
        expect(() => persistence.restoreAllRunes(["Viking1"], {}, [])).not.toThrow();
    });

    test("restoreAllRunes() handles empty vikings list", () => {
        const container = document.createElement('div');
        container.id = 'runesCircleContainer';
        mockDocument.getElementById.mockImplementation((id) => {
            if (id === 'runesCircleContainer') return container;
            return null;
        });
        
        persistence.restoreAllRunes([], {}, []);
        expect(container.innerHTML).toBe('');
    });

    test("restoreAllRunes() applies broken rune styling", () => {
        const container = document.createElement('div');
        container.id = 'runesCircleContainer';
        container.classList.add = jest.fn();
        container.classList.remove = jest.fn();
        document.body.appendChild(container);
        
        mockDocument.getElementById.mockImplementation((id) => {
            if (id === 'runesCircleContainer') return container;
            return null;
        });
        
        const allVikings = ["Viking1"];
        const vikingToRune = { "Viking1": { id: 1, url: "rune1.png" } };
        const brokenRunesList = [{ vikingName: "Viking1", runeId: 1 }];
        
        Object.defineProperty(window, 'innerHeight', { value: 1000, writable: true });
        Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true });
        
        persistence.restoreAllRunes(allVikings, vikingToRune, brokenRunesList);
        
        const runeElements = mockState.setRuneElements.mock.calls[0][0];
        expect(runeElements[0].classList.contains('broken')).toBe(true);
    });

    test("restoreAllRunes() calculates scale for small window", () => {
        const container = document.createElement('div');
        container.id = 'runesCircleContainer';
        container.classList.add = jest.fn();
        container.classList.remove = jest.fn();
        document.body.appendChild(container);
        
        mockDocument.getElementById.mockImplementation((id) => {
            if (id === 'runesCircleContainer') return container;
            return null;
        });
        
        Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
        Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true });
        
        persistence.restoreAllRunes(["Viking1"], { "Viking1": { id: 1, url: "rune1.png" } }, []);
        
        expect(mockState.setRuneElements).toHaveBeenCalled();
    });

    test("restoreAllRunes() calculates scale for mobile", () => {
        const container = document.createElement('div');
        container.id = 'runesCircleContainer';
        container.classList.add = jest.fn();
        container.classList.remove = jest.fn();
        document.body.appendChild(container);
        
        mockDocument.getElementById.mockImplementation((id) => {
            if (id === 'runesCircleContainer') return container;
            return null;
        });
        
        Object.defineProperty(window, 'innerHeight', { value: 1000, writable: true });
        Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });
        
        persistence.restoreAllRunes(["Viking1"], { "Viking1": { id: 1, url: "rune1.png" } }, []);
        
        expect(mockState.setRuneElements).toHaveBeenCalled();
    });

});
