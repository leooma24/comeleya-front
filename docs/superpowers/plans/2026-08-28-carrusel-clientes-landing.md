# Carrusel de clientes en la landing — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar en la landing una tira de logos deslizante con los negocios que están activos y pagando un plan, dos veces: bajo el hero y arriba del footer.

**Architecture:** Una ruta pública nueva y cacheada en el backend devuelve `{name, slug, logo}` de los establecimientos activos con suscripción vigente. En el frontend, la lógica de la marquesina vive en un util puro y probado (`src/utils/logosClientes.js`), el pintado en un componente único (`src/components/LogosClientes.vue`) instanciado dos veces desde `MainPage.vue`, que hace un solo fetch.

**Tech Stack:** Laravel + PHPUnit (repo `c:\laragon\www\comeleya-laravel`) · Vue 3 `<script setup>` + Quasar 2 + Vitest + @vue/test-utils (repo `c:\laragon\www\delivery-food`)

**Spec:** `docs/superpowers/specs/2026-08-28-carrusel-clientes-landing-design.md`

---

## Estructura de archivos

| Archivo | Repo | Responsabilidad |
|---|---|---|
| `routes/api.php` (modificar) | laravel | La ruta `GET /clients`, junto a `packages` y `sitemap` |
| `tests/Feature/Public/ClientsListTest.php` (crear) | laravel | Que el filtro "activo + plan vigente" no deje entrar a quien no debe |
| `src/utils/logosClientes.js` (crear) | front | Lógica pura: normalizar, decidir si anima, cuántas veces repetir la pista |
| `tests/utils/logosClientes.test.js` (crear) | front | Pruebas de lo anterior |
| `src/components/LogosClientes.vue` (crear) | front | El carrusel: marcado + estilos, en dos variantes de color |
| `tests/components/LogosClientes.test.js` (crear) | front | Que no pinte nada vacío, que enlace bien, que caiga al nombre sin logo |
| `src/pages/MainPage.vue` (modificar) | front | Un fetch, dos instancias |

Dos cosas a propósito:

- **El componente no usa componentes de Quasar.** `q-img` mete un envoltorio con relación de aspecto que pelea con una tira de logos de proporciones distintas, y `tests/setup.mjs` simula el módulo `quasar` con una superficie mínima. HTML plano se monta en las pruebas sin instalar nada.
- **La lógica sale del `.vue`.** El repo ya tiene ese patrón (`src/utils/cartBarCta.js` + `tests/utils/cartBarCta.test.js`): lo que se puede probar sin DOM, se prueba sin DOM.

---

## Task 1: Endpoint público `GET /clients`

**Repo:** `c:\laragon\www\comeleya-laravel`

**Files:**
- Create: `tests/Feature/Public/ClientsListTest.php`
- Modify: `routes/api.php` (junto a la ruta `packages`, ~línea 138)

**Contexto que el implementador necesita:**

- `Establishment::activeSubscription()` ya existe (`app/Models/Establishment.php:433`) y define "tiene plan vigente": `status = 'active'` y `end_date > now()`. **Se reutiliza, no se reescribe** — dos definiciones del mismo filtro es una que se queda atrás.
- Los valores reales de `establishments.status` en producción son `Activo` e `Inactivo`. **Ojo:** `EstablishmentFactory` pone `'Activa'` (femenino), que no coincide con ninguno de los dos. En las pruebas hay que pasar `status` explícito siempre. No arreglar la factory en este cambio: hay pruebas existentes que dependen de su valor actual.
- No hay `SubscriptionFactory`. Las suscripciones se crean con `Subscription::create([...])`; la tabla exige `establishment_id`, `package_id`, `start_date`, `end_date`, `duration_days`, `type` (`monthly`|`yearly`) y `status`.
- `PackageFactory` sí existe.

- [ ] **Step 1: Escribir la prueba que falla**

Crear `tests/Feature/Public/ClientsListTest.php`:

