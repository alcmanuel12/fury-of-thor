import { jest } from "@jest/globals";

async function flush() {
    await Promise.resolve();
    await Promise.resolve();
}

let alertPopup;

beforeEach(async () => {
    jest.resetModules();

    document.body.innerHTML = `
        <div id="alert-popup" class="hidden">
            <div class="alert-message"></div>
            <button id="alert-accept-btn"></button>
            <button id="alert-cancel-btn" class="hidden"></button>
        </div>
    `;

    const module = await import("../../src/ui/alert-popup.js");
    alertPopup = module.alertPopup;
});

test("confirm() muestra botón cancelar y devuelve false si se pulsa cancelar", async () => {
    const cancelBtn = document.getElementById("alert-cancel-btn");

    const promise = alertPopup.confirm("¿Seguro?");
    await flush();

    expect(cancelBtn.classList.contains("hidden")).toBe(false);

    cancelBtn.click();
    const result = await promise;

    expect(result).toBe(false);
});

test("show() admite contenido HTML cuando isHTML = true", async () => {
    const messageEl = document.querySelector(".alert-message");

    alertPopup.show("<b>HTML</b>", false, "OK", "Cancel", true);
    await flush();

    expect(messageEl.innerHTML).toBe("<b>HTML</b>");
});

test("show() asigna textos de botones correctamente", async () => {
    const acceptBtn = document.getElementById("alert-accept-btn");
    const cancelBtn = document.getElementById("alert-cancel-btn");

    alertPopup.show("msg", true, "Aceptar", "Cancelar", false);
    await flush();

    expect(acceptBtn.textContent).toBe("Aceptar");
    expect(cancelBtn.textContent).toBe("Cancelar");
});

test("show() returns resolved promise when popup elements missing", async () => {
    document.body.innerHTML = "";
    const module = await import("../../src/ui/alert-popup.js");
    const newAlertPopup = module.alertPopup;
    
    const promise = newAlertPopup.show("test");
    const result = await promise;
    expect(result).toBeUndefined();
});

test("init() handles missing elements gracefully", async () => {
    document.body.innerHTML = "";
    const module = await import("../../src/ui/alert-popup.js");
    const newAlertPopup = module.alertPopup;
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    newAlertPopup.init();
    
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
});

test("show() with cancel button returns false when cancel clicked", async () => {
    const cancelBtn = document.getElementById("alert-cancel-btn");
    
    const promise = alertPopup.show("test", true);
    await flush();
    
    cancelBtn.click();
    const result = await promise;
    
    expect(result).toBe(false);
});

test("show() with accept button returns true when accept clicked", async () => {
    const acceptBtn = document.getElementById("alert-accept-btn");
    
    const promise = alertPopup.show("test", false);
    await flush();
    
    acceptBtn.click();
    const result = await promise;
    
    expect(result).toBe(true);
});

test("show() adds extraClass when provided", async () => {
    const popup = document.getElementById("alert-popup");
    
    alertPopup.show("test", false, "OK", "Cancel", false, "test-class");
    await flush();
    
    expect(popup.classList.contains("test-class")).toBe(true);
});

test("alert() calls show() with correct parameters", async () => {
    const showSpy = jest.spyOn(alertPopup, 'show');
    
    alertPopup.alert("test message");
    
    expect(showSpy).toHaveBeenCalledWith("test message", false);
    showSpy.mockRestore();
});

test("hide() removes winner-alert class", async () => {
    document.body.innerHTML = `
        <div id="alert-popup" class="winner-alert">
            <div class="alert-message"></div>
            <button id="alert-accept-btn"></button>
            <button id="alert-cancel-btn" class="hidden"></button>
        </div>
    `;
    jest.resetModules();
    const module = await import("../../src/ui/alert-popup.js");
    const newAlertPopup = module.alertPopup;
    
    const popup = document.getElementById("alert-popup");
    newAlertPopup.init();
    newAlertPopup.hide();
    
    expect(popup.classList.contains("winner-alert")).toBe(false);
    expect(popup.classList.contains("hidden")).toBe(true);
});