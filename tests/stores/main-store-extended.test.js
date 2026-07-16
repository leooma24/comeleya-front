import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useMainStore } from "stores/main-store";
import { api } from "boot/axios";

describe("main-store - extended coverage", () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useMainStore();
    vi.clearAllMocks();
    vi.stubGlobal("open", vi.fn());
    vi.stubGlobal("document", {
      querySelector: () => ({
        style: {
          setProperty: vi.fn(),
          backgroundColor: "",
          color: "",
          fontFamily: "",
        },
      }),
    });
  });

  // --- Coupon ---
  describe("applyCoupon", () => {
    it("returns false when code is empty", async () => {
      const result = await store.applyCoupon("");
      expect(result).toBe(false);
    });

    it("returns false when code is null", async () => {
      const result = await store.applyCoupon(null);
      expect(result).toBe(false);
    });

    it("applies coupon successfully", async () => {
      store.companyStore.slug = "test";
      store.cartStore.addToCart({ name: "Tacos", totalPrice: 100, qty: 1 });

      api.post.mockResolvedValueOnce({
        data: { coupon_id: 5, discount: 20 },
      });

      const result = await store.applyCoupon("DESC20");
      expect(result).toBe(true);
      expect(store.coupon.applied).toBe(true);
      expect(store.coupon.discount).toBe(20);
      expect(store.coupon.code).toBe("DESC20");
      expect(store.coupon.id).toBe(5);
    });

    it("returns false on invalid coupon", async () => {
      store.companyStore.slug = "test";

      api.post.mockRejectedValueOnce({
        response: { data: { message: "Cupón expirado" } },
      });

      const result = await store.applyCoupon("INVALID");
      expect(result).toBe(false);
      expect(store.coupon.applied).toBe(false);
    });

    it("handles network error on coupon validation", async () => {
      store.companyStore.slug = "test";

      api.post.mockRejectedValueOnce(new Error("Network"));

      const result = await store.applyCoupon("CODE");
      expect(result).toBe(false);
    });
  });

  describe("removeCoupon", () => {
    it("resets coupon state", () => {
      store.coupon = { id: 5, code: "ABC", discount: 20, applied: true };
      store.removeCoupon();
      expect(store.coupon.applied).toBe(false);
      expect(store.coupon.discount).toBe(0);
      expect(store.coupon.id).toBeNull();
    });
  });

  // --- Reorder ---
  describe("reorder", () => {
    beforeEach(() => {
      store.companyStore.slug = "test";
    });

    it("loads history entry into cart", () => {
      const entry = {
        establishment: "test",
        cart: [
          { name: "Tacos", totalPrice: 50, qty: 2 },
          { name: "Burrito", totalPrice: 80, qty: 1 },
        ],
      };

      store.reorder(entry);
      expect(store.cartStore.cart).toHaveLength(2);
      expect(store.cartDrawer).toBe(true);
    });

    it("rejects reorder from different establishment", () => {
      const entry = {
        establishment: "other-place",
        cart: [{ name: "Pizza", totalPrice: 120, qty: 1 }],
      };

      store.reorder(entry);
      expect(store.cartStore.cart).toHaveLength(0);
    });

    it("clears existing cart before reorder", () => {
      store.cartStore.addToCart({ name: "Old", totalPrice: 10, qty: 1 });

      store.reorder({
        establishment: "test",
        cart: [{ name: "New", totalPrice: 50, qty: 1 }],
      });

      expect(store.cartStore.cart).toHaveLength(1);
      expect(store.cartStore.cart[0].name).toBe("New");
    });
  });

  // --- Search ---
  describe("searchResults", () => {
    beforeEach(() => {
      store.productStore.setProducts([
        { id: 1, name: "Tacos al pastor", dish_category_id: 1 },
        { id: 2, name: "Burrito de carne", dish_category_id: 1 },
        { id: 3, name: "Taco de suadero", dish_category_id: 2 },
      ]);
    });

    it("returns empty when search is empty", () => {
      store.search = "";
      expect(store.searchResults).toEqual([]);
    });

    it("filters products by search term", () => {
      store.search = "taco";
      expect(store.searchResults).toHaveLength(2);
    });

    it("is case insensitive", () => {
      store.search = "BURRITO";
      expect(store.searchResults).toHaveLength(1);
    });

    it("returns empty for no matches", () => {
      store.search = "pizza";
      expect(store.searchResults).toHaveLength(0);
    });
  });

  describe("isSearching", () => {
    it("returns falsy when search is empty", () => {
      store.search = "";
      expect(store.isSearching).toBeFalsy();
    });

    it("returns true when search has content", () => {
      store.search = "tacos";
      expect(store.isSearching).toBe(true);
    });
  });

  // --- Theme ---
  describe("setPrimaryColor", () => {
    it("strips # from color and sets", () => {
      store.setPrimaryColor("#FF0000");
      expect(store.companyStore.color).toBe("FF0000");
    });

    it("handles color without #", () => {
      store.setPrimaryColor("FF0000");
      expect(store.companyStore.color).toBe("FF0000");
    });
  });

  describe("applyThemeConfig", () => {
    it("does nothing when config is null", () => {
      expect(() => store.applyThemeConfig(null)).not.toThrow();
    });

    it("applies secondary color", () => {
      const spy = vi.fn();
      vi.stubGlobal("document", {
        querySelector: () => ({
          style: { setProperty: spy, backgroundColor: "", color: "", fontFamily: "" },
        }),
      });

      store.applyThemeConfig({ secondary_color: "#333" });
      expect(spy).toHaveBeenCalledWith("--q-secondary", "#333");
    });

    it("applies all theme properties", () => {
      const spy = vi.fn();
      vi.stubGlobal("document", {
        querySelector: () => ({
          style: { setProperty: spy, backgroundColor: "", color: "", fontFamily: "" },
        }),
      });

      store.applyThemeConfig({
        secondary_color: "#333",
        accent_color: "#666",
        background_color: "#FFF",
        text_color: "#000",
        font_family: "Arial",
        border_radius: 8,
      });

      expect(spy).toHaveBeenCalledWith("--q-secondary", "#333");
      expect(spy).toHaveBeenCalledWith("--q-accent", "#666");
      expect(spy).toHaveBeenCalledWith("--mc-bg", "#FFF");
      expect(spy).toHaveBeenCalledWith("--mc-text", "#000");
      expect(spy).toHaveBeenCalledWith("--mc-radius", "8px");
    });
  });

  describe("checkColor", () => {
    it("applies color when stored", () => {
      store.companyStore.color = "FF0000";
      store.checkColor();
      expect(store.companyStore.color).toBe("FF0000");
    });

    it("does nothing when no color stored", () => {
      store.companyStore.color = "";
      expect(() => store.checkColor()).not.toThrow();
    });
  });

  // --- Getters ---
  describe("additional getters", () => {
    it("data returns userStore data", () => {
      store.userStore.data = { name: "Omar" };
      expect(store.data.name).toBe("Omar");
    });

    it("categories returns product categories", () => {
      store.productStore.setCategories([{ id: 1 }]);
      expect(store.categories).toHaveLength(1);
    });

    it("featuredProducts returns featured items", () => {
      store.productStore.setProducts([
        { id: 1, name: "A", is_featured: true },
        { id: 2, name: "B", is_featured: false },
      ]);
      expect(store.featuredProducts).toHaveLength(1);
    });

    it("specialOffers filters by price and date", () => {
      store.productStore.setProducts([
        { id: 1, name: "A", special_price: 50, special_until: "2099-12-31" },
        { id: 2, name: "B", special_price: null },
      ]);
      expect(store.specialOffers).toHaveLength(1);
    });

    it("getHours returns company hours", () => {
      store.companyStore.company = { hours: [{ day: "lunes" }] };
      expect(store.getHours).toHaveLength(1);
    });

    it("totalPrice returns product total * qty", () => {
      store.productStore.product = { totalPrice: 50, qty: 3 };
      expect(store.totalPrice).toBe(150);
    });

    it("totalToPay includes coupon discount", () => {
      store.cartStore.addToCart({ name: "A", totalPrice: 100, qty: 1 });
      store.tip.value = 10;
      store.coupon.discount = 20;
      store.userStore.data = { delivery: "Recoger" };
      store.companyStore.company = {};
      expect(store.totalToPay).toBe(90); // 100 + 10 - 20
    });

    it("orderHistory filters by current slug", () => {
      store.companyStore.slug = "test";
      store.orderStore.orderHistory = [
        { establishment: "test", order_code: "1" },
        { establishment: "other", order_code: "2" },
        { establishment: "test", order_code: "3" },
      ];
      expect(store.orderHistory).toHaveLength(2);
    });
  });

  // --- Delegation actions ---
  describe("delegation actions", () => {
    it("isDisabled delegates to productStore", () => {
      store.productStore.product = { price: "50", totalPrice: 0, extras: [] };
      const extra = { qty: 2, options: [{ qty: 1, price: 0 }, { qty: 1, price: 0 }] };
      expect(store.isDisabled(extra)).toBe(true);
    });

    it("updatePrice delegates to productStore", () => {
      store.productStore.product = { price: "50", totalPrice: 0, extras: [] };
      store.updatePrice();
      expect(store.productStore.product.totalPrice).toBe(50);
    });

    it("incrementProduct delegates", () => {
      store.productStore.product = { price: "50", qty: 1, totalPrice: 50, extras: [] };
      store.incrementProduct();
      expect(store.productStore.product.qty).toBe(2);
    });

    it("decrementProduct delegates", () => {
      store.productStore.product = { price: "50", qty: 3, totalPrice: 50, extras: [] };
      store.decrementProduct();
      expect(store.productStore.product.qty).toBe(2);
    });

    it("countByCategory returns true when count > 0", () => {
      store.productStore.countByCategory[1] = 5;
      expect(store.countByCategory(1)).toBe(true);
    });

    it("countByCategory returns false when count is 0", () => {
      store.productStore.countByCategory[1] = 0;
      expect(store.countByCategory(1)).toBe(false);
    });
  });

  // --- seeProduct / editProduct ---
  describe("seeProduct / editProduct", () => {
    it("seeProduct opens addCartDrawer", async () => {
      const product = { id: 1, name: "Tacos", price: "50", extras: [] };
      await store.seeProduct(product);
      expect(store.addCartDrawer).toBe(true);
      expect(store.productStore.product).toBeDefined();
    });

    it("editProduct opens addCartDrawer and closes cartDrawer", () => {
      store.cartStore.addToCart({ name: "Tacos", totalPrice: 50, qty: 1 });
      store.cartDrawer = true;

      store.editProduct(0);
      expect(store.addCartDrawer).toBe(true);
      expect(store.cartDrawer).toBe(false);
    });
  });

  // --- getTowns ---
  describe("getTowns", () => {
    it("fetches towns by zip", async () => {
      store.userStore.data = { zip: "80000" };

      api.get.mockResolvedValueOnce({
        data: { towns: ["Centro", "Norte"] },
      });

      await store.getTowns();
      expect(store.userStore.data.towns).toEqual(["Centro", "Norte"]);
    });
  });

  // --- creatingOrder with coupon ---
  describe("creatingOrder with coupon", () => {
    beforeEach(() => {
      store.cartStore.addToCart({
        name: "Tacos",
        totalPrice: 100,
        qty: 1,
        extras: [],
      });
      store.userStore.data = { name: "Omar", phone: "123", delivery: "Recoger" };
      store.companyStore.company = {
        name: "Test",
        whatsapp: "123",
        features: [],
      };
      store.companyStore.slug = "test";
      store.orderStore.order = { order_code: "ORD-1" };
    });

    it("includes coupon_id when coupon is applied", async () => {
      store.coupon = { id: 5, code: "DESC20", discount: 20, applied: true };
      store.payment = { type: "Tarjeta", value: "" };

      api.post.mockResolvedValueOnce({
        data: { id: 1, order_code: "ORD-1" },
      });

      await store.creatingOrder();

      const payload = api.post.mock.calls[0][1];
      expect(payload.coupon_id).toBe(5);
    });

    it("sends null coupon_id when no coupon applied", async () => {
      store.payment = { type: "Tarjeta", value: "" };

      api.post.mockResolvedValueOnce({
        data: { id: 1, order_code: "ORD-1" },
      });

      await store.creatingOrder();

      const payload = api.post.mock.calls[0][1];
      expect(payload.coupon_id).toBeNull();
    });

    it("saves order to history after creating", async () => {
      store.payment = { type: "Tarjeta", value: "" };

      api.post.mockResolvedValueOnce({
        data: { id: 1, order_code: "ORD-99" },
      });

      await store.creatingOrder();

      expect(store.orderStore.orderHistory).toHaveLength(1);
      expect(store.orderStore.orderHistory[0].order_code).toBe("ORD-99");
    });
  });

  // --- WhatsApp with coupon ---
  describe("buildWhatsAppUrl with coupon", () => {
    it("includes coupon info in WhatsApp message", () => {
      store.cartStore.addToCart({
        name: "Tacos",
        totalPrice: 100,
        qty: 1,
        extras: [],
      });
      store.userStore.data = { name: "Omar", phone: "123", delivery: "Recoger" };
      store.companyStore.company = {
        name: "Test",
        whatsapp: "123",
        features: [],
      };
      store.orderStore.order = { order_code: "ORD-1" };
      store.coupon = { id: 5, code: "DESC20", discount: 20, applied: true };

      store.buildWhatsAppUrl();

      const decoded = decodeURIComponent(store.whatsappUrl);
      expect(decoded).toContain("DESC20");
      expect(decoded).toContain("-$20.00");
    });
  });
});
