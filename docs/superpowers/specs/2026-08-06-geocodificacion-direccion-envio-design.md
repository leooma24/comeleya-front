# Geocodificación de la dirección para cobrar el envío por distancia

**Fecha:** 2026-08-06
**Estado:** aprobado, pendiente de plan de implementación

## Problema

Bajamar tiene el envío configurado por distancia, pero a los clientes les cobra
$35 sin importar qué tan lejos vivan. Reportado por el dueño:

> "Me sale a 35 aunque la distancia esté lejos."

Configuración real de Bajamar en producción:

| Campo | Valor |
|---|---|
| `delivery_mode` | `distance` |
| `delivery_base_fee` | 35.00 |
| `delivery_base_km` | 2.00 |
| `delivery_per_km` | 5.00 |
| `delivery_max_km` | 15.00 |
| `delivery_free_from` | 0.00 |
| `coordinates` | `25.792506354997876,-108.9807379245758` |

$35 es exactamente `delivery_base_fee`.

## Causa raíz

El cobro depende de una distancia que casi nunca existe, y cuando no existe se
cae a la tarifa base.

**Frontend** — `src/stores/main-store.js:140`:

```js
const dist = Number(this.data.distance);
if (!dist || Number.isNaN(dist)) return Number(e.delivery_base_fee ?? 0); // sin GPS: base
```

**Backend (el que cuenta para el dinero)** — `app/Models/Establishment.php:87-89`:

```php
if ($distanceKm === null) {
    return ['fee' => (float) $this->delivery_base_fee, 'covered' => true];
}
```

`data.distance` solo se llena en `getDistance()` (`main-store.js:786`), que solo
corre desde el callback de éxito de `navigator.geolocation.getCurrentPosition()`,
disparado en `src/layouts/MainLayout.vue:137` al montar la página.

De ahí salen cuatro fallas encadenadas:

1. **Si el cliente niega el permiso de ubicación, siempre paga la tarifa base.**
   Verificado contra producción: la consola registra
   `Error Code = 1 - User denied Geolocation`.
2. **El permiso se pide al cargar el menú**, antes de que el cliente decida
   pedir. La mayoría lo descarta.
3. **Aunque lo acepte, mide dónde está el celular, no a dónde va el pedido.**
   Pedir desde el trabajo para la casa da un cobro equivocado.
4. **`deliveryCovered` devuelve `true` cuando no hay distancia**
   (`main-store.js:155`), así que el radio máximo de 15 km tampoco bloquea nada.

## Lo que ya funciona y no hay que tocar

El cálculo del envío **ya es autoritativo en el servidor** y ya lee lat/lng del
cliente — `app/Http/Controllers/EstablishmentController.php:241-246`:

```php
$dist = $establishment->distanceFromCoords(
    $request->input('user.latitude'), $request->input('user.longitude')
);
$calc = $establishment->computeDeliveryFee($serverTotal, $dist);
```

Como el payload manda `user: this.userStore.data` (`main-store.js`, acción
`creatingOrder`), basta con poblar `userStore.data.latitude/longitude` con la
coordenada de la dirección escrita para que el cobro correcto salga solo.

`computeDeliveryFee()` y `distanceFromCoords()` se conservan tal cual salvo el
cambio del punto 3 de abajo.

## Decisiones tomadas

| Decisión | Elección | Motivo |
|---|---|---|
| Exactitud | Aproximada por colonia/CP, geocodificador gratuito | Cero fricción para el cliente, sin API key ni costo |
| Si no se puede ubicar | Cobrar la base y avisar que es estimado | Nadie se traba en el checkout y el dueño sabe cuáles revisar |
| Dónde se geocodifica | Backend con caché | Política de Nominatim, caché compartida, y el dato es confiable del lado servidor |
| GPS del dispositivo | Se retira del flujo | Mide el celular, no el destino; y el prompt al cargar espanta |

### Alternativas descartadas

- **Geocodificar desde el navegador.** La política de uso de Nominatim prohíbe
  este patrón y bloquea IPs. Sin caché, cada tecleo cuesta una llamada. Y el
  servidor no puede confiar en una coordenada que envió el cliente: cualquiera
  podría mandar lat/lng falsas y pagar la tarifa base siempre — justo el agujero
  que se está tapando.
