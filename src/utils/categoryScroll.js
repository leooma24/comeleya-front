// Posicionamiento al saltar a una categoría del menú.
//
// Hay DOS números que tienen que concordar o el tab se queda en la categoría
// anterior:
//
//   1. Dónde aterriza el título de la categoría.
//   2. La línea a partir de la cual el scroll-spy considera que ya "pasó" y
//      marca ese tab.
//
// Si el aterrizaje queda POR DEBAJO de la línea del spy, el título llega a un
// pelo de activarse y el tab anterior se queda seleccionado. Es justo lo que
// pasaba en el iframe: se aterrizaba a tabs+12 (unos 65px) mientras la línea del
// spy estaba fija en 60.
//
// Por eso los dos salen de la misma medición y el aterrizaje queda siempre por
// ENCIMA de la línea.

const RESPIRO = 12; // para que el título no quede pegado a los tabs
const MARGEN_SPY = 6; // la línea del spy va un poco por debajo del aterrizaje

/**
 * Borde inferior de la barra de categorías fija, medido en vivo.
 * La altura real varía: el bloque del establecimiento cambia según tenga
 * dirección, banner o calificación, así que un número fijo se desfasa.
 */
function tabsBottom({ isExternal, isNarrow }) {
  const tabsFijos = isExternal || isNarrow;
  if (!tabsFijos) return null; // escritorio normal: solo el header

  const el = typeof document !== "undefined" && document.querySelector(".mc-sidebar-tabs");
  if (el) return el.getBoundingClientRect().bottom;

  // Respaldo si aún no montó: alturas típicas de cada modo.
  return isExternal ? 56 : 230;
}

/** Cuánto restarle a la posición de la sección para que aterrice bajo los tabs. */
export function scrollOffsetFor(ctx) {
  const bottom = tabsBottom(ctx);
  if (bottom === null) return -60; // escritorio: solo el header de 56px
  return -(bottom + RESPIRO);
}

/** Línea a partir de la cual el spy da una categoría por activa. */
export function spyThresholdFor(ctx) {
  const bottom = tabsBottom(ctx);
  if (bottom === null) return 75;
  return bottom + RESPIRO + MARGEN_SPY;
}
