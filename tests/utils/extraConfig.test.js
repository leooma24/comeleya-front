import { describe, it, expect } from "vitest";
import {
  controlOf,
  priceModeOf,
  maxOf,
  chosenOf,
  isFull,
  selectionRuleOf,
} from "src/utils/extraConfig.js";

// Atajos para armar extras de prueba
const extra = (props = {}) => ({ name: "Extra", qty: 1, options: [], ...props });
const opt = (price = 0, qty = 0) => ({ name: "Op", price, qty });

describe("extraConfig", () => {
  describe("el campo guardado manda sobre la heurística", () => {
    it("controlOf respeta selection_type aunque la heurística diga otra cosa", () => {
      // qty 1 => la heurística diría "radio"
      const e = extra({ qty: 3, selection_type: "counter", options: [opt(0), opt(0)] });
      expect(controlOf(e)).toBe("counter");

      // todas con precio y qty 1 => la heurística diría "radio", pero mandan los datos
      const e2 = extra({ qty: 1, selection_type: "checkbox", options: [opt(10), opt(20)] });
      expect(controlOf(e2)).toBe("checkbox");
    });

    it("priceModeOf respeta price_mode aunque la heurística diga otra cosa", () => {
      const e = extra({ qty: 1, price_mode: "add", options: [opt(425), opt(529)] });
      expect(priceModeOf(e)).toBe("add"); // la heurística diría "replace"

      const e2 = extra({ qty: 1, price_mode: "replace", options: [opt(0), opt(50)] });
      expect(priceModeOf(e2)).toBe("replace"); // la heurística diría "add"
    });

    it("ignora valores inválidos y cae a la heurística", () => {
      const e = extra({ qty: 1, selection_type: "dropdown", price_mode: "multiply" });
      expect(controlOf(e)).toBe("radio");
      expect(priceModeOf(e)).toBe("add");
    });
  });

  // Esta tabla es la GUARDA DE REGRESIÓN: es exactamente la conducta de hoy y es lo
  // que la migración va a rellenar. Si alguien cambia la heurística, los menús ya
  // existentes cambiarían de aspecto o de precio, y estas pruebas lo detienen.
  describe("respaldo: reproduce la conducta actual para extras sin los campos", () => {
    const casos = [
      {
        caso: "qty 1, todas con precio (Charola Clásica)",
        e: extra({ qty: 1, options: [opt(425), opt(529), opt(669)] }),
        control: "radio",
        precio: "replace",
      },
      {
        caso: "qty 1, alguna en cero (bien configurado)",
        e: extra({ qty: 1, options: [opt(0), opt(91), opt(251)] }),
        control: "radio",
        precio: "add",
      },
      {
        caso: "qty > 1, todas con precio",
        e: extra({ qty: 3, options: [opt(10), opt(20)] }),
        control: "counter",
        precio: "add",
      },
      {
        caso: "qty > 1, alguna en cero",
        e: extra({ qty: 3, options: [opt(0), opt(20)] }),
        control: "checkbox",
        precio: "add",
      },
      {
        caso: "qty > 1, todas en cero (la promo de 3 sushis mal configurada)",
        e: extra({ qty: 3, options: [opt(0), opt(0)] }),
        control: "checkbox",
        precio: "add",
      },
    ];

    casos.forEach(({ caso, e, control, precio }) => {
      it(`${caso} => ${control} / ${precio}`, () => {
        expect(controlOf(e)).toBe(control);
        expect(priceModeOf(e)).toBe(precio);
      });
    });
  });

  // Un extra sin `qty` no era "elige 1" ni "elige varios": caía en casillas y en
  // aditivo. Normalizarlo a 1 lo volvería "reemplazo" y le borraría el precio base
  // al platillo. Estas pruebas evitan que alguien "limpie" la normalización y lo rompa.
  describe("extras sin qty (conducta vieja al pie de la letra)", () => {
    it("no se toman como 'elige 1' aunque todas las opciones tengan precio", () => {
      const e = { options: [opt(10), opt(5)] }; // sin qty
      expect(priceModeOf(e)).toBe("add");
      expect(controlOf(e)).toBe("checkbox");
    });

    it("un qty basura tampoco activa el reemplazo", () => {
      expect(priceModeOf({ qty: null, options: [opt(10)] })).toBe("add");
      expect(priceModeOf({ qty: "", options: [opt(10)] })).toBe("add");
      expect(priceModeOf({ qty: "abc", options: [opt(10)] })).toBe("add");
    });

    it("pero maxOf sí normaliza a 1, que es lo seguro para el tope de la interfaz", () => {
      expect(maxOf({ options: [opt(10)] })).toBe(1);
    });
  });

  describe("extras sin opciones", () => {
    // [].every(...) es true: sin esta guarda un extra vacío caería en "replace" y
    // dejaría el precio del platillo en 0.
    it("no se toma como 'todas con precio'", () => {
      const vacio = extra({ qty: 1, options: [] });
      expect(priceModeOf(vacio)).toBe("add");
      expect(controlOf(vacio)).toBe("radio");
    });

    it("con qty > 1 y sin opciones queda en casillas, no en contador", () => {
      const vacio = extra({ qty: 3, options: [] });
      expect(controlOf(vacio)).toBe("checkbox");
    });
  });

  describe("maxOf", () => {
    it("radio siempre admite 1 aunque qty diga otra cosa", () => {
      expect(maxOf(extra({ qty: 5, selection_type: "radio" }))).toBe(1);
    });

    it("counter y checkbox usan qty", () => {
      expect(maxOf(extra({ qty: 3, selection_type: "counter" }))).toBe(3);
      expect(maxOf(extra({ qty: 4, selection_type: "checkbox" }))).toBe(4);
    });

    it("normaliza qty inválido a 1", () => {
      expect(maxOf(extra({ qty: 0, selection_type: "counter" }))).toBe(1);
      expect(maxOf(extra({ qty: -2, selection_type: "counter" }))).toBe(1);
      expect(maxOf(extra({ qty: null, selection_type: "counter" }))).toBe(1);
      expect(maxOf(extra({ qty: 2.7, selection_type: "counter" }))).toBe(2);
    });
  });

  describe("chosenOf e isFull", () => {
    it("cuenta unidades, no opciones marcadas", () => {
      const e = extra({ qty: 3, selection_type: "counter", options: [opt(0, 2), opt(0, 1)] });
      expect(chosenOf(e)).toBe(3);
      expect(isFull(e)).toBe(true);
    });

    it("con cupo libre no está lleno", () => {
      const e = extra({ qty: 3, selection_type: "counter", options: [opt(0, 1)] });
      expect(chosenOf(e)).toBe(1);
      expect(isFull(e)).toBe(false);
    });

    it("tolera qty ausente o basura en las opciones", () => {
      const e = extra({ qty: 3, options: [{ name: "x" }, { name: "y", qty: null }] });
      expect(chosenOf(e)).toBe(0);
    });

    it("las casillas también topan (el hueco que dejaba pedir de más)", () => {
      const e = extra({ qty: 2, selection_type: "checkbox", options: [opt(0, 1), opt(0, 1), opt(0, 0)] });
      expect(isFull(e)).toBe(true);
    });
  });

  describe("selectionRuleOf", () => {
    it("dice lo correcto por tipo", () => {
      expect(selectionRuleOf(extra({ selection_type: "radio" }))).toBe("Elige 1");
      expect(selectionRuleOf(extra({ qty: 3, selection_type: "counter" }))).toBe("Elige 3 en total");
      expect(selectionRuleOf(extra({ qty: 3, selection_type: "checkbox" }))).toBe("Elige hasta 3");
    });
  });

  describe("entradas basura", () => {
    it("no revienta con null ni con objetos vacíos", () => {
      expect(() => controlOf(null)).not.toThrow();
      // "checkbox" y no "radio": sin qty no es "elige 1", igual que un extra sin qty.
      expect(controlOf(null)).toBe("checkbox");
      // Lo importante para el dinero: nunca cae en "replace", que borraría la base.
      expect(priceModeOf(null)).toBe("add");
      expect(chosenOf(null)).toBe(0);
      expect(maxOf(undefined)).toBe(1);
    });
  });
});
