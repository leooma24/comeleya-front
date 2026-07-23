// Píxel de Meta por establecimiento. Se inicializa solo si el restaurante tiene un
// pixel_id configurado (premium). Todo va envuelto en try/catch: si algo falla o el
// cliente bloquea Meta, el menú sigue funcionando normal.
let currentPixel = null;

export function initPixel(pixelId) {
  if (typeof window === "undefined" || !pixelId) return;
  // Evita re-inicializar el mismo pixel (p. ej. al re-montar el menú).
  if (currentPixel === pixelId) return;
  currentPixel = pixelId;

  try {
    if (!window.fbq) {
      /* eslint-disable */
      !(function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = "2.0";
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      /* eslint-enable */
    }
    window.fbq("init", pixelId);
    window.fbq("track", "PageView");
  } catch {
    // sin pixel: no pasa nada
  }
}

export function trackFb(event, data) {
  try {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", event, data || {});
    }
  } catch {
    // silencioso
  }
}
