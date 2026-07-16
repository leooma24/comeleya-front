import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useCartStore } from "stores/cart-store";

describe("cart-store", () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useCartStore();
  });

  describe("initial state", () => {
    it("starts with an empty cart", () => {
      expect(store.cart).toEqual([]);
      expect(store.total).toBe(0);
      expect(store.editing).toBe(-1);
    });

    it("isEmpty returns true when cart is empty", () => {
      expect(store.isEmpty).toBe(true);
    });

    it("isEditing returns false initially", () => {
      expect(store.isEditing).toBe(false);
    });
  });

  describe("addToCart", () => {
    const product = { name: "Tacos", totalPrice: 50, qty: 2 };

    it("adds a product to the cart", () => {
      store.addToCart(product);
      expect(store.cart).toHaveLength(1);
      expect(store.cart[0].name).toBe("Tacos");
    });

    it("updates total after adding a product", () => {
      store.addToCart(product);
      expect(store.total).toBe(100); // 50 * 2
    });

    it("isEmpty returns false after adding a product", () => {
      store.addToCart(product);
      expect(store.isEmpty).toBe(false);
    });

    it("adds multiple products", () => {
      store.addToCart(product);
      store.addToCart({ name: "Burrito", totalPrice: 80, qty: 1 });
      expect(store.cart).toHaveLength(2);
      expect(store.total).toBe(180); // (50*2) + (80*1)
    });

    it("replaces product when editing", () => {
      store.addToCart(product);
      store.editing = 0;
      store.addToCart({ name: "Quesadilla", totalPrice: 30, qty: 1 });
      expect(store.cart).toHaveLength(1);
      expect(store.cart[0].name).toBe("Quesadilla");
      expect(store.editing).toBe(-1);
    });
  });

  describe("editProduct", () => {
    it("sets editing index and returns a copy of the product", () => {
      const product = { name: "Tacos", totalPrice: 50, qty: 2 };
      store.addToCart(product);

      const result = store.editProduct(0);
      expect(store.editing).toBe(0);
      expect(store.isEditing).toBe(true);
      expect(result.name).toBe("Tacos");
    });

    it("returns a copy, not a reference", () => {
      const product = { name: "Tacos", totalPrice: 50, qty: 2 };
      store.addToCart(product);

      const result = store.editProduct(0);
      result.name = "Changed";
      expect(store.cart[0].name).toBe("Tacos");
    });
  });

  describe("removeProduct", () => {
    it("removes a product by index", () => {
      store.addToCart({ name: "Tacos", totalPrice: 50, qty: 1 });
      store.addToCart({ name: "Burrito", totalPrice: 80, qty: 1 });

      store.removeProduct(0);
      expect(store.cart).toHaveLength(1);
      expect(store.cart[0].name).toBe("Burrito");
    });

    it("updates total after removing", () => {
      store.addToCart({ name: "Tacos", totalPrice: 50, qty: 1 });
      store.addToCart({ name: "Burrito", totalPrice: 80, qty: 1 });

      store.removeProduct(0);
      expect(store.total).toBe(80);
    });

    it("cart is empty after removing last product", () => {
      store.addToCart({ name: "Tacos", totalPrice: 50, qty: 1 });
      store.removeProduct(0);
      expect(store.isEmpty).toBe(true);
      expect(store.total).toBe(0);
    });
  });

  describe("clear", () => {
    it("empties the cart and resets total", () => {
      store.addToCart({ name: "Tacos", totalPrice: 50, qty: 2 });
      store.addToCart({ name: "Burrito", totalPrice: 80, qty: 1 });

      store.clear();
      expect(store.cart).toEqual([]);
      expect(store.total).toBe(0);
      expect(store.isEmpty).toBe(true);
    });
  });

  describe("updateTotal", () => {
    it("calculates total based on totalPrice * qty", () => {
      store.cart = [
        { name: "Tacos", totalPrice: 50, qty: 3 },
        { name: "Burrito", totalPrice: 80, qty: 2 },
      ];
      store.updateTotal();
      expect(store.total).toBe(310); // (50*3) + (80*2)
    });

    it("returns 0 for empty cart", () => {
      store.updateTotal();
      expect(store.total).toBe(0);
    });
  });

  describe("edge cases / errors", () => {
    it("handles product with totalPrice 0", () => {
      store.addToCart({ name: "Gratis", totalPrice: 0, qty: 5 });
      expect(store.total).toBe(0);
      expect(store.cart).toHaveLength(1);
    });

    it("handles product with negative totalPrice", () => {
      store.addToCart({ name: "Descuento", totalPrice: -10, qty: 1 });
      expect(store.total).toBe(-10);
    });

    it("handles product with qty 0", () => {
      store.addToCart({ name: "Nada", totalPrice: 100, qty: 0 });
      expect(store.total).toBe(0);
    });

    it("handles product with decimal totalPrice", () => {
      store.addToCart({ name: "Tacos", totalPrice: 49.99, qty: 3 });
      expect(store.total).toBeCloseTo(149.97);
    });

    it("removeProduct on invalid index does not break cart", () => {
      store.addToCart({ name: "Tacos", totalPrice: 50, qty: 1 });
      store.removeProduct(5); // index out of bounds
      expect(store.cart).toHaveLength(1); // splice with invalid index removes nothing
    });

    it("editProduct on invalid index sets editing but returns undefined properties", () => {
      store.addToCart({ name: "Tacos", totalPrice: 50, qty: 1 });
      const result = store.editProduct(99);
      expect(store.editing).toBe(99);
      expect(result).toBeDefined(); // Object.assign({}, undefined) returns {}
    });

    it("addToCart replaces at editing index even if cart has multiple items", () => {
      store.addToCart({ name: "A", totalPrice: 10, qty: 1 });
      store.addToCart({ name: "B", totalPrice: 20, qty: 1 });
      store.addToCart({ name: "C", totalPrice: 30, qty: 1 });

      store.editing = 1; // editing "B"
      store.addToCart({ name: "D", totalPrice: 40, qty: 1 });

      expect(store.cart).toHaveLength(3);
      expect(store.cart[1].name).toBe("D");
      expect(store.total).toBe(80); // 10 + 40 + 30
    });

    it("clear after editing resets editing state", () => {
      store.addToCart({ name: "Tacos", totalPrice: 50, qty: 1 });
      store.editProduct(0);
      expect(store.isEditing).toBe(true);

      store.clear();
      expect(store.cart).toEqual([]);
      expect(store.total).toBe(0);
      expect(store.editing).toBe(-1);
      expect(store.isEditing).toBe(false);
    });

    it("addToCart does not mutate the original product object", () => {
      const product = { name: "Tacos", totalPrice: 50, qty: 2 };
      store.addToCart(product);

      store.cart[0].name = "Changed";
      expect(product.name).toBe("Tacos");
    });

    it("handles very large quantities", () => {
      store.addToCart({ name: "Bulk", totalPrice: 1, qty: 1000000 });
      expect(store.total).toBe(1000000);
    });
  });
});
