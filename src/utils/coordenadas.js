// De una liga de Google Maps a un par de coordenadas.
//
// El dueño casi nunca sabe las coordenadas de su sucursal, pero SIEMPRE tiene su
// negocio en Google Maps y puede copiar la liga. Antes la unica forma de poner el punto
// era pararse fisicamente en la sucursal y tocar "usar mi ubicacion": quien lo tocaba
// desde su oficina guardaba la ubicacion de su oficina, y de ahi salia el costo del
// envio de esa sucursal.
//
// Las ligas de Google traen el punto de varias maneras y NO son equivalentes:
//
//   !3d25.7738148!4d-109.0120005   el LUGAR. Es el bueno.
//   ?q=25.77,-109.01               lo que se busco. Tambien sirve.
//   @25.7738147,-109.0168714,17z   donde estaba la CAMARA al copiar la liga, que puede
//                                  quedar a cuadras del lugar. Es el ultimo recurso.
//
// Por eso se leen en ese orden y no en el que aparezcan.

/** Un numero de latitud o longitud con signo y decimales. */
const NUM = "-?\\d{1,3}(?:\\.\\d+)?";

const PATRONES = [
  // El lugar, tal como lo guarda Google en el bloque de datos.
  new RegExp(`!3d(${NUM})!4d(${NUM})`),
  // Busquedas y ligas cortas: ?q=lat,lng  ·  &query=lat,lng  ·  &destination=lat,lng
  new RegExp(`[?&](?:q|query|destination|ll|center)=(${NUM})%2C\\s*(${NUM})`, "i"),
  new RegExp(`[?&](?:q|query|destination|ll|center)=(${NUM}),\\s*(${NUM})`, "i"),
  // La camara. Al final a proposito: es el encuadre, no el negocio.
  new RegExp(`@(${NUM}),(${NUM})`),
];

const enRango = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng) &&
  Math.abs(lat) <= 90 && Math.abs(lng) <= 180 &&
  // 0,0 es el Golfo de Guinea: es lo que devuelve un campo a medio llenar, no un local.
  !(lat === 0 && lng === 0);

/** "25.773815,-109.012001", o null si ahi no hay un punto. */
export function coordenadasDeTexto(texto) {
  const t = String(texto ?? "").trim();
  if (!t) return null;

  // Ya son coordenadas escritas a mano.
  const directo = t.match(new RegExp(`^(${NUM})\\s*,\\s*(${NUM})$`));
  const encontrado = directo ?? PATRONES.map((p) => t.match(p)).find(Boolean);
  if (!encontrado) return null;

  const lat = Number(encontrado[1]);
  const lng = Number(encontrado[2]);
  if (!enRango(lat, lng)) return null;

  return `${lat.toFixed(6)},${lng.toFixed(6)}`;
}

/** Si ese texto es una liga (para saber si hay que traducirla o dejarla en paz). */
export function pareceLiga(texto) {
  return /^https?:\/\/|maps\.app\.goo\.gl|google\.[a-z.]+\/maps/i.test(String(texto ?? "").trim());
}
