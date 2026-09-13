// De que menu llego quien se registra.
//
// Cada menu publico lleva al pie "Menu hecho con ComeleYa", con una liga a la portada
// que trae ?ref=<slug del negocio>. Quien la sigue casi nunca se registra en ese mismo
// momento: primero lee la portada, ve los precios, a veces vuelve otro dia. Por eso la
// referencia se guarda en el navegador en cuanto llega, y el alta la manda al servidor.
//
// Treinta dias: si se registra despues de eso, ya no fue ese menu el que lo trajo.

const LLAVE = "mc-ref";
const VIGENCIA_MS = 30 * 24 * 60 * 60 * 1000;
// Un slug de negocio: minusculas, numeros y guiones. Cualquier otra cosa no se guarda.
const SLUG = /^[a-z0-9][a-z0-9-]{0,120}$/;

/** Guarda el ?ref= de la liga, si trae uno valido. La ultima liga que siguio es la que cuenta. */
export function guardarReferencia(query, ahora = Date.now()) {
  const slug = String(query?.ref ?? "").trim().toLowerCase();
  if (!SLUG.test(slug)) return;
  try {
    localStorage.setItem(LLAVE, JSON.stringify({ slug, at: ahora }));
  } catch {
    // Navegacion privada o almacenamiento bloqueado: se pierde la referencia, nada mas.
  }
}

/** El slug del menu que lo trajo, o null si no llego por uno o ya paso mucho tiempo. */
export function leerReferencia(ahora = Date.now()) {
  try {
    const guardada = JSON.parse(localStorage.getItem(LLAVE) || "null");
    if (!guardada || !SLUG.test(String(guardada.slug ?? ""))) return null;
    return ahora - Number(guardada.at) <= VIGENCIA_MS ? guardada.slug : null;
  } catch {
    return null;
  }
}
