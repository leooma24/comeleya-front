import { describe, it, expect } from "vitest";
import {
  DIAS,
  DIAS_LUNES_PRIMERO,
  aplicaHoy,
  diasValidos,
  textoDeDias,
} from "src/utils/weekDays.js";

// Fechas fijas para no depender del día en que corran las pruebas.
const LUNES = new Date("2026-08-10T12:00:00");
const MARTES = new Date("2026-08-11T12:00:00");
const SABADO = new Date("2026-08-15T12:00:00");
const DOMINGO = new Date("2026-08-16T12:00:00");

describe("weekDays", () => {
  it("las fechas de prueba caen en el día que se cree", () => {
    // Si esto falla, todo lo demás miente.
    expect(LUNES.getDay()).toBe(1);
    expect(MARTES.getDay()).toBe(2);
    expect(SABADO.getDay()).toBe(6);
    expect(DOMINGO.getDay()).toBe(0);
  });

  describe("sin días capturados aplica siempre", () => {
    // ESTA es la que garantiza que los 14 negocios de hoy no cambian: ninguno
    // tiene días guardados, así que todo tiene que seguir saliendo igual.
    it("nulo, vacío o basura se comportan como 'todos los días'", () => {
      [null, undefined, [], "lunes", 5, {}].forEach((entrada) => {
        expect(aplicaHoy(entrada, MARTES)).toBe(true);
      });
    });
  });

  describe("con días capturados", () => {
    it("un solo día aplica ese y ningún otro", () => {
      expect(aplicaHoy([2], MARTES)).toBe(true);
      expect(aplicaHoy([2], LUNES)).toBe(false);
      expect(aplicaHoy([2], DOMINGO)).toBe(false);
    });

    it("fin de semana", () => {
      expect(aplicaHoy([0, 6], SABADO)).toBe(true);
      expect(aplicaHoy([0, 6], DOMINGO)).toBe(true);
      expect(aplicaHoy([0, 6], MARTES)).toBe(false);
    });

    it("entre semana", () => {
      expect(aplicaHoy([1, 2, 3, 4, 5], LUNES)).toBe(true);
      expect(aplicaHoy([1, 2, 3, 4, 5], SABADO)).toBe(false);
    });

    it("los siete días es lo mismo que no restringir", () => {
      expect(aplicaHoy([0, 1, 2, 3, 4, 5, 6], MARTES)).toBe(true);
    });

    it("sin fecha usa el día de hoy y no revienta", () => {
      expect(() => aplicaHoy([1])).not.toThrow();
      expect(typeof aplicaHoy([1])).toBe("boolean");
    });

    it("una fecha inválida cae al día de hoy", () => {
      expect(() => aplicaHoy([1], new Date("no soy fecha"))).not.toThrow();
    });
  });

  describe("normalizar lo guardado", () => {
    it("acepta números escritos como texto", () => {
      expect(diasValidos(["1", "3"])).toEqual([1, 3]);
    });

    it("descarta lo que no es un día", () => {
      expect(diasValidos([1, 9, -2, "lunes", null, 3.5])).toEqual([1]);
    });

    /**
     * Number(null), Number(""), Number(false) y Number([]) valen 0 — domingo. Sin
     * descartarlos antes de convertir, un nulo guardado por descuido convertía una
     * promo de martes en una promo de domingo.
     */
    it("un nulo NO se convierte en domingo", () => {
      expect(diasValidos([null, 2])).toEqual([2]);
      expect(diasValidos([undefined, 2])).toEqual([2]);
      expect(diasValidos(["", 2])).toEqual([2]);
      expect(diasValidos([false, 2])).toEqual([2]);
      expect(diasValidos([[], 2])).toEqual([2]);
    });

    it("el domingo de verdad sí pasa", () => {
      expect(diasValidos([0])).toEqual([0]);
      expect(diasValidos(["0"])).toEqual([0]);
    });

    it("quita repetidos y ordena", () => {
      expect(diasValidos([6, 1, 6, 0])).toEqual([0, 1, 6]);
    });

    it("con basura completa devuelve vacío, no revienta", () => {
      expect(diasValidos("1,2,3")).toEqual([]);
      expect(diasValidos(null)).toEqual([]);
    });
  });

  describe("cómo se leen", () => {
    it("los casos con nombre propio no se listan día por día", () => {
      expect(textoDeDias([0, 6])).toBe("Fines de semana");
      expect(textoDeDias([1, 2, 3, 4, 5])).toBe("Entre semana");
    });

    it("los demás se enumeran", () => {
      expect(textoDeDias([1])).toBe("Lunes");
      expect(textoDeDias([1, 3])).toBe("Lunes, Miércoles");
    });

    it("sin restricción no hay nada que decir", () => {
      expect(textoDeDias([])).toBe("");
      expect(textoDeDias(null)).toBe("");
      expect(textoDeDias([0, 1, 2, 3, 4, 5, 6])).toBe("");
    });
  });

  describe("las listas del panel", () => {
    it("el índice de DIAS es el día que dice getDay()", () => {
      DIAS.forEach((d, i) => expect(d.valor).toBe(i));
      expect(DIAS[0].nombre).toBe("Domingo");
    });

    it("el panel los muestra de lunes a domingo", () => {
      expect(DIAS_LUNES_PRIMERO.map((d) => d.valor)).toEqual([1, 2, 3, 4, 5, 6, 0]);
      expect(DIAS_LUNES_PRIMERO.map((d) => d.corto)).toEqual([
        "L", "M", "M", "J", "V", "S", "D",
      ]);
    });
  });
});
