import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Ninguna tabla del panel llega a un celular.
 *
 * Reportado con una foto: el listado de establecimientos en un iPhone se veia
 * "oneless Pizza" -el nombre cortado- porque la tabla se arrastraba de lado y la
 * primera columna, la que dice de que renglon estamos hablando, quedaba fuera.
 *
 * El primer intento apilo la tabla con CSS y quedo peor: apilar nueve columnas
 * sigue siendo una tabla, nueve renglones y nueve encabezados para leer un nombre.
 * Lo que este producto hace en celular es otra cosa -un renglon por registro, con
 * iniciales, nombre, una linea de contexto y las acciones en la hoja de abajo- y
 * eso es lo que esta prueba protege.
 *
 * No mide pixeles. Fija dos reglas, y la tabla que se agregue manana tambien las
 * tiene que cumplir:
 *
 *   1. Ninguna q-table se pinta abajo de 1024 px.
 *   2. Quien esconde una tabla ofrece algo en su lugar.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const ADMIN = resolve(AQUI, "../../src/components/admin");

function vuesDelPanel(dir = ADMIN, salida = []) {
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) vuesDelPanel(ruta, salida);
    else if (nombre.endsWith(".vue")) salida.push(ruta);
  }
  return salida;
}

const conTabla = vuesDelPanel()
  .map((ruta) => ({ ruta, nombre: basename(ruta), src: readFileSync(ruta, "utf8") }))
  .filter((t) => t.src.includes("<q-table"));

describe("las tablas del panel en celular", () => {
  it("hay tablas que revisar", () => {
    // Si alguien mueve la carpeta, esta prueba no puede pasar por estar vacia.
    expect(conTabla.length).toBeGreaterThan(10);
  });

  describe.each(conTabla)("$nombre", ({ src }) => {
    const tablas = [...src.matchAll(/<q-table\b[^>]*>/gs)].map((m) => m[0]);

    // `modoApp` es < 1024 px (src/composables/useModoApp.js). Una q-table sin ese
    // candado se pinta en el celular, y ahi no hay ancho: se arrastra de lado.
    it("ninguna q-table se pinta en celular", () => {
      const sinCandado = tablas.filter((t) => !t.includes("!modoApp"));
      expect(sinCandado).toEqual([]);
    });

    // Esconder la tabla sin poner nada en su lugar deja la seccion en blanco, que
    // es peor que arrastrarla de lado.
    it("ofrece algo en su lugar", () => {
      // `v-if="modoApp"`, `v-if="modoApp && ..."`, `v-if="view === 'list' && modoApp"`.
      const sinNegar = src.replace(/!modoApp/g, "NEGADO");
      const hayRamaMovil = /v-if="[^"]*\bmodoApp\b[^"]*"/.test(sinNegar);

      expect(hayRamaMovil).toBe(true);
    });
  });
});
