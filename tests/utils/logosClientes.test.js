import { describe, it, expect } from "vitest";
import {
  normalizaClientes,
  debeAnimar,
  repeticiones,
  duracionSegundos,
} from "src/utils/logosClientes.js";

const cliente = (props = {}) => ({ name: "Kazuki", slug: "kazuki", logo: "https://cdn/k.jpg", ...props });

describe("normalizaClientes", () => {
  it("deja pasar un cliente completo", () => {
    expect(normalizaClientes([cliente()])).toEqual([
      { name: "Kazuki", slug: "kazuki", logo: "https://cdn/k.jpg" },
    ]);
  });

  it("devuelve lista vacia si no le dan un arreglo", () => {
    expect(normalizaClientes(null)).toEqual([]);
    expect(normalizaClientes(undefined)).toEqual([]);
    expect(normalizaClientes("no soy un arreglo")).toEqual([]);
  });

  // Un enlace a /undefined es peor que no pintar ese logo.
  it("descarta a quien no trae slug o nombre", () => {
    expect(normalizaClientes([cliente({ slug: "" }), cliente({ name: "  " }), { logo: "x" }])).toEqual([]);
  });

  it("un logo vacio queda en null, no en cadena vacia", () => {
    expect(normalizaClientes([cliente({ logo: "" })])[0].logo).toBeNull();
    expect(normalizaClientes([cliente({ logo: undefined })])[0].logo).toBeNull();
  });

  it("recorta los espacios del nombre y del slug", () => {
    expect(normalizaClientes([cliente({ name: "  Kazuki  ", slug: " kazuki " })])[0])
      .toEqual({ name: "Kazuki", slug: "kazuki", logo: "https://cdn/k.jpg" });
  });
});

describe("debeAnimar", () => {
  it("con tres o menos se queda quieta", () => {
    expect(debeAnimar(0)).toBe(false);
    expect(debeAnimar(1)).toBe(false);
    expect(debeAnimar(3)).toBe(false);
  });

  it("con cuatro o mas se desliza", () => {
    expect(debeAnimar(4)).toBe(true);
    expect(debeAnimar(30)).toBe(true);
  });
});

describe("repeticiones", () => {
  it("sin clientes no hay pista", () => {
    expect(repeticiones(0)).toBe(0);
  });

  it("si no anima, la lista va una sola vez", () => {
    expect(repeticiones(1)).toBe(1);
    expect(repeticiones(3)).toBe(1);
  });

  // El -50% del keyframe exige mitades identicas: siempre par.
  it("si anima, siempre un numero par de copias", () => {
    for (const n of [4, 5, 7, 8, 12, 40]) {
      expect(repeticiones(n) % 2).toBe(0);
    }
  });

  it("repite lo suficiente para llenar la pista con pocos clientes", () => {
    expect(repeticiones(4) * 4).toBeGreaterThanOrEqual(16);
    expect(repeticiones(5) * 5).toBeGreaterThanOrEqual(16);
    expect(repeticiones(8) * 8).toBeGreaterThanOrEqual(16);
  });

  it("con muchos clientes basta con duplicar", () => {
    expect(repeticiones(16)).toBe(2);
    expect(repeticiones(40)).toBe(2);
  });
});

describe("duracionSegundos", () => {
  it("crece con la cantidad de logos", () => {
    expect(duracionSegundos(20)).toBeGreaterThan(duracionSegundos(8));
  });

  it("nunca baja de un minimo, para que no parezca un parpadeo", () => {
    expect(duracionSegundos(0)).toBeGreaterThanOrEqual(20);
    expect(duracionSegundos(1)).toBeGreaterThanOrEqual(20);
  });
});
