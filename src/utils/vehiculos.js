// En que se mueve un repartidor.
//
// Era texto libre y cada negocio lo escribia a su modo: "Moto", "moto", "Motocicleta",
// "motoneta". En la lista para asignar repartidor salian como cosas distintas. Ahora se
// elige de una lista. Lo que ya estaba escrito se acomoda a su opcion al abrir el
// repartidor, y lo que no se reconoce se respeta tal cual: no se le borra a nadie.

export const VEHICULOS = ["Moto", "Bicicleta", "Auto", "A pie"];

// Solo formas que de verdad son lo mismo. "Camioneta" no es "Auto": si alguien la
// escribio, se queda como la escribio.
const SINONIMOS = {
  Moto: ["moto", "motocicleta", "motoneta", "scooter"],
  Bicicleta: ["bici", "bicicleta", "bici electrica", "bicicleta electrica"],
  Auto: ["auto", "carro", "coche", "automovil"],
  "A pie": ["a pie", "pie", "caminando", "peaton"],
};

const SIN_PLACAS = ["Bicicleta", "A pie"];

const limpio = (texto) =>
  String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

/** La opcion de la lista que corresponde a lo escrito, o lo escrito tal cual si no hay. */
export function normalizarVehiculo(texto) {
  const forma = limpio(texto);
  if (!forma) return "";
  const opcion = Object.keys(SINONIMOS).find((o) => SINONIMOS[o].includes(forma));
  return opcion ?? String(texto).trim();
}

/** Las opciones del select: las de siempre, mas la que ya tenia si no es ninguna de ellas. */
export function opcionesDeVehiculo(actual) {
  const valor = String(actual ?? "").trim();
  return valor && !VEHICULOS.includes(valor) ? [...VEHICULOS, valor] : [...VEHICULOS];
}

/** A una bicicleta o a alguien a pie no se le piden placas. */
export function llevaPlacas(vehiculo) {
  return !SIN_PLACAS.includes(vehiculo);
}
