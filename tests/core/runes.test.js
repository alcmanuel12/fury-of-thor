import { runes, brokenRunes } from "../../src/core/runes.js";

describe("runes.js", () => {

    test("runes is an array with 16 elements", () => {
        expect(Array.isArray(runes)).toBe(true);
        expect(runes.length).toBe(16);
    });

    test("each rune has id and url with correct types", () => {
        for (const r of runes) {
            expect(r).toHaveProperty("id");
            expect(r).toHaveProperty("url");
            expect(typeof r.id).toBe("number");
            expect(typeof r.url).toBe("string");
            expect(r.url.length).toBeGreaterThan(0);
        }
    });

    test("rune IDs are unique and in valid range", () => {
        const ids = runes.map(r => r.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(runes.length);
        const sortedIds = [...ids].sort((a, b) => a - b);
        expect(sortedIds[0]).toBeGreaterThanOrEqual(1);
        expect(sortedIds[sortedIds.length - 1]).toBeLessThanOrEqual(16);
        for (const id of ids) {
            expect(id).toBeGreaterThanOrEqual(1);
            expect(id).toBeLessThanOrEqual(16);
        }
    });

    test("brokenRunes is an array with 16 elements", () => {
        expect(Array.isArray(brokenRunes)).toBe(true);
        expect(brokenRunes.length).toBe(16);
    });

    test("each brokenRune has id and url with correct types", () => {
        for (const br of brokenRunes) {
            expect(br).toHaveProperty("id");
            expect(br).toHaveProperty("url");
            expect(typeof br.id).toBe("number");
            expect(typeof br.url).toBe("string");
            expect(br.url.length).toBeGreaterThan(0);
        }
    });

    test("IDs of runes and brokenRunes match one to one", () => {
        const rIds = runes.map(r => r.id).sort();
        const brIds = brokenRunes.map(b => b.id).sort();
        expect(rIds).toEqual(brIds);
    });

    test("rune URLs are valid HTTP/HTTPS URLs", () => {
        for (const r of runes) {
            expect(r.url).toMatch(/^https?:\/\//);
        }
    });

    test("brokenRune URLs are valid HTTP/HTTPS URLs", () => {
        for (const br of brokenRunes) {
            expect(br.url).toMatch(/^https?:\/\//);
        }
    });

});
