import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { resolve, dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Ninguna tabla del panel se lee de lado en un celular.
 *
 * Reportado con una foto: el listado de establecimientos en un iPhone se veia
 * "oneless Pizza" -el nombre cortado- porque la tabla se arrastraba de lado y la
 * primera columna, la que dice de que renglon estamos hablando, quedaba fuera.
 *
 * Esta prueba no mide pixeles: fija la REGLA. Cada tabla del panel tiene que estar
 * resuelta de una de tres formas, y la que se agregue manana tambien.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const ADMIN = resolve(AQUI, "../../src/components/admin");

/**
 * Estas no pasan por la regla porque ya tienen algo mejor: una lista de celular
 * hecha a mano, con `v-if="modoApp"`, y la tabla escondida abajo de 1024. Estan
 * escritas aqui a proposito y no detectadas solas: si alguna pierde su lista, la
 * prueba tiene que empezar a fallar en vez de perdonarla.
 */
const CON_LISTA_PROPIA = ["Dashboard.vue"];

function vuesDelPanel(dir = ADMIN, salida = []) {
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) vuesDelPanel(ruta, salida);
    else if (nombre.endsWith(".vue")) salida.push(ruta);
  }
  return salida;
}

/** name -> label, leyendo los objetos de columna del <script>. */
function etiquetasDeColumna(src) {
  const mapa = {};
  for (const m of src.matchAll(/name\s*:\s*["']([\w.-]+)["']/g)) {
    const abre = src.lastIndexOf("{", m.index);
    if (abre < 0) continue;
    let i = abre;
    let prof = 0;
    while (i < src.length) {
      if (src[i] === "{") prof++;
      else if (src[i] === "}" && --prof === 0) break;
      i++;
    }
    const label = /label\s*:\s*["']([^"']*)["']/.exec(src.slice(abre, i + 1));
    if (label && mapa[m[1]] === undefined) mapa[m[1]] = label[1];
  }
  return mapa;
}

const tablas = vuesDelPanel()
  .map((ruta) => ({ ruta, nombre: basename(ruta), src: readFileSync(ruta, "utf8") }))
  .filter((t) => t.src.includes("<q-table"))
  .filter((t) => !CON_LISTA_PROPIA.includes(t.nombre));

describe("las tablas del panel en celular", () => {
  it("hay tablas que revisar", () => {
    // Si alguien mueve la carpeta, esta prueba no puede pasar por estar vacia.
    expect(tablas.length).toBeGreaterThan(5);
  });

  describe.each(tablas)("$nombre", ({ src }) => {
    const apilada = src.includes("mc-tabla-apilada");
    const enGrid = /<q-table\b[^>]*:grid=/s.test(src);
    const tieneBody = /(v-slot:|#)body[="\s]/.test(src);
    const tieneItem = /(v-slot:|#)item[="\s]/.test(src);

    it("no se arrastra de lado: o se apila, o va en tarjetas", () => {
      expect(apilada || enGrid).toBe(true);
    });

    // El modo `grid` de Quasar NO usa el slot `body`: pinta su tarjeta por defecto.
    // Una tabla que dibuja sus celdas a mano -avatares, chips, botones- y prende
    // grid sin dar un slot `item` pierde todo eso justo en el celular, que es
    // donde se supone que estamos arreglando algo. Paso de verdad en Users,
    // Packages y Subscriptions.
    it("no prende grid si eso le tira las celdas que dibuja a mano", () => {
      if (enGrid && tieneBody) expect(tieneItem).toBe(true);
    });

    // Apilada, cada celda se lee sola: sin encabezados arriba, un valor suelto no
    // dice de que columna es. La etiqueta sale de data-label.
    it("apilada, cada celda con columna nombrada trae su etiqueta", () => {
      if (!apilada) return;

      const etiquetas = etiquetasDeColumna(src);
      const sinEtiqueta = [];

      for (const td of src.matchAll(/<q-td\b[^>]*?>/gs)) {
        const key = /(?<!:)key="([^"]+)"/.exec(td[0]);
        if (!key) continue;
        const label = etiquetas[key[1]];
        // Columna sin encabezado (el logo, la de acciones): no lleva etiqueta.
        if (!label || !label.trim()) continue;
        if (!td[0].includes("data-label")) sinEtiqueta.push(key[1]);
      }

      expect(sinEtiqueta).toEqual([]);
    });
  });
});
