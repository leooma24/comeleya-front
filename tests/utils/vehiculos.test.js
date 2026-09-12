import { describe, it, expect } from "vitest";
import {
  VEHICULOS,
  normalizarVehiculo,
  opcionesDeVehiculo,
  llevaPlacas,
} from "src/utils/vehiculos.js";

/**
 * El tipo de vehiculo de un repartidor se elige de una lista.
 *
 * Antes era texto libre. Estas pruebas cuidan que lo que los negocios ya habian escrito
 * no se pierda al abrir y guardar un repartidor.
 */

describe("las opciones", () => {
  it("son las mas comunes", () => {
    expect(VEHICULOS).toEqual(["Moto", "Bicicleta", "Auto", "A pie"]);
  });

  it("incluyen la que ya tenia el repartidor si no es ninguna de ellas", () => {
    expect(opcionesDeVehiculo("Camioneta")).toEqual([...VEHICULOS, "Camioneta"]);
    expect(opcionesDeVehiculo("Moto")).toEqual(VEHICULOS);
    expect(opcionesDeVehiculo(null)).toEqual(VEHICULOS);
    expect(opcionesDeVehiculo("")).toEqual(VEHICULOS);
  });

  it("no dejan que quien las usa modifique la lista original", () => {
    opcionesDeVehiculo("").push("Patines");
    expect(VEHICULOS).toHaveLength(4);
  });
});

describe("lo que ya estaba escrito", () => {
  it("se acomoda a su opcion aunque venga con otra forma, mayusculas o acentos", () => {
    expect(normalizarVehiculo("moto")).toBe("Moto");
    expect(normalizarVehiculo("  Motocicleta ")).toBe("Moto");
    expect(normalizarVehiculo("MOTONETA")).toBe("Moto");
    expect(normalizarVehiculo("bici")).toBe("Bicicleta");
    expect(normalizarVehiculo("Carro")).toBe("Auto");
    expect(normalizarVehiculo("Automóvil")).toBe("Auto");
    expect(normalizarVehiculo("a  pie")).toBe("A pie");
    expect(normalizarVehiculo("Peatón")).toBe("A pie");
  });

  it("lo que no se reconoce se respeta tal cual", () => {
    expect(normalizarVehiculo("Camioneta")).toBe("Camioneta");
    expect(normalizarVehiculo(" Patines ")).toBe("Patines");
  });

  it("vacio sigue vacio", () => {
    expect(normalizarVehiculo("")).toBe("");
    expect(normalizarVehiculo(null)).toBe("");
    expect(normalizarVehiculo(undefined)).toBe("");
  });
});

describe("las placas", () => {
  it("solo se piden a lo que tiene motor, o si no se sabe en que se mueve", () => {
    expect(llevaPlacas("Moto")).toBe(true);
    expect(llevaPlacas("Auto")).toBe(true);
    expect(llevaPlacas("Camioneta")).toBe(true);
    expect(llevaPlacas("")).toBe(true);
    expect(llevaPlacas(null)).toBe(true);
    expect(llevaPlacas("Bicicleta")).toBe(false);
    expect(llevaPlacas("A pie")).toBe(false);
  });
});
