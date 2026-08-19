# Geocodificación de la dirección para el envío — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cobrar el envío según la distancia real a la dirección que escribe el cliente, en vez de caer siempre a la tarifa base porque nunca hay coordenadas.

**Architecture:** El backend geocodifica la dirección (Nominatim/OSM) con caché en base de datos y devuelve lat/lng. El front las guarda en `userStore.data`, que ya viaja en el payload del pedido, así que el cálculo autoritativo que ya existe en `EstablishmentController` empieza a recibir una distancia buena. Cuando no se puede ubicar, se cobra un respaldo marcado como estimado y esa bandera llega hasta el ticket del dueño.

**Tech Stack:** Laravel 11 (backend, repo `c:\laragon\www\comeleya-laravel`), Vue 3 + Quasar 2 + Pinia (frontend, repo `c:\laragon\www\delivery-food`), Vitest, PHPUnit, Nominatim/OpenStreetMap.

**Spec:** `docs/superpowers/specs/2026-08-06-geocodificacion-direccion-envio-design.md`

---

## ⚠️ Antes de empezar: las migraciones las corre el humano

Claude sube archivos por FTP pero **no puede ejecutar `php artisan` en producción**. Las
credenciales de producción viven solo en el servidor (el `.env` del repo apunta a Laragon local).

Al terminar, el dueño del repo corre **una** de estas dos opciones en producción:

**Opción A — terminal (cPanel / SSH):**
```bash
php artisan migrate --force
php artisan config:clear
```

**Opción B — phpMyAdmin, pegar este SQL:**
```sql
CREATE TABLE `geocode_cache` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `address_hash` CHAR(64) NOT NULL,
  `address_raw` VARCHAR(255) NOT NULL,
  `lat` DECIMAL(10,7) NULL,
  `lng` DECIMAL(10,7) NULL,
  `match_precision` VARCHAR(16) NOT NULL,
  `provider` VARCHAR(32) NOT NULL DEFAULT 'nominatim',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `geocode_cache_address_hash_unique` (`address_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `orders`
  ADD COLUMN `delivery_estimated` TINYINT(1) NOT NULL DEFAULT 0 AFTER `delivery_charge`;
```

> La columna se llama `match_precision`, **no** `precision`: `PRECISION` es palabra reservada en MySQL y rompe queries sin backticks.

**El orden importa:** el backend nuevo se sube *después* de correr el SQL, o los pedidos fallarán al escribir en una columna que no existe.

---

# PARTE 1 — Backend (`c:\laragon\www\comeleya-laravel`)

## Task 1: Tabla y modelo de caché de geocodificación

**Files:**
- Create: `database/migrations/2026_08_06_100000_create_geocode_cache_table.php`
- Create: `app/Models/GeocodeCache.php`

- [ ] **Step 1: Crear la migración**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('geocode_cache', function (Blueprint $table) {
            $table->id();
            // SHA-256 de la direccion normalizada. Es la llave de busqueda.
            $table->char('address_hash', 64)->unique();
            $table->string('address_raw');
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();
            // 'precision' es palabra reservada en MySQL: se llama match_precision.
            $table->string('match_precision', 16);
            $table->string('provider', 32)->default('nominatim');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('geocode_cache');
    }
};
```

- [ ] **Step 2: Crear el modelo**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GeocodeCache extends Model
{
    protected $table = 'geocode_cache';

    protected $fillable = [
        'address_hash',
        'address_raw',
        'lat',
        'lng',
        'match_precision',
        'provider',
    ];

    protected $casts = [
        'lat' => 'float',
        'lng' => 'float',
    ];
}
```

- [ ] **Step 3: Correr la migración en local**

Run: `php artisan migrate`
Expected: `INFO  Running migrations.` seguido de `2026_08_06_100000_create_geocode_cache_table ... DONE`

- [ ] **Step 4: Commit**

```bash
git add database/migrations/2026_08_06_100000_create_geocode_cache_table.php app/Models/GeocodeCache.php
git commit -m "Cache de geocodificacion: tabla y modelo"
```

---

## Task 2: Columna `delivery_estimated` en pedidos

**Files:**
- Create: `database/migrations/2026_08_06_100100_add_delivery_estimated_to_orders_table.php`
- Modify: `app/Models/Order.php` (agregar a `$fillable` y `$casts` si existen)

- [ ] **Step 1: Crear la migración**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // true = el envio se cobro sin conocer la distancia real. El dueno
            // lo ve marcado para poder ajustarlo.
            $table->boolean('delivery_estimated')->default(false)->after('delivery_charge');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('delivery_estimated');
        });
    }
};
```

- [ ] **Step 2: Registrar el cast en el modelo**

En `app/Models/Order.php`, agregar `'delivery_estimated' => 'boolean'` al arreglo `$casts`. Si el modelo usa `$fillable`, agregar también `'delivery_estimated'`.

- [ ] **Step 3: Correr la migración**

Run: `php artisan migrate`
Expected: `... add_delivery_estimated_to_orders_table ... DONE`

- [ ] **Step 4: Commit**

```bash
git add database/migrations/2026_08_06_100100_add_delivery_estimated_to_orders_table.php app/Models/Order.php
git commit -m "Pedidos: bandera delivery_estimated"
```

---

## Task 3: `GeocodingService` — cascada Nominatim con caché

