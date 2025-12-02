class AlertPopup {
    constructor() {
        this.popup = null;
        this.messageEl = null;
        this.acceptBtn = null;
        this.cancelBtn = null;
        this.resolvePromise = null;
    }

    init() {
        if (this.popup) return;

        this.popup = document.getElementById('alert-popup');
        this.messageEl = document.querySelector('.alert-message');
        this.acceptBtn = document.getElementById('alert-accept-btn');
        this.cancelBtn = document.getElementById('alert-cancel-btn');

        if (!this.popup || !this.messageEl || !this.acceptBtn) {
            console.error("AlertPopup: required elements missing");
            return;
        }

        this.acceptBtn.addEventListener("click", () => {
            this.hide();
            if (this.resolvePromise) {
                this.resolvePromise(true);
                this.resolvePromise = null;
            }
        });

        if (this.cancelBtn) {
            this.cancelBtn.addEventListener("click", () => {
                this.hide();
                if (this.resolvePromise) {
                    this.resolvePromise(false);
                    this.resolvePromise = null;
                }
            });
        }
    }

    show(message, showCancel = false, acceptText = "OK", cancelText = "Cancel", isHTML = false, extraClass = "") {
        this.init(); // <-- AHORA SE INICIALIZA AQUÍ, CON DOM DISPONIBLE

        if (!this.popup || !this.messageEl) {
            return Promise.resolve();
        }

        if (isHTML) {
            this.messageEl.innerHTML = message;
        } else {
            this.messageEl.textContent = message;
        }

        this.acceptBtn.textContent = acceptText;

        if (this.cancelBtn) {
            this.cancelBtn.textContent = cancelText;
            this.cancelBtn.classList.toggle("hidden", !showCancel);
        }

        if (extraClass) this.popup.classList.add(extraClass);

        this.popup.classList.remove("hidden");

        return new Promise((resolve) => {
            this.resolvePromise = resolve;
        });
    }

    hide() {
        if (this.popup) {
            this.popup.classList.add("hidden");
            this.popup.classList.remove("winner-alert");
        }
    }

    alert(message) {
        return this.show(message, false);
    }

    confirm(message) {
        return this.show(message, true);
    }
}

export const alertPopup = new AlertPopup();
