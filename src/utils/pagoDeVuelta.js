// El cliente que pagó en Mercado Pago y regresa al menú.
//
// Al pagar, Mercado Pago lo manda de vuelta a
//   /{slug}?payment=success|pending|failure&order={codigo}&status=approved&payment_id=...
// -`payment` y `order` los pone ComeleYa al crear el cobro; el resto los agrega Mercado Pago-.
// Hasta hoy el menú ignoraba todo eso: el cliente pagaba y caía en el menú sin una sola
// palabra de que su pedido ya estaba pagado.
//
// Esto es solo para MOSTRAR un mensaje: el pedido se marca como pagado por la notificación
// que Mercado Pago le manda al servidor, no por lo que diga esta liga (que cualquiera puede
// escribir a mano).

const ESTADOS = {
  success: "pagado",
  pending: "pendiente",
  failure: "rechazado",
};

/** Todo lo que se agrega a la liga al volver; se quita de la barra de direcciones al leerlo. */
export const PARAMS_DE_PAGO = [
  "payment",
  "order",
  "collection_id",
  "collection_status",
  "payment_id",
  "status",
  "external_reference",
  "payment_type",
  "merchant_order_id",
  "preference_id",
  "site_id",
  "processing_mode",
  "merchant_account_id",
];

/**
 * Lo que dice la liga de regreso, o null si no es de un pago.
 *
 * @param {object} query el query de la ruta
 * @returns {{estado: "pagado"|"pendiente"|"rechazado", codigo: string}|null}
 */
export function leerPagoDeVuelta(query = {}) {
  const estado = ESTADOS[String(query.payment ?? "").toLowerCase()];
  if (!estado) return null;

  // El código solo se pinta: se deja en letras, números y guion para que una liga armada a
  // mano no meta otra cosa en pantalla.
  const codigo = String(query.order ?? "").replace(/[^\w-]/g, "").slice(0, 20);

  return { estado, codigo };
}

/** El query sin lo del pago: lo demás (?local=, ?pruebas=...) se queda. */
export function sinParametrosDePago(query = {}) {
  return Object.fromEntries(Object.entries(query).filter(([k]) => !PARAMS_DE_PAGO.includes(k)));
}

/** Lo que se le dice al cliente en cada caso. */
export function textosDePago(estado, codigo) {
  const pedido = codigo ? `pedido #${codigo}` : "pedido";

  return {
    pagado: {
      icono: "check_circle",
      tono: "positive",
      titulo: "¡Pago recibido!",
      mensaje: `Mercado Pago confirmó el pago de tu ${pedido}. El restaurante ya lo tiene y lo empieza a preparar.`,
    },
    pendiente: {
      icono: "schedule",
      tono: "warning",
      titulo: "Tu pago está pendiente",
      mensaje: `Mercado Pago todavía no confirma el pago de tu ${pedido} (pasa con OXXO o transferencia). El restaurante lo prepara en cuanto se acredite.`,
    },
    // Un pedido que no se pagó no le llegó al restaurante: ni lo ve ni lo prepara. Por eso aquí no
    // hay número de pedido ni "Seguir mi pedido": no hay nada que seguir.
    rechazado: {
      icono: "error",
      tono: "negative",
      titulo: "No se completó el pago",
      mensaje:
        "Tu pedido no se envió al restaurante porque el pago no se completó. No se cobró nada: puedes intentarlo de nuevo o elegir otra forma de pago.",
    },
  }[estado];
}