**Files:**
- Create: `app/Services/GeocodingService.php`
- Test: `tests/Unit/GeocodingServiceTest.php`

- [ ] **Step 1: Escribir la prueba que falla**

```php
<?php

namespace Tests\Unit;

use App\Models\GeocodeCache;
use App\Services\GeocodingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GeocodingServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_normaliza_la_direccion_para_la_llave_de_cache(): void
    {
        $svc = app(GeocodingService::class);

        $this->assertSame(
            $svc->normalize('  Áv. Álvaro   Obregón  #123, Centro '),
            $svc->normalize('av alvaro obregon 123 centro')
        );
    }

    public function test_devuelve_precision_street_cuando_nominatim_acierta(): void
    {
        Http::fake([
            'nominatim.openstreetmap.org/*' => Http::response([
                ['lat' => '25.7925063', 'lon' => '-108.9807379'],
            ], 200),
        ]);

        $result = app(GeocodingService::class)->geocode('81200', 'Centro', 'Aldama', '500');

        $this->assertSame('street', $result['match_precision']);
        $this->assertEqualsWithDelta(25.7925063, $result['lat'], 0.0001);
        $this->assertEqualsWithDelta(-108.9807379, $result['lng'], 0.0001);
    }

    public function test_cae_a_none_cuando_nominatim_no_encuentra_nada(): void
    {
        Http::fake(['nominatim.openstreetmap.org/*' => Http::response([], 200)]);

        $result = app(GeocodingService::class)->geocode('81200', 'Centro', 'Calle Inexistente', '999');

        $this->assertSame('none', $result['match_precision']);
        $this->assertNull($result['lat']);
    }

    public function test_cae_a_none_cuando_el_proveedor_esta_caido(): void
    {
        Http::fake(['nominatim.openstreetmap.org/*' => Http::response('', 500)]);

        $result = app(GeocodingService::class)->geocode('81200', 'Centro', 'Aldama', '500');

        $this->assertSame('none', $result['match_precision']);
    }

    public function test_la_segunda_llamada_sale_de_cache_sin_pegar_a_la_red(): void
    {
        Http::fake([
            'nominatim.openstreetmap.org/*' => Http::response([
                ['lat' => '25.79', 'lon' => '-108.98'],
            ], 200),
        ]);

        $svc = app(GeocodingService::class);
        $svc->geocode('81200', 'Centro', 'Aldama', '500');
        $svc->geocode('81200', 'Centro', 'Aldama', '500');

        $this->assertSame(1, GeocodeCache::count());
        Http::assertSentCount(1);
    }
}
```

- [ ] **Step 2: Correr las pruebas para verificar que fallan**

Run: `php artisan test --filter=GeocodingServiceTest`
Expected: FAIL — `Class "App\Services\GeocodingService" does not exist`

- [ ] **Step 3: Implementar el servicio**

```php
<?php

namespace App\Services;

use App\Models\GeocodeCache;
use App\Models\Town;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Geocodifica direcciones mexicanas contra Nominatim/OpenStreetMap, con cache en
 * base de datos. La cache no expira: las calles no se mueven. Los fallos ('none')
 * tambien se cachean, para no reintentar en bucle una direccion que no existe.
 */
class GeocodingService
{
    private const ENDPOINT = 'https://nominatim.openstreetmap.org/search';

    // Nominatim exige un User-Agent identificable; sin el bloquean la IP.
    private const USER_AGENT = 'ComeleYa/1.0 (contacto@comeleya.com)';

    /**
     * Minusculas, sin acentos, sin puntuacion, espacios colapsados.
     * Dos formas de escribir la misma direccion deben dar la misma llave.
     */
    public function normalize(string $address): string
    {
        $s = mb_strtolower(trim($address), 'UTF-8');
        $s = strtr($s, [
            'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u',
            'ü' => 'u', 'ñ' => 'n',
        ]);
        $s = preg_replace('/[^a-z0-9\s]/', ' ', $s);
        return preg_replace('/\s+/', ' ', trim($s));
    }

    /**
     * @return array{lat: ?float, lng: ?float, match_precision: string}
     */
    public function geocode(?string $zip, ?string $town, ?string $street, ?string $extNumber): array
    {
        $raw = collect([$street, $extNumber, $town, $zip])->filter()->implode(' ');
        $key = hash('sha256', $this->normalize($raw));

        $hit = GeocodeCache::where('address_hash', $key)->first();
        if ($hit) {
            return [
                'lat' => $hit->lat,
                'lng' => $hit->lng,
                'match_precision' => $hit->match_precision,
            ];
        }

        [$municipio, $estado] = $this->resolvePlaceFromZip($zip);

        // Cascada: de lo mas especifico a lo mas general. Para en el primer acierto.
        $attempts = [
            ['street', collect([$street, $extNumber, $town, $municipio, $estado])->filter()->implode(', ')],
            ['locality', collect([$town, $municipio, $estado])->filter()->implode(', ')],
            ['zip', collect([$zip, $estado])->filter()->implode(', ')],
        ];

        $result = ['lat' => null, 'lng' => null, 'match_precision' => 'none'];

        foreach ($attempts as [$precision, $query]) {
            if ($query === '') {
                continue;
            }
            $coords = $this->query($query);
            if ($coords) {
                $result = [
                    'lat' => $coords['lat'],
                    'lng' => $coords['lng'],
                    'match_precision' => $precision,
                ];
                break;
            }
        }

        GeocodeCache::create([
            'address_hash' => $key,
            'address_raw' => mb_substr($raw, 0, 255),
            'lat' => $result['lat'],
            'lng' => $result['lng'],
            'match_precision' => $result['match_precision'],
            'provider' => 'nominatim',
        ]);

        return $result;
    }

    /**
     * Municipio y estado a partir del CP, usando la tabla SEPOMEX que ya existe.
     * Suben mucho la tasa de acierto de Nominatim.
     *
     * @return array{0: ?string, 1: ?string}
     */
    private function resolvePlaceFromZip(?string $zip): array
    {
        if (!$zip) {
            return [null, null];
        }
        $row = Town::where('d_codigo', $zip)->first();
        return [$row->D_mnpio ?? null, $row->d_estado ?? null];
    }

    /**
     * Una consulta a Nominatim. Serializada a 1 req/seg por su politica de uso.
     * Cualquier fallo devuelve null: nunca revienta el checkout.
     */
    private function query(string $q): ?array
    {
        try {
            $this->throttle();

            $response = Http::withHeaders(['User-Agent' => self::USER_AGENT])
                ->timeout(6)
                ->get(self::ENDPOINT, [
                    'q' => $q,
                    'format' => 'json',
                    'limit' => 1,
                    'countrycodes' => 'mx',
                ]);

            if (!$response->successful()) {
                return null;
            }

            $first = $response->json()[0] ?? null;
            if (!$first || !isset($first['lat'], $first['lon'])) {
                return null;
            }

            return ['lat' => (float) $first['lat'], 'lng' => (float) $first['lon']];
        } catch (\Throwable $e) {
            Log::warning('Geocode fallo: ' . $e->getMessage(), ['q' => $q]);
            return null;
        }
    }

    /** Politica de Nominatim: maximo 1 request por segundo en toda la app. */
    private function throttle(): void
    {
        $last = (float) Cache::get('geocode:last_call', 0);
        $wait = 1.0 - (microtime(true) - $last);
        if ($wait > 0) {
            usleep((int) ($wait * 1_000_000));
        }
        Cache::put('geocode:last_call', microtime(true), 60);
    }
}
```

