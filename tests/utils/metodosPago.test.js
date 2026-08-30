import { describe, it, expect } from "vitest";
import { etiquetaPago, METODOS_PAGO } from "src/utils/metodosPago.js";

/**
 * La traduccion de codigo a etiqueta, en un solo lugar.
 *
 * Estaba escrita dos veces -en la tabla de pedidos y en el ticket- con el mismo
 * objeto copiado. Es el tipo de duplicado que se queda a medias: se agrega un
 * metodo nuevo en uno y el otro lo pinta crudo.
 */
describe("etiquetaPago", () => {
  it("traduce los cuatro metodos", () => {
    expect(etiquetaPago("cash")).toBe("Efectivo");
    expect(etiquetaPago("card")).toBe("Tarjeta");
    expect(etiquetaPago("transfer")).toBe("Transferencia");
    expect(etiquetaPago("mercadopago")).toBe("MercadoPago");
  });

  // Quedan pedidos viejos con la etiqueta en espanol guardada. Se pintan tal cual
  // en vez de dejar el renglon vacio: el dueno prefiere leer "Efectivo" a nada.
  it("un valor que no conoce se pinta tal cual", () => {
    expect(etiquetaPago("Efectivo")).toBe("Efectivo");
    expect(etiquetaPago("criptomonedas")).toBe("criptomonedas");
  });

  it("sin valor no inventa nada", () => {
    expect(etiquetaPago(null)).toBe("");
    expect(etiquetaPago(undefined)).toBe("");
    expect(etiquetaPago("")).toBe("");
  });

  it("expone los metodos para pintar las opciones del cobro", () => {
    expect(METODOS_PAGO.map((m) => m.valor)).toEqual(["cash", "card", "transfer"]);
  });

  // MercadoPago no se elige a mano: lo escribe la pasarela cuando confirma el pago.
  it("MercadoPago se traduce pero no se ofrece como opcion", () => {
    expect(etiquetaPago("mercadopago")).toBe("MercadoPago");
    expect(METODOS_PAGO.some((m) => m.valor === "mercadopago")).toBe(false);
  });
});
