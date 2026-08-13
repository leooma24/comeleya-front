import { describe, it, expect, vi, afterEach } from "vitest";
import { isSpecialActive, effectivePrice } from "src/utils/dishPrice.js";

const futuro = "2099-12-31T23:59:59";
const pasado = "2020-01-01T00:00:00";

describe("dishPrice", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("isSpecialActive", () => {
    it("vigente cuando hay precio de oferta y la fecha no ha pasado", () => {
      expect(isSpecialActive({ price: 200, special_price: 150, special_until: futuro })).toBe(true);
    });

    it("vencida cuando la fecha ya pasó", () => {
      expect(isSpecialActive({ price: 200, special_price: 150, special_until: pasado })).toBe(false);
    });

    /**
     * SIN fecha de fin la oferta corre hasta que la quiten.
     *
     * Antes esto devolvía false, y era una trampa: el panel ofrecía la fecha como
     * "opcional", así que quien la dejaba en blanco guardaba el precio, lo veía
     * guardado y la oferta no aplicaba nunca. Cambió junto con
     * Dish::tieneOfertaVigente() del servidor, en el mismo movimiento.
     */
    it("SIN fecha de fin corre hasta que la quiten", () => {
      expect(isSpecialActive({ price: 200, special_price: 150 })).toBe(true);
      expect(isSpecialActive({ price: 200, special_price: 150, special_until: null })).toBe(true);
      expect(isSpecialActive({ price: 200, special_price: 150, special_until: "" })).toBe(true);
    });

    it("sin precio de oferta no aplica", () => {
      expect(isSpecialActive({ price: 200, special_until: futuro })).toBe(false);
      expect(isSpecialActive({ price: 200, special_price: 0, special_until: futuro })).toBe(false);
      expect(isSpecialActive({ price: 200, special_price: null, special_until: futuro })).toBe(false);
    });

    // Una fecha que no se entiende no puede cancelar una oferta que el dueño sí
    // capturó: se trata como si no la hubiera puesto.
    it("una fecha ilegible no cancela la oferta", () => {
      expect(isSpecialActive({ price: 200, special_price: 150, special_until: "ayer" })).toBe(true);
    });

    // ------------------------------------------------------- días de la semana

    describe("promociones por día", () => {
      // Fechas fijas: si no, la prueba pasa o falla según el día en que corra.
      const martes = new Date("2026-08-11T12:00:00");
      const oferta = (dias) => ({ price: 200, special_price: 150, special_days: dias });

      it("sin días capturados aplica todos, como siempre", () => {
        expect(isSpecialActive(oferta(null))).toBe(true);
        expect(isSpecialActive(oferta([]))).toBe(true);
      });

      it("solo el día marcado", () => {
        vi.setSystemTime(martes);
        expect(isSpecialActive(oferta([2]))).toBe(true); // martes
        expect(isSpecialActive(oferta([1]))).toBe(false); // lunes
        expect(isSpecialActive(oferta([0, 6]))).toBe(false); // fin de semana
        vi.useRealTimers();
      });

      // Las dos condiciones se suman: el día correcto no salva una oferta vencida.
      it("el día correcto no revive una oferta vencida", () => {
        vi.setSystemTime(martes);
        expect(
          isSpecialActive({ ...oferta([2]), special_until: "2020-01-01T00:00:00" })
        ).toBe(false);
        vi.useRealTimers();
      });
    });

    it("tolera null", () => {
      expect(isSpecialActive(null)).toBe(false);
      expect(isSpecialActive(undefined)).toBe(false);
    });

    it("justo antes y justo después del vencimiento", () => {
      const corte = new Date("2026-06-15T12:00:00");
      const dish = { price: 200, special_price: 150, special_until: corte.toISOString() };

      vi.useFakeTimers();
      vi.setSystemTime(new Date(corte.getTime() - 1000));
      expect(isSpecialActive(dish)).toBe(true);

      vi.setSystemTime(new Date(corte.getTime() + 1000));
      expect(isSpecialActive(dish)).toBe(false);
    });
  });

  describe("effectivePrice", () => {
    it("cobra la oferta cuando está vigente", () => {
      expect(effectivePrice({ price: 200, special_price: 150, special_until: futuro })).toBe(150);
    });

    it("cobra el precio normal cuando la oferta venció", () => {
      expect(effectivePrice({ price: 200, special_price: 150, special_until: pasado })).toBe(200);
    });

    it("cobra el precio normal si no hay oferta", () => {
      expect(effectivePrice({ price: 200 })).toBe(200);
    });

    it("acepta precios en texto, como llegan del API", () => {
      expect(effectivePrice({ price: "200.00", special_price: "150.00", special_until: futuro })).toBe(150);
      expect(effectivePrice({ price: "200.00" })).toBe(200);
    });

    it("un platillo sin precio da cero, no NaN", () => {
      expect(effectivePrice({})).toBe(0);
      expect(effectivePrice({ price: "abc" })).toBe(0);
      expect(effectivePrice(null)).toBe(0);
    });
  });
});