- [ ] **Step 4: Correr las pruebas para verificar que pasan**

Run: `php artisan test --filter=GeocodingServiceTest`
Expected: PASS, 5 pruebas

- [ ] **Step 5: Commit**

```bash
git add app/Services/GeocodingService.php tests/Unit/GeocodingServiceTest.php
git commit -m "GeocodingService: cascada Nominatim con cache y respaldo none"
```

---

## Task 4: Endpoint `POST /establishment/{slug}/geocode`

**Files:**
- Modify: `app/Http/Controllers/EstablishmentController.php` (método nuevo)
- Modify: `routes/api.php:41` (agregar ruta debajo de la de order)
- Test: `tests/Feature/GeocodeEndpointTest.php`

- [ ] **Step 1: Escribir la prueba que falla**

```php
<?php

namespace Tests\Feature;

use App\Models\Establishment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GeocodeEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_devuelve_coordenadas_de_la_direccion(): void
    {
        Http::fake([
            'nominatim.openstreetmap.org/*' => Http::response([
                ['lat' => '25.7925063', 'lon' => '-108.9807379'],
            ], 200),
        ]);
        $est = Establishment::factory()->create(['slug' => 'bajamar']);

        $this->postJson("/api/establishment/{$est->slug}/geocode", [
            'zip' => '81200',
            'town' => 'Centro',
            'street' => 'Aldama',
            'ext_number' => '500',
        ])
            ->assertOk()
            ->assertJsonStructure(['lat', 'lng', 'match_precision']);
    }

    public function test_responde_none_sin_reventar_cuando_no_encuentra(): void
    {
        Http::fake(['nominatim.openstreetmap.org/*' => Http::response([], 200)]);
        $est = Establishment::factory()->create(['slug' => 'bajamar']);

        $this->postJson("/api/establishment/{$est->slug}/geocode", [
            'zip' => '81200',
            'town' => 'Centro',
            'street' => 'Inexistente',
            'ext_number' => '1',
        ])
            ->assertOk()
            ->assertJson(['match_precision' => 'none', 'lat' => null]);
    }

    public function test_exige_al_menos_cp_o_colonia(): void
    {
        $est = Establishment::factory()->create(['slug' => 'bajamar']);

        $this->postJson("/api/establishment/{$est->slug}/geocode", [])
            ->assertStatus(422);
    }
}
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `php artisan test --filter=GeocodeEndpointTest`
Expected: FAIL — 404, la ruta no existe

- [ ] **Step 3: Agregar el método al controlador**

En `app/Http/Controllers/EstablishmentController.php`, importar arriba:

```php
use App\Services\GeocodingService;
```

Y agregar el método:

```php
/**
 * Geocodifica la direccion del cliente para poder cobrar el envio por distancia.
 * Publico (el cliente no esta autenticado) y con rate limit en la ruta.
 */
