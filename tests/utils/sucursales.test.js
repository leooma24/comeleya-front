import { describe, it, expect } from "vitest";
import {
  MATRIZ,
  matrizDe,
  direccionCompleta,
  tieneSucursales,
  origenDelPedido,
  opcionesDeLocal,
  localValido,
  nombreDelLocal,
  claveLocalVisto,
  localDelPedido,
  ordenarRepartidores,
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
      orders_paused: false,
      // El horario de la Matriz ES el del negocio, asi que su lista propia va vacia
      // -igual que la de una sucursal que hereda- y is_open es el del negocio.
      is_open: false,
      hours: [],
    });
  });

  it("su horario es el del negocio: lista propia vacia y el abierto del negocio", () => {
    expect(matrizDe({ isOpen: true }).is_open).toBe(true);
    expect(matrizDe({ isOpen: false }).is_open).toBe(false);
    expect(matrizDe({}).hours).toEqual([]);
  });

  it("dice si la Matriz esta en pausa con el mismo campo que una sucursal", () => {
    expect(matrizDe({ matriz_pausada: true }).orders_paused).toBe(true);
    expect(matrizDe({}).orders_paused).toBe(false);
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

describe("que local se ve en Pedidos", () => {
  const negocio = {
    active_branches: [
      { id: 2, name: "Norte" },
      { id: 7, name: "Centro" },
    ],
  };

  it("se elige entre todos, la matriz y las sucursales encendidas, con el id como texto", () => {
    // Como texto porque asi lo manda y lo compara el servidor (App\Support\LocalDePedidos).
    expect(opcionesDeLocal(negocio)).toEqual([
      { value: null, label: "Todos los locales" },
      { value: MATRIZ, label: "Matriz" },
      { value: "2", label: "Norte" },
      { value: "7", label: "Centro" },
    ]);
  });

  it("un negocio de un solo local no tiene que elegir", () => {
    expect(opcionesDeLocal({ active_branches: [] })).toEqual([]);
    expect(opcionesDeLocal(undefined)).toEqual([]);
  });

  it("lo guardado en el aparato vale mientras el local siga encendido", () => {
    expect(localValido(null, negocio)).toBe(true);
    expect(localValido(MATRIZ, negocio)).toBe(true);
    expect(localValido("7", negocio)).toBe(true);
    expect(localValido(7, negocio)).toBe(true);
    // Apagada, borrada, o el negocio bajo de plan y ya no manda sucursales.
    expect(localValido("9", negocio)).toBe(false);
    expect(localValido(MATRIZ, { active_branches: [] })).toBe(false);
  });

  it("se dice con su nombre", () => {
    expect(nombreDelLocal(null, negocio)).toBe("Todos los locales");
    expect(nombreDelLocal(MATRIZ, negocio)).toBe("Matriz");
    expect(nombreDelLocal("2", negocio)).toBe("Norte");
    expect(nombreDelLocal("9", negocio)).toBeNull();
  });

  it("cada negocio guarda el suyo", () => {
    expect(claveLocalVisto("kazuki")).toBe("mc-local:kazuki");
    expect(claveLocalVisto("kazuki")).not.toBe(claveLocalVisto("bajamar"));
  });
});

describe("los repartidores para un pedido", () => {
  it("el local de un pedido se escribe como en el servidor", () => {
    expect(localDelPedido({ branch_id: 7 })).toBe("7");
    expect(localDelPedido({ branch_id: null })).toBe(MATRIZ);
    expect(localDelPedido({})).toBe(MATRIZ);
  });

  it("primero los del local del pedido, luego los compartidos, al final los de otro local", () => {
    const repartidores = [
      { name: "Norte", local: "2" },
      { name: "Compartido A", local: null },
      { name: "Centro", local: "7" },
      { name: "Compartido B", local: null },
    ];

    expect(ordenarRepartidores(repartidores, "7").map((d) => d.name)).toEqual([
      "Centro",
      "Compartido A",
      "Compartido B",
      "Norte",
    ]);
    // No toca la lista original.
    expect(repartidores[0].name).toBe("Norte");
  });

  it("los de la Matriz van primero en un pedido de la Matriz", () => {
    const repartidores = [{ name: "Centro", local: "7" }, { name: "Matriz", local: MATRIZ }];
    expect(ordenarRepartidores(repartidores, MATRIZ).map((d) => d.name)).toEqual(["Matriz", "Centro"]);
  });
});
