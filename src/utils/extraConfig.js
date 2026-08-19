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

// ---------------------------------------------------------------------------
// Topes que dependen de OTRO extra
//
// Un grupo puede tomar su tope del tamaño elegido en otro grupo del mismo
// platillo: la Charola de 36 piezas incluye 3 rollos, la de 48 incluye 4. Eso lo
// declara cada opción del grupo fuente en `grants_qty`, y el grupo dependiente
// apunta al fuente con `qty_from_extra_id`.
//
// Además, una opción puede tener su propio techo (`max_qty`): el Norteño es el
// rollo caro y en la charola chica no se permiten 3 iguales. Las opciones del
// grupo fuente pueden desactivar esos techos con `lifts_caps` (en las charolas
// grandes el precio ya los absorbe).
//
// OJO con las firmas: el segundo argumento `extras` es OPCIONAL. Sin él estas
// funciones se comportan igual que antes de existir la dependencia, que es lo
// que mantiene funcionando a los llamadores que no la necesitan.
// ---------------------------------------------------------------------------

const entero = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
};

/** La opción actualmente elegida en un extra (la primera con cantidad). */
const opcionElegida = (extra) => (extra?.options || []).find((o) => Number(o?.qty) > 0) || null;

/** El extra del que este toma su tope, si es que declara uno. */
const extraFuente = (extra, extras) => {
  const id = extra?.qty_from_extra_id;
  if (!id || !Array.isArray(extras)) return null;
  // Nunca por posición: el orden de los extras no está garantizado.
  return extras.find((e) => e && e.id === id && e !== extra) || null;
};

/** Tope de unidades (counter) u opciones distintas (checkbox) que admite el extra. */
export function maxOf(extra, extras) {
  if (controlOf(extra) === "radio") return 1;

  const fuente = extraFuente(extra, extras);
  if (fuente) {
    const otorga = entero(opcionElegida(fuente)?.grants_qty);
    // Sin tamaño elegido todavía, o un tamaño que no declara cuánto incluye:
    // se cae al tope propio, que es la conducta de siempre.
    if (otorga) return otorga;
  }

  return maxDeclarado(extra);
}

/**
 * Tope de UNA opción dentro de su grupo.
 * Devuelve el tope del grupo cuando la opción no tiene techo propio: nunca puede
 * elegirse más de una sola opción que el total del grupo.
 */
export function maxOfOption(extra, option, extras) {
  const maxGrupo = maxOf(extra, extras);

  const fuente = extraFuente(extra, extras);
  if (fuente && opcionElegida(fuente)?.lifts_caps) {
    return maxGrupo; // este tamaño quita todos los techos
  }

  const techos = [];

  // "Al menos dos variedades": no puede llevarse el grupo completo de una sola
  // opción. Se ajusta solo al tamaño elegido —2 de 3, 3 de 4, 5 de 6— sin tener
  // que capturar un número por cada combinación de tamaño y opción.
  if (extra?.require_variety && maxGrupo > 1) {
    techos.push(maxGrupo - 1);
  }

  // Techo propio de esta opción, si lo tiene.
  const propio = entero(option?.max_qty);
  if (propio) techos.push(propio);

  // Gana el más estricto, y el total del grupo siempre manda por encima de todos.
  return techos.length ? Math.min(...techos, maxGrupo) : maxGrupo;
}

/** ¿Esta opción ya llegó a su propio techo? (distinto de que el grupo esté lleno) */
export function isOptionFull(extra, option, extras) {
  const propio = maxOfOption(extra, option, extras);
  return (Number(option?.qty) || 0) >= propio;
}

/** El techo que impone "al menos dos variedades", o null si no aplica. */
const techoDeVariedad = (extra, extras) => {
  const maxGrupo = maxOf(extra, extras);
  return extra?.require_variety && maxGrupo > 1 ? maxGrupo - 1 : null;
};

/** ¿La opción tiene un techo MENOR al del grupo? Solo entonces vale explicarlo. */
export function optionCapLabel(extra, option, extras) {
  const propio = maxOfOption(extra, option, extras);
  if (propio >= maxOf(extra, extras)) return "";

  // La variedad vale para TODAS las opciones por igual y ya se dice en la regla del
  // grupo. Repetirla aquí llenaría la lista de "máx. 2" idénticos, y entonces el
  // que sí es propio de una opción —el rollo caro— dejaría de notarse.
  if (propio === techoDeVariedad(extra, extras)) return "";

  return `máx. ${propio}`;
}

/**
 * ¿Este grupo no le ofrece al comensal ninguna decisión real?
 *
 * Una sola opción no es una eleccion, es una pregunta con una sola respuesta. Pasa
 * seguido porque el panel creaba por default un grupo "Opciones" con una opción
 * "Base" al precio del platillo (ya corregido para los nuevos, pero los viejos
 * siguen ahí).
 *
 * La condición NO es solo "tiene una opción": si esa opción COBRA de más, esconder
 * el grupo haría que el comensal pagara algo que nunca vio. Por eso además se
 * exige que no mueva el precio del platillo.
 */
