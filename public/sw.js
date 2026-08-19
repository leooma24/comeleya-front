/* ComeleYa Service Worker — mínimo y seguro.
   Estrategia:
   - HTML/navegación: SIEMPRE red primero (nunca sirve una página vieja); si no hay
     internet, cae al último HTML cacheado.
   - Assets con hash (/assets/*, iconos): cache-first con revalidación en segundo plano.
   - API (otro origen, app.comeleya.com): NO se toca, va directo a la red.
   Al cambiar CACHE se limpian las versiones anteriores. */
const CACHE = "comeleya-v3";
const OFFLINE_URLS = ["/"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(OFFLINE_URLS)).catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Solo manejamos el mismo origen (comeleya.com). La API vive en otro origen: se ignora.
  if (url.origin !== self.location.origin) return;

  // Navegaciones / HTML: SIEMPRE fresco del servidor (cache: "reload" ignora la
  // caché HTTP del navegador), así cada deploy se refleja de inmediato. Fallback a
  // caché solo si no hay internet.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req, { cache: "reload" })
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("/", copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("/")))
    );
    return;
  }

  // Assets estáticos con hash: cache-first + revalidación.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