- **Solo centroide del código postal.** La tabla `cp` (dump de SEPOMEX) no trae
  lat/lng, habría que importarlas. Y la precisión sería de todo el CP (1–3 km),
  que a $5/km se equivoca por $5–15. Se conserva como *escalón intermedio* del
  fallback, no como solución.
- **Autocompletado de Google Places.** Mejor precisión y experiencia, pero exige
  API key con tarjeta y cobra por uso.

## Arquitectura

```
Cliente llena CP → colonia → calle → número
        ↓ (debounce 600 ms, cuando los cuatro están llenos)
POST /establishment/{slug}/geocode  { zip, town, street, ext_number }
        ↓
Laravel: geocode_cache → si no está, Nominatim/OSM en cascada
        ↓
{ lat, lng, precision: 'street' | 'locality' | 'zip' | 'none' }
        ↓
userStore.data.latitude / .longitude / .geo_precision
        ↓
getDistance() → data.distance → deliveryCharge   (el cliente ve el costo en vivo)
        ↓
Al pedir: `user` viaja con lat/lng → el backend recalcula autoritativo (ya existe)
```

## Componentes

### 1. Tabla `geocode_cache` (migración nueva)

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigint | |
| `address_hash` | char(64), único, indexado | SHA-256 de la dirección normalizada |
| `address_raw` | string | Para depurar |
| `lat` | decimal(10,7), nullable | `null` cuando `precision = 'none'` |
| `lng` | decimal(10,7), nullable | |
| `precision` | enum: `street`, `locality`, `zip`, `none` | |
| `provider` | string | `nominatim` por ahora |
| `created_at` / `updated_at` | timestamp | |

**Sin expiración.** Las calles no se mueven; si algún día hay que
re-geocodificar, se vacía la tabla. Los resultados `none` también se cachean,
para no reintentar en bucle una dirección que no existe.

### 2. `POST /establishment/{slug}/geocode`

**Entrada:** `{ zip, town, street, ext_number }`
**Salida:** `{ lat, lng, precision }`

Pasos:

1. **Normalizar** la dirección: minúsculas, sin acentos, espacios colapsados,
   sin puntuación. El hash de eso es la llave de caché.
2. **Buscar en `geocode_cache`.** Si hay acierto, responder y terminar.
3. **Resolver municipio/ciudad/estado desde la tabla `cp`** (modelo `Town`,
   `d_codigo` → `D_mnpio`, `d_estado`). El endpoint `/towns/{cp}/all` ya
   demuestra que esos campos están disponibles.
4. **Consultar Nominatim en cascada**, parando en el primer acierto:

   | Intento | Consulta | `precision` |
   |---|---|---|
   | 1 | `calle #num, colonia, municipio, estado` | `street` |
   | 2 | `colonia, municipio, estado` | `locality` |
   | 3 | `CP, estado` | `zip` |
   | 4 | — sin resultado — | `none` |

   Parámetros: `format=json&limit=1&countrycodes=mx`.

5. **Guardar en caché y responder.**

**Cumplimiento de la política de Nominatim:** `User-Agent` identificable
(`ComeleYa/1.0 (contacto@comeleya.com)`) y máximo 1 request por segundo,
serializado con un lock. En la práctica la caché hace que casi nunca se llame.

**Validación:** el endpoint es público (el cliente no está autenticado), así que
lleva rate limit por IP para que no se use como proxy gratuito de geocodificación.

### 3. `Establishment::computeDeliveryFee()` — arreglo del fallback

Pasa a devolver `['fee', 'covered', 'estimated']`. Sin distancia sigue cobrando
la base, pero con `estimated => true`.

Ese flag se persiste en el pedido: migración `orders.delivery_estimated`
(boolean, default `false`). Se expone en los `select()` de
`AdminController@orders` y `@moreOrders` (líneas 742 y 821), y se muestra como
**ENVÍO ESTIMADO** en `admin/Orders.vue` y en el ticket de `printOrder()`.

Sin esto Bajamar no se entera de qué pedidos revisar, que era la queja original.

### 4. Frontend

