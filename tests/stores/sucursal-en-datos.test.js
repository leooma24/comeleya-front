import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { setActivePinia, createPinia } from "pinia";
import { useMainStore } from "stores/main-store";

/**
 * Elegir sucursal antes de que importe.
 *
 * El selector vivía solo en el paso de Pago, así que en "Datos" el comensal que elegía
 * "Recoger" leía la dirección del negocio —la de la Matriz— aunque su pedido saliera de
 * otra sucursal: llegaba al local equivocado. Ahora se elige en Datos, y la dirección y
 * el mapa son los de ESE local.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const leer = (ruta) => readFileSync(resolve(AQUI, "../..", ruta), "utf8");

describe("la dirección de recoger", () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useMainStore();
    store.companyStore.company = {
      coordinates: "25.79,-108.98",
      isOpen: true,
      address: { street: "Rio Presidio", exterior_number: "351", town: "Centro", city: "Los Mochis" },
      active_branches: [
        {
          id: 7,
          name: "Norte",
          coordinates: "25.84,-108.98",
          full_address: "Blvd Rosales 120, Norte, Los Mochis",
          is_open: true,
        },
      ],
    };
  });

  it("sin sucursales sigue siendo la del negocio", () => {
    store.companyStore.company.active_branches = [];

    expect(store.direccionDelLocalElegido).toBe(store.businessAddress);
    expect(store.mapaDelLocalElegido).toBe("25.79,-108.98");
  });

  it("con la sucursal elegida, es la suya", () => {
    store.elegirSucursal(7);

    expect(store.direccionDelLocalElegido).toBe("Blvd Rosales 120, Norte, Los Mochis");
    expect(store.mapaDelLocalElegido).toBe("25.84,-108.98");
  });

  it("con la Matriz elegida, la del negocio", () => {
    store.elegirSucursal("matriz");

    // La de la Matriz se arma con el mismo criterio que la de una sucursal
    // (direccionCompleta), que descarta los campos vacios. companyAddress, que es lo
    // que se usaba antes, todavia puede devolver "undefined" cuando la ficha del
    // negocio esta incompleta; por eso DataDrawer lo filtraba a mano.
    expect(store.direccionDelLocalElegido).toBe("Rio Presidio 351, Centro, Los Mochis");
    expect(store.mapaDelLocalElegido).toBe("25.79,-108.98");
  });
});

describe("el paso de Datos", () => {
  const src = leer("src/components/client/DataDrawer.vue");

  it("pregunta de qué sucursal, y solo cuando hay más de un local", () => {
    expect(src).toMatch(/¿De qué sucursal\?/);
    expect(src).toMatch(/v-if="mainStore\.sucursales\.length > 1"/);
  });

  it("dice en cuál recoge, no 'Dirección del Comercio' a secas", () => {
    expect(src).toMatch(/Recoges en \$\{mainStore\.sucursalElegida\.name\}/);
  });

  it("la dirección y el mapa salen del local elegido", () => {
    expect(src).toMatch(/mainStore\.direccionDelLocalElegido/);
    expect(src).toMatch(/coordenadas: mainStore\.mapaDelLocalElegido/);
    expect(src).not.toMatch(/const d = mainStore\.businessAddress/);
  });

  it("avisa cuando un local está cerrado o en pausa, sin esconderlo", () => {
    expect(src).toMatch(/Cerrado ahora/);
    expect(src).toMatch(/En pausa/);
  });
});

describe("el formulario de sucursales del panel", () => {
  const src = leer("src/components/admin/Sucursales.vue");

  it("el C.P. llena ciudad, estado y las colonias", () => {
    expect(src).toMatch(/\/towns\/\$\{cp\}\/all/);
    expect(src).toMatch(/forma\.value\.city = /);
    expect(src).toMatch(/forma\.value\.state = /);
  });

  it("una sola colonia se pone sin preguntar", () => {
    expect(src).toMatch(/if \(colonias\.value\.length === 1\) forma\.value\.town = colonias\.value\[0\]/);
  });

  it("un C.P. que no está en el catálogo no estorba: la colonia se escribe a mano", () => {
    expect(src).toMatch(/v-if="colonias\.length"/);
    expect(src).toMatch(/v-else class="col-6" v-model="forma\.town"/);
  });

  it("cambiar de sucursal no arrastra las colonias de la anterior", () => {
    const abrir = src.slice(src.indexOf("const nueva = "));
    expect(abrir).toMatch(/colonias\.value = \[\]/);
  });
});
