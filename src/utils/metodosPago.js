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
 * ¿Se le ofrece al cliente pagar en línea?
 *
 * Con las llaves de Mercado Pago del negocio guardadas, y fuera del modo de pruebas. Dentro
 * del modo de pruebas la opción se esconde -para que un cliente de verdad no pague en un
 * sandbox- y solo se abre entrando por la liga de prueba del dueño (?pruebas=mp).
 * El servidor vuelve a revisar lo mismo al crear el pedido.
 */
export function pagoEnLineaDisponible(negocio, ligaDePruebas = false) {
  if (!negocio?.mercadopago_ready) return false;
  return !negocio.mp_sandbox || ligaDePruebas;
}

const CLAVE_PRUEBAS = "mc-pruebas-mp";

/**
 * ¿El menú se abrió con la liga de prueba del dueño?
 *
 * Se recuerda en la pestaña: el router puede quitar el `?pruebas=mp` al navegar, y a mitad del
 * pedido el dueño se quedaría sin la opción que está probando.
 */
export function esLigaDePruebas(search = typeof window !== "undefined" ? window.location.search : "") {
  const enLiga = new URLSearchParams(search).get("pruebas") === "mp";
  try {
    if (enLiga) sessionStorage.setItem(CLAVE_PRUEBAS, "1");
    return enLiga || sessionStorage.getItem(CLAVE_PRUEBAS) === "1";
  } catch {
    return enLiga;
  }
}

/**
 * ¿Ya se pagó un pedido de pago en línea? Solo aplica a Mercado Pago: efectivo, tarjeta
 * en mostrador y transferencia se cobran fuera del sistema y no tienen estado aquí.
 *
 * El pedido entra al panel al instante, ANTES de que el cliente pague en Mercado Pago, y
 * la confirmación llega después. Devuelve null cuando no aplica.
 *
 * @returns {{texto: string, tono: "pagado"|"espera"|"fallido"}|null}
 */
export function estadoDePagoEnLinea(order) {
  if (String(order?.payment_method || "").toLowerCase() !== "mercadopago") return null;

  switch (order.payment_status) {
    case "completed":
      return { texto: "PAGADO", tono: "pagado" };
    case "failed":
      return { texto: "PAGO RECHAZADO", tono: "fallido" };
    case "refunded":
      return { texto: "REEMBOLSADO", tono: "fallido" };
    default:
      return { texto: "ESPERANDO PAGO", tono: "espera" };
  }
}

/**
 * La etiqueta para mostrar. Un valor desconocido se devuelve tal cual en vez de
 * dejar el renglón vacío: quedan pedidos viejos con "Efectivo" guardado como texto,
 * y el dueño prefiere leer eso a no leer nada.
 */
export function etiquetaPago(valor) {
  if (!valor) return "";

  return ETIQUETAS[valor] || valor;
}
