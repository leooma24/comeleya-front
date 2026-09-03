import { describe, it, expect, beforeEach, vi } from "vitest";
import { ref } from "vue";
import { setActivePinia, createPinia } from "pinia";

const compartirLink = vi.fn(() => Promise.resolve("compartido"));
vi.mock("src/utils/compartir", () => ({ compartirLink: (...a) => compartirLink(...a) }));

import { useDish } from "src/composables/useDish";
import { useMainStore } from "stores/main-store";
import { useCompanyStore } from "stores/company-store";

/**
 * El boton de compartir un platillo.
 *
 * Lo que se manda por WhatsApp lo lee una persona, no un servidor: el enlace no puede
 * traer el numero interno del platillo si ya existe su direccion con nombre.
 */
describe("compartir un platillo", () => {
  let mainStore;

  const platillo = (extra = {}) => ({
    id: 2683,
    name: "PROMOCIÓN TORTAS",
    price: 250,
    slug: "promocion-tortas",
    ...extra,
  });

  const compartir = async (item) => {
    const { shareProduct } = useDish(ref(item));
    await shareProduct();
    return compartirLink.mock.calls.at(-1)[0];
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    mainStore = useMainStore();
    useCompanyStore().company = { slug: "bajamar", name: "Bajamar" };
    window.history.replaceState({}, "", "/bajamar");
    compartirLink.mockClear();
    compartirLink.mockResolvedValue("compartido");
  });

  it("manda la direccion del platillo, no su id", async () => {
    // Lo que se veia antes en el mensaje: comeleya.com/bajamar?dish=2683.
    const { url } = await compartir(platillo());

    expect(url).toBe(`${window.location.origin}/bajamar/promocion-tortas`);
    expect(url).not.toContain("dish=");
  });

  it("un platillo de antes de los slugs se sigue compartiendo con su id", async () => {
    // No todos tienen `slug` todavia. Ese enlace es feo pero abre, y es mejor que
    // mandar una direccion que daria 404.
    const { url } = await compartir(platillo({ slug: null }));

    expect(url).toBe(`${window.location.origin}/bajamar?dish=2683`);
  });

  it("si el negocio no esta en el store, lo saca de la direccion", async () => {
    useCompanyStore().company = {};
    window.history.replaceState({}, "", "/kazuki-sushi/otro-platillo");

    const { url } = await compartir(platillo({ slug: "maguro-roll" }));

    expect(url).toBe(`${window.location.origin}/kazuki-sushi/maguro-roll`);
  });

  it("el mensaje lleva el nombre, el precio y el negocio", async () => {
    const { text, title } = await compartir(platillo());

    expect(title).toBe("PROMOCIÓN TORTAS");
    expect(text).toBe("PROMOCIÓN TORTAS - $250 en Bajamar");
  });

  describe("cuando no se pudo compartir, el boton deja de quedarse mudo", () => {
    const avisos = () => ({
      ok: vi.spyOn(mainStore.messageStore, "success"),
      error: vi.spyOn(mainStore.messageStore, "error"),
    });

    it("avisa que quedo copiado", async () => {
      const { ok } = avisos();
      compartirLink.mockResolvedValue("copiado");

      await compartir(platillo());

      expect(ok).toHaveBeenCalledWith(expect.stringContaining("Copiamos el link"));
    });

    it("avisa cuando de plano no se pudo", async () => {
      const { error } = avisos();
      compartirLink.mockResolvedValue("fallo");

      await compartir(platillo());

      expect(error).toHaveBeenCalled();
    });

    it("no dice nada si el comensal cerro la hoja de compartir", async () => {
      const { ok, error } = avisos();
      compartirLink.mockResolvedValue("cancelado");

      await compartir(platillo());

      expect(ok).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
    });
  });
});
