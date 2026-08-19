import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useProductStore } from "stores/products";

describe("products store", () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useProductStore();
  });

  describe("initial state", () => {
    it("starts with null product", () => {
      expect(store.product).toBeNull();
    });

    it("starts with empty items and categories", () => {
      expect(store.items).toEqual([]);
      expect(store.categories).toEqual([]);
    });
  });

  describe("setProducts / setCategories", () => {
    it("sets items", () => {
      const products = [
        { id: 1, name: "Tacos", dish_category_id: 1 },
        { id: 2, name: "Burrito", dish_category_id: 2 },
      ];
      store.setProducts(products);
      expect(store.items).toEqual(products);
    });

    it("sets categories", () => {
      const categories = [
        { id: 1, name: "Entradas" },
        { id: 2, name: "Platos fuertes" },
      ];
      store.setCategories(categories);
      expect(store.categories).toEqual(categories);
    });
  });

  describe("getProductsByCategoryId", () => {
    beforeEach(() => {
      store.setProducts([
        { id: 1, name: "Tacos al pastor", dish_category_id: 1 },
        { id: 2, name: "Tacos de suadero", dish_category_id: 1 },
        { id: 3, name: "Burrito", dish_category_id: 2 },
        { id: 4, name: "Quesadilla", dish_category_id: 2 },
      ]);
    });

    it("filters products by category id", () => {
      const result = store.getProductsByCategoryId(1, "");
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Tacos al pastor");
    });

    it("filters by search term", () => {
      const result = store.getProductsByCategoryId(1, "suadero");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Tacos de suadero");
    });

    it("search is case insensitive", () => {
      const result = store.getProductsByCategoryId(1, "PASTOR");
      expect(result).toHaveLength(1);
    });

    it("returns empty when no match", () => {
      const result = store.getProductsByCategoryId(1, "pizza");
      expect(result).toHaveLength(0);
    });

    it("updates countByCategory", () => {
      store.getProductsByCategoryId(1, "");
      expect(store.countByCategory[1]).toBe(2);
    });
  });

  describe("seeProduct", () => {
    const mockProduct = {
      id: 1,
      name: "Tacos",
      price: "50.00",
      extras: [
        {
          id: 1,
          name: "Salsa",
          order: 2,
          qty: 1,
          is_required: true,
          options: [{ id: 1, name: "Verde", qty: 0, price: 0 }],
        },
        {
          id: 2,
          name: "Bebida",
          order: 1,
          qty: 1,
          is_required: false,
          options: [{ id: 2, name: "Agua", qty: 0, price: 10 }],
        },
      ],
    };

    it("sets product with qty 1 and calculates total from extras", () => {
      store.seeProduct(mockProduct);
      expect(store.product.qty).toBe(1);
      // totalPrice is calculated from extras: Verde(qty=1,price=0) + Agua(qty=0,price=10) = 0
      expect(store.product.totalPrice).toBe(0);
    });

    it("sorts extras by order", () => {
      store.seeProduct(mockProduct);
      expect(store.product.extras[0].name).toBe("Bebida"); // order 1
      expect(store.product.extras[1].name).toBe("Salsa"); // order 2
    });

    it("auto-selects first option for required extras with qty=1", () => {
      store.seeProduct(mockProduct);
      const salsaExtra = store.product.extras.find((e) => e.name === "Salsa");
      expect(salsaExtra.options[0].qty).toBe(1);
    });
  });

  describe("increment / decrement", () => {
    beforeEach(() => {
      store.product = {
        name: "Tacos",
        price: "50.00",
        qty: 1,
        totalPrice: 50,
        extras: [],
      };
    });

    it("increments qty", () => {
      store.increment();
      expect(store.product.qty).toBe(2);
    });

    it("decrements qty", () => {
      store.product.qty = 3;
      store.decrement();
      expect(store.product.qty).toBe(2);
    });
  });

  describe("updatePrice", () => {
    it("uses base price when no extras", () => {
      store.product = {
        price: "50.00",
        totalPrice: 0,
        extras: [],
      };
      store.updatePrice();
      expect(store.product.totalPrice).toBe(50);
    });

    it("sums extra option prices", () => {
      store.product = {
        price: "50.00",
        totalPrice: 0,
        extras: [
          {
            options: [
              { qty: 1, price: 10 },
              { qty: 2, price: 5 },
            ],
          },
        ],
      };
      store.updatePrice();
      // base 50 + aditivo (1*10 + 2*5 = 20) = 70
      expect(store.product.totalPrice).toBe(70);
    });

    it("handles null qty and price in options", () => {
      store.product = {
        price: "50.00",
        totalPrice: 0,
        extras: [
          {
            options: [{ qty: null, price: null }],
          },
        ],
      };
      store.updatePrice();
      // base 50 + aditivo (0) = 50
      expect(store.product.totalPrice).toBe(50);
    });
  });

  // Casos reales que reprodujeron el doble cobro contra el servidor: el frontend
  // reemplazaba el precio base y el backend lo sumaba. Verificado con un pedido real
  // en local: Charola Clásica salía $425 en pantalla y $850 en el ticket.
  // Ninguna prueba cubría esta rama, por eso nadie lo detectó.
  describe("updatePrice: modo de precio (reemplazo vs suma)", () => {
    const elegir = (extras) => {
      store.product = { price: "425.00", totalPrice: 0, extras };
      store.updatePrice();
      return store.product.totalPrice;
    };

    it("reemplazo explícito: la opción ES el precio del platillo", () => {
      const total = elegir([
        {
          qty: 1,
          price_mode: "replace",
          options: [
            { qty: 1, price: 425 },
            { qty: 0, price: 529 },
          ],
        },
      ]);
      expect(total).toBe(425); // NO 850
    });

    it("reemplazo elige la opción marcada, no la primera", () => {
      const total = elegir([
        {
          qty: 1,
          price_mode: "replace",
          options: [
            { qty: 0, price: 425 },
            { qty: 1, price: 669 },
          ],
        },
      ]);
      expect(total).toBe(669);
    });

    it("suma explícita: la opción se agrega al precio base", () => {
      const total = elegir([
        {
          qty: 1,
          price_mode: "add",
          options: [
            { qty: 0, price: 0 },
            { qty: 1, price: 91 },
          ],
        },
      ]);
      expect(total).toBe(516); // 425 + 91
    });

    it("Charola Premium: un extra que suma y otro que reemplaza conviven", () => {
      store.product = {
        price: "534.00",
        totalPrice: 0,
        extras: [
          { qty: 1, price_mode: "add", options: [{ qty: 1, price: 0 }] },
          { qty: 1, price_mode: "replace", options: [{ qty: 1, price: 534 }] },
        ],
      };
      store.updatePrice();
      expect(store.product.totalPrice).toBe(534); // NO 1068
    });

    it("sin el campo, el respaldo reproduce la conducta vieja (todas con precio)", () => {
      const total = elegir([
        {
          qty: 1,
          options: [
            { qty: 1, price: 425 },
            { qty: 0, price: 529 },
          ],
        },
      ]);
      expect(total).toBe(425);
    });

    it("sin el campo y con una opción en cero, suma (configuración correcta)", () => {
      const total = elegir([
        {
          qty: 1,
          options: [
            { qty: 0, price: 0 },
            { qty: 1, price: 91 },
          ],
        },
      ]);
      expect(total).toBe(516);
    });
  });

  // La vitrina anunciaba el precio de oferta y el carrito cobraba el normal, porque
  // seeProduct/updatePrice usaban siempre `price`. El servidor SÍ usa special_price,
  // asi que el mensaje de WhatsApp y el pedido guardado no coincidian.
  describe("precio de oferta", () => {
    const futuro = "2099-12-31T23:59:59";
    const pasado = "2020-01-01T00:00:00";

    it("el carrito cobra el precio de oferta cuando está vigente", () => {
      store.seeProduct({ id: 1, price: "200.00", special_price: "150.00", special_until: futuro, extras: [] });
      expect(store.product.totalPrice).toBe(150);
    });

    it("cobra el precio normal cuando la oferta venció", () => {
      store.seeProduct({ id: 1, price: "200.00", special_price: "150.00", special_until: pasado, extras: [] });
      expect(store.product.totalPrice).toBe(200);
    });

    // Sin fecha de fin la oferta corre hasta que la quiten, que es lo que hace
    // posible "los martes el ceviche a $99, hasta nuevo aviso". Antes se ignoraba,
    // y el panel ofrecía la fecha como opcional: el dueño guardaba el precio y no
    // pasaba nada.
    it("una oferta sin fecha de fin sí se cobra", () => {
      store.seeProduct({ id: 1, price: "200.00", special_price: "150.00", extras: [] });
      expect(store.product.totalPrice).toBe(150);
    });

    it("una oferta de martes no se cobra en lunes", () => {
      vi.setSystemTime(new Date("2026-08-10T12:00:00")); // lunes
      store.seeProduct({
        id: 1, price: "200.00", special_price: "150.00", special_days: [2], extras: [],
      });
      expect(store.product.totalPrice).toBe(200);

      vi.setSystemTime(new Date("2026-08-11T12:00:00")); // martes
      store.seeProduct({
        id: 1, price: "200.00", special_price: "150.00", special_days: [2], extras: [],
      });
      expect(store.product.totalPrice).toBe(150);
      vi.useRealTimers();
    });

    it("los extras que suman se agregan sobre el precio de oferta", () => {
      store.seeProduct({
        id: 1,
        price: "200.00",
        special_price: "150.00",
        special_until: futuro,
        extras: [
          { qty: 1, price_mode: "add", options: [{ id: 1, qty: 1, price: 25 }] },
        ],
      });
      expect(store.product.totalPrice).toBe(175); // 150 + 25, no 225
    });

    it("un extra que reemplaza ignora la oferta, porque ES el precio", () => {
      store.seeProduct({
        id: 1,
        price: "200.00",
        special_price: "150.00",
        special_until: futuro,
        extras: [
          { qty: 1, price_mode: "replace", options: [{ id: 1, qty: 1, price: 300 }] },
        ],
      });
      expect(store.product.totalPrice).toBe(300);
    });
  });

  // El caso que motivó todo esto: "3 sushis por $350", opciones gratis y repetibles.
  describe("updatePrice: promo con contador y opciones en $0", () => {
    it("el total se queda en el precio de la promo aunque elija 3 piezas", () => {
      store.product = {
        price: "350.00",
        totalPrice: 0,
        extras: [
          {
            qty: 3,
            selection_type: "counter",
            price_mode: "add",
            options: [
              { qty: 2, price: 0 }, // dos del mismo
              { qty: 1, price: 0 },
            ],
          },
        ],
      };
      store.updatePrice();
      expect(store.product.totalPrice).toBe(350);
    });

    it("el tope cuenta piezas totales, no opciones marcadas", () => {
      const extra = {
        qty: 3,
        selection_type: "counter",
        options: [
          { qty: 2, price: 0 },
          { qty: 0, price: 0 },
        ],
      };
      store.product = { price: "350.00", totalPrice: 0, extras: [extra] };
      expect(store.isDisabled(extra)).toBe(false); // van 2 de 3
      extra.options[1].qty = 1;
      expect(store.isDisabled(extra)).toBe(true); // ya son 3
    });
  });

  // El caso real: Charola Clásica. Cambiar de tamaño cambia cuántos rollos caben
  // y si aplican los techos por rollo. Se conserva lo elegido y se recorta el
  // sobrante, nunca se limpia todo.
  describe("enforceLimits: recorte al cambiar de tamaño", () => {
    const charola = () => {
      const tamanos = {
        id: 667,
        name: "Número de piezas",
        qty: 1,
        selection_type: "radio",
        price_mode: "replace",
        options: [
          { id: 1, name: "36 Piezas", price: 425, qty: 0, grants_qty: 3 },
          { id: 2, name: "48 Piezas", price: 529, qty: 0, grants_qty: 4, lifts_caps: true },
        ],
      };
      const sushis = {
        id: 703,
        name: "Seleccionar sushis",
        qty: 3,
        selection_type: "counter",
        price_mode: "add",
        qty_from_extra_id: 667,
        options: [
          { id: 10, name: "Bombazo", price: 0, qty: 0 },
          { id: 11, name: "Norteño", price: 0, qty: 0, max_qty: 2 },
          { id: 12, name: "California", price: 0, qty: 0 },
        ],
      };
      store.product = { price: "425.00", totalPrice: 0, qty: 1, extras: [tamanos, sushis] };
      return { tamanos, sushis };
    };

    const elegirTamano = (tamanos, id) => {
      tamanos.options.forEach((o) => (o.qty = o.id === id ? 1 : 0));
    };

    it("bajar de 48 a 36 recorta el rollo que ya no cabe", () => {
      const { tamanos, sushis } = charola();
      elegirTamano(tamanos, 2); // 48 -> 4 rollos
      sushis.options[0].qty = 2; // Bombazo
      sushis.options[2].qty = 2; // California

      elegirTamano(tamanos, 1); // 36 -> 3 rollos
      const quitados = store.enforceLimits();

      expect(store.product.extras[1].options[0].qty + store.product.extras[1].options[2].qty).toBe(3);
      // Se recorta desde el final, o sea lo último que agregó.
      expect(sushis.options[2].qty).toBe(1);
      expect(quitados).toEqual([{ name: "California", count: 1 }]);
    });

    // Bajar de tamaño también reactiva los techos por rollo.
    it("bajar a 36 recorta el tercer Norteño aunque el total sí cupiera", () => {
      const { tamanos, sushis } = charola();
      elegirTamano(tamanos, 2); // 48, sin techos
      sushis.options[1].qty = 3; // 3 Norteños, permitido con 48

      elegirTamano(tamanos, 1); // 36, techo de 2 vuelve a aplicar
      const quitados = store.enforceLimits();

      expect(sushis.options[1].qty).toBe(2);
      expect(quitados).toEqual([{ name: "Norteño", count: 1 }]);
    });

    it("subir de 36 a 48 conserva todo y no quita nada", () => {
      const { tamanos, sushis } = charola();
      elegirTamano(tamanos, 1);
      sushis.options[0].qty = 1;
      sushis.options[1].qty = 2;

      elegirTamano(tamanos, 2);
      const quitados = store.enforceLimits();

      expect(sushis.options[0].qty).toBe(1);
      expect(sushis.options[1].qty).toBe(2);
      expect(quitados).toEqual([]);
    });

    it("con 48 se permiten 4 iguales del rollo caro", () => {
      const { tamanos, sushis } = charola();
      elegirTamano(tamanos, 2);
      sushis.options[1].qty = 4;

      expect(store.enforceLimits()).toEqual([]);
      expect(sushis.options[1].qty).toBe(4);
    });

    it("una selección que ya cabe no se toca", () => {
      const { tamanos, sushis } = charola();
      elegirTamano(tamanos, 1);
      sushis.options[0].qty = 2;
      sushis.options[1].qty = 1;

      expect(store.enforceLimits()).toEqual([]);
      expect(sushis.options[0].qty).toBe(2);
      expect(sushis.options[1].qty).toBe(1);
    });

    it("no toca los grupos de elegir uno", () => {
      const { tamanos } = charola();
      elegirTamano(tamanos, 1);
      store.enforceLimits();
      expect(tamanos.options[0].qty).toBe(1);
    });

    it("un platillo sin extras no revienta", () => {
      store.product = { price: "100.00", totalPrice: 0, qty: 1, extras: [] };
      expect(() => store.enforceLimits()).not.toThrow();
      expect(store.enforceLimits()).toEqual([]);
    });
  });

  // Los grupos de una sola opción se esconden del menú, pero siguen en los datos y
  // su opción sigue seleccionada. Esta es la garantía de que esconder NO es borrar:
  // el precio que se cobra tiene que ser exactamente el mismo.
  describe("grupos escondidos: el precio no cambia", () => {
    it("el caso real de Súper Tortas sigue costando lo mismo", () => {
      store.seeProduct({
        id: 1,
        name: "Jamón y Queso Super",
        price: "50.00",
        extras: [
          {
            id: 9,
            name: "Opciones",
            qty: 1,
            is_required: 1,
            selection_type: "radio",
            price_mode: "replace",
            options: [{ id: 90, name: "Base", price: 50, qty: 0 }],
          },
        ],
      });

      // La opción se preselecciona sola aunque no se vea.
      expect(store.product.extras[0].options[0].qty).toBe(1);
      expect(store.product.totalPrice).toBe(50);
    });

    it("un grupo escondido conviviendo con uno visible no altera la suma", () => {
      store.seeProduct({
        id: 1,
        price: "50.00",
        extras: [
          {
            id: 9,
            qty: 1,
            is_required: 1,
            selection_type: "radio",
            price_mode: "replace",
            options: [{ id: 90, name: "Base", price: 50, qty: 0 }],
          },
          {
            id: 10,
            qty: 2,
            selection_type: "counter",
            price_mode: "add",
            options: [
              { id: 100, name: "Queso extra", price: 15, qty: 0 },
              { id: 101, name: "Aguacate", price: 20, qty: 0 },
            ],
          },
        ],
      });

      store.product.extras[1].options[0].qty = 1;
      store.updatePrice();

      expect(store.product.totalPrice).toBe(65); // 50 del reemplazo + 15 del extra
    });
  });

  describe("isDisabled", () => {
    beforeEach(() => {
      store.product = {
        price: "50.00",
        totalPrice: 0,
        extras: [],
      };
    });

    it("returns true when sum of option qty >= extra qty", () => {
      const extra = {
        qty: 2,
        options: [
          { qty: 1, price: 0 },
          { qty: 1, price: 0 },
        ],
      };
      expect(store.isDisabled(extra)).toBe(true);
    });

    it("returns false when sum of option qty < extra qty", () => {
      const extra = {
        qty: 3,
        options: [
          { qty: 1, price: 0 },
          { qty: 0, price: 0 },
        ],
      };
      expect(store.isDisabled(extra)).toBe(false);
    });
  });

  describe("clear", () => {
    it("resets all state", () => {
      store.items = [{ id: 1 }];
      store.categories = [{ id: 1 }];
      store.product = { name: "Tacos" };
      store.editing = 2;

      store.clear();
      expect(store.product).toBeNull();
      expect(store.items).toEqual([]);
      expect(store.categories).toEqual([]);
      expect(store.editing).toBe(-1);
    });
  });

  describe("edge cases / errors", () => {
    it("getProductsByCategoryId with non-existent category returns empty", () => {
      store.setProducts([
        { id: 1, name: "Tacos", dish_category_id: 1 },
      ]);
      const result = store.getProductsByCategoryId(999, "");
      expect(result).toHaveLength(0);
    });

    it("getProductsByCategoryId with empty search string returns all in category", () => {
      store.setProducts([
        { id: 1, name: "A", dish_category_id: 1 },
        { id: 2, name: "B", dish_category_id: 1 },
      ]);
      const result = store.getProductsByCategoryId(1, "");
      expect(result).toHaveLength(2);
    });

    it("getProductsByCategoryId with null search returns all in category", () => {
      store.setProducts([
        { id: 1, name: "A", dish_category_id: 1 },
      ]);
      const result = store.getProductsByCategoryId(1, null);
      expect(result).toHaveLength(1);
    });

    it("seeProduct with no extras uses base price", () => {
      store.seeProduct({
        id: 1,
        name: "Simple",
        price: "75.50",
        extras: [],
      });
      expect(store.product.totalPrice).toBe(75.5);
      expect(store.product.qty).toBe(1);
    });

    it("seeProduct with string price parses correctly", () => {
      store.seeProduct({
        id: 1,
        name: "Test",
        price: "0.01",
        extras: [],
      });
      expect(store.product.totalPrice).toBe(0.01);
    });

    it("updatePrice with empty options array in extras", () => {
      store.product = {
        price: "50.00",
        totalPrice: 0,
        extras: [{ options: [] }],
      };
      store.updatePrice();
      // base 50 + aditivo (0) = 50
      expect(store.product.totalPrice).toBe(50);
    });

    it("updatePrice with multiple extras sums all", () => {
      store.product = {
        price: "50.00",
        totalPrice: 0,
        extras: [
          { options: [{ qty: 1, price: 10 }] },
          { options: [{ qty: 2, price: 15 }] },
        ],
      };
      store.updatePrice();
      // base 50 + aditivo (10 + 30 = 40) = 90
      expect(store.product.totalPrice).toBe(90);
    });

    it("isDisabled with all options at qty 0", () => {
      store.product = { price: "50", totalPrice: 0, extras: [] };
      const extra = {
        qty: 2,
        options: [
          { qty: 0, price: 0 },
          { qty: 0, price: 0 },
        ],
      };
      expect(store.isDisabled(extra)).toBe(false);
    });

    it("isDisabled with options exceeding max qty", () => {
      store.product = { price: "50", totalPrice: 0, extras: [] };
      const extra = {
        qty: 1,
        options: [
          { qty: 5, price: 10 },
        ],
      };
      expect(store.isDisabled(extra)).toBe(true);
    });

    it("decrement allows qty to go to 0", () => {
      store.product = { name: "Test", price: "50", qty: 1, totalPrice: 50, extras: [] };
      store.decrement();
      expect(store.product.qty).toBe(0);
    });

    it("decrement allows qty to go negative", () => {
      store.product = { name: "Test", price: "50", qty: 0, totalPrice: 50, extras: [] };
      store.decrement();
      expect(store.product.qty).toBe(-1);
    });

    it("seeProduct does not auto-select for non-required extras", () => {
      store.seeProduct({
        id: 1,
        name: "Test",
        price: "50",
        extras: [
          {
            id: 1,
            name: "Opcional",
            order: 1,
            qty: 1,
            is_required: false,
            options: [{ id: 1, name: "A", qty: 0, price: 5 }],
          },
        ],
      });
      const extra = store.product.extras[0];
      expect(extra.options[0].qty).toBe(0);
    });

    it("seeProduct does not auto-select for required extras with qty > 1", () => {
      store.seeProduct({
        id: 1,
        name: "Test",
        price: "50",
        extras: [
          {
            id: 1,
            name: "Multi",
            order: 1,
            qty: 3,
            is_required: true,
            options: [{ id: 1, name: "A", qty: 0, price: 5 }],
          },
        ],
      });
      const extra = store.product.extras[0];
      expect(extra.options[0].qty).toBe(0);
    });

    it("setProducts overwrites previous items", () => {
      store.setProducts([{ id: 1, name: "Old" }]);
      store.setProducts([{ id: 2, name: "New" }]);
      expect(store.items).toHaveLength(1);
      expect(store.items[0].name).toBe("New");
    });

    it("removeProduct removes item from items list by index", () => {
      store.setProducts([
        { id: 1, name: "A" },
        { id: 2, name: "B" },
        { id: 3, name: "C" },
      ]);
      store.removeProduct(1);
      expect(store.items).toHaveLength(2);
      expect(store.items[0].name).toBe("A");
      expect(store.items[1].name).toBe("C");
    });

    it("seeProduct does not mutate original product extras order", () => {
      const original = {
        id: 1,
        name: "Test",
        price: "50",
        extras: [
          { id: 1, name: "Z", order: 3, qty: 1, is_required: false, options: [] },
          { id: 2, name: "A", order: 1, qty: 1, is_required: false, options: [] },
        ],
      };
      const originalFirstName = original.extras[0].name;
      store.seeProduct(original);
      // original array should NOT be mutated
      expect(original.extras[0].name).toBe(originalFirstName);
    });
  });
});
