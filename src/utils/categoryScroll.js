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

/**
 * A qué scroll llevar la tira de categorías para dejar el tab activo al centro.
 *
 * Quasar ya la mueve sola al cambiar de tab, pero con el cálculo mínimo: empuja lo
 * justo para que el tab entre en pantalla, así que la categoría activa acaba pegada a
 * la orilla y no se ve qué sigue. Centrarla es lo que la vuelve una brújula: siempre
 * se asoma la anterior y la siguiente.
 *
 * El recorte a los extremos es la otra mitad. Sin él, la primera categoría quedaría
 * flotando a media pantalla con un hueco a su izquierda, y la última con uno a la
 * derecha.
 *
 * Sin unidades ni ejes: el llamador pasa medidas horizontales o verticales según cómo
 * esté la tira, y lo que sale es el scroll de ese mismo eje.
 */
export function centerTabScroll({ tabStart, tabSize, viewSize, contentSize }) {
  const maximo = contentSize - viewSize;
  if (!(maximo > 0)) return 0; // no se pasa de largo: no hay nada que recorrer

  // Un tab más ancho que la tira no cabe, y centrarlo le cortaría el principio al
  // nombre. Se alinea a su inicio: más vale leer "CAMARONES EMPANIZ…" que "…IZADOS".
  const destino =
    tabSize >= viewSize ? tabStart : tabStart + tabSize / 2 - viewSize / 2;

  return Math.max(0, Math.min(destino, maximo));
}

/**
 * ¿El scroll ya tocó fondo? Decide si mandan "las últimas".
 *
 * Existe porque una categoría corta al final -Postres con dos platillos- nunca sube
 * su título arriba de la línea de fijado: el cliente la está viendo y el menú sigue
 * marcando la anterior, sin manera de corregirlo porque ya no hay scroll.
 *
 * El cuidado está en QUIÉN se mide. `target` viene del evento y muchas veces no es
 * quien scrollea:
 *
 *   - En touchmove es el elemento tocado, una tarjeta de platillo.
 *   - La tira de categorías scrollea en horizontal y dispara su propio evento.
 *
 * Ninguno de los dos baja verticalmente -scrollHeight igual a clientHeight-, y darlos
 * por buenos hacía que "ya llegué al fondo" fuera verdad SIEMPRE: en móvil el menú
 * abría marcando la última categoría y volvía a ella con cada arrastre.
 *
 * Recibe medidas, no elementos, para poder probarse sin un navegador.
 */
export function estaEnElFondo(target, documento) {
  const bajaDeVerdad = (el) => !!el && el.scrollHeight > el.clientHeight + 1;

  const el = bajaDeVerdad(target) ? target : documento;

  // Si nada se puede bajar, no hay fondo al que llegar: la página entera cabe y las
  // categorías se ven todas. Forzar la última ahí sería inventarse una lectura.
  if (!bajaDeVerdad(el)) return false;

  // 2px de holgura: con zoom o densidades raras el fondo no cae en un entero exacto.
  return el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
}
