import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * La cajera solo ve Pedidos, entre por donde entre al panel.
 *
 * El servidor le niega lo demas con 403. Esta prueba cuida la otra mitad: que ninguna de
 * las puertas por las que se llega a una seccion -la barra de escritorio, la de abajo en
 * el celular, el menu Mas y la pagina que pinta la seccion- deje de preguntar por el rol.
 * Una puerta que no pregunta le enseña a la cajera un boton que la manda a un error.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const leer = (ruta) => readFileSync(resolve(AQUI, "../..", ruta), "utf8");

const PUERTAS = [
  "src/layouts/AdminLayout.vue",
  "src/components/admin/movil/TabBar.vue",
  "src/components/admin/Mas.vue",
  "src/pages/AdminPage.vue",
];

describe("el panel de la cajera", () => {
  it.each(PUERTAS)("%s filtra las secciones por rol", (ruta) => {
    const src = leer(ruta);
    expect(src).toMatch(/from "src\/utils\/permisos"/);
    expect(src).toMatch(/puedeVerSeccion\(/);
  });

  it("no le pinta el asistente de ayuda, que lleva a secciones del dueño", () => {
    expect(leer("src/layouts/AdminLayout.vue")).toMatch(/<help-assistant v-if="[^"]*esCajero/);
  });

  it("no le pinta los avisos del dueño", () => {
    expect(leer("src/components/admin/Avisos.vue")).toMatch(/if \(adminStore\.esCajero\) return \[\];/);
  });

  it("no le enseña la exportacion, y la exportacion ya no abre una pestaña sin token", () => {
    const src = leer("src/components/admin/OrdersHistory.vue");
    expect(src).toMatch(/puedeExportarPedidos\(/);
    expect(src).not.toMatch(/window\.open\(/);
  });
});

describe("el local que se ve en Pedidos", () => {
  it("el selector es del dueño; la cajera solo ve el suyo", () => {
    const src = leer("src/components/admin/Orders.vue");
    expect(src).toMatch(/const puedeElegirLocal = computed\(\s*\(\) => !adminStore\.esCajero/);
    expect(src).toMatch(/<q-btn-dropdown\s+v-if="puedeElegirLocal"/);
  });

  // Si una de estas se armara aparte, la cajera de Centro veria en el Historial o en el
  // corte algo distinto de lo que ve en su pestaña.
  it.each([
    "src/components/admin/OrdersHistory.vue",
    "src/components/admin/CorteDeCaja.vue",
    "src/components/admin/Orders.vue",
    "src/composables/useOrderAlerts.js",
  ])("%s pide con el local que se esta viendo", (ruta) => {
    expect(leer(ruta)).toMatch(/adminStore\.paramsDeLocal/);
  });
});

describe("la pestaña Historial", () => {
  const src = leer("src/components/admin/Orders.vue");

  it("el v-else del historial se empareja con el template de !esHistorial", () => {
    // Si entre los dos queda otro elemento con v-if, Vue empareja el v-else con ese y la
    // pestaña sale en blanco. Asi estuvo, con el de la paginacion.
    expect(src).toMatch(/<\/template>\s*<orders-history v-else/);
  });

  it("la tarjeta de pedido de prueba sabe si el negocio ya vendio", () => {
    expect(src).toMatch(/const hayPedidosAlguna = /);
  });
});