```php
<?php

namespace Tests\Feature\Public;

use App\Models\Establishment;
use App\Models\Package;
use App\Models\Subscription;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * La tira de logos de la portada. Lo que se prueba aqui no es que pinte bonito,
 * es QUIEN entra: la landing dice "estos ya usan ComeleYa", y meter ahi a un
 * negocio dado de baja o a uno que nunca pago convierte la prueba social en
 * publicidad enganosa.
 */
class ClientsListTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // La ruta cachea 10 minutos. Sin esto, la primera prueba que corra le
        // deja su respuesta a las demas y todas pasan por accidente.
        Cache::flush();
    }

    private function negocio(string $status, string $name, ?string $logo = null): Establishment
    {
        return Establishment::factory()->create([
            'status' => $status,
            'name' => $name,
            'logo' => $logo,
        ]);
    }

    private function suscripcion(Establishment $est, string $status, string $endDate, string $startDate = '-1 month'): Subscription
    {
        return Subscription::create([
            'establishment_id' => $est->id,
            'package_id' => Package::factory()->create()->id,
            'start_date' => Carbon::parse($startDate),
            'end_date' => Carbon::parse($endDate),
            'duration_days' => 30,
            'type' => 'monthly',
            'status' => $status,
        ]);
    }

    public function test_devuelve_los_activos_con_plan_vigente(): void
    {
        $est = $this->negocio('Activo', 'Kazuki Sushi', 'https://cdn.test/kazuki.jpg');
        $this->suscripcion($est, 'active', '+1 month');

        $this->getJson('/api/clients')
            ->assertOk()
            ->assertJsonCount(1, 'clients')
            ->assertJsonPath('clients.0.name', 'Kazuki Sushi')
            ->assertJsonPath('clients.0.slug', $est->slug)
            ->assertJsonPath('clients.0.logo', 'https://cdn.test/kazuki.jpg');
    }

    public function test_excluye_al_que_se_le_vencio_el_plan(): void
    {
        $est = $this->negocio('Activo', 'Vencido');
        $this->suscripcion($est, 'active', '-1 day', '-2 months');

        $this->getJson('/api/clients')->assertOk()->assertJsonCount(0, 'clients');
    }

    public function test_excluye_al_que_cancelo(): void
    {
        $est = $this->negocio('Activo', 'Cancelado');
        $this->suscripcion($est, 'cancelled', '+1 month');

        $this->getJson('/api/clients')->assertOk()->assertJsonCount(0, 'clients');
    }

    public function test_excluye_al_negocio_dado_de_baja_aunque_este_pagado(): void
    {
        $est = $this->negocio('Inactivo', 'De baja');
        $this->suscripcion($est, 'active', '+1 month');

        $this->getJson('/api/clients')->assertOk()->assertJsonCount(0, 'clients');
    }

    public function test_excluye_al_que_nunca_tuvo_plan(): void
    {
        $this->negocio('Activo', 'Sin plan');

        $this->getJson('/api/clients')->assertOk()->assertJsonCount(0, 'clients');
    }

    /**
     * Tres campos y ningun otro. Es una ruta publica y sin sesion: el telefono,
     * el correo y la configuracion del negocio no tienen por que viajar para
     * pintar una imagen.
     */
    public function test_no_expone_mas_que_nombre_slug_y_logo(): void
    {
        $est = $this->negocio('Activo', 'Kazuki Sushi', 'https://cdn.test/k.jpg');
        $this->suscripcion($est, 'active', '+1 month');

        $cliente = $this->getJson('/api/clients')->assertOk()->json('clients.0');

        $llaves = array_keys($cliente);
        sort($llaves);
        $this->assertSame(['logo', 'name', 'slug'], $llaves);
    }

    public function test_los_clientes_mas_nuevos_van_primero(): void
    {
        $viejo = $this->negocio('Activo', 'El de siempre');
        $this->suscripcion($viejo, 'active', '+1 month', '-2 years');

        $nuevo = $this->negocio('Activo', 'El recien llegado');
        $this->suscripcion($nuevo, 'active', '+1 month', '-3 days');

        $this->getJson('/api/clients')
            ->assertOk()
            ->assertJsonPath('clients.0.name', 'El recien llegado')
            ->assertJsonPath('clients.1.name', 'El de siempre');
    }
}
```

