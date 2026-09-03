/**
 * Abrir una pestaña nueva desde el menu, aunque vaya embebido.
 *
 * Dentro de un iframe con `sandbox` -que es como varios sitios embeben el menu-,
 * `window.open` devuelve `null` y no pasa absolutamente nada: ni ventana, ni error, ni
 * aviso. El comensal toca el boton y se queda mudo. Comprobado: en un iframe normal
 * abre bien, y con `sandbox` sin `allow-popups` devuelve `null`.
 *
 * Por eso hay un plan B: pedirle a la pagina que nos contiene que lo abra ella, que no
 * esta dentro del sandbox. Ese mensaje lo atiende `public/embed.js` y contesta. Si no
 * contesta -porque el sitio embebe el menu sin ese script-, se avisa, que es mejor que
 * el silencio.
 */

/** Si el menu va embebido en otro sitio. */
export function vaEmbebido() {
  try {
    return typeof window !== "undefined" && window.parent && window.parent !== window;
  } catch {
    return false;
  }
}

/**
 * Abre `url` en una pestaña nueva. `alFallar` se llama solo si no se pudo de ninguna
 * manera, para que quien llama decida que decirle al comensal.
 */
export function abrirPestana(url, { alFallar } = {}) {
  if (!url) return false;

  let ventana = null;
  try {
    ventana = window.open(url, "_blank", "noopener");
  } catch {
    ventana = null;
  }
  if (ventana) return true;

  // Bloqueado. Si hay una pagina contenedora, que lo intente ella.
  if (!vaEmbebido()) {
    alFallar?.();
    return false;
  }

  let contesto = false;
  const oir = (e) => {
    if (e?.data && e.data.type === "comeleya:abierto") contesto = true;
  };
  window.addEventListener("message", oir);
  try {
    window.parent.postMessage({ type: "comeleya:abrir", url }, "*");
  } catch {
    // sin canal con el contenedor
  }

  // Un momento para que conteste. Sin respuesta, el sitio no trae embed.js y no hay
  // forma de abrir nada: se avisa.
  setTimeout(() => {
    window.removeEventListener("message", oir);
    if (!contesto) alFallar?.();
  }, 900);

  return true;
}
