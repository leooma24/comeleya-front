// Precio efectivo de un platillo: el de oferta si está vigente, si no el normal.
//
// La regla tiene que ser IDÉNTICA a la del servidor, que es quien cobra
// (EstablishmentController::createOrder):
//
//   $dish->special_price && $dish->special_until && Carbon::parse($dish->special_until)->isFuture()
//
// Antes esta pregunta se respondía en dos lugares distintos y con reglas
// distintas, y ninguno de los dos alimentaba el carrito:
//
//   - products.js usaba SIEMPRE `price`, así que la vitrina anunciaba la oferta
//     y el carrito cobraba el precio normal.
//   - useDish.js daba por vigente una oferta SIN fecha de fin, cosa que el
//     servidor no acepta, así que pintaba el precio tachado de una oferta que
//     nunca se iba a aplicar.
//
// Desde las promociones recurrentes ("los martes el ceviche a $99") la regla suma
// los días de la semana, y una oferta sin fecha de fin sí corre: significa "hasta
// que la quiten". Las dos cosas cambiaron aquí y en Dish::tieneOfertaVigente() en
// el mismo movimiento.

import { aplicaHoy } from "./weekDays";

/** ¿La oferta del platillo está vigente ahora mismo? */
export function isSpecialActive(dish) {
  if (!dish) return false;

  const precio = Number(dish.special_price);
  if (!precio || precio <= 0) return false;

  // Días de la semana: "los martes el ceviche a $99". Sin días capturados aplica
  // todos, que es como se comportaron siempre las ofertas.
  if (!aplicaHoy(dish.special_days)) return false;

  // SIN fecha de fin la oferta corre hasta que la quiten.
  //
  // Antes se exigía la fecha, y eso era una trampa: el panel la ofrecía como
  // opcional, así que quien la dejaba en blanco guardaba el precio, lo veía
  // guardado y la oferta no aplicaba nunca. Además es justo lo que pidieron para
  // las promos recurrentes. La misma regla está en Dish::tieneOfertaVigente().
  if (!dish.special_until) return true;

  const hasta = new Date(dish.special_until);
  // Una fecha ilegible no puede cancelar una oferta que el dueño sí capturó.
  if (Number.isNaN(hasta.getTime())) return true;

  return hasta > new Date();
}

/** Precio que se debe usar para cobrar: el de oferta si aplica, si no el normal. */
export function effectivePrice(dish) {
  if (!dish) return 0;

  if (isSpecialActive(dish)) {
    return Number(dish.special_price);
  }

  const normal = Number(dish.price);
  return Number.isFinite(normal) ? normal : 0;
}