**`src/stores/main-store.js`**
- Acción `geocodeAddress()`: llama al endpoint, escribe
  `userStore.data.latitude/longitude/geo_precision` y dispara `getDistance()`.
- Getter `deliveryEstimated`: `true` cuando no hay distancia utilizable.
- `deliveryCharge` conserva su lógica; solo se apoya en que ahora sí llega
  distancia.

**`src/components/client/DataDrawer.vue`**
- Watcher con debounce de 600 ms sobre `zip`, `town`, `street`, `ext_number`;
  dispara `geocodeAddress()` cuando los cuatro tienen valor.
- `validateData()` espera el geocode pendiente antes de continuar.
- La línea que hoy dice *"Costo de envío: $35"* muestra, cuando es estimado:
  *"Envío estimado $35 — el restaurante puede ajustarlo según la distancia."*

**Coordenadas rancias.** `user-store` es persistido, así que
`data.latitude/longitude/distance` sobreviven entre sesiones y entre
establecimientos. Sin limpiarlas, un cliente que pidió en el restaurante A
arrastraría su coordenada al abrir el B, y una dirección corregida seguiría
cobrando según la anterior. Por eso:

- Al cambiar cualquiera de `zip`, `town`, `street` o `ext_number`, se borran
  `latitude`, `longitude`, `geo_precision` y `distance` **antes** de disparar el
  geocode con debounce. Durante esa ventana el costo se muestra como estimado.
- Al cargar un slug distinto al del `company-store` persistido, se limpian
  también. La coordenada del cliente es válida por dirección, no por comercio,
  pero la `distance` derivada sí depende del negocio.

**`src/layouts/MainLayout.vue`**
- Se quita `mainStore.getPositions()` del arranque (línea 137). La dirección
  escrita pasa a ser la única fuente de ubicación. Se eliminan `getPositions()`
  del store por quedar sin uso; `getDistance()` se conserva porque lo usa el
  nuevo flujo.

**`buildWhatsAppUrl()`**
- Marca el envío como estimado en el mensaje cuando aplique, para que el dueño lo
  vea también por WhatsApp.

## Manejo de errores

| Situación | Comportamiento |
|---|---|
| Nominatim no responde o da timeout | Se cachea `none`, se cobra la base marcada como estimada. El checkout no se bloquea. |
| Dirección incompleta (falta calle o número) | No se dispara el geocode; el costo se muestra como estimado. |
| `precision = 'zip'` o `'locality'` | Se usa la coordenada y **no** se marca estimado: la exactitud a nivel colonia/CP es justo la que se aceptó como objetivo, y marcarla diluiría la señal de "revisar este pedido" hasta volverla inútil. |
| `precision = 'none'` | Estimado: base + aviso al cliente + bandera en el ticket. |
| Coordenada fuera del radio (`delivery_max_km`) | El backend ya responde 422 con "fuera del área de entrega". Se conserva. |
| El cliente manda lat/lng falsas | El backend recalcula desde la coordenada recibida. **Riesgo aceptado y sin cambio respecto a hoy**; cerrarlo requeriría que el servidor geocodifique al crear el pedido en vez de confiar en el cliente. Anotado como trabajo futuro. |

## Pruebas

**Frontend (Vitest, ya existe `tests/stores/main-store.test.js`):**
- `deliveryCharge` dentro de los km base → solo tarifa base.
- `deliveryCharge` con km extra → base + extra × por-km.
- Distancia mayor a `delivery_max_km` → no cubierto.
- `delivery_free_from` alcanzado → envío gratis.
- Sin coordenadas → base y `deliveryEstimated === true`.
- `geocodeAddress()` escribe lat/lng y recalcula la distancia.

**Backend (PHPUnit):**
- `computeDeliveryFee()` con y sin distancia, y en cada tramo.
- Endpoint de geocode: acierto de caché, fallo de caché, cascada de precisión,
  proveedor caído. **Nominatim se mockea; las pruebas no pegan a la red.**

## Trabajo futuro (fuera de alcance)

- Geocodificar del lado servidor al crear el pedido, para dejar de confiar en la
  lat/lng que manda el cliente.
- Distancia por ruta de manejo en vez de línea recta.
- Permitir al dueño ajustar el envío desde el panel en los pedidos marcados como
  estimados.
