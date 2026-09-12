import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAdminStore } from "stores/admin-store";
import { api } from "boot/axios";

/**
 * La cajera en el panel: a donde llega, que no se le abre y que ve cuando su negocio
 * ya no tiene el plan.
 *
 * Quien niega de verdad es el servidor. Esto cuida que el panel no la lleve a pantallas
 * del dueño ni le enseñe un error de "revisa tu conexion" que no es cierto.
 */

const conRol = (slug, role) => ({
  name: "Ana",
  role: "Usuario",
  establishments: [{ id: 1, slug, name: "Kazuki", pivot: { role } }],
});

describe("la cajera en el panel", () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useAdminStore();
    vi.clearAllMocks();
    store.userStore.user = conRol("kazuki", "cajero");
  });

  it("se sabe cajera en su negocio y aterriza en Pedidos", () => {
    store.setSlug("kazuki");

    expect(store.esCajero).toBe(true);
    expect(store.tab).toBe("pedidos_pendientes");
    expect(store.orderTab).toBe("pedidos_pendientes");
  });

  it("no se le abren los cajones del dueño, pero si su perfil", () => {
    store.setSlug("kazuki");

    store.setConfigurationDrawer(true);
    store.setAddressDrawer(true);
    store.setScheduleDrawer(true);
    store.setEstablishmentDrawer(true);
    expect(store.configurationDrawer).toBe(false);
    expect(store.addressDrawer).toBe(false);
    expect(store.scheduleDrawer).toBe(false);
    expect(store.establishmentDrawer).toBe(false);

    store.setProfileDrawer(true);
    expect(store.profileDrawer).toBe(true);
  });

  it("el rol que devuelve el servidor manda sobre el de la sesion", async () => {
    store.userStore.user = conRol("kazuki", "propietario");
    store.setSlug("kazuki");
    expect(store.esCajero).toBe(false);

    api.get.mockResolvedValueOnce({
      data: {
        establishment: { name: "Kazuki" },
        rol: "cajero",
        categories: [],
        features: [],
        types: [],
        counts: {},
      },
    });
    await store.getEstablishment();

    expect(store.esCajero).toBe(true);
  });

  it("si el plan ya no incluye cajeros, lo dice en vez de culpar a la conexion", async () => {
    store.setSlug("kazuki");
    const error = vi.spyOn(store.messageStore, "error");
    api.get.mockRejectedValueOnce({
      response: {
        status: 403,
        data: { code: "plan_sin_equipo", message: "El plan del negocio ya no incluye cuentas de cajero." },
      },
    });

    await store.getEstablishment();

    expect(store.bloqueoCajero).toBe("El plan del negocio ya no incluye cuentas de cajero.");
    expect(error).not.toHaveBeenCalled();
  });

  it("cambiar de negocio olvida el rol y el bloqueo del anterior", () => {
    store.userStore.user = {
      establishments: [
        { slug: "kazuki", pivot: { role: "cajero" } },
        { slug: "otro", pivot: { role: "propietario" } },
      ],
    };
    store.setSlug("kazuki");
    store.rolServidor = "cajero";
    store.bloqueoCajero = "sin plan";

    store.setSlug("otro");

    expect(store.rolServidor).toBeNull();
    expect(store.bloqueoCajero).toBe("");
    expect(store.esCajero).toBe(false);
    expect(store.tab).toBe("dashboard");
  });
});

describe("el dueño en el panel", () => {
  it("sigue como siempre: entra al Dashboard y abre todos los cajones", () => {
    setActivePinia(createPinia());
    const store = useAdminStore();
    // Una sesion de antes de las cajeras: la relacion no trae rol.
    store.userStore.user = { name: "Omar", establishments: [{ slug: "kazuki" }] };

    store.setSlug("kazuki");
    store.setConfigurationDrawer(true);

    expect(store.esCajero).toBe(false);
    expect(store.tab).toBe("dashboard");
    expect(store.configurationDrawer).toBe(true);
  });
});
