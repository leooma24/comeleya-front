import { describe, it, expect, beforeEach } from "vitest";
import { etiquetaPago, estadoDePagoEnLinea, pagoEnLineaDisponible, esLigaDePruebas, METODOS_PAGO } from "src/utils/metodosPago.js";

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

/**
 * El pedido con Mercado Pago entra al panel ANTES de que el cliente pague. El estado le
 * dice al dueño si ya puede prepararlo.
 */
describe("estadoDePagoEnLinea", () => {
  const enLinea = (payment_status) => ({ payment_method: "mercadopago", payment_status });

  it("pagado cuando Mercado Pago ya confirmó", () => {
    expect(estadoDePagoEnLinea(enLinea("completed"))).toEqual({ texto: "PAGADO", tono: "pagado" });
  });

  it("esperando pago mientras no confirma (o si el cliente nunca pagó)", () => {
    expect(estadoDePagoEnLinea(enLinea("pending")).texto).toBe("ESPERANDO PAGO");
    expect(estadoDePagoEnLinea(enLinea(undefined)).tono).toBe("espera");
  });

  it("rechazado y reembolsado se avisan", () => {
    expect(estadoDePagoEnLinea(enLinea("failed")).texto).toBe("PAGO RECHAZADO");
    expect(estadoDePagoEnLinea(enLinea("refunded")).texto).toBe("REEMBOLSADO");
  });

  it("reconoce el método guardado como 'MercadoPago' (pedidos de antes)", () => {
    expect(estadoDePagoEnLinea({ payment_method: "MercadoPago", payment_status: "completed" }).texto).toBe("PAGADO");
  });

  // Efectivo, terminal y transferencia se cobran fuera del sistema: no tienen estado aquí,
  // y decir "esperando pago" de un pedido en efectivo sería mentira.
  it("no aplica a los demás métodos", () => {
    expect(estadoDePagoEnLinea({ payment_method: "cash", payment_status: "pending" })).toBeNull();
    expect(estadoDePagoEnLinea({ payment_method: "transfer", payment_status: "pending" })).toBeNull();
    expect(estadoDePagoEnLinea(null)).toBeNull();
  });
});

/**
 * El modo de pruebas del pago en línea. Con llaves de prueba guardadas en un negocio de
 * verdad, sus clientes no deben ver la opción: pagarían en un sandbox.
 */
describe("pagoEnLineaDisponible", () => {
  it("sin llaves guardadas no se ofrece", () => {
    expect(pagoEnLineaDisponible({ mercadopago_ready: false })).toBe(false);
    expect(pagoEnLineaDisponible({})).toBe(false);
    expect(pagoEnLineaDisponible(null)).toBe(false);
  });

  it("con llaves y en vivo, se ofrece a todos", () => {
    expect(pagoEnLineaDisponible({ mercadopago_ready: true, mp_sandbox: false })).toBe(true);
  });

  it("en modo de pruebas se esconde de los clientes", () => {
    expect(pagoEnLineaDisponible({ mercadopago_ready: true, mp_sandbox: true })).toBe(false);
  });

  it("en modo de pruebas se abre solo con la liga de prueba del dueño", () => {
    expect(pagoEnLineaDisponible({ mercadopago_ready: true, mp_sandbox: true }, true)).toBe(true);
  });

  it("la liga de prueba no ofrece lo que no tiene llaves", () => {
    expect(pagoEnLineaDisponible({ mercadopago_ready: false, mp_sandbox: true }, true)).toBe(false);
  });
});

describe("esLigaDePruebas", () => {
  beforeEach(() => sessionStorage.clear());

  it("reconoce ?pruebas=mp", () => {
    expect(esLigaDePruebas("?pruebas=mp")).toBe(true);
    expect(esLigaDePruebas("?local=matriz&pruebas=mp")).toBe(true);
  });

  it("un menú normal no es liga de prueba", () => {
    expect(esLigaDePruebas("")).toBe(false);
    expect(esLigaDePruebas("?pruebas=otra")).toBe(false);
  });

  // El router puede quitar el query al navegar; a mitad del pedido el dueño no debe perder la
  // opción que está probando.
  it("se acuerda en la pestaña aunque el query ya no esté", () => {
    expect(esLigaDePruebas("?pruebas=mp")).toBe(true);
    expect(esLigaDePruebas("")).toBe(true);
  });
});
