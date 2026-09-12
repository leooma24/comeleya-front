import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { printOrderTicket } from "src/utils/orderTicket.js";

/**
 * La comanda de un negocio con varios locales.
 *
 * Todos los pedidos de todos los locales llegan al mismo panel. Si la comanda no dice
 * de cual es, la cocina equivocada arma el pedido o el cliente llama a un numero que
 * no es el del local que lo tiene.
 */

// La comanda se escribe en un iframe oculto y se imprime despues, en un setTimeout.
// Con relojes falsos ese timeout nunca corre: se lee lo escrito sin llegar a imprimir.
const frame = () => document.getElementById("mc-admin-print-frame");
const textoDe = (order, company) => {
  printOrderTicket(order, { company });
  return frame().contentWindow.document.body.textContent.replace(/\s+/g, " ");
};

const pedido = (extra = {}) => ({
  id: 1,
  order_code: "A1",
  customer_name: "Ana",
  phone: "6681112233",
  delivery: "Envio",
  delivery_address: "Calle 1",
  items: [],
  total: 100,
  ...extra,
});

const negocio = {
  name: "Sushi Express",
  whatsapp: "6680000000",
  address: { street: "Matriz", exterior_number: "10" },
};

const negocioConSucursales = { ...negocio, active_branches: [{ id: 2, name: "Norte" }] };

describe("la comanda de un negocio con varios locales", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    frame()?.remove();
    vi.useRealTimers();
  });

  it("dice de que sucursal es y da su telefono", () => {
    const t = textoDe(
      pedido({ branch_id: 2, branch: { id: 2, name: "Norte", phone: "6689998877" } }),
      negocioConSucursales
    );

    expect(t).toContain("SUCURSAL Norte");
    expect(t).toContain("Tel. 6689998877");
    expect(t).not.toContain("6680000000");
  });

  it("sin telefono propio usa el del negocio, y la direccion fiscal no cambia", () => {
    const t = textoDe(
      pedido({ branch_id: 2, branch: { id: 2, name: "Norte", phone: null } }),
      negocioConSucursales
    );

    expect(t).toContain("SUCURSAL Norte");
    expect(t).toContain("Tel. 6680000000");
    expect(t).toContain("Matriz 10");
  });

  it("un pedido que salio de la Matriz lo dice, con el telefono del negocio", () => {
    const t = textoDe(pedido({ branch_id: null }), negocioConSucursales);

    expect(t).toContain("SUCURSAL Matriz");
    expect(t).toContain("Tel. 6680000000");
  });

  it("un negocio de un solo local imprime igual que siempre", () => {
    const t = textoDe(pedido(), negocio);

    expect(t).not.toContain("SUCURSAL");
    expect(t).toContain("Tel. 6680000000");
  });

  it("el nombre de la sucursal no se interpreta como HTML", () => {
    printOrderTicket(pedido({ branch_id: 3, branch: { id: 3, name: "<b>X</b>" } }), {
      company: negocioConSucursales,
    });

    expect(frame().contentWindow.document.body.querySelector("b")).toBeNull();
  });
});