public function geocode(Request $request, $slug, GeocodingService $geocoder)
{
    $data = $request->validate([
        'zip' => 'nullable|string|max:10',
        'town' => 'nullable|string|max:120',
        'street' => 'nullable|string|max:160',
        'ext_number' => 'nullable|string|max:20',
    ]);

    // Sin CP ni colonia no hay nada que buscar: no gastamos una llamada al proveedor.
    if (empty($data['zip']) && empty($data['town'])) {
        return response()->json([
            'message' => 'Se requiere al menos codigo postal o colonia.',
        ], 422);
    }

    return response()->json($geocoder->geocode(
        $data['zip'] ?? null,
        $data['town'] ?? null,
        $data['street'] ?? null,
        $data['ext_number'] ?? null,
    ));
}
```

- [ ] **Step 4: Registrar la ruta**

En `routes/api.php`, justo debajo de la línea 41 (`establishment/{slug}/order`):

```php
Route::post('establishment/{slug}/geocode', [EstablishmentController::class, 'geocode'])
    ->middleware('throttle:20,1')
    ->name('establishment.geocode');
```

- [ ] **Step 5: Correr las pruebas**

Run: `php artisan test --filter=GeocodeEndpointTest`
Expected: PASS, 3 pruebas

- [ ] **Step 6: Commit**

```bash
git add app/Http/Controllers/EstablishmentController.php routes/api.php tests/Feature/GeocodeEndpointTest.php
git commit -m "Endpoint publico de geocodificacion con rate limit"
```

---

## Task 5: `computeDeliveryFee` marca el envío estimado

**Files:**
- Modify: `app/Models/Establishment.php:81-101`
- Modify: `app/Models/Establishment.php:312-338` (`createOrder`)
- Modify: `app/Http/Controllers/EstablishmentController.php:240-253`
- Test: `tests/Unit/DeliveryFeeTest.php`

- [ ] **Step 1: Escribir la prueba que falla**

```php
<?php

namespace Tests\Unit;

use App\Models\Establishment;
use Tests\TestCase;

class DeliveryFeeTest extends TestCase
{
    private function bajamar(): Establishment
    {
        // Config real de Bajamar en produccion.
        return new Establishment([
            'delivery_mode' => 'distance',
            'delivery_charge' => 40,
            'delivery_base_fee' => 35,
            'delivery_base_km' => 2,
            'delivery_per_km' => 5,
            'delivery_max_km' => 15,
            'delivery_free_from' => 0,
        ]);
    }

    public function test_dentro_de_los_km_base_cobra_solo_la_base(): void
    {
        $r = $this->bajamar()->computeDeliveryFee(500, 1.5);
        $this->assertSame(35.0, $r['fee']);
        $this->assertFalse($r['estimated']);
    }

    public function test_cobra_los_km_extra(): void
    {
        // 7 km => 35 + (7-2)*5 = 60
        $r = $this->bajamar()->computeDeliveryFee(500, 7.0);
        $this->assertSame(60.0, $r['fee']);
    }

    public function test_fuera_del_radio_no_esta_cubierto(): void
    {
        $r = $this->bajamar()->computeDeliveryFee(500, 20.0);
        $this->assertFalse($r['covered']);
    }

    public function test_sin_distancia_usa_la_tarifa_fija_y_marca_estimado(): void
    {
        $r = $this->bajamar()->computeDeliveryFee(500, null);
        // El respaldo es delivery_charge (40), NO la base (35): la base es el
        // piso para quien vive cerca, y cobrarla a todos regala los envios lejanos.
        $this->assertSame(40.0, $r['fee']);
        $this->assertTrue($r['estimated']);
        $this->assertTrue($r['covered']);
    }

    public function test_sin_distancia_y_sin_tarifa_fija_cae_a_la_base(): void
    {
        $e = $this->bajamar();
        $e->delivery_charge = 0;
        $r = $e->computeDeliveryFee(500, null);
        $this->assertSame(35.0, $r['fee']);
        $this->assertTrue($r['estimated']);
    }

    public function test_envio_gratis_desde_cierto_monto(): void
    {
        $e = $this->bajamar();
        $e->delivery_free_from = 400;
        $r = $e->computeDeliveryFee(500, 7.0);
        $this->assertSame(0.0, $r['fee']);
    }

    public function test_modo_tarifa_fija_nunca_es_estimado(): void
    {
        $e = $this->bajamar();
        $e->delivery_mode = 'flat';
        $r = $e->computeDeliveryFee(500, null);
        $this->assertSame(40.0, $r['fee']);
        $this->assertFalse($r['estimated']);
    }
}
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `php artisan test --filter=DeliveryFeeTest`
Expected: FAIL — `Undefined array key "estimated"`

- [ ] **Step 3: Reemplazar `computeDeliveryFee` (líneas 77-101)**

```php
    /**
     * Costo de envío autoritativo según la config del dueño.
     * Devuelve ['fee' => float, 'covered' => bool, 'estimated' => bool].
     *
     * 'estimated' = se cobró sin conocer la distancia real. El dueño lo ve
     * marcado en el pedido para poder ajustarlo.
     */
    public function computeDeliveryFee(float $subtotal, ?float $distanceKm): array
    {
        if (($this->delivery_mode ?? 'flat') !== 'distance') {
            return ['fee' => (float) $this->delivery_charge, 'covered' => true, 'estimated' => false];
        }
        // Sin ubicación del cliente: respaldo = tarifa fija si está configurada.
        // Antes caía a delivery_base_fee, que es el piso para quien vive cerca:
        // cobrárselo a todos regalaba los envíos lejanos.
        if ($distanceKm === null) {
            $flat = (float) $this->delivery_charge;
            $fee = $flat > 0 ? $flat : (float) $this->delivery_base_fee;
            return ['fee' => $fee, 'covered' => true, 'estimated' => true];
        }
        $max = (float) $this->delivery_max_km;
        if ($max > 0 && $distanceKm > $max) {
            return ['fee' => 0, 'covered' => false, 'estimated' => false];
        }
        $extra = max(0, $distanceKm - (float) $this->delivery_base_km);
        $fee = (float) $this->delivery_base_fee + $extra * (float) $this->delivery_per_km;
        $freeFrom = (float) $this->delivery_free_from;
        if ($freeFrom > 0 && $subtotal >= $freeFrom) {
            $fee = 0;
        }
        return ['fee' => round($fee, 2), 'covered' => true, 'estimated' => false];
    }
```

