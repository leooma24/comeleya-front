import { describe, it, expect } from "vitest";
import { amountToWords } from "src/utils/numberToWords.js";

describe("amountToWords", () => {
  it("formatea el importe estilo recibo", () => {
    expect(amountToWords(500)).toBe("QUINIENTOS PESOS 00/100 M.N.");
  });

  it("maneja el singular PESO", () => {
    expect(amountToWords(1)).toBe("UN PESO 00/100 M.N.");
  });

  it("maneja cero", () => {
    expect(amountToWords(0)).toBe("CERO PESOS 00/100 M.N.");
  });

  it("incluye centavos", () => {
    expect(amountToWords(45.5)).toBe("CUARENTA Y CINCO PESOS 50/100 M.N.");
  });

  it("maneja centenas y decenas compuestas", () => {
    expect(amountToWords(321)).toBe("TRESCIENTOS VEINTIUN PESOS 00/100 M.N.");
  });

  it("maneja cien exacto", () => {
    expect(amountToWords(100)).toBe("CIEN PESOS 00/100 M.N.");
  });

  it("maneja ciento y pico", () => {
    expect(amountToWords(115)).toBe("CIENTO QUINCE PESOS 00/100 M.N.");
  });

  it("maneja miles", () => {
    expect(amountToWords(1500)).toBe("MIL QUINIENTOS PESOS 00/100 M.N.");
  });

  it("maneja dos mil y pico", () => {
    expect(amountToWords(2380)).toBe("DOS MIL TRESCIENTOS OCHENTA PESOS 00/100 M.N.");
  });

  it("redondea centavos que llegan a 100", () => {
    expect(amountToWords(9.999)).toBe("DIEZ PESOS 00/100 M.N.");
  });

  it("acepta strings", () => {
    expect(amountToWords("75")).toBe("SETENTA Y CINCO PESOS 00/100 M.N.");
  });
});
