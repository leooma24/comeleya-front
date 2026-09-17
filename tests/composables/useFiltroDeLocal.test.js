import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useFiltroDeLocal } from "src/composables/useFiltroDeLocal";
import { useAdminStore } from "stores/admin-store";

/**
 * El selector de local del Dashboard y de Analiticas.
 *
 * Es de la pantalla, no del aparato: el dueño que mira las ventas de Centro un momento
 * no debe encontrarse Pedidos filtrado en Centro, ni el Dashboard en Centro mañana.
 */
describe("el selector de local de las estadisticas", () => {
  let admin;

  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    admin = useAdminStore();
    admin.userStore.user = { name: "Omar", establishments: [{ slug: "kazuki", pivot: { role: "propietario" } }] };
    admin.companyStore.company = {
      active_branches: [
        { id: 2, name: "Norte" },
        { id: 7, name: "Centro" },
      ],
    };
    admin.setSlug("kazuki");
  });

  it("arranca en todo el negocio, aunque Pedidos este en otro local", () => {
    admin.elegirLocal("7");

    const filtro = useFiltroDeLocal();

    expect(filtro.local.value).toBeNull();
    expect(filtro.params.value).toEqual({});
    expect(filtro.nombre.value).toBeNull();
  });

  it("elegir un local no toca el de Pedidos", () => {
    const filtro = useFiltroDeLocal();

    filtro.elegir(2);

    expect(filtro.params.value).toEqual({ local: "2" });
    expect(filtro.nombre.value).toBe("Norte");
    expect(admin.localVisto).toBeNull();
    expect(localStorage.getItem("mc-local:kazuki")).toBeNull();
  });

  it("solo se ofrece en un negocio con sucursales", () => {
    expect(useFiltroDeLocal().hayLocales.value).toBe(true);

    admin.companyStore.company = { active_branches: [] };
    const filtro = useFiltroDeLocal();
    expect(filtro.hayLocales.value).toBe(false);
    expect(filtro.opciones.value).toEqual([]);
  });
});
