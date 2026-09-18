// El teléfono del comensal, listo para marcarle.
//
// Se guarda como lo escribió él: "668 123 4567", "(668) 123-4567", "6681234567". Eso
// está bien para leerlo, pero wa.me no acepta nada que no sean dígitos, y sin lada de
// país abre una conversación con un número que no existe.
//
// Diez dígitos es un número mexicano, que es lo que hay en toda la base. Lo que ya
// venga con lada se respeta: hay negocios que capturan el 52 a mano.

/** Solo los dígitos: lo que wa.me entiende. */
export function soloDigitos(tel) {
  return String(tel ?? "").replace(/\D/g, "");
}

/** El número para una liga de wa.me, con lada de México cuando hacía falta. */
export function paraWhatsApp(tel) {
  const digitos = soloDigitos(tel);

  return digitos.length === 10 ? `52${digitos}` : digitos;
}
