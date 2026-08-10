// Convierte un importe numérico a letras en español (pesos mexicanos), en el
// formato usado por los recibos: "QUINIENTOS PESOS 00/100 M.N.".
// Sin dependencias externas (CSP del build no permite librerías remotas).

const UNIDADES = [
  "",
  "UNO",
  "DOS",
  "TRES",
  "CUATRO",
  "CINCO",
  "SEIS",
  "SIETE",
  "OCHO",
  "NUEVE",
  "DIEZ",
  "ONCE",
  "DOCE",
  "TRECE",
  "CATORCE",
  "QUINCE",
  "DIECISEIS",
  "DIECISIETE",
  "DIECIOCHO",
  "DIECINUEVE",
  "VEINTE",
];

const DECENAS = [
  "",
  "",
  "VEINTE",
  "TREINTA",
  "CUARENTA",
  "CINCUENTA",
  "SESENTA",
  "SETENTA",
  "OCHENTA",
  "NOVENTA",
];

const CENTENAS = [
  "",
  "CIENTO",
  "DOSCIENTOS",
  "TRESCIENTOS",
  "CUATROCIENTOS",
  "QUINIENTOS",
  "SEISCIENTOS",
  "SETECIENTOS",
  "OCHOCIENTOS",
  "NOVECIENTOS",
];

// Convierte un entero de 0..999 a letras.
function centenasToWords(n) {
  if (n === 0) return "";
  if (n === 100) return "CIEN";

  let out = "";
  const c = Math.floor(n / 100);
  const resto = n % 100;

  if (c > 0) out += CENTENAS[c];

  if (resto > 0) {
    if (out) out += " ";
    if (resto <= 20) {
      out += UNIDADES[resto];
    } else if (resto < 30) {
      // 21..29 → VEINTIUNO, VEINTIDOS, ...
      out += "VEINTI" + UNIDADES[resto - 20];
    } else {
      const d = Math.floor(resto / 10);
      const u = resto % 10;
      out += DECENAS[d];
      if (u > 0) out += " Y " + UNIDADES[u];
    }
  }

  return out;
}

// Convierte un entero >= 0 a letras (soporta hasta millones).
function integerToWords(n) {
  if (n === 0) return "CERO";

  const millones = Math.floor(n / 1000000);
  const miles = Math.floor((n % 1000000) / 1000);
  const cientos = n % 1000;

  let out = "";

  if (millones > 0) {
    out += millones === 1 ? "UN MILLON" : centenasToWords(millones) + " MILLONES";
  }

  if (miles > 0) {
    if (out) out += " ";
    out += miles === 1 ? "MIL" : centenasToWords(miles) + " MIL";
  }

  if (cientos > 0) {
    if (out) out += " ";
    out += centenasToWords(cientos);
  }

  return out.trim();
}

/**
 * Importe a letras estilo recibo: "QUINIENTOS PESOS 00/100 M.N."
 * @param {number|string} amount
 * @returns {string}
 */
export function amountToWords(amount) {
  const num = Number(amount) || 0;
  const abs = Math.abs(num);
  const entero = Math.floor(abs);
  const centavos = Math.round((abs - entero) * 100);

  // Si el redondeo de centavos llega a 100, sube el entero.
  let enteroFinal = entero;
  let centavosFinal = centavos;
  if (centavosFinal === 100) {
    enteroFinal += 1;
    centavosFinal = 0;
  }

  // Apócope fiscal: "...UNO" → "...UN" antes de PESOS (UN PESO, VEINTIUN PESOS,
  // TREINTA Y UN PESOS, CIENTO UN PESOS).
  const letras = integerToWords(enteroFinal).replace(/UNO$/, "UN");
  const moneda = enteroFinal === 1 ? "PESO" : "PESOS";
  const cent = String(centavosFinal).padStart(2, "0");

  return `${letras} ${moneda} ${cent}/100 M.N.`;
}

export default amountToWords;
