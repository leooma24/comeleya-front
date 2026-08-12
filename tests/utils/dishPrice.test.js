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

    // Aquí es donde el navegador y el servidor no se ponían de acuerdo: la app
    // daba por vigente una oferta sin fecha de fin y el servidor la ignoraba.
    it("SIN fecha de fin NO está vigente, igual que en el servidor", () => {
      expect(isSpecialActive({ price: 200, special_price: 150 })).toBe(false);
      expect(isSpecialActive({ price: 200, special_price: 150, special_until: null })).toBe(false);
      expect(isSpecialActive({ price: 200, special_price: 150, special_until: "" })).toBe(false);
    });

    it("sin precio de oferta no aplica", () => {
      expect(isSpecialActive({ price: 200, special_until: futuro })).toBe(false);
      expect(isSpecialActive({ price: 200, special_price: 0, special_until: futuro })).toBe(false);
      expect(isSpecialActive({ price: 200, special_price: null, special_until: futuro })).toBe(false);
    });

    it("una fecha ilegible no activa la oferta", () => {
      expect(isSpecialActive({ price: 200, special_price: 150, special_until: "ayer" })).toBe(false);
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