- [ ] **Step 2: Correr la prueba y verificar que falla**

Desde `c:\laragon\www\comeleya-laravel`:

```
php artisan test --filter=ClientsListTest
```

Esperado: FAIL en las 7. La ruta `/api/clients` no existe, así que `getJson` devuelve 404 y `assertOk()` truena.

- [ ] **Step 3: Escribir la ruta**

En `routes/api.php`, inmediatamente después del bloque `Route::get('packages', ...)`:

```php
// Los logos que la portada muestra como prueba social: los negocios que estan
// activos Y pagando. Se apoya en activeSubscription() del modelo para que "tiene
// plan vigente" se defina en un solo lugar; si esa regla cambiara -por ejemplo
// para contar un periodo de gracia- cambia aqui sola.
//
// Tres campos y nada mas, igual que /sitemap: mandar el establecimiento completo
// serian 43 platillos con extras y horarios por negocio, para pintar una imagen.
//
// Cacheada 10 minutos y con Cache-Control. Es un whereHas sobre suscripciones que
// corre en CADA carga de la landing, no una vez: sin cache, cada curioso que hace
// scroll en la portada le pega a la base.
Route::get('clients', function () {
    $clientes = \Illuminate\Support\Facades\Cache::remember('landing.clients', 600, function () {
        return \App\Models\Establishment::query()
            ->select('id', 'name', 'slug', 'logo')
            ->where('status', 'Activo')
            ->whereHas('activeSubscription')
            ->withMax('activeSubscription as alta', 'start_date')
            ->orderByDesc('alta')
            ->get()
            ->map(fn ($e) => [
                'name' => $e->name,
                'slug' => $e->slug,
                'logo' => $e->logo,
            ])
            ->values();
    });

    return response()->json(['clients' => $clientes])
        ->header('Cache-Control', 'public, max-age=600');
});
```

- [ ] **Step 4: Correr la prueba y verificar que pasa**

```
php artisan test --filter=ClientsListTest
```

Esperado: PASS, las 7.

Si `test_los_clientes_mas_nuevos_van_primero` falla porque `withMax` no digiere el `latest()` que trae dentro la relación `activeSubscription`, sustituir las dos líneas `withMax` + `orderByDesc('alta')` por una subconsulta explícita:

```php
->orderByDesc(
    \App\Models\Subscription::select('start_date')
        ->whereColumn('subscriptions.establishment_id', 'establishments.id')
        ->where('status', 'active')
        ->where('end_date', '>', now())
        ->orderByDesc('start_date')
        ->limit(1)
)
```

y volver a correr.

- [ ] **Step 5: Confirmar que no se rompió nada más**

```
php artisan test --testsuite=Feature
```

Esperado: el mismo resultado que antes del cambio, más las 7 nuevas.

- [ ] **Step 6: Commit**

```bash
git add routes/api.php tests/Feature/Public/ClientsListTest.php
git commit -m "Ruta publica con los negocios que ya pagan, para la portada"
```

---

## Task 2: Lógica de la marquesina (util puro)

**Repo:** `c:\laragon\www\delivery-food`

**Files:**
- Create: `src/utils/logosClientes.js`
- Test: `tests/utils/logosClientes.test.js`

**Por qué estas cuatro funciones:**

- `normalizaClientes` — la respuesta viene de la red; un objeto sin `slug` produciría un enlace a `/undefined` en la portada.
- `debeAnimar` — con 3 o menos, dos logos dando vueltas se ven peor que dos logos quietos.
- `repeticiones` — la marquesina de CSS recorre `-50%`, así que la pista tiene que contener la lista un número **par** de veces, con las dos mitades idénticas. Y con listas cortas hay que repetirla más, para que la pista no acabe siendo más angosta que la pantalla.
- `duracionSegundos` — más logos, más recorrido; a duración fija, una lista larga pasaría volando.

- [ ] **Step 1: Escribir las pruebas que fallan**

Crear `tests/utils/logosClientes.test.js`:

