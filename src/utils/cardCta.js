// El botón que cierra cada tarjeta de platillo: cómo se llama y a dónde va.
//
// Por default abre el detalle del platillo y dice "Ver más", que es como funcionó
// siempre. Un negocio puede cambiarle el texto y, si además le pone una URL, el
// botón deja de abrir el modal y navega.
//
// Nace de Kazuki, que tiene su menú partido en dos páginas de su propio dominio:
// una con las categorías, que enlaza a la otra —la del iframe— con `?cat=`. La ida
// ya funcionaba; esto es la vuelta.
//
// Las dos llaves viven en `theme_config`, junto a `banner_text` y `cart_image`, así
// que no hubo columna nueva. Sin URL configurada NADA cambia: es lo que mantiene a
// los otros negocios exactamente como estaban.

export const ETIQUETA_POR_DEFECTO = "Ver más";

const config = (establishment) => {
  const cfg = establishment?.theme_config;
  // theme_config puede llegar como null, o como string si alguien guardó el JSON
  // sin decodificar. En los dos casos no hay nada que leer.
  return cfg && typeof cfg === "object" && !Array.isArray(cfg) ? cfg : {};
};

const texto = (v) => (typeof v === "string" ? v.trim() : "");

/** Cómo se llama el botón. Vacío o solo espacios cae al de siempre. */
export function ctaLabelOf(establishment) {
  return texto(config(establishment).card_cta_label) || ETIQUETA_POR_DEFECTO;
}

/**
 * A dónde va el botón, o null si abre el detalle (lo normal).
 *
 * Solo http y https. Este valor termina en un `href` dentro del menú de un cliente:
 * un `javascript:` ahí sería ejecutar código ajeno en la página de su negocio, y un
 * `//otro-sitio.com` se lo llevaría fuera sin que se note al capturarlo.
 */
export function ctaUrlOf(establishment) {
  const bruto = texto(config(establishment).card_cta_url);
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
}
