import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Toda seccion del panel se puede abrir desde la computadora.
 *
 * El celular llega a las secciones por la pestaña "Más" (Mas.vue) y la computadora
 * por la barra de AdminLayout. Son dos listas escritas a mano, y dos veces una
 * seccion quedo solo en la del celular: primero "Comparte tu menu", despues
 * Sucursales -lo que se vende en el paquete Premium-. En los dos casos la pantalla
 * existia y funcionaba; desde la computadora no habia forma de entrar.
 *
 * Fija dos reglas, y la seccion que se agregue mañana tambien las tiene que cumplir:
 *
 *   1. Lo que se abre desde "Más" tambien se abre desde la barra de escritorio.
 *   2. Cada `feature:` de la barra tiene su renglon en el mapa de hasFeature. Sin el,
 *      `pkg[undefined]` da falso y la entrada queda escondida para todos, incluso
 *      para quien pago por ella.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const leer = (ruta) => readFileSync(resolve(AQUI, "../..", ruta), "utf8");

const mas = leer("src/components/admin/Mas.vue");
const layout = leer("src/layouts/AdminLayout.vue");

// Filas de "Más" que no abren una seccion propia sino una vista de otra: el
// Historial es una pestaña dentro de Pedidos (ver abrir() en Mas.vue).
const DENTRO_DE = { pedidos_historial: "pedidos_pendientes" };

const tabsDeMas = [...mas.matchAll(/\btab:\s*"([a-z_]+)"/g)].map((m) => m[1]);
const tabsDeEscritorio = [...layout.matchAll(/\bname:\s*"([a-z_]+)"/g)].map((m) => m[1]);

const mapaDeFunciones = layout.match(/const map = \{([^}]*)\}/)?.[1] ?? "";
const funcionesConMapa = [...mapaDeFunciones.matchAll(/(\w+):/g)].map((m) => m[1]);
const funcionesDeLaBarra = [
  ...new Set([...layout.matchAll(/\bfeature:\s*"([a-z_]+)"/g)].map((m) => m[1])),
];

describe("las secciones del panel desde la computadora", () => {
  it("hay secciones que revisar", () => {
    // Si alguien renombra las listas, esta prueba no puede pasar por estar vacia.
    expect(tabsDeMas.length).toBeGreaterThan(10);
    expect(tabsDeEscritorio.length).toBeGreaterThan(10);
    expect(funcionesConMapa.length).toBeGreaterThan(5);
  });

  it.each(tabsDeMas)("%s tambien se abre desde la barra de escritorio", (tab) => {
    expect(tabsDeEscritorio).toContain(DENTRO_DE[tab] ?? tab);
  });

  it("cada funcion de la barra sabe que columna del paquete revisar", () => {
    const sinMapa = funcionesDeLaBarra.filter((f) => !funcionesConMapa.includes(f));
    expect(sinMapa).toEqual([]);
  });
});
