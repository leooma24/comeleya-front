import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { setActivePinia, createPinia } from "pinia";
import { api } from "boot/axios";
import { useMainStore } from "stores/main-store";
import { useAdminStore } from "stores/admin-store";
import { agotadoEn, MATRIZ } from "src/utils/sucursales.js";

/**
 * Lo que se acaba en UNA cocina.
 *
 * Agotar un platillo siempre fue de todo el negocio, que es lo único que existe cuando
 * hay un solo local. Con sucursales eso deja de ser cierto: en Centro se acabó el salmón
 * y en Norte todavía hay, y quien está pidiendo de Norte tiene que poder pedirlo.
 *
 * El menú se marca según el local elegido; si el cliente se cambia de sucursal en el
 * checkout se le avisa ahí, antes de mandar, y no con un error del servidor.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const leer = (ruta) => readFileSync(resolve(AQUI, "../..", ruta), "utf8");

const SALMON = { id: 1, name: "Salmón Roll", price: 200, is_sold_out: false };
const RAMEN = { id: 2, name: "Ramen", price: 150, is_sold_out: false };

describe("agotadoEn", () => {
  it("el agotado de todo el negocio manda en todos los locales", () => {
    const p = { ...SALMON, is_sold_out: true, locales_agotados: [] };
    expect(agotadoEn(p, "7")).toBe(true);
    expect(agotadoEn(p, null)).toBe(true);
  });

  it("el de un local solo pega en ese local", () => {
    const p = { ...SALMON, locales_agotados: ["7"] };
    expect(agotadoEn(p, "7")).toBe(true);
    expect(agotadoEn(p, "2")).toBe(false);
    expect(agotadoEn(p, MATRIZ)).toBe(false);
  });

  it("sin local -un negocio de un solo local- solo cuenta el de todo el negocio", () => {
    expect(agotadoEn({ ...SALMON, locales_agotados: ["7"] }, null)).toBe(false);
  });

  it("compara ids como texto: el servidor los manda así y el menú los trae número", () => {
    expect(agotadoEn({ ...SALMON, locales_agotados: ["7"] }, 7)).toBe(true);
  });
});

describe("el menú del cliente", () => {
  let store;

  const conSucursales = () => {
    store.companyStore.company = {
      coordinates: "25.79,-108.98",
      active_branches: [
        { id: 7, name: "Centro", coordinates: "25.79,-108.98" },
        { id: 2, name: "Norte", coordinates: "25.84,-108.98" },
      ],
    };
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useMainStore();
    store.companyStore.company = { coordinates: "25.79,-108.98" };
    store.productStore.items = [
      { ...SALMON, locales_agotados: ["7"] },
      { ...RAMEN, locales_agotados: [] },
    ];
  });

  it("en un negocio de un solo local nada cambia", () => {
    expect(store.localDelCliente).toBeNull();
    expect(store.estaAgotado(store.productStore.items[0])).toBe(false);
    expect(store.faltanEnElLocal).toEqual([]);
  });

  it("marca agotado según el local elegido", () => {
    conSucursales();
    store.elegirSucursal(7);
    expect(store.localDelCliente).toBe("7");
    expect(store.estaAgotado(store.productStore.items[0])).toBe(true);
    expect(store.estaAgotado(store.productStore.items[1])).toBe(false);

    store.elegirSucursal(2);
    expect(store.estaAgotado(store.productStore.items[0])).toBe(false);
  });

  it("sin elegir nada, el local es la Matriz", () => {
    conSucursales();
    expect(store.localDelCliente).toBe(MATRIZ);
  });

  it("no deja abrir la ficha de lo que no hay en ese local", () => {
    conSucursales();
    store.elegirSucursal(7);
    store.seeProduct({ ...store.productStore.items[0] });
    expect(store.addCartDrawer).toBe(false);

    store.elegirSucursal(2);
    store.seeProduct({ ...store.productStore.items[0] });
    expect(store.addCartDrawer).toBe(true);
  });

  it("al cambiar de sucursal avisa lo que ya no hay en el carrito", () => {
    conSucursales();
    store.cartStore.cart = [{ ...SALMON, qty: 1 }];

    store.elegirSucursal(2);
    expect(store.faltanEnElLocal).toEqual([]);

    store.elegirSucursal(7);
    expect(store.faltanEnElLocal).toEqual(["Salmón Roll"]);
  });

  it("lo mira en el menú y no en el carrito, que se guarda entre visitas", () => {
    conSucursales();
    store.elegirSucursal(7);
    // El carrito guardado trae el platillo como estaba ayer: disponible.
    store.cartStore.cart = [{ ...SALMON, locales_agotados: [], qty: 1 }];

    expect(store.faltanEnElLocal).toEqual(["Salmón Roll"]);
  });

  it("no se puede mandar el pedido con algo que esa cocina no tiene", () => {
    const src = leer("src/components/client/PaymentDrawer.vue");
    expect(src).toMatch(/:disable="sendingOrder \|\| mainStore\.faltanEnElLocal\.length > 0"/);
    expect(src).toMatch(/v-if="mainStore\.faltanEnElLocal\.length"/);
  });

  it("las tarjetas del menú preguntan por el local, no por el platillo", () => {
    for (const ruta of ["src/components/client/CardDish.vue", "src/components/client/ListDish.vue"]) {
      const src = leer(ruta);
      expect(src).not.toMatch(/item\.is_sold_out/);
      expect(src).toMatch(/agotado/);
    }
    expect(leer("src/composables/useDish.js")).toMatch(/mainStore\.estaAgotado\(item\.value\)/);
  });
});

describe("el panel", () => {
  let store;

  const negocio = {
    name: "Kazuki",
    active_branches: [
      { id: 7, name: "Centro" },
      { id: 2, name: "Norte" },
    ],
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    store = useAdminStore();
    store.companyStore.company = { ...negocio };
    store.userStore.user = {
      name: "Ana",
      role: "Usuario",
      establishments: [{ id: 1, slug: "kazuki", pivot: { role: "propietario" } }],
    };
    store.slug = "kazuki";
    store.products = [{ ...SALMON, locales_agotados: [] }, { ...RAMEN, locales_agotados: [] }];
  });

  it("marca agotado en un local sin apagarlo en los demás", async () => {
    api.put.mockResolvedValue({
      data: { is_sold_out: false, locales_agotados: ["7"], local: "7" },
    });

    await store.toggleSoldOut(store.products[0], "7");

    expect(api.put).toHaveBeenCalledWith("/admin/kazuki/1/sold-out", { local: "7" });
    expect(store.products[0].is_sold_out).toBe(false);
    expect(store.products[0].locales_agotados).toEqual(["7"]);
  });

  it("sin local sigue siendo de todo el negocio", async () => {
    api.put.mockResolvedValue({
      data: { is_sold_out: true, locales_agotados: [], local: null },
    });

    await store.toggleSoldOut(store.products[0]);

    expect(api.put).toHaveBeenCalledWith("/admin/kazuki/1/sold-out", {});
    expect(store.products[0].is_sold_out).toBe(true);
    // El servidor borra los de cada local: ya no dicen nada.
    expect(store.products[0].locales_agotados).toEqual([]);
  });

  it("la lista de agotados se pide del local que se está viendo", async () => {
    api.get.mockResolvedValue({ data: { local: { valor: "7", nombre: "Centro" }, platillos: [] } });
    store.localVisto = "7";

    const data = await store.cargarAgotados();

    expect(api.get).toHaveBeenCalledWith("/admin/kazuki/agotados", { params: { local: "7" } });
    expect(data.local.nombre).toBe("Centro");
  });

  it("los locales para elegir son la Matriz y las sucursales, sin el 'todos'", () => {
    expect(store.locales).toEqual([
      { value: MATRIZ, label: "Matriz" },
      { value: "7", label: "Centro" },
      { value: "2", label: "Norte" },
    ]);
  });

  it("la cajera llega a los agotados desde Pedidos, y solo con un local a la vista", () => {
    const src = leer("src/components/admin/Orders.vue");
    expect(src).toMatch(/<agotados-dialog v-model="agotadosAbierto" \/>/);
    // Las dos puertas -escritorio y celular- piden el mismo local en vista.
    expect(src.match(/agotadosAbierto = true/g)).toHaveLength(2);
  });

  it("el diálogo manda el local, no deja que el servidor decida por su cuenta", () => {
    const src = leer("src/components/admin/AgotadosDialog.vue");
    expect(src).toMatch(/toggleSoldOut\(p, local\.value\?\.valor \?\? null\)/);
    // Lo apagado en todo el negocio no se destapa desde aquí.
    expect(src).toMatch(/:disable="p\.en_todos/);
  });
});
