// Configuración de un extra: qué control se dibuja y cómo cuenta su precio.
//
// Son dos preguntas INDEPENDIENTES que antes se deducían las dos del precio de las
// opciones, y esa fusión causaba dos problemas: no se podía tener un extra gratis
// pero repetible (una promo "3 piezas por $350"), y el navegador aplicaba una regla
// de reemplazo que el servidor no tenía, cobrando el doble.
//
// Ahora cada una es un campo guardado en `extras`. La heurística vieja se conserva
// SOLO como respaldo para extras que todavía no lo traen (despliegue escalonado o
// datos sin migrar), y nunca contradice al campo cuando este existe.

const CONTROLES = ["radio", "checkbox", "counter"];
const MODOS_PRECIO = ["add", "replace"];

// OJO: [].every(...) es true, así que un extra SIN opciones pasaría como "todas con
// precio" y caería en reemplazo, dejando el total en 0. Por eso se exige longitud.
const todasConPrecio = (extra) => {
  const opciones = extra?.options || [];
  return opciones.length > 0 && opciones.every((o) => Number(o?.price ?? 0) > 0);
};

const maxDeclarado = (extra) => {
  const n = Number(extra?.qty);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
};

// El respaldo tiene que reproducir la conducta vieja AL PIE DE LA LETRA, incluidos
// los casos raros: un extra sin `qty` no era "elige 1" ni "elige varios", caía en
// casillas y en aditivo. Normalizarlo a 1 lo volvería "reemplazo" y le borraría el
// precio base al platillo, que es justo lo que estamos arreglando.
const eligeUno = (extra) => Number(extra?.qty) === 1;
const eligeVarios = (extra) => Number(extra?.qty) > 1;

/**
 * Control que ve el comensal.
 *  - "radio":    elige exactamente una opción
 *  - "checkbox": elige varias distintas, sin repetir
 *  - "counter":  elige cantidades, puede repetir la misma opción
 */
export function controlOf(extra) {
  if (CONTROLES.includes(extra?.selection_type)) return extra.selection_type;
  if (eligeUno(extra)) return "radio";
  if (eligeVarios(extra) && todasConPrecio(extra)) return "counter";
  return "checkbox";
}

/**
 * Cómo cuenta el precio de la opción.
 *  - "add":     se suma al precio del platillo
 *  - "replace": ES el precio del platillo (variantes de tamaño)
 */
export function priceModeOf(extra) {
  if (MODOS_PRECIO.includes(extra?.price_mode)) return extra.price_mode;
  return eligeUno(extra) && todasConPrecio(extra) ? "replace" : "add";
}

/** Tope de unidades (counter) u opciones distintas (checkbox) que admite el extra. */
export function maxOf(extra) {
  return controlOf(extra) === "radio" ? 1 : maxDeclarado(extra);
}

/** Unidades ya elegidas en el extra. */
export function chosenOf(extra) {
  return (extra?.options || []).reduce((total, o) => total + (Number(o?.qty) || 0), 0);
}

/** ¿Ya no se puede elegir más en este extra? */
export function isFull(extra) {
  return chosenOf(extra) >= maxOf(extra);
}

/** Texto de la regla que se muestra junto al nombre del extra. */
export function selectionRuleOf(extra) {
  const max = maxOf(extra);
  switch (controlOf(extra)) {
    case "radio":
      return "Elige 1";
    case "counter":
      return `Elige ${max} en total`;
    default:
      return `Elige hasta ${max}`;
  }
}
