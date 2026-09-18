// La liga con la que el cliente sigue su pedido.
//
// El numero del pedido (order_code) es 1, 2, 3... por negocio: sirve para que el
// cliente y el restaurante se entiendan por telefono, pero como llave no vale nada.
// Con el solo se leian de corrido todos los pedidos de cualquier restaurante -cuantos
// al dia, de cuanto cada uno, y el telefono del repartidor asignado-. Por eso la liga
// lleva ademas el token del pedido, que el servidor exige.
//
// Un pedido sin token es de antes de ese cambio: su liga sigue abriendose con el
// codigo solo, y por eso `token` es opcional y no se inventa nada cuando falta.

/** La ruta interna: /kazuki-sushi-delivery/pedido/84?t=... */
export function rutaDeSeguimiento(slug, code, token) {
  const base = `/${slug}/pedido/${code}`;

  return token ? `${base}?t=${encodeURIComponent(token)}` : base;
}

/** La misma, absoluta, para pegarla en un mensaje de WhatsApp. */
export function ligaDeSeguimiento(origen, slug, code, token) {
  return `${origen}${rutaDeSeguimiento(slug, code, token)}`;
}