- [ ] **Step 4: Persistir la bandera en `createOrder` (línea 322)**

Debajo de `$order->delivery_charge = $data['delivery_charge'] ?? 0;` agregar:

```php
        $order->delivery_estimated = $data['delivery_estimated'] ?? false;
```

- [ ] **Step 5: Pasarla desde el controlador**

En `EstablishmentController.php`, cambiar el bloque de las líneas 240-253:

```php
        $deliveryCharge = 0;
        $deliveryEstimated = false;
        if ($request->input('user.delivery') === 'Envio') {
            $dist = $establishment->distanceFromCoords(
                $request->input('user.latitude'),
                $request->input('user.longitude')
            );
            $calc = $establishment->computeDeliveryFee($serverTotal, $dist);
            if (!$calc['covered']) {
                return response()->json([
                    'message' => 'Tu dirección está fuera del área de entrega de este restaurante.',
                ], 422);
            }
            $deliveryCharge = $calc['fee'];
            $deliveryEstimated = $calc['estimated'];
        }
```

Y en el arreglo `$orderData` (línea 278), junto a `'delivery_charge'`:

```php
            'delivery_estimated' => $deliveryEstimated,
```

- [ ] **Step 6: Correr las pruebas**

Run: `php artisan test --filter=DeliveryFeeTest`
Expected: PASS, 7 pruebas

- [ ] **Step 7: Commit**

```bash
git add app/Models/Establishment.php app/Http/Controllers/EstablishmentController.php tests/Unit/DeliveryFeeTest.php
git commit -m "Envio sin ubicacion: respaldo a tarifa fija y bandera de estimado"
```

---

## Task 6: Exponer `delivery_estimated` al panel

**Files:**
- Modify: `app/Http/Controllers/AdminController.php:742` y `:821`

- [ ] **Step 1: Agregar la columna a los dos `select()`**

En ambas líneas, agregar `'delivery_estimated'` justo después de `'delivery_charge'`:

```php
->select('id', 'order_code', 'customer_name', 'phone', 'delivery', 'delivery_address', 'delivery_references', 'delivery_charge', 'delivery_estimated', 'total', 'discount', 'tip', 'payment_method', 'comments', 'current_status_id', 'created_at', 'schedule_at')
```

- [ ] **Step 2: Verificar que la suite sigue verde**

Run: `php artisan test`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/Http/Controllers/AdminController.php
git commit -m "Admin: exponer delivery_estimated en pedidos"
```

---

# PARTE 2 — Frontend (`c:\laragon\www\delivery-food`)

## Task 7: `deliveryCharge` y `deliveryEstimated` en el store

**Files:**
- Modify: `src/stores/main-store.js:132-158`
- Test: `tests/stores/main-store.test.js`

- [ ] **Step 1: Escribir las pruebas que fallan**

Agregar al final de `tests/stores/main-store.test.js`, dentro del `describe("main-store", ...)`:

```js
  describe("deliveryCharge y deliveryEstimated", () => {
    const bajamar = {
      delivery_mode: "distance",
      delivery_charge: 40,
      delivery_base_fee: 35,
      delivery_base_km: 2,
      delivery_per_km: 5,
      delivery_max_km: 15,
      delivery_free_from: 0,
    };

    const setup = (distance, establishment = bajamar) => {
      store.userStore.data = { delivery: "Envio", distance };
      store.companyStore.company = { establishment };
    };

    it("dentro de los km base cobra solo la base", () => {
      setup(1.5);
      expect(store.deliveryCharge).toBe(35);
      expect(store.deliveryEstimated).toBe(false);
    });

    it("cobra los km extra", () => {
      setup(7); // 35 + (7-2)*5 = 60
      expect(store.deliveryCharge).toBe(60);
    });

    it("fuera del radio no esta cubierto", () => {
      setup(20);
      expect(store.deliveryCovered).toBe(false);
    });

    it("sin distancia usa la tarifa fija y marca estimado", () => {
      setup(undefined);
      expect(store.deliveryCharge).toBe(40);
      expect(store.deliveryEstimated).toBe(true);
    });

    it("sin distancia y sin tarifa fija cae a la base", () => {
      setup(undefined, { ...bajamar, delivery_charge: 0 });
      expect(store.deliveryCharge).toBe(35);
      expect(store.deliveryEstimated).toBe(true);
    });

    it("envio gratis desde cierto monto", () => {
      setup(7, { ...bajamar, delivery_free_from: 400 });
      store.cartStore.total = 500;
      expect(store.deliveryCharge).toBe(0);
    });

    it("en modo tarifa fija nunca es estimado", () => {
      setup(undefined, { ...bajamar, delivery_mode: "flat" });
      expect(store.deliveryCharge).toBe(40);
      expect(store.deliveryEstimated).toBe(false);
    });

    it("al recoger no hay costo de envio", () => {
      store.userStore.data = { delivery: "Recoger" };
      store.companyStore.company = { establishment: bajamar };
      expect(store.deliveryCharge).toBe(0);
      expect(store.deliveryEstimated).toBe(false);
    });
  });
