/**
 * Service Worker — compatível com GitHub Pages (incluindo subpasta /repo/)
 */
const CACHE_NAME = "cardapio-bebidas-v2";

const ASSET_PATHS = [
  "",
  "index.html",
  "manifest.json",
  "assets/css/style.css",
  "assets/css/variables.css",
  "assets/css/reset.css",
  "assets/css/header.css",
  "assets/css/banner.css",
  "assets/css/produtos.css",
  "assets/css/carrinho.css",
  "assets/css/modal.css",
  "assets/css/footer.css",
  "assets/css/animations.css",
  "assets/css/responsive.css",
  "assets/js/config.js",
  "assets/js/utils.js",
  "assets/js/horario.js",
  "assets/js/categorias.js",
  "assets/js/produtos.js",
  "assets/js/banner.js",
  "assets/js/carrinho.js",
  "assets/js/whatsapp.js",
  "assets/js/pwa.js",
  "assets/js/app.js",
  "data/loja.json",
  "data/produtos.json",
  "data/categorias.json",
  "data/banners.json",
  "assets/images/logo.svg",
  "assets/images/favicon.svg",
  "assets/images/produto-placeholder.svg",
  "assets/images/icon-192.png",
  "assets/images/icon-512.png",
];

/** Scope do SW = pasta do projeto no GitHub Pages */
function toScopedUrl(path) {
  const scope = self.registration.scope; // ex: https://user.github.io/repo/
  return new URL(path, scope).href;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const urls = ASSET_PATHS.map(toScopedUrl);

      // Não falha a instalação se um arquivo individual der erro
      await Promise.all(
        urls.map((url) =>
          cache.add(url).catch((err) => {
            console.warn("[SW] Falha ao cachear:", url, err);
          })
        )
      );

      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Só intercepta pedidos do mesmo origin / scope
  if (!request.url.startsWith(self.registration.scope) && url.origin === self.location.origin) {
    // ainda pode ser do mesmo origin mas fora do scope — ignora
    if (!request.url.startsWith(self.registration.scope)) return;
  }

  // Network-first para JSON (dados atualizados)
  if (url.pathname.includes("/data/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first para demais assets
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === "opaque") {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(toScopedUrl("index.html")));
    })
  );
});
