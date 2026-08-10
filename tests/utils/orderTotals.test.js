import { describe, it, expect } from "vitest";
import { orderTotals } from "src/utils/orderTotals.js";

describe("orderTotals", () => {
  it("suma la propina al total (ticket Bajamar #10: 375 + 20 = 395)", () => {
    const t = orderTotals({
      total: 375,
      tip: 20,
      discount: 0,
      delivery_charge: 0,
      items: [
        { total: 120 }, // Yakimeshi
        { total: 145 }, // Sushi Philadelphia
        { total: 110 }, // Bomba empanizada
      ],
    });
    expect(t.subtotal).toBe(375);
    expect(t.tip).toBe(20);
    expect(t.grandTotal).toBe(395);
  });

  it("suma el envío al total", () => {
    const t = orderTotals({ total: 200, delivery_charge: 45, items: [{ total: 200 }] });
    expect(t.deliveryCharge).toBe(45);
    expect(t.grandTotal).toBe(245);
  });

  it("resta el descuento", () => {
    const t = orderTotals({ total: 300, discount: 50, items: [{ total: 300 }] });
    expect(t.grandTotal).toBe(250);
  });

  it("combina subtotal, descuento, propina y envío", () => {
    const t = orderTotals({
      total: 500,
      discount: 100,
      tip: 30,
      delivery_charge: 45,
      items: [{ total: 500 }],
    });
    expect(t.grandTotal).toBe(475);
  });

  it("nunca devuelve un total negativo", () => {
    const t = orderTotals({ total: 100, discount: 500, items: [{ total: 100 }] });
    expect(t.grandTotal).toBe(0);
  });

  it("acepta importes como texto (el API los manda como string decimal)", () => {
    const t = orderTotals({
      total: "375.00",
      tip: "20.00",
      discount: "0.00",
      delivery_charge: "0.00",
      items: [{ total: "375.00" }],
    });
    expect(t.grandTotal).toBe(395);
  });

  it("redondea a dos decimales en vez de arrastrar el error de punto flotante", () => {
    const t = orderTotals({ total: 0.1, tip: 0.2, items: [{ total: 0.1 }] });
    expect(t.grandTotal).toBe(0.3);
  });

  it("cae al importe de los artículos cuando el pedido no trae total", () => {
    const t = orderTotals({ tip: 20, items: [{ total: 120 }, { total: 255 }] });
    expect(t.subtotal).toBe(375);
    expect(t.grandTotal).toBe(395);
  });

  it("tolera un pedido vacío sin reventar", () => {
    const t = orderTotals({});
    expect(t).toEqual({ subtotal: 0, discount: 0, tip: 0, deliveryCharge: 0, grandTotal: 0 });
  });

  it("tolera null", () => {
    expect(orderTotals(null).grandTotal).toBe(0);
  });
});
