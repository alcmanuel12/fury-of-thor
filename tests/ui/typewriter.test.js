import { jest } from "@jest/globals";
import { Typewriter } from "../../src/ui/typewriter.js";

describe("Typewriter", () => {
    let element;
    let typewriter;

    beforeEach(() => {
        jest.useFakeTimers();
        element = document.createElement("div");
        document.body.appendChild(element);
    });

    afterEach(() => {
        if (typewriter) {
            typewriter.stop();
        }
        jest.useRealTimers();
        document.body.innerHTML = "";
    });

    test("constructor initializes with default phrases", () => {
        typewriter = new Typewriter(element);
        expect(typewriter.phrases.length).toBeGreaterThan(0);
        expect(typewriter.isActive).toBe(false);
    });

    test("constructor accepts custom phrases", () => {
        const customPhrases = ["Phrase 1", "Phrase 2"];
        typewriter = new Typewriter(element, customPhrases);
        expect(typewriter.phrases).toEqual(customPhrases);
    });

    test("constructor accepts custom options", () => {
        typewriter = new Typewriter(element, null, {
            deleteSpeed: 10,
            typeSpeed: 20,
            minDelay: 1000,
            maxDelay: 2000
        });
        expect(typewriter.deleteSpeed).toBe(10);
        expect(typewriter.typeSpeed).toBe(20);
        expect(typewriter.minDelay).toBe(1000);
        expect(typewriter.maxDelay).toBe(2000);
    });

    test("start() begins typewriter animation", () => {
        typewriter = new Typewriter(element, ["Test phrase"]);
        typewriter.start();
        
        expect(typewriter.isActive).toBe(true);
        jest.advanceTimersByTime(100);
        expect(element.textContent.length).toBeGreaterThan(0);
    });

    test("start() uses initial text when provided", () => {
        typewriter = new Typewriter(element, ["Default", "Custom"]);
        typewriter.start("Custom text");
        
        jest.advanceTimersByTime(100);
        expect(typewriter.initialPhraseShown).toBe(true);
    });

    test("stop() stops animation and clears timeouts", () => {
        typewriter = new Typewriter(element, ["Test"]);
        typewriter.start();
        
        typewriter.stop();
        
        expect(typewriter.isActive).toBe(false);
        expect(typewriter.isTyping).toBe(false);
    });

    test("reset() stops and resets initial phrase", () => {
        typewriter = new Typewriter(element, ["Test"]);
        typewriter.start();
        typewriter.initialPhraseShown = true;
        
        typewriter.reset();
        
        expect(typewriter.isActive).toBe(false);
        expect(typewriter.initialPhraseShown).toBe(false);
    });

    test("typewriterAnimation() types text character by character", () => {
        typewriter = new Typewriter(element, null, { typeSpeed: 10 });
        typewriter.isActive = true;
        
        typewriter.typewriterAnimation("Test", () => {});
        
        jest.advanceTimersByTime(50);
        expect(element.textContent.length).toBeGreaterThan(0);
    });

    test("typewriterAnimation() deletes existing text before typing", () => {
        element.textContent = "Existing text";
        typewriter = new Typewriter(element, null, { deleteSpeed: 10, typeSpeed: 10 });
        typewriter.isActive = true;
        
        typewriter.typewriterAnimation("New text", () => {});
        
        jest.advanceTimersByTime(20);
        expect(element.textContent.length).toBeLessThan("Existing text".length);
    });

    test("typewriterAnimation() does nothing when not active", () => {
        typewriter = new Typewriter(element);
        typewriter.isActive = false;
        const initialText = element.textContent;
        
        typewriter.typewriterAnimation("Test", () => {});
        
        expect(element.textContent).toBe(initialText);
    });

    test("typewriterAnimation() does nothing when element is null", () => {
        typewriter = new Typewriter(null);
        typewriter.isActive = true;
        
        expect(() => typewriter.typewriterAnimation("Test", () => {})).not.toThrow();
    });

    test("changeTextRandomly() changes to random phrase", () => {
        typewriter = new Typewriter(element, ["Phrase 1", "Phrase 2", "Phrase 3"]);
        typewriter.isActive = true;
        typewriter.checkActive = () => true;
        
        typewriter.changeTextRandomly();
        
        jest.advanceTimersByTime(100);
        expect(element.textContent.length).toBeGreaterThan(0);
    });

    test("changeTextRandomly() does not repeat current phrase", () => {
        element.textContent = "Phrase 1";
        typewriter = new Typewriter(element, ["Phrase 1", "Phrase 2"]);
        typewriter.isActive = true;
        typewriter.checkActive = () => true;
        typewriter.initialPhraseShown = true;
        
        typewriter.changeTextRandomly();
        
        jest.advanceTimersByTime(100);
        expect(element.textContent).not.toBe("Phrase 1");
    });

    test("changeTextRandomly() does nothing when not active", () => {
        typewriter = new Typewriter(element);
        typewriter.isActive = false;
        
        typewriter.changeTextRandomly();
        
        expect(element.textContent).toBe("");
    });

    test("scheduleNextChange() schedules next change", () => {
        typewriter = new Typewriter(element, ["Phrase 1", "Phrase 2"]);
        typewriter.isActive = true;
        typewriter.checkActive = () => true;
        typewriter.isTyping = false;
        
        typewriter.scheduleNextChange();
        
        jest.advanceTimersByTime(5000);
        expect(typewriter.nextChangeTimeout).toBeTruthy();
    });

    test("scheduleNextChange() does nothing when not active", () => {
        typewriter = new Typewriter(element);
        typewriter.isActive = false;
        
        typewriter.scheduleNextChange();
        
        expect(typewriter.nextChangeTimeout).toBeNull();
    });

    test("checkActive callback prevents changes when false", () => {
        let checkActiveValue = true;
        typewriter = new Typewriter(element, ["Test"], {
            checkActive: () => checkActiveValue
        });
        typewriter.isActive = true;
        
        typewriter.changeTextRandomly();
        jest.advanceTimersByTime(10);
        const initialLength = element.textContent.length;
        
        checkActiveValue = false;
        jest.advanceTimersByTime(100);
        
        expect(element.textContent.length).toBe(initialLength);
    });

    test("typewriterAnimation() stops when checkActive becomes false", () => {
        let checkActiveValue = true;
        typewriter = new Typewriter(element, ["Long test phrase"], {
            typeSpeed: 10,
            checkActive: () => checkActiveValue
        });
        typewriter.isActive = true;
        
        typewriter.typewriterAnimation("Long test phrase", () => {});
        jest.advanceTimersByTime(50);
        
        checkActiveValue = false;
        jest.advanceTimersByTime(100);
        
        expect(typewriter.isTyping).toBe(false);
    });
});

