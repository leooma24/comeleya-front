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
