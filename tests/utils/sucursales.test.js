import { describe, it, expect } from "vitest";
import {
  MATRIZ,
  matrizDe,
  direccionCompleta,
  tieneSucursales,
  origenDelPedido,
} from "src/utils/sucursales.js";

/**
 * La matriz: el negocio mismo, contado como un local mas en cuanto tiene sucursales.
 *
 * No se da de alta en ningun lado. Si hubiera que capturarla como sucursal, el dia que
 * el dueño registre solo su segundo local todos los pedidos se irian para alla y la
 * matriz desapareceria del menu.
 */

describe("la matriz", () => {
  const negocio = {
    coordinates: "25.7925,-108.9807",
    whatsapp: "6689990000",
    phone: "6681234567",
    address: {
      street: "Rio Presidio",
      exterior_number: "351",
      town: "Centro",
      city: "Los Mochis",
      postal_code: "81200",
    },
  };

  it("se arma con los datos del negocio y tiene la forma de una sucursal", () => {
    expect(matrizDe(negocio)).toEqual({
      id: MATRIZ,
      matriz: true,
      name: "Matriz",
      coordinates: "25.7925,-108.9807",
      whatsapp: "6689990000",
      phone: "6681234567",
      full_address: "Rio Presidio 351, Centro, Los Mochis, 81200",
    });
  });

  it("un negocio sin ubicar da una matriz sin coordenadas, no unas inventadas", () => {
    expect(matrizDe({ address: {} }).coordinates).toBeNull();
    expect(matrizDe({}).full_address).toBe("");
  });
});

describe("la direccion completa", () => {
  it("se escribe igual que la de una sucursal en el servidor", () => {
    // Branch::getFullAddressAttribute: "calle numero int. X, colonia, ciudad, CP".
    expect(
      direccionCompleta({
        street: "Obregón",
        exterior_number: "10",
        interior_number: "B",
        town: "Centro",
        city: "Los Mochis",
        postal_code: "81200",
      })
    ).toBe("Obregón 10 int. B, Centro, Los Mochis, 81200");
  });

  it("un interior en 0 no se imprime, igual que en el servidor", () => {
    // PHP trata "0" como vacio: `if ($this->interior_number)` no lo pinta.
    expect(
      direccionCompleta({ street: "Rio Presidio", exterior_number: "351", interior_number: "0" })
    ).toBe("Rio Presidio 351");
  });

  it("se salta lo que no esta capturado", () => {
    expect(direccionCompleta({ street: "Obregón", town: " ", city: "Los Mochis" })).toBe(
      "Obregón, Los Mochis"
    );
  });
});

describe("de que local salio un pedido", () => {
  const conSucursales = { active_branches: [{ id: 2, name: "Norte" }] };
  const unSoloLocal = { active_branches: [] };

  it("de la sucursal que lo preparo", () => {
    const pedido = { branch_id: 2, branch: { id: 2, name: "Norte" } };
    expect(origenDelPedido(pedido, conSucursales)).toBe("Norte");
  });

  it("de la Matriz cuando no trae sucursal y el negocio tiene varias", () => {
    expect(origenDelPedido({ branch_id: null }, conSucursales)).toBe("Matriz");
  });

  it("de ninguna en un negocio de un solo local", () => {
    expect(origenDelPedido({ branch_id: null }, unSoloLocal)).toBeNull();
    expect(origenDelPedido({}, {})).toBeNull();
  });

  it("no la confunde con la Matriz si la sucursal no vino cargada", () => {
    expect(origenDelPedido({ branch_id: 7 }, conSucursales)).toBeNull();
  });

  it("solo cuenta las sucursales que manda el servidor", () => {
    expect(tieneSucursales(conSucursales)).toBe(true);
    expect(tieneSucursales(unSoloLocal)).toBe(false);
    expect(tieneSucursales(undefined)).toBe(false);
  });
});
