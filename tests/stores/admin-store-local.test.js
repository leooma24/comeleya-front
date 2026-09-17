import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAdminStore } from "stores/admin-store";
import { api } from "boot/axios";

/**
 * Que local se ve en Pedidos.
 *
 * El dueño elige y el aparato lo recuerda: la tableta de la cocina Centro se queda en
 * Centro. La cajera no elige: el servidor le aplica el suyo, y el panel solo lo dice.
 */

const negocio = {
  name: "Kazuki",
  active_branches: [
    { id: 2, name: "Norte" },
    { id: 7, name: "Centro" },
  ],
};

const sesion = (slug, role) => ({
  name: "Ana",
  role: "Usuario",
  establishments: [{ id: 1, slug, pivot: { role } }],
});

const respuesta = (extra = {}) => ({
  data: {
    establishment: { ...negocio },
    categories: [],
    features: [],
    types: [],
    counts: { 1: 3 },
    hay_pedidos: true,
    rol: "propietario",
    local: null,
    ...extra,
  },
});

describe("el dueño elige que local ver", () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
    store = useAdminStore();
    store.userStore.user = sesion("kazuki", "propietario");
    store.companyStore.company = { ...negocio };
  });

  it("lo recuerda en este aparato, uno por negocio", () => {
    store.setSlug("kazuki");
    store.elegirLocal("7");

    // Otro arranque del panel en el mismo aparato.
    setActivePinia(createPinia());
    const otra = useAdminStore();
    otra.userStore.user = sesion("kazuki", "propietario");
    otra.setSlug("kazuki");
    expect(otra.localVisto).toBe("7");

    otra.setSlug("bajamar");
    expect(otra.localVisto).toBeNull();
  });

  it("volver a todos borra lo guardado", () => {
    store.setSlug("kazuki");
    store.elegirLocal("matriz");
    store.elegirLocal(null);

    expect(localStorage.getItem("mc-local:kazuki")).toBeNull();
    expect(store.localEfectivo).toBeNull();
    expect(store.paramsDeLocal).toEqual({});
  });

  it("todas las peticiones de Pedidos llevan el local elegido", () => {
    store.setSlug("kazuki");
    store.elegirLocal(7);

    expect(store.localEfectivo).toBe("7");
    expect(store.paramsDeLocal).toEqual({ local: "7" });
    expect(store.nombreLocalVisto).toBe("Centro");
  });

  it("si la sucursal ya no existe ve todos, sin olvidar lo guardado", () => {
    localStorage.setItem("mc-local:kazuki", "9");
    store.setSlug("kazuki");

    expect(store.localEfectivo).toBeNull();
    expect(store.paramsDeLocal).toEqual({});
    // Si la vuelven a encender, la tableta regresa sola a ella.
    expect(localStorage.getItem("mc-local:kazuki")).toBe("9");
  });

  it("pide el negocio con el local, y guarda contadores y si ya vendio", async () => {
    store.setSlug("kazuki");
    store.elegirLocal("matriz");
    api.get.mockResolvedValueOnce(respuesta());

    await store.getEstablishment();

    expect(api.get).toHaveBeenCalledWith("/admin/establishment/kazuki", { params: { local: "matriz" } });
    expect(store.orderStore.counts).toEqual({ 1: 3 });
    expect(store.orderStore.hayPedidos).toBe(true);
    expect(store.localCajero).toBeNull();
  });

  it("recarga los contadores del local que ve", async () => {
    store.setSlug("kazuki");
    store.elegirLocal("2");
    store.orderStore.cambiarLocal("2");
    api.get.mockResolvedValueOnce({ data: { counts: { 1: 1 }, hay_pedidos: true, pendientes: [5] } });

    await store.recargarConteos();

    expect(api.get).toHaveBeenCalledWith("/admin/kazuki/orders/counts", { params: { local: "2" } });
    expect(store.orderStore.counts).toEqual({ 1: 1 });
  });
});

describe("la cajera no elige local", () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
    store = useAdminStore();
    store.userStore.user = sesion("kazuki", "cajero");
    store.companyStore.company = { ...negocio };
  });

  it("aunque el aparato tenga uno guardado, no lo manda: el suyo lo pone el servidor", () => {
    localStorage.setItem("mc-local:kazuki", "matriz");
    store.setSlug("kazuki");

    expect(store.localEfectivo).toBeNull();
    expect(store.paramsDeLocal).toEqual({});
  });

  it("guarda el local que le dice el servidor para enseñarlo", async () => {
    store.setSlug("kazuki");
    api.get.mockResolvedValueOnce(respuesta({ rol: "cajero", local: { valor: "7", nombre: "Centro" } }));

    await store.getEstablishment();

    expect(store.localCajero).toEqual({ valor: "7", nombre: "Centro" });
    expect(store.nombreLocalVisto).toBe("Centro");
  });

  it("cambiar de negocio olvida el local del anterior", () => {
    store.setSlug("kazuki");
    store.localCajero = { valor: "7", nombre: "Centro" };

    store.setSlug("otro");

    expect(store.localCajero).toBeNull();
  });
});

describe("pausar el local que se esta viendo", () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
    store = useAdminStore();
    store.userStore.user = sesion("kazuki", "propietario");
    store.companyStore.company = {
      ...negocio,
      matriz_pausada: false,
      active_branches: negocio.active_branches.map((s) => ({ ...s, orders_paused: false })),
    };
    store.setSlug("kazuki");
  });

  it("con todos los locales no hay un local en vista que pausar", () => {
    expect(store.localEnVista).toBeNull();
    expect(store.localEnVistaPausado).toBe(false);
  });

  it("el dueño que ve Centro puede pausar Centro", () => {
    store.elegirLocal("7");
    expect(store.localEnVista).toBe("7");
  });

  it("la cajera fija a una sucursal que ya no se ofrece no tiene boton", () => {
    store.userStore.user = sesion("kazuki", "cajero");
    store.localCajero = { valor: "9", nombre: "Apagada" };
    expect(store.localEnVista).toBeNull();

    store.localCajero = { valor: "7", nombre: "Centro" };
    expect(store.localEnVista).toBe("7");
  });

  it("pausar actualiza el negocio cargado sin recargarlo", async () => {
    store.elegirLocal("7");
    api.put.mockResolvedValueOnce({ data: { local: "7", pausado: true, message: "Local en pausa" } });

    expect(await store.pausarLocal("7", true)).toBe(true);

    expect(api.put).toHaveBeenCalledWith("/admin/kazuki/local/pausa", { local: "7", pausado: true });
    expect(store.localEnVistaPausado).toBe(true);
    expect(store.localesEnPausa).toEqual([{ valor: "7", nombre: "Centro" }]);

    api.put.mockResolvedValueOnce({ data: { local: "matriz", pausado: true, message: "Local en pausa" } });
    await store.pausarLocal("matriz", true);
    expect(store.localesEnPausa.map((l) => l.nombre)).toEqual(["Matriz", "Centro"]);
  });

  it("si el servidor lo niega, lo dice y no cambia nada", async () => {
    const error = vi.spyOn(store.messageStore, "error");
    api.put.mockRejectedValueOnce({ response: { status: 404, data: { message: "Local no encontrado" } } });

    expect(await store.pausarLocal("2", true)).toBe(false);

    expect(error).toHaveBeenCalledWith("Local no encontrado");
    expect(store.localesEnPausa).toEqual([]);
  });
});