```

> Antes de escribir estas pruebas, confirmar cómo el `main-store` lee `establishment` (getter `establishment`) y ajustar `setup()` para poblar exactamente esa fuente. Si el getter lee de otro lado, cambiar `store.companyStore.company = ...` por lo que corresponda — la prueba debe reflejar el código real, no al revés.

- [ ] **Step 2: Correr para verificar que fallan**

Run: `npx vitest run tests/stores/main-store.test.js -t "deliveryCharge y deliveryEstimated"`
Expected: FAIL — `deliveryEstimated` es `undefined`, y el caso sin distancia devuelve 35 en vez de 40

- [ ] **Step 3: Cambiar el getter y agregar el nuevo (líneas 132-148)**

```js
    deliveryCharge() {
      if (this.data.delivery !== "Envio") return 0;
      const e = this.establishment || {};
      if ((e.delivery_mode ?? "flat") !== "distance") {
        return Number(e.delivery_charge ?? 0);
      }
      // Modo distancia: usa la distancia (km) a la dirección geocodificada.
      const dist = Number(this.data.distance);
      if (!dist || Number.isNaN(dist)) {
        // Sin ubicación: respaldo = tarifa fija si está configurada. La base es
        // el piso para quien vive cerca; cobrársela a todos regala los lejanos.
        const flat = Number(e.delivery_charge ?? 0);
        return flat > 0 ? flat : Number(e.delivery_base_fee ?? 0);
      }
      const max = Number(e.delivery_max_km ?? 0);
      if (max > 0 && dist > max) return 0; // fuera de cobertura
      const extra = Math.max(0, dist - Number(e.delivery_base_km ?? 0));
      let fee = Number(e.delivery_base_fee ?? 0) + extra * Number(e.delivery_per_km ?? 0);
      const freeFrom = Number(e.delivery_free_from ?? 0);
      if (freeFrom > 0 && Number(this.total) >= freeFrom) fee = 0;
      return Math.round(fee * 100) / 100;
    },
    // El envío se cobró sin conocer la distancia real: se le avisa al cliente y
    // se marca el pedido para que el dueño pueda ajustarlo.
    deliveryEstimated() {
      if (this.data.delivery !== "Envio") return false;
      const e = this.establishment || {};
      if ((e.delivery_mode ?? "flat") !== "distance") return false;
      const dist = Number(this.data.distance);
      return !dist || Number.isNaN(dist);
    },
```

- [ ] **Step 4: Correr para verificar que pasan**

Run: `npx vitest run tests/stores/main-store.test.js`
Expected: PASS, toda la suite del archivo

- [ ] **Step 5: Commit**

```bash
git add src/stores/main-store.js tests/stores/main-store.test.js
git commit -m "Envio sin ubicacion: respaldo a tarifa fija y getter deliveryEstimated"
```

---

## Task 8: `geocodeAddress()` y limpieza de coordenadas rancias

**Files:**
- Modify: `src/stores/main-store.js` (acciones, junto a `getDistance`)
- Test: `tests/stores/main-store.test.js`

- [ ] **Step 1: Escribir las pruebas que fallan**

```js
  describe("geocodeAddress", () => {
    beforeEach(() => {
      store.companyStore.slug = "bajamar";
      store.companyStore.company = { establishment: { coordinates: "25.79,-108.98" } };
      store.userStore.data = {
        delivery: "Envio", zip: "81200", town: "Centro",
        street: "Aldama", ext_number: "500",
      };
    });

    it("guarda lat/lng y recalcula la distancia", async () => {
      api.post = vi.fn().mockResolvedValue({
        data: { lat: 25.75, lng: -108.99, match_precision: "street" },
      });

      await store.geocodeAddress();

      expect(store.userStore.data.latitude).toBe(25.75);
      expect(store.userStore.data.longitude).toBe(-108.99);
      expect(Number(store.userStore.data.distance)).toBeGreaterThan(0);
    });

    it("deja la distancia vacia cuando no se pudo ubicar", async () => {
      api.post = vi.fn().mockResolvedValue({
        data: { lat: null, lng: null, match_precision: "none" },
      });

      await store.geocodeAddress();

      expect(store.userStore.data.distance).toBeFalsy();
      expect(store.deliveryEstimated).toBe(true);
    });

    it("no revienta si el endpoint falla", async () => {
      api.post = vi.fn().mockRejectedValue(new Error("network"));

      await expect(store.geocodeAddress()).resolves.not.toThrow();
      expect(store.deliveryEstimated).toBe(true);
    });

    it("no llama al endpoint si falta CP y colonia", async () => {
      api.post = vi.fn();
      store.userStore.data.zip = "";
      store.userStore.data.town = "";

      await store.geocodeAddress();

      expect(api.post).not.toHaveBeenCalled();
    });
  });

  describe("clearGeo", () => {
    it("borra coordenadas y distancia", () => {
      store.userStore.data = {
        latitude: 1, longitude: 2, distance: 3, geo_precision: "street",
      };
      store.clearGeo();
      expect(store.userStore.data.latitude).toBeNull();
      expect(store.userStore.data.longitude).toBeNull();
      expect(store.userStore.data.distance).toBeNull();
      expect(store.userStore.data.geo_precision).toBeNull();
    });
  });