export function isDecorative(extra, precioBase) {
  const opciones = extra?.options || [];
  if (opciones.length !== 1) return false; // con dos o más sí hay que elegir

  const unica = opciones[0];
  const precioOpcion = Number(unica?.price) || 0;
  const base = Number(precioBase) || 0;

  // "replace": la opción ES el precio. Solo sobra si vale lo mismo que el platillo.
  if (priceModeOf(extra) === "replace") {
    return precioOpcion === base;
  }

  // "add": solo sobra si no suma nada.
  return precioOpcion === 0;
}

/** Unidades ya elegidas en el extra. */
export function chosenOf(extra) {
  return (extra?.options || []).reduce((total, o) => total + (Number(o?.qty) || 0), 0);
}

/** ¿Ya no se puede elegir más en este extra? */
export function isFull(extra, extras) {
  return chosenOf(extra) >= maxOf(extra, extras);
}

/** Texto de la regla que se muestra junto al nombre del extra. */
export function selectionRuleOf(extra, extras) {
  const max = maxOf(extra, extras);
  switch (controlOf(extra)) {
    case "radio":
      return "Elige 1";
    case "counter": {
      const regla = `Elige ${max} en total`;
      const variedad = techoDeVariedad(extra, extras);
      // Solo en "cantidades": en casillas no se puede repetir, así que la variedad
      // ya está garantizada y decirlo sobraría.
      return variedad ? `${regla} · máx. ${variedad} iguales` : regla;
    }
    default:
      return `Elige hasta ${max}`;
  }
}

// ---------------------------------------------------------------------------
// Lo que el panel necesita para partirse en Básico y Experto
// ---------------------------------------------------------------------------

/** Formatea un monto como se ve en el panel: $50, $12.50. */
const pesos = (n) => {
  const v = Number(n) || 0;
  return `$${Number.isInteger(v) ? v : v.toFixed(2)}`;
};

const plural = (n, singular, muchos) => `${n} ${n === 1 ? singular : muchos}`;

/**
 * Qué configuración avanzada trae prendida este grupo, dicho en palabras.
 *
 * En modo Básico esos controles no se dibujan, y ahí está el riesgo: alguien
 * configura los topes de la charola, otro entra en Básico, no ve nada raro, y no
 * entiende por qué el menú se comporta distinto a lo que el panel le muestra. Este
 * resumen es lo que impide esconder en silencio.
 *
 * Devuelve [] cuando no hay nada avanzado, que es el caso común (una salsa con dos
 * opciones) y donde el modo Básico tiene que quedar completamente limpio.
 */
export function advancedSummary(extra, extras) {
  if (!extra) return [];
  const partes = [];
  const hermanos = Array.isArray(extras) ? extras : [];

  // Nunca por posición: el orden de los extras no está garantizado.
  const dependiente = hermanos.find(
    (e) => e && e !== extra && e.qty_from_extra_id && e.qty_from_extra_id === extra.id
  );
  if (dependiente) {
    partes.push(`Define el máximo de ${dependiente.name || "otro grupo"}`);
  }

  if (extra.qty_from_extra_id) {
    const fuente = hermanos.find((e) => e && e.id === extra.qty_from_extra_id && e !== extra);
    partes.push(`Su máximo lo define ${fuente?.name || "otro grupo"}`);
  }

  if (extra.require_variety) partes.push("Al menos dos variedades");

  const opciones = extra.options || [];

  const conTope = opciones.filter((o) => entero(o?.max_qty)).length;
  if (conTope) partes.push(plural(conTope, "opción con tope propio", "opciones con tope propio"));

  const sinLimite = opciones.filter((o) => o?.lifts_caps).length;
  if (sinLimite) {
    partes.push(plural(sinLimite, "opción permite", "opciones permiten") + " repetir sin límite");
  }

  return partes;
}

/**
 * El ejemplo con los números reales del platillo para el campo de precio.
 *
 * Ese campo decide si el precio de la opción se suma o reemplaza, y es el que hacía
 * que el navegador y el servidor calcularan distinto: una Charola de $425 se
 * guardaba en $850. Etiquetarlo con la torta y el precio que el dueño ACABA de
 * teclear es más claro que cualquier explicación en abstracto.
 *
 * Devuelve null si ninguna opción cuesta: ahí el campo no se dibuja, que es la
 * misma condición que ya usa el panel para mostrarlo.
 */
export function priceExampleOf(extra, precioBase) {
  const opcion = (extra?.options || []).find((o) => Number(o?.price) > 0);
  if (!opcion) return null;

  const base = Number(precioBase) || 0;
  const precio = Number(opcion.price) || 0;
  const nombre = opcion.name || "esa opción";

  return {
    suma: `${pesos(base)} + ${nombre} ${pesos(precio)} = ${pesos(base + precio)}`,
    reemplazo: `${nombre} ${pesos(precio)} = ${pesos(precio)}`,
  };
}
