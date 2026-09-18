import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { setActivePinia, createPinia } from "pinia";
import { api } from "boot/axios";
import { useMainStore } from "stores/main-store";
import { useAdminStore } from "stores/admin-store";

/**
 * El horario de cada local.
 *
 * Hasta ahora el horario era del negocio entero: si Centro cierra a las 10 y Norte a
 * la 1, el menú decía lo mismo para los dos. La regla es herencia: una sucursal sin
 * horario propio usa el del negocio, y quien resuelve eso es el servidor, que manda el
 * `is_open` de cada local ya calculado.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const leer = (ruta) => readFileSync(resolve(AQUI, "../..", ruta), "utf8");

const HORARIO_NEGOCIO = [
  { id: 1, day_of_week: "martes", open_time: "08:00", close_time: "17:00", is_closed: false },
];
const HORARIO_NORTE = [
  { id: 9, day_of_week: "martes", open_time: "12:00", close_time: "23:00", is_closed: false },
];

describe("el menú del cliente", () => {
  let store;

  const conSucursales = ({ negocioAbierto = false } = {}) => {
    store.companyStore.company = {
      coordinates: "25.79,-108.98",
      isOpen: negocioAbierto,
      hours: HORARIO_NEGOCIO,
      active_branches: [
        { id: 7, name: "Centro", coordinates: "25.79,-108.98", is_open: false, hours: [] },
        { id: 2, name: "Norte", coordinates: "25.84,-108.98", is_open: true, hours: HORARIO_NORTE },
      ],
    };
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useMainStore();
    store.companyStore.company = { isOpen: true, hours: HORARIO_NEGOCIO };
  });

  it("en un negocio de un solo local sigue mandando el del negocio", () => {
    expect(store.estaAbierto).toBe(true);
    expect(store.getHours).toEqual(HORARIO_NEGOCIO);

    store.companyStore.company.isOpen = false;
    expect(store.estaAbierto).toBe(false);
  });

  it("con sucursales, abierto o cerrado es del local elegido", () => {
    conSucursales();

    store.elegirSucursal(2);
    expect(store.estaAbierto).toBe(true);

    store.elegirSucursal(7);
    expect(store.estaAbierto).toBe(false);
  });

  it("la Matriz usa el del negocio", () => {
    conSucursales({ negocioAbierto: true });

    store.elegirSucursal("matriz");
    expect(store.estaAbierto).toBe(true);

    store.companyStore.company.isOpen = false;
    store.elegirSucursal("matriz");
    expect(store.estaAbierto).toBe(false);
  });

  it("enseña el horario propio de la sucursal, y el del negocio cuando lo hereda", () => {
    conSucursales();

    store.elegirSucursal(2);
    expect(store.getHours).toEqual(HORARIO_NORTE);

    // Centro no capturó el suyo: hereda.
    store.elegirSucursal(7);
    expect(store.getHours).toEqual(HORARIO_NEGOCIO);
  });

  it("no deja agregar al carrito con el local cerrado, y lo dice por su nombre", () => {
    conSucursales();
    store.elegirSucursal(7);
    store.productStore.product = { id: 1, name: "Sushi", is_sold_out: false, qty: 1 };

    store.addToCart();

    expect(store.cartStore.cart.length).toBe(0);
  });

  it("el menú pregunta por el local, no por el negocio", () => {
    for (const ruta of ["src/components/client/Sidebar.vue", "src/pages/IndexPage.vue"]) {
      const src = leer(ruta);
      expect(src).toMatch(/mainStore\.estaAbierto/);
      expect(src).not.toMatch(/mainStore\.company\.isOpen/);
    }
  });
});

describe("el panel", () => {
  let store;

  const negocio = {
    name: "Kazuki",
    hours: HORARIO_NEGOCIO,
    active_branches: [
      { id: 7, name: "Centro", hours: [] },
      { id: 2, name: "Norte", hours: HORARIO_NORTE },
    ],
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    store = useAdminStore();
    store.slug = "kazuki";
    store.companyStore.company = JSON.parse(JSON.stringify(negocio));
  });

  it("una sucursal sin horario propio arranca con una copia del negocio, sin los ids", () => {
    store.elegirLocalDelHorario("7");

    expect(store.horarioHeredado).toBe(true);
    const martes = store.companyStore.scheduleForm.find((d) => d.day_of_week === "martes");
    expect(martes.open_time).toBe("08:00");
    // Sin id: son renglones del negocio, y guardarlos como suyos no tocaría nada.
    expect(martes.id).toBeUndefined();
  });

  it("una sucursal con horario propio carga el suyo", () => {
    store.elegirLocalDelHorario("2");

    expect(store.horarioHeredado).toBe(false);
    const martes = store.companyStore.scheduleForm.find((d) => d.day_of_week === "martes");
    expect(martes.open_time).toBe("12:00");
    expect(martes.id).toBe(9);
  });

  it("guardar manda el local y deja el horario en esa sucursal", async () => {
    api.put.mockResolvedValue({ data: { local: "7", hours: HORARIO_NORTE } });
    store.elegirLocalDelHorario("7");

    await store.saveSchedule();

    expect(api.put).toHaveBeenCalledWith(
      "/admin/establishment/kazuki/schedule",
      expect.objectContaining({ local: "7" })
    );
    expect(store.sucursalDelHorario.hours).toEqual(HORARIO_NORTE);
    // El del negocio no se toca.
    expect(store.companyStore.company.hours).toEqual(HORARIO_NEGOCIO);
  });

  it("sin local elegido guarda el del negocio, como siempre", async () => {
    api.put.mockResolvedValue({ data: { hours: HORARIO_NEGOCIO } });
    store.elegirLocalDelHorario(null);

    await store.saveSchedule();

    expect(api.put).toHaveBeenCalledWith("/admin/establishment/kazuki/schedule", {
      hours: store.companyStore.scheduleForm,
    });
    expect(store.companyStore.company.hours).toEqual(HORARIO_NEGOCIO);
  });

  it("volver al horario del negocio borra el propio y recarga el heredado", async () => {
    api.put.mockResolvedValue({ data: { hours: [] } });
    store.elegirLocalDelHorario("2");

    await store.heredarHorarioDelNegocio();

    expect(api.put).toHaveBeenCalledWith("/admin/establishment/kazuki/schedule", {
      local: "2",
      heredar: true,
    });
    expect(store.sucursalDelHorario.hours).toEqual([]);
    expect(store.horarioHeredado).toBe(true);
    const martes = store.companyStore.scheduleForm.find((d) => d.day_of_week === "martes");
    expect(martes.open_time).toBe("08:00");
  });

  it("en un negocio de un solo local el selector no aparece", () => {
    const src = leer("src/components/admin/ScheduleDrawer.vue");
    expect(src).toMatch(/v-if="locales\.length > 1"/);
    expect(src).toMatch(/tieneSucursales\(negocio\)/);
  });
});
