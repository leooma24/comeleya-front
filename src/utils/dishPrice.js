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

/** ¿La oferta del platillo está vigente ahora mismo? */
export function isSpecialActive(dish) {
  if (!dish) return false;

  const precio = Number(dish.special_price);
  if (!precio || precio <= 0) return false;

  // El servidor EXIGE fecha de fin: sin ella no hay oferta.
  if (!dish.special_until) return false;

  const hasta = new Date(dish.special_until);
  if (Number.isNaN(hasta.getTime())) return false;

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
