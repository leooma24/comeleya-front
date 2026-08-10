import { describe, it, expect, beforeEach } from "vitest";
import { fitPageToContent } from "src/utils/ticketPageSize.js";

// jsdom no maqueta, así que scrollHeight es 0: lo fijamos a mano para poder
// probar la conversión px -> mm y la regla que se inyecta.
const conAltura = (px) => {
  const doc = document.implementation.createHTMLDocument("ticket");
  Object.defineProperty(doc.body, "scrollHeight", { value: px, configurable: true });
  Object.defineProperty(doc.documentElement, "scrollHeight", { value: px, configurable: true });
  return doc;
};

const reglaDe = (doc) => doc.head.querySelector("style[data-page-size]")?.textContent ?? "";

describe("fitPageToContent", () => {
  let doc;
  beforeEach(() => {
    doc = conAltura(720); // 720px = 190.5mm
  });

  it("inyecta @page con el ancho del rollo y el alto del contenido", () => {
    fitPageToContent(doc);
    // 720px -> 190.5mm, redondeado hacia arriba 191 + 3 de respiro
    expect(reglaDe(doc)).toBe("@page { size: 80mm 194mm; margin: 0; }");
  });

  it("nunca usa la palabra auto en el alto (Chrome descarta la regla)", () => {
    fitPageToContent(doc);
    expect(reglaDe(doc)).not.toContain("auto");
  });

  it("respeta un ancho de rollo distinto (58mm)", () => {
    fitPageToContent(doc, 58);
    expect(reglaDe(doc)).toContain("size: 58mm");
  });

  it("un ticket corto produce una página corta", () => {
    const corto = conAltura(200); // 52.9mm
    fitPageToContent(corto);
    expect(reglaDe(corto)).toBe("@page { size: 80mm 56mm; margin: 0; }");
  });

  it("no inyecta nada si el contenido no tiene altura", () => {
    const vacio = conAltura(0);
    fitPageToContent(vacio);
    expect(vacio.head.querySelector("style[data-page-size]")).toBeNull();
  });

  it("tolera un documento inválido sin reventar", () => {
    expect(() => fitPageToContent(null)).not.toThrow();
    expect(() => fitPageToContent({})).not.toThrow();
  });
});