```js
import { describe, it, expect } from "vitest";
import {
  normalizaClientes,
  debeAnimar,
  repeticiones,
  duracionSegundos,
} from "src/utils/logosClientes.js";

const cliente = (props = {}) => ({ name: "Kazuki", slug: "kazuki", logo: "https://cdn/k.jpg", ...props });

describe("normalizaClientes", () => {
  it("deja pasar un cliente completo", () => {
    expect(normalizaClientes([cliente()])).toEqual([
      { name: "Kazuki", slug: "kazuki", logo: "https://cdn/k.jpg" },
    ]);
  });

  it("devuelve lista vacia si no le dan un arreglo", () => {
    expect(normalizaClientes(null)).toEqual([]);
    expect(normalizaClientes(undefined)).toEqual([]);
    expect(normalizaClientes("no soy un arreglo")).toEqual([]);
  });

  // Un enlace a /undefined es peor que no pintar ese logo.
  it("descarta a quien no trae slug o nombre", () => {
    expect(normalizaClientes([cliente({ slug: "" }), cliente({ name: "  " }), { logo: "x" }])).toEqual([]);
  });

  it("un logo vacio queda en null, no en cadena vacia", () => {
    expect(normalizaClientes([cliente({ logo: "" })])[0].logo).toBeNull();
    expect(normalizaClientes([cliente({ logo: undefined })])[0].logo).toBeNull();
  });

  it("recorta los espacios del nombre y del slug", () => {
    expect(normalizaClientes([cliente({ name: "  Kazuki  ", slug: " kazuki " })])[0])
      .toEqual({ name: "Kazuki", slug: "kazuki", logo: "https://cdn/k.jpg" });
  });
});

describe("debeAnimar", () => {
  it("con tres o menos se queda quieta", () => {
    expect(debeAnimar(0)).toBe(false);
    expect(debeAnimar(1)).toBe(false);
    expect(debeAnimar(3)).toBe(false);
  });

  it("con cuatro o mas se desliza", () => {
    expect(debeAnimar(4)).toBe(true);
    expect(debeAnimar(30)).toBe(true);
  });
});

describe("repeticiones", () => {
  it("sin clientes no hay pista", () => {
    expect(repeticiones(0)).toBe(0);
  });

  it("si no anima, la lista va una sola vez", () => {
    expect(repeticiones(1)).toBe(1);
    expect(repeticiones(3)).toBe(1);
  });

  // El -50% del keyframe exige mitades identicas: siempre par.
  it("si anima, siempre un numero par de copias", () => {
    for (const n of [4, 5, 7, 8, 12, 40]) {
      expect(repeticiones(n) % 2).toBe(0);
    }
  });

  it("repite lo suficiente para llenar la pista con pocos clientes", () => {
    expect(repeticiones(4) * 4).toBeGreaterThanOrEqual(16);
    expect(repeticiones(5) * 5).toBeGreaterThanOrEqual(16);
    expect(repeticiones(8) * 8).toBeGreaterThanOrEqual(16);
  });

  it("con muchos clientes basta con duplicar", () => {
    expect(repeticiones(16)).toBe(2);
    expect(repeticiones(40)).toBe(2);
  });
});

describe("duracionSegundos", () => {
  it("crece con la cantidad de logos", () => {
    expect(duracionSegundos(20)).toBeGreaterThan(duracionSegundos(8));
  });

  it("nunca baja de un minimo, para que no parezca un parpadeo", () => {
    expect(duracionSegundos(0)).toBeGreaterThanOrEqual(20);
    expect(duracionSegundos(1)).toBeGreaterThanOrEqual(20);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

```
npx vitest run tests/utils/logosClientes.test.js
```

Esperado: FAIL — "Failed to resolve import src/utils/logosClientes.js".

- [ ] **Step 3: Escribir el util**

Crear `src/utils/logosClientes.js`:

```js
// La tira de logos de la portada: los negocios que ya pagan ComeleYa.
//
// La logica vive aqui y no dentro del .vue porque todo esto se puede probar sin
// DOM: que un cliente sin slug no genere un enlace a /undefined, y que la pista
// lleve las copias exactas que la marquesina de CSS necesita.

const texto = (v) => (typeof v === "string" ? v.trim() : "");

