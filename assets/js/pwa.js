/**
 * Progressive Web App — instalação e service worker
 * Compatível com GitHub Pages (incluindo /nome-do-repo/)
 */
const PWA = {
  deferredPrompt: null,

  init() {
    this.registrarSW();
    this.bindInstall();
  },

  registrarSW() {
    if (!("serviceWorker" in navigator)) return;

    const swUrl =
      typeof assetUrl === "function"
        ? assetUrl("service-worker.js")
        : "./service-worker.js";

    const scope =
      typeof APP_BASE === "string" ? APP_BASE : "./";

    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register(swUrl, { scope })
        .then((reg) => {
          console.log("[PWA] Service Worker registrado:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] Falha ao registrar SW:", err);
        });
    });
  },

  bindInstall() {
    const banner = document.getElementById("pwa-banner");
    const btnInstalar = document.getElementById("pwa-instalar");
    const btnFechar = document.getElementById("pwa-fechar");

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.deferredPrompt = e;

      const dismissed = localStorage.getItem("pwa_dismissed");
      if (!dismissed && banner) {
        banner.classList.add("visivel");
      }
    });

    btnInstalar?.addEventListener("click", async () => {
      if (!this.deferredPrompt) return;
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      if (outcome === "accepted") {
        Utils.toast("App instalado!");
      }
      this.deferredPrompt = null;
      banner?.classList.remove("visivel");
    });

    btnFechar?.addEventListener("click", () => {
      banner?.classList.remove("visivel");
      localStorage.setItem("pwa_dismissed", "1");
    });

    window.addEventListener("appinstalled", () => {
      banner?.classList.remove("visivel");
      this.deferredPrompt = null;
    });
  },
};

window.PWA = PWA;
