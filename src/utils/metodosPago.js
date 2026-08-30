// Los métodos de pago, escritos una sola vez.
//
// El código es lo que viaja y lo que se guarda; la etiqueta es lo que lee una
// persona. Antes esto vivía duplicado en la tabla de pedidos y en el ticket, con el
// mismo objeto copiado, y el menú del comensal ni siquiera usaba códigos: mandaba
// "Efectivo" directo a la base. De ahí salieron dos nombres para lo mismo y un corte
// del día que los contaba por separado.

const ETIQUETAS = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  mercadopago: "MercadoPago",
};

/**
 * Los que el comensal puede elegir al pagar.
 *
 * MercadoPago no está: no se escoge a mano, lo escribe la pasarela cuando confirma
 * el cobro. Ofrecerlo aquí dejaría al comensal marcando un pago que nadie hizo.
 */
export const METODOS_PAGO = [
  { valor: "cash", etiqueta: "Efectivo" },
  { valor: "card", etiqueta: "Tarjeta" },
  { valor: "transfer", etiqueta: "Transferencia" },
];

/**
 * La etiqueta para mostrar. Un valor desconocido se devuelve tal cual en vez de
 * dejar el renglón vacío: quedan pedidos viejos con "Efectivo" guardado como texto,
 * y el dueño prefiere leer eso a no leer nada.
 */
export function etiquetaPago(valor) {
  if (!valor) return "";

  return ETIQUETAS[valor] || valor;
}
