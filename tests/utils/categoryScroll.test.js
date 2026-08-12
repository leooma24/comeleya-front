import { describe, it, expect, afterEach, vi } from "vitest";
import { scrollOffsetFor, spyThresholdFor } from "src/utils/categoryScroll.js";

// Simula la barra de categorías fija con un alto dado.
const conTabsDeAlto = (bottom) => {
  const el = { getBoundingClientRect: () => ({ bottom }) };
  vi.spyOn(document, "querySelector").mockImplementation((sel) =>
    sel === ".mc-sidebar-tabs" ? el : null
  );
};

const sinTabs = () => {
  vi.spyOn(document, "querySelector").mockReturnValue(null);
};

describe("categoryScroll", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ESTA es la invariante que se había roto y que causaba el bug reportado: el
  // título aterrizaba a 65px y el spy solo marcaba a <= 60, así que el tab se
  // quedaba en la categoría anterior "a un pasito" de llegar.
  describe("el aterrizaje siempre queda por encima de la línea del spy", () => {
    const contextos = [
      { caso: "iframe", ctx: { isExternal: true, isNarrow: false }, tabs: 53 },
      { caso: "iframe con tabs altos", ctx: { isExternal: true, isNarrow: false }, tabs: 96 },
      { caso: "móvil web", ctx: { isExternal: false, isNarrow: true }, tabs: 230 },
      { caso: "móvil con banner", ctx: { isExternal: false, isNarrow: true }, tabs: 280 },
    ];

    contextos.forEach(({ caso, ctx, tabs }) => {
      it(`${caso} (tabs a ${tabs}px)`, () => {
        conTabsDeAlto(tabs);
        // El título aterriza a |offset| del tope del viewport.
        const aterrizaje = Math.abs(scrollOffsetFor(ctx));
        const linea = spyThresholdFor(ctx);
        expect(aterrizaje).toBeLessThanOrEqual(linea);
      });
    });

    it("escritorio normal, sin tabs fijos", () => {
      sinTabs();
      const ctx = { isExternal: false, isNarrow: false };
      expect(Math.abs(scrollOffsetFor(ctx))).toBeLessThanOrEqual(spyThresholdFor(ctx));
    });
  });

  describe("mide los tabs en vivo", () => {
    it("un cambio de alto mueve los dos números juntos", () => {
      conTabsDeAlto(53);
      const offsetChico = scrollOffsetFor({ isExternal: true, isNarrow: false });
      const lineaChica = spyThresholdFor({ isExternal: true, isNarrow: false });

      vi.restoreAllMocks();
      conTabsDeAlto(96);
      const offsetGrande = scrollOffsetFor({ isExternal: true, isNarrow: false });
      const lineaGrande = spyThresholdFor({ isExternal: true, isNarrow: false });

      expect(Math.abs(offsetGrande)).toBeGreaterThan(Math.abs(offsetChico));
      expect(lineaGrande).toBeGreaterThan(lineaChica);
      // Y la invariante se mantiene en ambos.
      expect(Math.abs(offsetGrande)).toBeLessThanOrEqual(lineaGrande);
    });

    it("deja respiro entre los tabs y el título", () => {
      conTabsDeAlto(53);
      expect(Math.abs(scrollOffsetFor({ isExternal: true, isNarrow: false }))).toBeGreaterThan(53);
    });
  });

  describe("respaldo cuando los tabs aún no montaron", () => {
    it("iframe usa el alto típico del modo embebido", () => {
      sinTabs();
      const offset = scrollOffsetFor({ isExternal: true, isNarrow: false });
      expect(Math.abs(offset)).toBe(56 + 12);
    });

    it("móvil web usa el alto típico con el bloque del establecimiento", () => {
      sinTabs();
      const offset = scrollOffsetFor({ isExternal: false, isNarrow: true });
      expect(Math.abs(offset)).toBe(230 + 12);
    });

    it("escritorio no depende de los tabs", () => {
      sinTabs();
      expect(scrollOffsetFor({ isExternal: false, isNarrow: false })).toBe(-60);
      expect(spyThresholdFor({ isExternal: false, isNarrow: false })).toBe(75);
    });
  });
});
