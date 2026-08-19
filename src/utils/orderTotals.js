// Totales de un pedido tal como los devuelve el API.
//
// OJO con el modelo de datos: la columna `total` del pedido NO es el total a
// cobrar, es el subtotal de platillos. La propina, el descuento y el envío se
// guardan en columnas aparte (ver EstablishmentController@createOrder, que
// escribe 'total' => $serverTotal junto a 'tip', 'discount' y 'delivery_charge').
// Imprimir `order.total` como TOTAL deja la propina y el envío fuera de la nota.
//
// La fórmula es la misma que usa el backend para cobrar en PaymentService:
//   subtotal - descuento + propina + envío

const money = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Evita que 0.1 + 0.2 imprima 0.30000000000000004 en la nota.
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export function orderTotals(order) {
  const o = order || {};

  // El subtotal autoritativo es `total`; los artículos son el respaldo para
  // pedidos viejos que no lo traigan.
  const itemsSum = (o.items || []).reduce((acc, item) => acc + money(item?.total), 0);
  const subtotal = o.total == null ? itemsSum : money(o.total);

  const discount = money(o.discount);
  const tip = money(o.tip);
  const deliveryCharge = money(o.delivery_charge);

  return {
    subtotal: round2(subtotal),
    discount: round2(discount),
    tip: round2(tip),
    deliveryCharge: round2(deliveryCharge),
    // Un descuento mayor al consumo no debe dejar la nota en negativo.
    grandTotal: Math.max(0, round2(subtotal - discount + tip + deliveryCharge)),
  };
}
