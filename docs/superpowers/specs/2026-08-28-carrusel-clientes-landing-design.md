# Carrusel de clientes en la landing

**Fecha:** 2026-08-28
**Estado:** aprobado, pendiente de plan de implementación

## Problema

La landing no muestra ni un solo negocio real. La prueba social que hay hoy son
cuatro números abstractos (`0%`, `15 días`, `20+`, `15 min`) en
`src/pages/MainPage.vue:181`. Un restaurantero que llega a la portada no tiene
forma de confirmar que alguien más ya está usando esto.

Referencia que pidió el usuario (qr-corp.com): una tira de logos deslizándose
bajo el hero con el rótulo "EMPRESAS QUE YA TIENEN SU QR NEGOCIO", y la misma
tira repetida arriba del footer.

## Qué se construye

El mismo carrusel de logos, instanciado **dos veces** en la landing:

| Instancia | Ubicación | Título | Fondo |
|---|---|---|---|
| Hero | Entre `.banner` y `.options` | `NEGOCIOS QUE YA USAN COMELEYA` | claro |
| Footer | Arriba de las columnas del `<footer>` actual | `Ellos ya venden con ComeleYa` | oscuro |

Los logos son los que los establecimientos **ya tienen cargados** en la base. No
hay assets nuevos en el repo, no hay logos de empresas externas.

Cada logo es un cuadro redondeado, se desliza en bucle infinito, se pausa al
pasar el mouse, y al hacer clic abre `/{slug}` en pestaña nueva. Degradado en
las orillas para que los logos se desvanezcan en vez de cortarse.

## Criterio: quién aparece

`status = 'Activo'` **+** suscripción activa (`status = 'active'` y
`end_date > now()`).

Es exactamente `Establishment::activeSubscription()`, que ya existe en
`app/Models/Establishment.php:433`.

**Riesgo conocido, aceptado por el usuario:** en la base local ese filtro
devuelve **1 negocio de 367 activos**. Si en producción el número es parecido,
la sección se esconde sola o se ve pobre. Es un problema del dato, no del
código. Verificar en producción antes de desplegar.

## Backend (`comeleya-laravel`)

Ruta pública nueva en `routes/api.php`, junto a `packages` y `sitemap`:

```
GET /clients  →  { "clients": [{ "name", "slug", "logo" }] }
```

Decisiones:

- **Solo tres campos.** Mismo criterio que `/sitemap`: mandar el
  establecimiento completo para pintar un logo son 43 platillos con extras y
  horarios por negocio, para usar tres columnas.
- **Cacheada 10 minutos** + header `Cache-Control`. Es un `whereHas` sobre
  suscripciones que se dispara en **cada** carga de la portada; sin caché cada
  curioso que hace scroll le pega a la base.
- **Orden:** suscripción más reciente primero, para que un cliente nuevo se vea
  a sí mismo pronto.
- Pública y sin auth, como `/packages`. No expone nada que el menú público no
  exponga ya.

## Frontend

**Componente nuevo:** `src/components/LogosClientes.vue`

Props:

| Prop | Tipo | Para qué |
|---|---|---|
| `clientes` | Array | `[{ name, slug, logo }]` |
| `titulo` | String | El rótulo de arriba |
| `variante` | `'clara' \| 'oscura'` | Colores según el fondo donde vive |

Un solo componente instanciado dos veces: la lógica de marquesina no se escribe
dos veces.

**`MainPage.vue`:** un solo `GET /clients` en `onMounted` (junto al de
`packages`), y el mismo arreglo se pasa a las dos instancias. Dos fetches para
la misma lista sería pedirle lo mismo al servidor dos veces por visita.

**Animación:** CSS puro. La pista se duplica y se recorre `-50%` con
`@keyframes`; sin librerías. Respeta `prefers-reduced-motion`: si el usuario
pidió menos movimiento, se convierte en una fila con scroll horizontal manual.

## Casos borde

| Caso | Comportamiento |
|---|---|
| Cero clientes, o el fetch falla | No se pinta nada, ni el título. **Sin respaldo hardcodeado**: un carrusel de clientes inventados es justo lo que se nota. |
| Menos de 6 clientes | La pista se repite las veces necesarias para llenar el ancho. |
| 3 o menos | Se queda quieta y centrada. Dos logos dando vueltas se ven peor que dos logos quietos. |
| Cliente sin logo | Cuadro con su nombre en texto. Cumple el criterio sin dejar huecos. |
| Logo con URL muerta | `@error` lo cambia por el nombre en texto, igual que a quien nunca subió logo. Quitar el cuadro movería toda la fila a media vuelta. |

## Fuera de alcance

- Sección en el super-admin.
- Flag para curar manualmente quién aparece.
- Cambios al nav de `PageLayout.vue`.
- Logos de empresas del grupo (Medios Corp y hermanas). Se descartó: el usuario
  aclaró que "las empresas" son los negocios que pagan ComeleYa.

## Pruebas

Hoy `tests/` cubre stores, utils, composables y router, y ninguna prueba de
componente — pero la herramienta ya está instalada y configurada
(`@vue/test-utils`, `vitest.config.mjs` con `jsdom` y el plugin de Vue). No hay
nada que montar.

- **Backend:** prueba de feature en `tests/Feature/Public/`, junto a las demás
  rutas públicas. Lo que se prueba es **quién entra**: el vencido, el cancelado,
  el dado de baja y el que nunca pagó se quedan fuera, y la respuesta no lleva
  más que tres campos.
- **Util:** pruebas puras, como `tests/utils/cartBarCta.test.js`.
- **Componente:** montado con `mount()`. Lo importante es que con lista vacía no
  pinte ni el título, y que un cliente sin logo caiga al nombre.

A mano en `npm run dev` queda solo lo que las pruebas no pueden ver: que el
bucle no dé un brinco en la costura y que los logos no se deformen.