// Abajo de esto la marquesina se apaga. Dos o tres logos dando vueltas se ven
// peor que dos o tres logos quietos: parece que falta contenido, que es justo lo
// contrario de lo que la seccion viene a decir.
const MINIMO_PARA_ANIMAR = 4;

// Cuadros que se buscan en pantalla antes de dejar de repetir. Con menos, una
// lista de cuatro logos dejaria la pista mas corta que el monitor y el bucle se
// notaria a simple vista.
const CUADROS_DESEADOS = 16;

/**
 * `[{ name, slug, logo }]` con lo que sirve. Descarta al que venga sin nombre o
 * sin slug: esto llega de la red, y un objeto a medias termina en un enlace roto
 * dentro de la portada.
 */
export function normalizaClientes(lista) {
  if (!Array.isArray(lista)) return [];

  return lista.reduce((acc, cliente) => {
    const name = texto(cliente?.name);
    const slug = texto(cliente?.slug);
    if (!name || !slug) return acc;

    acc.push({ name, slug, logo: texto(cliente?.logo) || null });
    return acc;
  }, []);
}

/** Si la tira se desliza, o se queda centrada y quieta. */
export function debeAnimar(cantidad) {
  return cantidad >= MINIMO_PARA_ANIMAR;
}

/**
 * Cuantas veces se repite la lista dentro de la pista.
 *
 * El keyframe recorre `-50%`, asi que las dos mitades de la pista tienen que ser
 * identicas: cuando anima, el resultado es SIEMPRE par.
 */
export function repeticiones(cantidad) {
  if (cantidad <= 0) return 0;
  if (!debeAnimar(cantidad)) return 1;

  const mitad = Math.max(1, Math.ceil(CUADROS_DESEADOS / cantidad));
  return mitad * 2;
}

/** Un logo tarda mas o menos lo mismo en cruzar, sin importar cuantos haya. */
export function duracionSegundos(cantidad) {
  return Math.max(20, cantidad * 4);
}
```

- [ ] **Step 4: Correr y verificar que pasa**

```
npx vitest run tests/utils/logosClientes.test.js
```

Esperado: PASS, todas en verde.

- [ ] **Step 5: Commit**

```bash
git add src/utils/logosClientes.js tests/utils/logosClientes.test.js
git commit -m "Logica de la tira de logos de clientes"
```

---

## Task 3: Componente `LogosClientes.vue`

**Repo:** `c:\laragon\www\delivery-food`

**Files:**
- Create: `src/components/LogosClientes.vue`
- Test: `tests/components/LogosClientes.test.js` (la carpeta `tests/components/` no existe todavía; se crea)

- [ ] **Step 1: Escribir las pruebas que fallan**

Crear `tests/components/LogosClientes.test.js`:

```js
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import LogosClientes from "src/components/LogosClientes.vue";

const montar = (clientes, props = {}) =>
  mount(LogosClientes, { props: { clientes, titulo: "Ya usan ComeleYa", ...props } });

const cliente = (n) => ({ name: `Negocio ${n}`, slug: `negocio-${n}`, logo: `https://cdn/${n}.jpg` });
const lista = (n) => Array.from({ length: n }, (_, i) => cliente(i));

