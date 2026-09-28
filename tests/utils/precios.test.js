import { describe, it, expect } from "vitest";
import { dinero } from "src/utils/dinero.js";
import { precio, textoPlano } from "src/composables/useDish.js";

// Dos formatos a proposito: en el menu se compara de un vistazo ("$107"), en el
// pedido se suma ("$107.00"). Lo que no puede pasar es que un mismo lugar mezcle.
describe("precio (vitrina del menu)", () => {
  it("quita los .00", () => {
    expect(precio("107.00")).toBe("$107");
  });

  it("separa miles", () => {
    expect(precio(1250)).toBe("$1,250");
  });

  it("un centavo suelto se escribe con dos cifras", () => {
    expect(precio("89.5")).toBe("$89.50");
  });

  it("no inventa un precio si no hay numero", () => {
    expect(precio("abc")).toBe("");
  });
});

describe("dinero (carrito, pago y confirmacion)", () => {
  it("siempre con centavos", () => {
    expect(dinero(107)).toBe("$107.00");
    expect(dinero("214.5")).toBe("$214.50");
  });

  it("separa miles", () => {
    expect(dinero(1250)).toBe("$1,250.00");
  });

  it("un total vacio se lee como cero, no como NaN", () => {
    expect(dinero(undefined)).toBe("$0.00");
  });
});

describe("textoPlano (descripciones con HTML del editor viejo)", () => {
  it("quita las etiquetas", () => {
    expect(textoPlano("Orden chica: <b>$120</b>")).toBe("Orden chica: $120");
  });

  it("un <br> separa palabras en vez de pegarlas", () => {
    expect(textoPlano("Atún<br>Aguacate")).toBe("Atún Aguacate");
  });

  it("decodifica entidades", () => {
    expect(textoPlano("Pollo &amp; papas")).toBe("Pollo & papas");
  });

  it("vacio si no hay descripcion", () => {
    expect(textoPlano(null)).toBe("");
  });
});
