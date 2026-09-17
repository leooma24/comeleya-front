// La matriz y las sucursales.
//
// La matriz no vive en la tabla `branches`: son los datos del propio negocio -su
// Direccion, sus coordenadas, su WhatsApp-. En cuanto el negocio da de alta una
// sucursal, la matriz se vuelve un local mas de donde puede salir un pedido, y el
// cliente elige entre ella y las sucursales.
//
// Por eso un pedido de la matriz se guarda con `branch_id` null, igual que el de un
// negocio de un solo local. Lo que los distingue es si el negocio tiene sucursales.
//
// No conoce stores a proposito: lo usan el menu del cliente, el panel y la comanda.

/** El id con el que el navegador pide la matriz. El servidor lo reconoce igual. */
export const MATRIZ = "matriz";

const limpio = (v) => String(v ?? "").trim();

/** La direccion escrita igual que la de una sucursal en el servidor (Branch::full_address). */
export function direccionCompleta(a = {}) {
  let calle = [limpio(a.street), limpio(a.exterior_number)].filter(Boolean).join(" ");
  // "0" cuenta como vacio, igual que en PHP: muchas direcciones capturadas traen interior 0.
  const interior = limpio(a.interior_number);
  if (interior && interior !== "0") calle += ` int. ${interior}`;

  return [calle, a.town, a.city, a.postal_code].map(limpio).filter(Boolean).join(", ");
}

/** El negocio visto como un local mas, con la misma forma que una sucursal. */
export function matrizDe(negocio = {}) {
  return {
    id: MATRIZ,
    matriz: true,
    name: "Matriz",
    coordinates: negocio.coordinates || null,
    whatsapp: negocio.whatsapp || null,
    phone: negocio.phone || null,
    full_address: direccionCompleta(negocio.address ?? {}),
  };
}

/**
 * Si el negocio opera con varios locales. El servidor ya manda la lista vacia cuando
 * el plan no incluye sucursales, asi que aqui no se vuelve a revisar el plan.
 */
export function tieneSucursales(negocio) {
  return (negocio?.active_branches?.length ?? 0) > 0;
}

// --- Que local se esta viendo en Pedidos ---------------------------------------------
//
// Se escribe igual que en el servidor (App\Support\LocalDePedidos): null = todos los
// locales, "matriz", o el id de una sucursal como texto.

/** Las opciones del selector de Pedidos: todos, la matriz y las sucursales encendidas. */
export function opcionesDeLocal(negocio) {
  if (!tieneSucursales(negocio)) return [];
  return [
    { value: null, label: "Todos los locales" },
    { value: MATRIZ, label: "Matriz" },
    ...negocio.active_branches.map((s) => ({ value: String(s.id), label: s.name })),
  ];
}

/**
 * Si el local que quedo guardado en este aparato todavia se puede ver. Una sucursal que se
 * apago o se borro ya no: la tableta que se habia quedado en ella vuelve a ver todos.
 */
export function localValido(local, negocio) {
  if (local == null) return true;
  return opcionesDeLocal(negocio).some((o) => o.value === String(local));
}

/** El nombre con que se le dice al local. Null si ya no esta entre las opciones. */
export function nombreDelLocal(local, negocio) {
  if (local == null) return "Todos los locales";
  return opcionesDeLocal(negocio).find((o) => o.value === String(local))?.label ?? null;
}

/** El local de un pedido como lo escribe el servidor: el id de su sucursal, o "matriz". */
export function localDelPedido(order) {
  return order?.branch_id ? String(order.branch_id) : MATRIZ;
}

/**
 * Los repartidores para un pedido: primero los de su local, despues los compartidos y al
 * final los de otros locales, que solo le llegan al dueño. Dentro de cada grupo se
 * respeta el orden en que venian.
 */
export function ordenarRepartidores(repartidores, localPedido) {
  const grupo = (d) => (d.local == null ? 1 : String(d.local) === String(localPedido) ? 0 : 2);
  return [...repartidores].sort((a, b) => grupo(a) - grupo(b));
}

/** Donde guarda cada aparato el local que eligio, uno por negocio. */
export const claveLocalVisto = (slug) => `mc-local:${slug}`;

/**
 * De que local salio un pedido, para el panel y la comanda: el nombre de la sucursal
 * o "Matriz". Null en un negocio de un solo local, donde no hay nada que distinguir.
 */
export function origenDelPedido(order, negocio) {
  if (order?.branch?.name) return order.branch.name;
  // Trae sucursal pero no vino cargada: mejor no decir nada que decir "Matriz".
  if (order?.branch_id) return null;
  return tieneSucursales(negocio) ? "Matriz" : null;
}