```

- [ ] **Step 2: Correr para verificar que fallan**

Run: `npx vitest run tests/stores/main-store.test.js -t "geocodeAddress"`
Expected: FAIL — `store.geocodeAddress is not a function`

- [ ] **Step 3: Implementar las acciones**

En `src/stores/main-store.js`, reemplazar `getPositions()` (líneas 770-785, ya no se usa) por:

```js
    // Borra la ubicación derivada. user-store es persistido, así que sin esto
    // un cliente arrastraría la coordenada de otro establecimiento o de una
    // dirección que ya corrigió.
    clearGeo() {
      this.userStore.data.latitude = null;
      this.userStore.data.longitude = null;
      this.userStore.data.distance = null;
      this.userStore.data.geo_precision = null;
    },
    // Convierte la dirección escrita en lat/lng. Nunca lanza: si falla, el envío
    // simplemente queda como estimado y el checkout continúa.
    async geocodeAddress() {
      const d = this.userStore.data;
      if (!d.zip && !d.town) return;
      try {
        const { data } = await api.post(
          `/establishment/${this.companyStore.slug}/geocode`,
          {
            zip: d.zip ?? null,
            town: d.town ?? null,
            street: d.street ?? null,
            ext_number: d.ext_number ?? null,
          }
        );
        d.geo_precision = data.match_precision;
        if (data.lat == null || data.lng == null) {
          d.latitude = null;
          d.longitude = null;
          d.distance = null;
          return;
        }
        d.latitude = data.lat;
        d.longitude = data.lng;
        this.getDistance();
      } catch (e) {
        this.clearGeo();
      }
    },
```

- [ ] **Step 4: Correr para verificar que pasan**

Run: `npx vitest run tests/stores/main-store.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/stores/main-store.js tests/stores/main-store.test.js
git commit -m "Store: geocodeAddress y limpieza de coordenadas rancias"
```

---

## Task 9: `DataDrawer` dispara el geocode y avisa que es estimado

**Files:**
- Modify: `src/components/client/DataDrawer.vue:131-141` (el aviso) y sección `<script setup>`

- [ ] **Step 1: Cambiar el aviso del costo (líneas 132-135)**

```html
        <p class="mc-delivery-charge" v-if="mainStore.deliveryCovered">
          <q-icon name="local_shipping" size="16px" class="q-mr-xs" />
          <template v-if="mainStore.deliveryEstimated">
            Envío estimado: <strong>${{ Number(mainStore.deliveryCharge).toFixed(2) }}</strong>
            <span class="mc-delivery-note">
              — el restaurante puede ajustarlo según la distancia
            </span>
          </template>
          <template v-else>
            Costo de envío: <strong>${{ Number(mainStore.deliveryCharge).toFixed(2) }}</strong>
          </template>
        </p>
```

- [ ] **Step 2: Agregar el estilo del aviso**

En el `<style lang="scss" scoped>` del mismo archivo:

```scss
.mc-delivery-note {
  color: var(--color-text-tertiary);
  font-size: var(--text-xs);
}
```

- [ ] **Step 3: Agregar el watcher con debounce**

En `<script setup>`, junto a `loadTowns` (línea 312). Importar `watch` desde `vue` si no está ya:

```js
// Geocodifica la dirección cuando el cliente termina de escribirla. El debounce
// evita una llamada por tecla; la limpieza previa impide cobrar con la coordenada
// de la dirección anterior mientras llega la nueva.
let geoTimer = null;
let geoPending = null;

