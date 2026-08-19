import { boot } from "quasar/wrappers";

// Registra el service worker (PWA instalable). Va envuelto en guards para que si
// algo falla, la app siga funcionando exactamente igual.
export default boot(() => {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  // Solo en producción con HTTPS (evita interferir con el dev server local).
  if (window.location.protocol !== "https:") return;

  window.addEventListener("load", () => {
    // updateViaCache: "none" -> el navegador SIEMPRE re-descarga sw.js (no lo cachea),
    // así detecta versiones nuevas en cada carga en vez de quedarse con la vieja.
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((reg) => {
        // Busca si hay una versión nueva del SW cada vez que se abre la app.
        reg.update().catch(() => {});
      })
      .catch(() => {
        // sin SW: la app funciona normal, solo no es instalable
      });

    // Si YA había un SW controlando y llega uno nuevo (que hace skipWaiting+claim),
    // recarga una vez para usar el bundle nuevo. En la primera instalación no hay
    // controller previo, así que no recarga.
    let refreshing = false;
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    }
  });
});
