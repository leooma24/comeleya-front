// Importes del pedido: carrito, pago, confirmacion. Siempre con centavos y con
// separador de miles: "$1,250.00".
//
// Antes cada pantalla escribia el suyo. El mismo total salia como "$214.50" en el
// resumen y "$214.5" en el boton, y ninguno separaba miles. En el menu va precio()
// de useDish, sin los ".00": ahi se compara de un vistazo; aqui se suma.
const formato = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function dinero(valor) {
  const n = Number(valor);
  return "$" + formato.format(Number.isFinite(n) ? n : 0);
}
