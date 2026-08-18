import { describe, it, expect, afterEach, vi } from "vitest";
import {
  centerTabScroll,
  estaEnElFondo,
  scrollOffsetFor,
  spyThresholdFor,
} from "src/utils/categoryScroll.js";

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

// La tira de categorías siguiendo a la sección que se está viendo. Quasar ya la movía,
// pero con el cálculo mínimo: el tab activo quedaba pegado a la orilla.
describe("centerTabScroll", () => {
  // Una tira típica de móvil: 8 categorías de 120px en una pantalla de 360.
  const TIRA = { viewSize: 360, contentSize: 960, tabSize: 120 };
  const enPosicion = (tabStart) => centerTabScroll({ ...TIRA, tabStart });

  it("deja el tab de en medio centrado", () => {
    // Un tab que empieza en 420 y mide 120: su centro está en 480. Con 360 de ancho
    // visible, centrarlo pide arrancar en 480 - 180 = 300.
    expect(enPosicion(420)).toBe(300);
  });

  // Sin el recorte, la primera categoría quedaría flotando a media pantalla con un
  // hueco a su izquierda, y la última con uno a la derecha.
  describe("no se despega de los extremos", () => {
    it("los primeros tabs se quedan en 0", () => {
      expect(enPosicion(0)).toBe(0);
      expect(enPosicion(120)).toBe(0);
    });

    it("los últimos se quedan en el tope", () => {
      const tope = TIRA.contentSize - TIRA.viewSize; // 600
      expect(enPosicion(840)).toBe(tope);
      expect(enPosicion(720)).toBe(tope);
    });
  });

  it("sin desbordamiento no hay nada que recorrer", () => {
    expect(centerTabScroll({ tabStart: 100, tabSize: 80, viewSize: 400, contentSize: 300 }))
      .toBe(0);
    // Justo del tamaño de la pantalla: tampoco.
    expect(centerTabScroll({ tabStart: 100, tabSize: 80, viewSize: 400, contentSize: 400 }))
      .toBe(0);
  });

  // ESTA es la que no se puede perder al centrar: dejar el tab completamente visible es
  // lo único que Quasar sí hacía bien, y es para lo que sirve la tira.
  describe("el tab activo SIEMPRE queda completo en pantalla", () => {
    const tiras = [
      { caso: "móvil, categorías cortas", viewSize: 360, tabSize: 90, total: 12 },
      { caso: "móvil, categorías largas", viewSize: 360, tabSize: 240, total: 6 },
      { caso: "embebido angosto", viewSize: 280, tabSize: 150, total: 9 },
      { caso: "escritorio vertical", viewSize: 520, tabSize: 48, total: 20 },
      // Un tab más ancho que la pantalla no cabe entero; se pide que al menos arranque
      // visible y no deje hueco.
      { caso: "una categoría con nombre kilométrico", viewSize: 200, tabSize: 300, total: 4 },
    ];

    tiras.forEach(({ caso, viewSize, tabSize, total }) => {
      it(caso, () => {
        const contentSize = tabSize * total;

        for (let i = 0; i < total; i++) {
          const tabStart = i * tabSize;
          const scroll = centerTabScroll({ tabStart, tabSize, viewSize, contentSize });

          // Nunca se sale de lo que existe.
          expect(scroll).toBeGreaterThanOrEqual(0);
          expect(scroll).toBeLessThanOrEqual(Math.max(0, contentSize - viewSize));
          // El tab empieza dentro de la ventana...
          expect(tabStart).toBeGreaterThanOrEqual(scroll);
          // ...y termina dentro, salvo que no quepa ni ocupando toda la pantalla.
          if (tabSize <= viewSize) {
            expect(tabStart + tabSize).toBeLessThanOrEqual(scroll + viewSize);
          }
        }
      });
    });
  });
});

// Lo que reportaron: en móvil el menú abría marcando la última categoría y volvía a
// ella con cada arrastre. La causa no era el cálculo del fondo sino QUIÉN se medía.
describe("estaEnElFondo", () => {
  // Un elemento que no baja: scrollHeight igual a clientHeight.
  const plano = (alto = 400) => ({ scrollTop: 0, clientHeight: alto, scrollHeight: alto });
  const doc = (scrollTop, alto = 800, total = 3000) => ({
    scrollTop,
    clientHeight: alto,
    scrollHeight: total,
  });

  it("la tarjeta que toca el dedo en touchmove no cuenta como scroller", () => {
    // El target es la tarjeta; el documento apenas va empezando.
    expect(estaEnElFondo(plano(), doc(0))).toBe(false);
  });

  it("la tira de categorías, que scrollea en horizontal, tampoco", () => {
    const tira = { scrollTop: 0, clientHeight: 48, scrollHeight: 48 };
    expect(estaEnElFondo(tira, doc(500))).toBe(false);
  });

  it("con el documento abajo del todo, sí", () => {
    expect(estaEnElFondo(plano(), doc(2200))).toBe(true);
  });

  it("un contenedor propio que sí baja manda sobre el documento", () => {
    // El caso del iframe embebido: scrollea el contenedor, no la página.
    const caja = { scrollTop: 900, clientHeight: 600, scrollHeight: 1500 };
    expect(estaEnElFondo(caja, doc(0))).toBe(true);
  });

  it("si la página entera cabe, no hay fondo que valga", () => {
    // Todas las categorías están a la vista: marcar la última sería inventar.
    expect(estaEnElFondo(null, plano(700))).toBe(false);
  });

  it("perdona 2px de holgura", () => {
    expect(estaEnElFondo(null, { scrollTop: 2199, clientHeight: 800, scrollHeight: 3000 })).toBe(true);
    expect(estaEnElFondo(null, { scrollTop: 2100, clientHeight: 800, scrollHeight: 3000 })).toBe(false);
  });
});