watch(
  () => [
    mainStore.data.zip,
    mainStore.data.town,
    mainStore.data.street,
    mainStore.data.ext_number,
  ],
  () => {
    if (mainStore.data.delivery !== "Envio") return;
    mainStore.clearGeo();
    clearTimeout(geoTimer);
    const d = mainStore.data;
    if (!d.zip || !d.town || !d.street || !d.ext_number) return;
    geoTimer = setTimeout(() => {
      geoPending = mainStore.geocodeAddress();
    }, 600);
  }
);
```

- [ ] **Step 4: Esperar el geocode pendiente antes de validar**

En `validateData()` (línea 329), como primera instrucción del bloque `if (mainStore.data.delivery === "Envio")`:

```js
  if (mainStore.data.delivery === "Envio") {
    // Si el debounce sigue corriendo, forzarlo ya: el cobro debe estar resuelto
    // antes de decidir si la dirección queda dentro del área de entrega.
    clearTimeout(geoTimer);
    if (!mainStore.data.latitude && mainStore.data.zip && mainStore.data.town) {
      geoPending = mainStore.geocodeAddress();
    }
    if (geoPending) {
      await geoPending;
      geoPending = null;
    }
    e.town = !mainStore.data.town;
```

- [ ] **Step 5: Verificar a mano**

Run: `npm run dev`, abrir `/bajamar`, agregar un producto, ir a Datos, elegir Envío y llenar CP 81200 / Centro / Aldama / 500.
Expected: el costo de envío cambia de "Envío estimado" a un monto calculado en ~1 segundo.

- [ ] **Step 6: Commit**

```bash
git add src/components/client/DataDrawer.vue
git commit -m "Checkout: geocodifica la direccion y avisa cuando el envio es estimado"
```

---

## Task 10: Quitar el prompt de GPS del arranque

**Files:**
- Modify: `src/layouts/MainLayout.vue:137`

- [ ] **Step 1: Borrar la llamada**

Eliminar la línea:

```js
mainStore.getPositions();
```

La acción `getPositions()` ya se eliminó del store en el Task 8. `getDistance()` se conserva porque la usa `geocodeAddress()`.

- [ ] **Step 2: Verificar que no quedan referencias**

Run: `npx eslint src/ --ext .js,.vue`
Expected: sin errores de `getPositions is not defined`

Run: `grep -rn "getPositions" src/ tests/`
Expected: sin resultados

- [ ] **Step 3: Commit**

```bash
git add src/layouts/MainLayout.vue
git commit -m "Quitar el permiso de ubicacion al cargar el menu"
```

---

## Task 11: Marcar el envío estimado en el mensaje de WhatsApp

**Files:**
- Modify: `src/stores/main-store.js:706-708`

- [ ] **Step 1: Cambiar la línea del envío**

```js
      if (this.deliveryCharge > 0) {
        lines.push(
          this.deliveryEstimated
            ? `Envio: $${f(this.deliveryCharge)} (ESTIMADO - revisar distancia)`
            : `Envio: $${f(this.deliveryCharge)}`
        );
      }
```

- [ ] **Step 2: Correr la suite**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/stores/main-store.js
git commit -m "WhatsApp: marcar el envio estimado en el mensaje al dueno"
```

---

## Task 12: `ENVÍO ESTIMADO` en el panel y en el ticket

**Files:**
- Modify: `src/components/admin/Orders.vue` (lista de pedidos y `printOrder()`)

- [ ] **Step 1: Localizar dónde se muestra el envío**

Run: `grep -n "delivery_charge" src/components/admin/Orders.vue`

Anotar las dos ubicaciones: la tarjeta/renglón del pedido y el `printOrder()`.

- [ ] **Step 2: Agregar la insignia en la lista**

Junto a donde se pinta `order.delivery_charge`, agregar:

```html
<q-badge
  v-if="order.delivery_estimated"
  color="orange"
  text-color="white"
  class="q-ml-xs"
>
  ESTIMADO
</q-badge>
```

- [ ] **Step 3: Agregar la marca en el ticket impreso**

Dentro del `document.write()` de `printOrder()`, en la línea del envío, seguir el
mismo patrón de las otras líneas del ticket:

```js
${order.delivery_charge > 0 ? `<div class="row"><span>Envio</span><span>$${Number(order.delivery_charge).toFixed(2)}</span></div>` : ""}
${order.delivery_estimated ? `<div class="row"><span>** ENVIO ESTIMADO - REVISAR DISTANCIA **</span></div>` : ""}
```

> Ajustar las clases (`row`, etc.) a las que ya use el ticket en ese archivo. Leer el `printOrder()` completo antes de editar.

- [ ] **Step 4: Verificar a mano**

Run: `npm run dev`, entrar a `/bajamar/admin`, abrir un pedido con envío estimado e imprimir.
Expected: aparece la insignia naranja en la lista y la línea `** ENVIO ESTIMADO **` en el ticket.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/Orders.vue
git commit -m "Admin: marcar ENVIO ESTIMADO en la lista y en el ticket"
```

---

# PARTE 3 — Verificación y despliegue

## Task 13: Suites completas

- [ ] **Step 1: Frontend**

Run: `npm run test:run`
Expected: PASS, sin regresiones

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: sin errores

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: `Build succeeded`

- [ ] **Step 4: Backend**

Run (en `c:\laragon\www\comeleya-laravel`): `php artisan test`
Expected: PASS

---

## Task 14: Despliegue

**El orden es obligatorio.** Si el frontend nuevo sale antes que la columna, los pedidos revientan.

- [ ] **Step 1: Subir el backend**

Run: `.\deploy.ps1 back 9999`

- [ ] **Step 2: El humano corre las migraciones en producción**

Terminal de cPanel:
```bash
php artisan migrate --force
php artisan config:clear
```
O el SQL crudo del inicio de este documento, en phpMyAdmin.

**Claude no puede hacer este paso.** Esperar confirmación antes de seguir.

- [ ] **Step 3: Verificar que el endpoint responde en producción**

```bash
curl -s -X POST https://app.comeleya.com/api/establishment/bajamar/geocode \
  -H "Content-Type: application/json" \
  -d '{"zip":"81200","town":"Centro","street":"Aldama","ext_number":"500"}'
```
Expected: JSON con `lat`, `lng` y `match_precision`

- [ ] **Step 4: Subir el frontend**

Run: `.\deploy.ps1 front`

- [ ] **Step 5: Verificar el flujo completo en producción**

Abrir `https://comeleya.com/bajamar`, agregar un producto, elegir Envío y llenar una
dirección lejana (por ejemplo un CP del otro extremo de Los Mochis).
Expected: el costo sube por encima de $35 en vez de quedarse clavado.

- [ ] **Step 6: Confirmarle a Bajamar**

Avisar que los pedidos sin ubicación ahora cobran la tarifa fija y llegan marcados
como `ESTIMADO` por WhatsApp y en el ticket.
