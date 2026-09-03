/**
 * Llevar al comensal al mapa del negocio.
 *
 * Dos cosas que parecen una sola y no lo son: armar la direccion del mapa, y lograr
 * abrirla. La segunda es la que fallaba, y ya no vive aqui: la resuelve
 * `abrirPestana` en src/utils/abrirVentana.js, que es la misma pelea del boton mudo
 * dentro de un iframe y la comparte con el boton de compartir.
 */
import { abrirPestana } from "src/utils/abrirVentana";

/**
 * Abre `url` en una pestaña nueva. `alFallar` se llama solo si no se pudo de ninguna
 * manera, para que quien llama decida que decirle al comensal.
 */
export function abrirEnMapa(url, opciones) {
  return abrirPestana(url, opciones);
}

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
