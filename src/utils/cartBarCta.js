// El lado derecho de la barra del pedido: el que dice "Ver pedido →".
//
// Un negocio puede cambiarlo por un enlace suyo. Nace de Kazuki, que tiene su menú
// partido en dos páginas de su propio dominio: una con las categorías, que enlaza a
// la otra —la del iframe— con `?cat=`. La ida ya funcionaba; esto es la vuelta.
//
// Primero vivió en el botón "Ver más" de cada tarjeta de platillo, y ahí estaba mal:
// con la URL capturada NINGÚN platillo abría ya su detalle, así que el negocio perdía
// el menú entero a cambio de un botón de regreso. En la barra hay uno solo.
//
// Las llaves siguen diciendo `card_` porque así se guardaron en producción y hay dos
// negocios con valores capturados (Sushi Express, Kazuki); renombrarlas los dejaría
// huérfanos sin una migración en el backend. Viven en `theme_config`, junto a
// `banner_text` y `cart_image`, así que nunca hubo columna nueva.

const config = (establishment) => {
  const cfg = establishment?.theme_config;
  // theme_config puede llegar como null, o como string si alguien guardó el JSON
  // sin decodificar. En los dos casos no hay nada que leer.
  return cfg && typeof cfg === "object" && !Array.isArray(cfg) ? cfg : {};
};

const texto = (v) => (typeof v === "string" ? v.trim() : "");

/**
 * Solo http y https. Este valor termina en un `href` dentro del menú de un cliente:
 * un `javascript:` ahí sería ejecutar código ajeno en la página de su negocio, y un
 * `//otro-sitio.com` se lo llevaría fuera sin que se note al capturarlo.
 */
const urlSegura = (bruto) => {
  if (!bruto) return null;

  try {
    // Con base explícita para que una ruta relativa no dependa de dónde se llame.
    const url = new URL(bruto, "https://comeleya.com");
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    // Se devuelve lo capturado, no url.href: normalizar cambiaría la dirección que
    // el dueño ve en el panel por otra parecida.
    return /^https?:\/\//i.test(bruto) ? bruto : null;
  } catch {
    return null;
  }
};

/**
 * `{ label, url }` si este negocio configuró el botón, o null para dejar la barra como
 * siempre: "Ver pedido", y todo el ancho abre el cajón del pedido.
 *
 * Tres condiciones, y las tres tienen que cumplirse:
 *
 * - `embedded`: el enlace solo existe dentro del iframe. Quien abra el menú en
 *   comeleya.com no viene de la página del negocio y no tiene a dónde "volver".
 * - Una URL que pase `urlSegura`.
 * - Un texto. Los dos campos van juntos a propósito: un botón que dijera "Ver pedido"
 *   y se fuera a otro sitio sería mentira, y uno sin texto no se entiende.
 */
export function cartBarCta(establishment, { embedded } = {}) {
  if (!embedded) return null;

  const cfg = config(establishment);
  const label = texto(cfg.card_cta_label);
  if (!label) return null;

  const url = urlSegura(texto(cfg.card_cta_url));
  if (!url) return null;

  return { label, url };
}
