import { describe, it, expect } from "vitest";
import { luminancia, contraste, encimaDe } from "src/utils/contraste";

/**
 * De aquí sale el color de la X del botón de cerrar, encima del círculo que cada negocio
 * elige. Si esto falla, hay un comensal que no encuentra cómo salir de su pedido.
 */
describe("qué color va encima de otro", () => {
  describe("luminancia", () => {
    it("el negro es 0 y el blanco es 1", () => {
      expect(luminancia("#000000")).toBeCloseTo(0, 5);
      expect(luminancia("#ffffff")).toBeCloseTo(1, 5);
    });

    it("el verde pesa mucho más que el azul, como lo ve el ojo", () => {
      // Mismo valor numérico en canales distintos, luminancia muy distinta: por esto
      // no sirve promediar el RGB.
      expect(luminancia("#00ff00")).toBeGreaterThan(luminancia("#0000ff") * 8);
    });

    it("entiende las tres notaciones", () => {
      expect(luminancia("#fff")).toBeCloseTo(luminancia("#ffffff"), 5);
      expect(luminancia("rgb(255, 255, 255)")).toBeCloseTo(1, 5);
    });

    it("no inventa un valor cuando el color no se entiende", () => {
      expect(luminancia("azul cielo")).toBeNull();
      expect(luminancia("")).toBeNull();
      expect(luminancia(null)).toBeNull();
    });
  });

  describe("contraste", () => {
    it("blanco contra negro es el máximo posible", () => {
      expect(contraste("#ffffff", "#000000")).toBeCloseTo(21, 1);
    });

    it("un color contra sí mismo no contrasta", () => {
      expect(contraste("#E53935", "#E53935")).toBeCloseTo(1, 5);
    });
  });

  describe("encimaDe", () => {
    it("sobre blanco pone oscuro — el caso por defecto", () => {
      expect(encimaDe("#ffffff")).toBe("#1c1c21");
    });

    it("sobre negro pone blanco", () => {
      expect(encimaDe("#000000")).toBe("#ffffff");
    });

    it("sobre un amarillo pone oscuro, aunque sea un color 'de color'", () => {
      expect(encimaDe("#FFEB3B")).toBe("#1c1c21");
    });

    it("sobre un azul marino pone blanco", () => {
      expect(encimaDe("#0D47A1")).toBe("#ffffff");
    });

    it("sobre el rojo de la marca pone blanco", () => {
      expect(encimaDe("#E53935")).toBe("#ffffff");
    });

    it("lo que elija, siempre queda legible", () => {
      // La prueba que de verdad importa: el negocio puede poner CUALQUIER color y la X
      // tiene que leerse.
      //
      // El mínimo es 3:1, que es el de la WCAG para un elemento gráfico —un icono lo
      // es—. No 4.5, que es el de un párrafo de texto: para un color de tono medio ese
      // número es inalcanzable, ni el blanco ni el negro llegan. El rojo de la marca
      // (#E53935) se queda en 4.23 y el gris azulado en 4.37; el resto pasa de 6.
      const colores = [
        "#ffffff", "#000000", "#E53935", "#1976D2", "#FFEB3B", "#4CAF50",
        "#795548", "#9C27B0", "#00BCD4", "#FF9800", "#607D8B", "#8BC34A",
        "#3F51B5", "#CDDC39", "#F5F5F5", "#212121",
      ];
      colores.forEach((fondo) => {
        const encima = encimaDe(fondo);
        expect(contraste(fondo, encima)).toBeGreaterThanOrEqual(3);
      });
    });

    it("con un color que no se entiende cae en oscuro, que es lo de hoy", () => {
      expect(encimaDe("no es un color")).toBe("#1c1c21");
      expect(encimaDe(undefined)).toBe("#1c1c21");
    });
  });
});
