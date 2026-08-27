/**
 * Llevar al comensal al mapa del negocio.
 *
 * Dos cosas que parecen una sola y no lo son: armar la direccion del mapa, y lograr
 * abrirla. La segunda es la que fallaba.
 *
 * Dentro de un iframe con `sandbox` -que es como varios sitios embeben el menu-,
 * `window.open` devuelve `null` y no pasa absolutamente nada: ni ventana, ni error, ni
 * aviso. El comensal toca "Ver en Mapa" y el boton se queda mudo. Comprobado: en un
 * iframe normal abre bien, y con `sandbox` sin `allow-popups` devuelve `null`.
 *
 * Por eso hay un plan B: pedirle a la pagina que nos contiene que lo abra ella, que no
 * esta dentro del sandbox. Ese mensaje lo atiende `public/embed.js` y contesta. Si no
 * contesta -porque el sitio embebe el menu sin ese script-, se avisa, que es mejor que
 * el silencio.
 */

/** El buscador de Google Maps, con coordenadas si las hay y si no con la direccion. */
export function urlDelMapa({ coordenadas, direccion } = {}) {
  const c = String(coordenadas || "").replace(/\s/g, "");
  if (c) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c)}`;

  // Sin coordenadas se busca por el texto de la direccion. Es lo que deja el boton vivo
  // para los 19 negocios de 107 que en produccion no las tienen puestas: el campo vivia
  // dentro de "Envio a domicilio" y el que solo da para recoger no entraba ahi.
  const d = limpiar(direccion);
  if (!d) return "";

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d)}`;
}

/**
 * Deja la direccion buscable.
 *
 * Se arma juntando campos y varios vienen vacios, asi que salen cosas como
 * "Madrid  0, Los Mochis, , Mexico" -real, de un negocio en produccion-. Se quitan los
 * huecos, las comas seguidas y el numero exterior "0", que significa que no lo pusieron.
 */
function limpiar(direccion) {
  let d = String(direccion || "").trim();
  if (!d || d.includes("undefined")) return "";

  d = d.replace(/\s+/g, " ");
  d = d.replace(/(^|[,\s])0(?=[,\s]|$)/g, "$1");
  d = d.replace(/\s*,\s*/g, ", ");
  d = d.replace(/(,\s*)+/g, ", ");
  d = d.replace(/^[\s,]+|[\s,]+$/g, "");

  return d.replace(/\s+/g, " ").trim();
}

/** Si el menu va embebido en otro sitio. */
function vaEmbebido() {
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
export function abrirEnMapa(url, { alFallar } = {}) {
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
