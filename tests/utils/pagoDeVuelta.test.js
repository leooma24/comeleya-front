import { describe, it, expect } from "vitest";
import {
  leerPagoDeVuelta,
  sinParametrosDePago,
  textosDePago,
  PARAMS_DE_PAGO,
} from "src/utils/pagoDeVuelta.js";

/**
 * El cliente regresa de pagar en Mercado Pago. Mercado Pago lo manda a
 *   /{slug}?payment=success&order=21&status=approved&payment_id=...&preference_id=...
 * (probado pagando de verdad con una tarjeta de prueba). El menú tiene que decirle cómo quedó.
 */
describe("leerPagoDeVuelta", () => {
  it("un pago aprobado", () => {
    expect(leerPagoDeVuelta({ payment: "success", order: "21", status: "approved" })).toEqual({
      estado: "pagado",
      codigo: "21",
    });
  });

  it("pendiente (OXXO, transferencia) y rechazado", () => {
    expect(leerPagoDeVuelta({ payment: "pending", order: "21" }).estado).toBe("pendiente");
    expect(leerPagoDeVuelta({ payment: "failure", order: "21" }).estado).toBe("rechazado");
  });

  it("un menú normal no es un pago", () => {
    expect(leerPagoDeVuelta({})).toBeNull();
    expect(leerPagoDeVuelta({ local: "matriz" })).toBeNull();
    expect(leerPagoDeVuelta({ payment: "otra-cosa" })).toBeNull();
    expect(leerPagoDeVuelta(undefined)).toBeNull();
  });

  // El código se pinta en pantalla: una liga armada a mano no puede meter otra cosa.
  it("el código solo deja letras, números y guion", () => {
    expect(leerPagoDeVuelta({ payment: "success", order: "<img src=x onerror=alert(1)>" }).codigo)
      .toBe("imgsrcxonerroralert1");
    expect(leerPagoDeVuelta({ payment: "success", order: "A-12" }).codigo).toBe("A-12");
    expect(leerPagoDeVuelta({ payment: "success", order: "9".repeat(50) }).codigo).toHaveLength(20);
  });

  it("sin código no truena", () => {
    expect(leerPagoDeVuelta({ payment: "success" })).toEqual({ estado: "pagado", codigo: "" });
  });
});

describe("sinParametrosDePago", () => {
  it("quita todo lo del pago y deja lo demás", () => {
    const query = {
      payment: "success", order: "21", status: "approved", payment_id: "1",
      collection_status: "approved", preference_id: "x", site_id: "MLM",
      local: "matriz", pruebas: "mp",
    };

    expect(sinParametrosDePago(query)).toEqual({ local: "matriz", pruebas: "mp" });
  });

  it("conoce los que agrega Mercado Pago", () => {
    for (const p of ["payment_id", "collection_id", "merchant_order_id", "external_reference"]) {
      expect(PARAMS_DE_PAGO).toContain(p);
    }
  });
});

describe("textosDePago", () => {
  it("cada estado dice algo distinto y nombra el pedido", () => {
    const pagado = textosDePago("pagado", "21");
    const pendiente = textosDePago("pendiente", "21");
    const rechazado = textosDePago("rechazado", "21");

    expect(pagado.titulo).toBe("¡Pago recibido!");
    expect(pagado.mensaje).toContain("pedido #21");
    expect(pendiente.tono).toBe("warning");
    expect(rechazado.tono).toBe("negative");
    // Un pago rechazado no cobró nada: se le dice, para que no crea que le descontaron.
    expect(rechazado.mensaje).toContain("No se cobró nada");
  });

  it("sin código habla del pedido en general", () => {
    expect(textosDePago("pagado", "").mensaje).toContain("tu pedido.");
  });
});
