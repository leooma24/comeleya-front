import { describe, it, expect } from "vitest";
import {
  controlOf,
  priceModeOf,
  maxOf,
  maxOfOption,
  isOptionFull,
  optionCapLabel,
  isDecorative,
  chosenOf,
  isFull,
  selectionRuleOf,
  advancedSummary,
  priceExampleOf,
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

  // El caso real de Sushi Express: la Charola Clásica tiene un grupo de tamaño
  // (36/48/60/72 piezas) y otro de selección de rollos cuyo tope sale del tamaño.
  // 36 piezas son 3 rollos, 48 son 4, 60 son 5, 72 son 6.
  describe("tope que depende de otro grupo", () => {
    const charola = ({ tamanoElegido = 0, capsNorteno = null } = {}) => {
      const tamanos = {
        id: 667,
        name: "Número de piezas",
        qty: 1,
        selection_type: "radio",
        options: [
          { id: 1, name: "36 Piezas", price: 425, qty: 0, grants_qty: 3 },
          { id: 2, name: "48 Piezas", price: 529, qty: 0, grants_qty: 4, lifts_caps: true },
          { id: 3, name: "60 Piezas", price: 669, qty: 0, grants_qty: 5, lifts_caps: true },
          { id: 4, name: "72 Piezas", price: 755, qty: 0, grants_qty: 6, lifts_caps: true },
        ],
      };
      if (tamanoElegido) {
        tamanos.options.find((o) => o.id === tamanoElegido).qty = 1;
      }

      const sushis = {
        id: 703,
        name: "Seleccionar sushis",
        qty: 3, // tope propio, solo se usa si no hay tamaño elegido
        selection_type: "counter",
        qty_from_extra_id: 667,
        options: [
          { id: 10, name: "Bombazo", price: 0, qty: 0 },
          { id: 11, name: "Norteño", price: 0, qty: 0, max_qty: capsNorteno },
          { id: 12, name: "California", price: 0, qty: 0 },
        ],
      };

      return { tamanos, sushis, extras: [tamanos, sushis] };
    };

    describe("el total sale del tamaño elegido", () => {
      const casos = [
        [1, 3, "36 piezas"],
        [2, 4, "48 piezas"],
        [3, 5, "60 piezas"],
        [4, 6, "72 piezas"],
      ];

      casos.forEach(([id, esperado, nombre]) => {
        it(`${nombre} da ${esperado} rollos`, () => {
          const { sushis, extras } = charola({ tamanoElegido: id });
          expect(maxOf(sushis, extras)).toBe(esperado);
          expect(selectionRuleOf(sushis, extras)).toBe(`Elige ${esperado} en total`);
        });
      });
    });

    it("sin tamaño elegido cae al tope propio del grupo", () => {
      const { sushis, extras } = charola();
      expect(maxOf(sushis, extras)).toBe(3);
    });

    it("un tamaño que no declara cuánto incluye cae al tope propio", () => {
      const { tamanos, sushis, extras } = charola({ tamanoElegido: 1 });
      delete tamanos.options[0].grants_qty;
      expect(maxOf(sushis, extras)).toBe(3);
    });

    // El riesgo principal de esta funcionalidad: el orden de los extras no está
    // garantizado, así que la búsqueda debe ser por id y nunca por posición.
    it("resuelve el grupo fuente aunque llegue después en el arreglo", () => {
      const { tamanos, sushis } = charola({ tamanoElegido: 2 });
      expect(maxOf(sushis, [sushis, tamanos])).toBe(4);
    });

    it("sin la lista de extras se comporta como antes de la dependencia", () => {
      const { sushis } = charola({ tamanoElegido: 2 });
      expect(maxOf(sushis)).toBe(3); // su qty propio
    });

    it("un id que no existe entre los extras no revienta", () => {
      const { sushis } = charola({ tamanoElegido: 1 });
      expect(maxOf(sushis, [sushis])).toBe(3);
    });
  });

  describe("techo por opción", () => {
    const grupo = (max, capNorteno) => {
      const extra = {
        id: 703,
        qty: max,
        selection_type: "counter",
        options: [
          { id: 10, name: "Bombazo", qty: 0 },
          { id: 11, name: "Norteño", qty: 0, max_qty: capNorteno },
        ],
      };
      return { extra, norteno: extra.options[1], libre: extra.options[0] };
    };

    it("una opción con techo no pasa de él", () => {
      const { extra, norteno } = grupo(3, 2);
      expect(maxOfOption(extra, norteno)).toBe(2);

      norteno.qty = 1;
      expect(isOptionFull(extra, norteno)).toBe(false);
      norteno.qty = 2;
      expect(isOptionFull(extra, norteno)).toBe(true);
    });

    it("una opción sin techo llega hasta el total del grupo", () => {
      const { extra, libre } = grupo(3, 2);
      expect(maxOfOption(extra, libre)).toBe(3);
    });

    // Si alguien captura un techo mayor al total, el total tiene que ganar.
    it("el total del grupo le gana a un techo más grande", () => {
      const { extra, norteno } = grupo(3, 5);
      expect(maxOfOption(extra, norteno)).toBe(3);
    });

    it("la etiqueta solo aparece cuando el techo es menor que el grupo", () => {
      const { extra, norteno, libre } = grupo(3, 2);
      expect(optionCapLabel(extra, norteno)).toBe("máx. 2");
      expect(optionCapLabel(extra, libre)).toBe("");
    });
  });

  // "Que no se lleve la charola completa de un solo rollo." Un interruptor por
  // grupo que se ajusta solo al tamaño elegido, en vez de capturar un número por
  // cada combinación de tamaño y rollo.
  describe("al menos dos variedades", () => {
    const conTamano = (grants) => {
      const tamanos = {
        id: 667,
        qty: 1,
        selection_type: "radio",
        options: [{ id: 1, name: "T", qty: 1, grants_qty: grants }],
      };
      const sushis = {
        id: 703,
        qty: 3,
        selection_type: "counter",
        qty_from_extra_id: 667,
        require_variety: true,
        options: [{ id: 11, name: "Norteño", qty: 0 }],
      };
      return { sushis, norteno: sushis.options[0], extras: [tamanos, sushis] };
    };

    const casos = [
      [3, 2, "36 piezas"],
      [4, 3, "48 piezas"],
      [5, 4, "60 piezas"],
      [6, 5, "72 piezas"],
    ];

    casos.forEach(([rollos, esperado, nombre]) => {
      it(`${nombre}: ${rollos} rollos permiten ${esperado} iguales`, () => {
        const { sushis, norteno, extras } = conTamano(rollos);
        expect(maxOfOption(sushis, norteno, extras)).toBe(esperado);
      });
    });

    it("se ajusta solo a un tamaño nuevo, sin capturar nada", () => {
      const { sushis, norteno, extras } = conTamano(10);
      expect(maxOfOption(sushis, norteno, extras)).toBe(9);
    });

    it("con un solo elemento no se puede exigir variedad", () => {
      const { sushis, norteno, extras } = conTamano(1);
      expect(maxOfOption(sushis, norteno, extras)).toBe(1);
    });

    it("sin el interruptor, el tope sigue siendo el del grupo", () => {
      const { sushis, norteno, extras } = conTamano(3);
      sushis.require_variety = false;
      expect(maxOfOption(sushis, norteno, extras)).toBe(3);
    });

    it("funciona también sin depender de otro grupo", () => {
      const e = extra({ qty: 4, selection_type: "counter", require_variety: true, options: [opt(0)] });
      expect(maxOfOption(e, e.options[0])).toBe(3);
    });

    // Los dos topes conviven: gana el más estricto.
    it("con un techo propio más bajo, gana el techo propio", () => {
      const { sushis, norteno, extras } = conTamano(6); // variedad daría 5
      norteno.max_qty = 2;
      expect(maxOfOption(sushis, norteno, extras)).toBe(2);
    });

    it("con un techo propio más alto, gana la variedad", () => {
      const { sushis, norteno, extras } = conTamano(3); // variedad da 2
      norteno.max_qty = 3;
      expect(maxOfOption(sushis, norteno, extras)).toBe(2);
    });

    it("un tamaño que quita los topes también quita la variedad", () => {
      const tamanos = {
        id: 667,
        qty: 1,
        selection_type: "radio",
        options: [{ id: 1, name: "T", qty: 1, grants_qty: 4, lifts_caps: true }],
      };
      const sushis = {
        id: 703,
        qty: 3,
        selection_type: "counter",
        qty_from_extra_id: 667,
        require_variety: true,
        options: [{ id: 11, name: "Norteño", qty: 0, max_qty: 2 }],
      };
      expect(maxOfOption(sushis, sushis.options[0], [tamanos, sushis])).toBe(4);
    });

    // Cómo se le explica al comensal. La variedad aplica a todas las opciones por
    // igual, así que se dice UNA vez en la regla del grupo y no siete veces en la
    // lista; si se repitiera, el techo que sí es propio de un rollo se perdería
    // entre los demás.
    describe("cómo se le dice al comensal", () => {
      it("la regla del grupo lo menciona", () => {
        const { sushis, extras } = conTamano(3);
        expect(selectionRuleOf(sushis, extras)).toBe("Elige 3 en total · máx. 2 iguales");
      });

      it("y deja de mencionarlo sin el interruptor", () => {
        const { sushis, extras } = conTamano(3);
        sushis.require_variety = false;
        expect(selectionRuleOf(sushis, extras)).toBe("Elige 3 en total");
      });

      it("ninguna opción repite la etiqueta", () => {
        const { sushis, norteno, extras } = conTamano(3);
        expect(optionCapLabel(sushis, norteno, extras)).toBe("");
      });

      it("pero el techo propio más bajo sí se sigue viendo", () => {
        const { sushis, norteno, extras } = conTamano(4); // variedad daría 3
        norteno.max_qty = 2;
        expect(optionCapLabel(sushis, norteno, extras)).toBe("máx. 2");
      });

      // En casillas no se puede repetir, así que la variedad ya viene incluida.
      it("en un grupo de casillas no se anuncia", () => {
        const e = extra({ qty: 3, selection_type: "checkbox", require_variety: true });
        expect(selectionRuleOf(e)).toBe("Elige hasta 3");
      });
    });
  });

  describe("techos que el tamaño desactiva", () => {
    const armar = (tamanoElegido) => {
      const tamanos = {
        id: 667,
        qty: 1,
        selection_type: "radio",
        options: [
          { id: 1, name: "36", qty: tamanoElegido === 1 ? 1 : 0, grants_qty: 3 },
          { id: 2, name: "48", qty: tamanoElegido === 2 ? 1 : 0, grants_qty: 4, lifts_caps: true },
        ],
      };
      const sushis = {
        id: 703,
        qty: 3,
        selection_type: "counter",
        qty_from_extra_id: 667,
        options: [{ id: 11, name: "Norteño", qty: 0, max_qty: 2 }],
      };
      return { sushis, norteno: sushis.options[0], extras: [tamanos, sushis] };
    };

    it("con 36 el Norteño topa en 2", () => {
      const { sushis, norteno, extras } = armar(1);
      expect(maxOfOption(sushis, norteno, extras)).toBe(2);
      expect(optionCapLabel(sushis, norteno, extras)).toBe("máx. 2");
    });

    // "si ya eligen 4 ya va en el precio, entonces ahí sí podrían tomar 4 del mismo"
    it("con 48 el techo desaparece y puede llevar los 4 iguales", () => {
      const { sushis, norteno, extras } = armar(2);
      expect(maxOfOption(sushis, norteno, extras)).toBe(4);
      expect(optionCapLabel(sushis, norteno, extras)).toBe("");

      norteno.qty = 4;
      expect(isOptionFull(sushis, norteno, extras)).toBe(true);
      norteno.qty = 3;
      expect(isOptionFull(sushis, norteno, extras)).toBe(false);
    });
  });

  // Un grupo con una sola opción no es una elección. Viene del default viejo del
  // panel, que creaba "Opciones" con una opción "Base" al precio del platillo.
  describe("grupos que no ofrecen ninguna decisión", () => {
    // Los tres casos reales de Súper Tortas La Michoacana.
    const reales = [
      { platillo: "Especial", base: 75, opcion: "Torta", precio: 75 },
      { platillo: "Jamón y Queso Super", base: 50, opcion: "Base", precio: 50 },
      { platillo: "Malteada", base: 75, opcion: "Malteada", precio: 75 },
    ];

    reales.forEach(({ platillo, base, opcion, precio }) => {
      it(`${platillo}: una opción "${opcion}" al mismo precio, se esconde`, () => {
        const e = extra({ qty: 1, options: [{ name: opcion, price: precio, qty: 1 }] });
        expect(isDecorative(e, base)).toBe(true);
      });
    });

    it("una sola opción en $0 que no suma, se esconde", () => {
      const e = extra({ qty: 1, price_mode: "add", options: [opt(0)] });
      expect(isDecorative(e, 50)).toBe(true);
    });

    // ESTA es la que impide que alguien "simplifique" la regla a "una sola opción"
    // y termine escondiendo un cargo que el comensal nunca vio.
    it("una sola opción que SUMA dinero se sigue mostrando", () => {
      const e = extra({ qty: 1, price_mode: "add", options: [opt(15)] });
      expect(isDecorative(e, 50)).toBe(false);
    });

    it("una sola opción que reemplaza con OTRO precio se sigue mostrando", () => {
      const e = extra({ qty: 1, price_mode: "replace", options: [opt(80)] });
      expect(isDecorative(e, 50)).toBe(false);
    });

    it("con dos opciones nunca se esconde, aunque una sea gratis", () => {
      const e = extra({ qty: 1, price_mode: "add", options: [opt(0), opt(0)] });
      expect(isDecorative(e, 50)).toBe(false);
    });

    it("un grupo de cantidades con una sola opción gratis también sobra", () => {
      const e = extra({ qty: 3, selection_type: "counter", price_mode: "add", options: [opt(0)] });
      expect(isDecorative(e, 50)).toBe(true);
    });

    it("sin opciones, con nulos o con precios basura no revienta", () => {
      expect(isDecorative(extra({ options: [] }), 50)).toBe(false);
      expect(isDecorative(null, 50)).toBe(false);
      expect(isDecorative(extra({ qty: 1, options: [opt(0)] }), "abc")).toBe(true);
      expect(isDecorative(extra({ qty: 1, options: [opt(0)] }), undefined)).toBe(true);
    });
  });

  // El panel se parte en Básico y Experto. En Básico los controles de topes no se
  // dibujan, así que un grupo que YA los trae configurados tiene que anunciarlo:
  // esconder en silencio es lo único que este resumen existe para evitar.
  describe("resumen de la configuración avanzada", () => {
    it("un grupo normal no tiene nada que resumir", () => {
      const salsa = extra({ id: 1, name: "Salsa", qty: 1, options: [opt(0), opt(0)] });
      expect(advancedSummary(salsa, [salsa])).toEqual([]);
    });

    // La charola completa de Sushi Express, tal como quedó configurada.
    const charolaCompleta = () => {
      const tamanos = {
        id: 667,
        name: "Número de piezas",
        qty: 1,
        selection_type: "radio",
        options: [
          { id: 1, name: "36 Piezas", price: 425, grants_qty: 3 },
          { id: 2, name: "48 Piezas", price: 529, grants_qty: 4, lifts_caps: true },
        ],
      };
      const sushis = {
        id: 703,
        name: "Seleccionar sushis",
        qty: 3,
        selection_type: "counter",
        qty_from_extra_id: 667,
        require_variety: true,
        options: [
          { id: 11, name: "Bombazo", price: 0 },
          { id: 12, name: "Norteño", price: 0, max_qty: 2 },
        ],
      };
      return { tamanos, sushis, extras: [tamanos, sushis] };
    };

    it("el grupo que manda dice a quién le define el máximo", () => {
      const { tamanos, extras } = charolaCompleta();
      expect(advancedSummary(tamanos, extras)).toEqual([
        "Define el máximo de Seleccionar sushis",
        "1 opción permite repetir sin límite",
      ]);
    });

    it("el grupo dependiente dice de quién depende y qué topes trae", () => {
      const { sushis, extras } = charolaCompleta();
      expect(advancedSummary(sushis, extras)).toEqual([
        "Su máximo lo define Número de piezas",
        "Al menos dos variedades",
        "1 opción con tope propio",
      ]);
    });

    it("cuenta bien en plural", () => {
      const { sushis, extras } = charolaCompleta();
      sushis.options.push({ id: 13, name: "California", price: 0, max_qty: 1 });
      expect(advancedSummary(sushis, extras)).toContain("2 opciones con tope propio");
    });

    // Mismo cuidado que en extraFuente: el orden de los extras no está garantizado.
    it("encuentra al dependiente por id, no por posición", () => {
      const { tamanos, sushis } = charolaCompleta();
      expect(advancedSummary(tamanos, [sushis, tamanos])).toContain(
        "Define el máximo de Seleccionar sushis"
      );
    });

    it("sin la lista de hermanos no revienta, solo pierde los nombres", () => {
      const { tamanos, sushis } = charolaCompleta();
      expect(advancedSummary(tamanos)).toEqual(["1 opción permite repetir sin límite"]);
      expect(advancedSummary(sushis)).toContain("Su máximo lo define otro grupo");
    });

    it("con nulos devuelve vacío", () => {
      expect(advancedSummary(null)).toEqual([]);
      expect(advancedSummary(undefined, [])).toEqual([]);
      expect(advancedSummary(extra({ id: 1 }), null)).toEqual([]);
    });
  });

  // El campo que decide si el precio se suma o reemplaza es el que hacía que el
  // navegador y el servidor calcularan distinto. Se explica con los números que el
  // dueño acaba de teclear, no en abstracto.
  describe("el ejemplo del campo de precio", () => {
    it("arma las dos frases con el platillo y la opción reales", () => {
      const e = extra({ options: [opt(0), { name: "Grande", price: 20 }] });
      expect(priceExampleOf(e, 50)).toEqual({
        suma: "$50 + Grande $20 = $70",
        reemplazo: "Grande $20 = $20",
      });
    });

    it("con centavos no deja números largos", () => {
      const e = extra({ options: [{ name: "Grande", price: 12.5 }] });
      expect(priceExampleOf(e, 50).suma).toBe("$50 + Grande $12.50 = $62.50");
    });

    it("sin ninguna opción con precio no hay ejemplo (y el campo no se dibuja)", () => {
      expect(priceExampleOf(extra({ options: [opt(0), opt(0)] }), 50)).toBeNull();
      expect(priceExampleOf(extra({ options: [] }), 50)).toBeNull();
      expect(priceExampleOf(null, 50)).toBeNull();
    });

    it("con un precio base basura cuenta como cero, no como NaN", () => {
      const e = extra({ options: [{ name: "Grande", price: 20 }] });
      expect(priceExampleOf(e, undefined).suma).toBe("$0 + Grande $20 = $20");
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