describe("LogosClientes", () => {
  // Lo mas importante de todo: sin clientes no hay seccion. Un titulo que dice
  // "ya usan ComeleYa" encima de un hueco es peor que no decir nada.
  it("sin clientes no pinta ni el titulo", () => {
    const wrapper = montar([]);
    expect(wrapper.find(".mc-logos").exists()).toBe(false);
    expect(wrapper.text()).toBe("");
  });

  it("con clientes invalidos tampoco pinta nada", () => {
    expect(montar([{ logo: "https://cdn/x.jpg" }]).find(".mc-logos").exists()).toBe(false);
  });

  it("muestra el titulo que le pasan", () => {
    expect(montar(lista(5)).text()).toContain("Ya usan ComeleYa");
  });

  it("cada logo abre el menu del negocio en otra pestana", () => {
    const enlace = montar([cliente(1)]).find("a.mc-logos__cuadro");
    expect(enlace.attributes("href")).toBe("/negocio-1");
    expect(enlace.attributes("target")).toBe("_blank");
    expect(enlace.attributes("rel")).toContain("noopener");
  });

  it("pinta la imagen del cliente con su nombre como alt", () => {
    const img = montar([cliente(1)]).find("img");
    expect(img.attributes("src")).toBe("https://cdn/1.jpg");
    expect(img.attributes("alt")).toBe("Negocio 1");
  });

  it("un cliente sin logo sale con su nombre en texto", () => {
    const wrapper = montar([{ name: "Sin Logo", slug: "sin-logo", logo: null }]);
    expect(wrapper.find("img").exists()).toBe(false);
    expect(wrapper.find(".mc-logos__nombre").text()).toBe("Sin Logo");
  });

  // Una URL muerta deja el icono gris de imagen rota justo donde queriamos
  // presumir. Cae al nombre, igual que quien nunca subio logo.
  it("si la imagen no carga, cae al nombre", async () => {
    const wrapper = montar([cliente(1)]);
    await wrapper.find("img").trigger("error");
    expect(wrapper.find("img").exists()).toBe(false);
    expect(wrapper.find(".mc-logos__nombre").text()).toBe("Negocio 1");
  });

  it("con tres o menos no anima", () => {
    const wrapper = montar(lista(3));
    expect(wrapper.find(".mc-logos__pista--anima").exists()).toBe(false);
    expect(wrapper.findAll("a.mc-logos__cuadro")).toHaveLength(3);
  });

  it("con veinte clientes anima y duplica la pista", () => {
    const wrapper = montar(lista(20));
    expect(wrapper.find(".mc-logos__pista--anima").exists()).toBe(true);
    expect(wrapper.findAll("a.mc-logos__cuadro")).toHaveLength(40);
  });

  it("la variante cambia la clase del bloque", () => {
    expect(montar(lista(5), { variante: "oscura" }).find(".mc-logos--oscura").exists()).toBe(true);
    expect(montar(lista(5)).find(".mc-logos--clara").exists()).toBe(true);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

```
npx vitest run tests/components/LogosClientes.test.js
```

Esperado: FAIL — no existe `src/components/LogosClientes.vue`.

- [ ] **Step 3: Escribir el componente**

Crear `src/components/LogosClientes.vue`:

```vue
<template>
  <section v-if="pista.length" class="mc-logos" :class="`mc-logos--${variante}`">
    <p class="mc-logos__titulo">{{ titulo }}</p>

    <div class="mc-logos__ventana">
      <ul
        class="mc-logos__pista"
        :class="{ 'mc-logos__pista--anima': anima }"
        :style="{ '--mc-logos-duracion': `${duracion}s` }"
      >
        <li v-for="(cliente, i) in pista" :key="`${cliente.slug}-${i}`" class="mc-logos__item">
          <a
            class="mc-logos__cuadro"
            :href="`/${cliente.slug}`"
            target="_blank"
            rel="noopener"
            :title="cliente.name"
          >
            <img
              v-if="cliente.logo && !rotos[cliente.slug]"
              :src="cliente.logo"
              :alt="cliente.name"
              loading="lazy"
              @error="rotos[cliente.slug] = true"
            />
            <span v-else class="mc-logos__nombre">{{ cliente.name }}</span>
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup>
/**
 * La tira de logos de los negocios que ya pagan ComeleYa.
 *
 * Se usa dos veces en la portada -bajo el hero y arriba del footer- y por eso
 * recibe titulo y variante: es el mismo carrusel sobre dos fondos distintos, no
 * dos componentes que hay que mantener en paralelo.
 *
 * No usa componentes de Quasar a proposito: q-img envuelve la imagen en una caja
 * con relacion de aspecto fija, justo lo que no sirve para logos de proporciones
 * distintas.
 */
import { computed, reactive } from "vue";
import {
  normalizaClientes,
  debeAnimar,
  repeticiones,
  duracionSegundos,
} from "src/utils/logosClientes.js";

const props = defineProps({
  clientes: { type: Array, default: () => [] },
  titulo: { type: String, required: true },
  variante: { type: String, default: "clara" },
});

// Los logos cuya URL ya murio. Cae al nombre en texto en lugar de dejar el icono
// gris de imagen rota en la portada.
const rotos = reactive({});

const lista = computed(() => normalizaClientes(props.clientes));
const anima = computed(() => debeAnimar(lista.value.length));
const duracion = computed(() => duracionSegundos(lista.value.length));

// La lista repetida las veces que pide el util. La marquesina recorre -50%, asi
// que las dos mitades tienen que ser iguales.
const pista = computed(() =>
  Array.from({ length: repeticiones(lista.value.length) }, () => lista.value).flat()
);
</script>

<style lang="scss" scoped>
.mc-logos {
  padding: 40px 0;
  overflow: hidden;
}

.mc-logos__titulo {
  margin: 0 0 20px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.mc-logos__ventana {
  overflow: hidden;
  // Los logos se desvanecen en las orillas en vez de cortarse a la mitad.
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
}

.mc-logos__pista {
  display: flex;
  width: max-content;
  margin: 0 auto; // centra la pista cuando es mas angosta que la pantalla
  padding: 0;
  list-style: none;
}

// El hueco va como margen del cuadro, NO como `gap`: con gap, el 50% de la pista
// no coincide con el ancho de una mitad -sobra media separacion- y el bucle da un
// brinco visible en cada vuelta.
.mc-logos__item {
  margin-right: 16px;
}

.mc-logos__pista--anima {
  animation: mc-logos-scroll var(--mc-logos-duracion, 40s) linear infinite;

  &:hover {
    animation-play-state: paused;
  }
}

@keyframes mc-logos-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

// Quien pidio menos movimiento en su sistema no deberia encontrarse una tira
// desplazandose sola: se convierte en una fila que se arrastra con el dedo.
@media (prefers-reduced-motion: reduce) {
  .mc-logos__pista--anima {
    animation: none;
  }

  .mc-logos__ventana {
    overflow-x: auto;
  }
}

.mc-logos__cuadro {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 150px;
  height: 88px;
  padding: 14px;
  border-radius: 14px;
  text-decoration: none;
  transition: transform 0.2s ease;

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  &:hover {
    transform: translateY(-2px);
  }
}

.mc-logos__nombre {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
}

.mc-logos--clara {
  background: var(--color-surface-variant);

  .mc-logos__titulo { color: var(--color-text-tertiary); }

  .mc-logos__cuadro {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
  }

  .mc-logos__nombre { color: var(--color-text-secondary); }
}

.mc-logos--oscura {
  .mc-logos__titulo { color: rgba(255, 255, 255, 0.55); }

  .mc-logos__cuadro {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .mc-logos__nombre { color: #fff; }
}

@media (max-width: 599px) {
  .mc-logos__cuadro {
    width: 116px;
    height: 70px;
    padding: 10px;
  }
}
</style>
```

- [ ] **Step 4: Correr y verificar que pasa**

```
npx vitest run tests/components/LogosClientes.test.js
```

Esperado: PASS, las 10.

- [ ] **Step 5: Commit**

```bash
git add src/components/LogosClientes.vue tests/components/LogosClientes.test.js
git commit -m "Componente de la tira de logos, en variante clara y oscura"
```

---

## Task 4: Conectarlo a la portada

**Repo:** `c:\laragon\www\delivery-food`

**Files:**
- Modify: `src/pages/MainPage.vue`
  - import del componente (junto al de `EmailCheckoutDialog`, ~línea 618)
  - carga de los clientes y `onMounted` (~línea 763)
  - instancia del hero: después del cierre de `.banner` (línea 52), antes de `<div class="options">` (línea 54)
  - instancia del footer: dentro de `<footer>` (línea 544), antes de `<div class="container">` (línea 545)

- [ ] **Step 1: Importar el componente**

En `<script setup>`, junto al import de `EmailCheckoutDialog`:

```js
import LogosClientes from "src/components/LogosClientes.vue";
```

- [ ] **Step 2: Cargar los clientes**

Debajo de la función `loadPackages`, agregar:

```js
// Los negocios que ya pagan, para las dos tiras de logos. Un solo fetch: las dos
// instancias reciben el mismo arreglo, porque pedirle dos veces lo mismo al
// servidor en la misma visita no le sirve a nadie.
const clientes = ref([]);

const loadClientes = async () => {
  try {
    const { data } = await api.get("/clients");
    clientes.value = data.clients || [];
  } catch (e) {
    // Sin respaldo hardcodeado, a diferencia de loadPackages. Los planes son
    // nuestros y se pueden escribir a mano; los clientes no: inventar logos en
    // una seccion que dice "estos ya nos usan" es exactamente lo que se nota.
    clientes.value = [];
  }
};
```

Y cambiar el `onMounted` (línea 763):

```js
onMounted(() => { resetTheme(); loadPackages(); loadClientes(); });
```

- [ ] **Step 3: Poner la tira del hero**

En el `<template>`, entre el `</div>` que cierra `.banner` y `<div class="options">`:

```html
    <logos-clientes
      :clientes="clientes"
      titulo="Negocios que ya usan ComeleYa"
      variante="clara"
    />

    <div class="options">
```

- [ ] **Step 4: Poner la tira del footer**

Dentro de `<footer>`, como primer hijo, antes de `<div class="container">`:

```html
    <footer>
      <logos-clientes
        :clientes="clientes"
        titulo="Ellos ya venden con ComeleYa"
        variante="oscura"
      />
      <div class="container">
```

- [ ] **Step 5: Verificar que el lint pasa**

```
npm run lint
```

Esperado: sin errores nuevos.

- [ ] **Step 6: Correr toda la suite**

```
npm run test:run
```

Esperado: PASS, incluyendo las pruebas de los Tasks 2 y 3.

- [ ] **Step 7: Commit**

```bash
git add src/pages/MainPage.vue
git commit -m "La portada muestra los negocios que ya pagan, bajo el hero y en el footer"
```

---

## Task 5: Verificación a mano

**Files:** ninguno — es revisión en el navegador.

- [ ] **Step 1: Levantar el front**

```
npm run dev
```

Abrir `http://localhost:9000/`.

**Recordatorio:** el dev apunta a la base local, donde el filtro devuelve **1 negocio** (Kazuki Sushi). Con uno solo la tira debe verse **quieta y centrada**, con un cuadro. Eso es lo correcto, no una falla.

- [ ] **Step 2: Revisar lo que se ve**

En las dos tiras:

- La del hero sobre fondo gris claro y la del footer sobre el fondo oscuro; en las dos se leen los logos.
- Al hacer clic en un logo se abre `/{slug}` en pestaña nueva y carga el menú de ese negocio.
- Los cuadros no deforman el logo: uno ancho y uno cuadrado se ven completos.
- En 375px de ancho (DevTools) los cuadros se encogen y la página no se sale a lo ancho.

- [ ] **Step 3: Probar con lista larga**

Sin tocar la base: en `loadClientes`, sustituir temporalmente la asignación por

```js
clientes.value = Array.from({ length: 12 }, (_, i) => ({
  name: `Negocio ${i}`,
  slug: "kazuki-sushi-delivery",
  logo: i % 4 === 0 ? null : "https://www.fiestastarted.com/comeleya/restaurante/logo/433.jpeg",
}));
```

y confirmar que:

- La tira se desliza sin brincos al dar la vuelta (mirar la costura durante dos vueltas completas).
- Al pasar el mouse encima se detiene.
- Los que van sin logo salen con su nombre y no rompen la altura de la fila.

Después **deshacer el cambio temporal** y confirmar que el archivo quedó como en el commit del Task 4 (`git diff src/pages/MainPage.vue` sin salida).

- [ ] **Step 4: Contar los clientes reales de producción**

Antes de desplegar, confirmar cuántos negocios cumplen el filtro en producción. Si son 3 o menos, la tira se verá como una fila corta y centrada; decidir con el usuario si vale la pena publicarla así o esperar a tener más.

---

## Despliegue

Cambian los dos repos, así que van los dos:

```
.\deploy.ps1 back 9999
.\deploy.ps1 front
```

Y en producción, después del back:

```
php artisan config:clear
```

No hay migración: la ruta nueva solo lee tablas que ya existen.
