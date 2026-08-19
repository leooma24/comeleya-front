// ¿Esto aplica hoy? — días de la semana para platillos y ofertas.
//
// Nace de las promociones recurrentes: "lunes ceviche 3x2", "promo de fin de
// semana", activas hasta que las cancelen. Se usa en dos lugares con la MISMA
// forma, y por eso la regla vive aquí y no repetida en cada uno:
//
//   - dishes.available_days  → el platillo solo se vende esos días
//   - dishes.special_days    → la oferta solo aplica esos días
//
// Los números son los de `Date.getDay()`: 0 domingo … 6 sábado. Se eligió ese
// criterio y no uno propio para que el navegador no tenga que traducir nada; el
// servidor sí traduce, una sola vez, en Dish::aplicaHoy().

/** Domingo primero, como getDay(). El orden importa: el índice ES el día. */
export const DIAS = [
  { valor: 0, corto: "D", nombre: "Domingo" },
  { valor: 1, corto: "L", nombre: "Lunes" },
  { valor: 2, corto: "M", nombre: "Martes" },
  { valor: 3, corto: "M", nombre: "Miércoles" },
  { valor: 4, corto: "J", nombre: "Jueves" },
  { valor: 5, corto: "V", nombre: "Viernes" },
  { valor: 6, corto: "S", nombre: "Sábado" },
];

/** Los días del panel, de lunes a domingo, que es como los lee la gente. */
export const DIAS_LUNES_PRIMERO = [1, 2, 3, 4, 5, 6, 0].map(
  (v) => DIAS.find((d) => d.valor === v)
);

/**
 * Normaliza lo que venga guardado a una lista de días válidos.
 *
 * La columna es JSON y puede traer basura de una captura vieja o de un panel que
 * mandó otra cosa. Todo lo que no sea un día real se descarta en silencio: el
 * resultado es siempre una lista limpia, y si queda vacía significa "todos los
 * días", que es el lado seguro.
 */
export function diasValidos(dias) {
  if (!Array.isArray(dias)) return [];

  const limpios = dias
    // Se descarta ANTES de convertir: Number(null), Number(""), Number(false) y
    // Number([]) valen todos 0, o sea domingo. Un nulo guardado por descuido
    // convertiría una promo de martes en una promo de domingo.
    .filter((d) => typeof d === "number" || (typeof d === "string" && /^\d+$/.test(d.trim())))
    .map((d) => Number(d))
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);

  return [...new Set(limpios)].sort((a, b) => a - b);
}

/**
 * ¿La restricción de días permite hoy?
 *
 * SIN días capturados devuelve true: un platillo que nadie limitó se vende todos
 * los días, y ante datos raros conviene mostrar de más y no esconder el menú de un
 * negocio por un campo mal guardado.
 *
 * @param {number[]} dias  los días permitidos
 * @param {Date} [ahora]   para poder probarlo sin mover el reloj del sistema
 */
export function aplicaHoy(dias, ahora) {
  const permitidos = diasValidos(dias);
  if (!permitidos.length) return true;

  const fecha = ahora instanceof Date && !Number.isNaN(ahora.getTime()) ? ahora : new Date();

  return permitidos.includes(fecha.getDay());
}

/**
 * Cómo se leen los días elegidos. Vacío = sin restricción, y entonces no hay nada
 * que decir.
 */
export function textoDeDias(dias) {
  const permitidos = diasValidos(dias);
  if (!permitidos.length || permitidos.length === 7) return "";

  // Casos que la gente nombra de una sola forma, para no escupir una lista de
  // cinco días cuando basta con decir "entre semana".
  const clave = permitidos.join(",");
  if (clave === "0,6") return "Fines de semana";
  if (clave === "1,2,3,4,5") return "Entre semana";

  return permitidos
    .map((v) => DIAS.find((d) => d.valor === v).nombre)
    .join(", ");
}
