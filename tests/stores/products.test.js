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
      expect(store.product.totalPrice).toBe(20); // 10 + (2*5)
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
      expect(store.product.totalPrice).toBe(0);
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
      expect(store.product.totalPrice).toBe(0);
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
      expect(store.product.totalPrice).toBe(40); // 10 + 30
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
