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
