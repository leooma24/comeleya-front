/**
 * ¿Blanco o negro encima de este color?
 *
 * Cada negocio puede pintar cosas con su propio color, así que el color del texto o del
 * icono que va encima no se puede escribir a mano: sobre un amarillo hay que poner
 * negro, sobre un azul marino blanco, y nadie va a mantener esa tabla a mano.
 *
 * No basta con promediar el RGB. El ojo no percibe igual los tres canales —el verde pesa
 * casi siete veces más que el azul— así que un amarillo puro y un azul puro pueden tener
 * el mismo promedio y verse uno clarísimo y el otro oscurísimo. Por eso se usa la
 * luminancia relativa de la WCAG, que es la fórmula que sí corresponde a lo que se ve.
 */

/** "#fff", "#ffffff" o "rgb(255,255,255)" a [r, g, b]. Null si no se entiende. */
function aRgb(color) {
  if (!color) return null;
  const c = String(color).trim();

  const hex = c.replace("#", "");
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    return [0, 1, 2].map((i) => parseInt(hex[i] + hex[i], 16));
  }
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  }

  const m = c.match(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];

  return null;
}

/**
 * Luminancia relativa (WCAG 2.1). 0 = negro, 1 = blanco.
 *
 * El `Math.pow` no es adorno: los valores de un color en pantalla no son lineales, y sin
 * corregir esa curva un gris medio saldría mucho más claro de lo que se ve.
 */
export function luminancia(color) {
  const rgb = aRgb(color);
  if (!rgb) return null;

  const [r, g, b] = rgb.map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Cuánto contrastan dos colores, de 1 (nada) a 21 (blanco contra negro). */
export function contraste(colorA, colorB) {
  const a = luminancia(colorA);
  const b = luminancia(colorB);
  if (a === null || b === null) return null;
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/**
 * El color que mejor se lee encima de `fondo`: negro o blanco.
 *
 * Se comparan los dos contrastes y gana el mayor, en vez de partir la luminancia por la
 * mitad. Da lo mismo en los casos obvios y acierta en la franja de en medio, que es
 * justo donde un umbral fijo se equivoca.
 *
 * Si el color no se entiende, devuelve negro: es lo que hay hoy sobre el círculo blanco
 * por defecto, así que un valor raro no cambia nada de lo que ya se veía bien.
 */
export function encimaDe(fondo, { claro = "#ffffff", oscuro = "#1c1c21" } = {}) {
  const conClaro = contraste(fondo, claro);
  const conOscuro = contraste(fondo, oscuro);

  if (conClaro === null || conOscuro === null) return oscuro;
  return conClaro > conOscuro ? claro : oscuro;
}
