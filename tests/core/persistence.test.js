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
    runes: [],
    brokenRunes: []
}));

jest.unstable_mockModule("../../src/core/state.js", () => ({
    state: {
        getVikings: jest.fn(() => []),
        getRuneElements: jest.fn(() => {
            return [];
        }),
        getVikingToRune: jest.fn(() => ({}))
    }
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

});
