import { runes, brokenRunes } from "../../src/core/runes.js";

describe("runes data", () => {
    
    test("runes is an array", () => {
        expect(Array.isArray(runes)).toBe(true);
    });

    test("runes has 16 elements", () => {
        expect(runes.length).toBe(16);
    });

    test("each rune has id and url with correct types", () => {
        for (const rune of runes) {
            expect(rune).toHaveProperty("id");
            expect(rune).toHaveProperty("url");
            expect(typeof rune.id).toBe("number");
            expect(typeof rune.url).toBe("string");
            expect(rune.url.length).toBeGreaterThan(0);
        }
    });

    test("rune IDs are unique", () => {
        const ids = runes.map(r => r.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(runes.length);
    });

    test("rune URLs are valid", () => {
        for (const rune of runes) {
            expect(rune.url).toMatch(/^https?:\/\//);
        }
    });
});

describe("brokenRunes data", () => {
    
    test("brokenRunes is an array", () => {
        expect(Array.isArray(brokenRunes)).toBe(true);
    });

    test("brokenRunes has 16 elements", () => {
        expect(brokenRunes.length).toBe(16);
    });

    test("each broken rune has id and url with correct types", () => {
        for (const rune of brokenRunes) {
            expect(rune).toHaveProperty("id");
            expect(rune).toHaveProperty("url");
            expect(typeof rune.id).toBe("number");
            expect(typeof rune.url).toBe("string");
            expect(rune.url.length).toBeGreaterThan(0);
        }
    });

    test("brokenRune IDs match rune IDs", () => {
        const runeIds = runes.map(r => r.id).sort();
        const brokenRuneIds = brokenRunes.map(r => r.id).sort();
        expect(brokenRuneIds).toEqual(runeIds);
    });

    test("brokenRune URLs are valid", () => {
        for (const rune of brokenRunes) {
            expect(rune.url).toMatch(/^https?:\/\//);
        }
    });
});
