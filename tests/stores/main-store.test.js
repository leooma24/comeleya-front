import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useMainStore } from "stores/main-store";
import { api } from "boot/axios";

describe("main-store", () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useMainStore();
    vi.clearAllMocks();
    // Mock window.open
    vi.stubGlobal("open", vi.fn());
  });

  describe("initial state", () => {
    it("starts with all drawers closed", () => {
      expect(store.addCartDrawer).toBe(false);
      expect(store.cartDrawer).toBe(false);
      expect(store.dataDrawer).toBe(false);
      expect(store.paymentDrawer).toBe(false);
      expect(store.validationDialog).toBe(false);
    });

    it("starts with default tip", () => {
      expect(store.tip.type).toBe("price");
      expect(store.tip.value).toBe(0);
    });

    it("starts with default payment", () => {
      expect(store.payment.type).toBe("Efectivo");
    });
  });

  describe("setTip", () => {
    it("sets tip with price type", () => {
      store.setTip(25);
      expect(store.tip.type).toBe("price");
      expect(store.tip.value).toBe(25);
    });

    it("sets tip to otro type", () => {
      store.setTip("otro");
      expect(store.tip.type).toBe("otro");
      expect(store.tip.value).toBe(0);
    });

    it("sets tip to 0", () => {
      store.setTip(0);
      expect(store.tip.value).toBe(0);
      expect(store.tip.type).toBe("price");
    });
  });

  describe("clearAll", () => {
    it("clears cart and closes all drawers", () => {
      store.addCartDrawer = true;
      store.cartDrawer = true;
      store.dataDrawer = true;
      store.paymentDrawer = true;
      store.validationDialog = true;

      store.clearAll();

      expect(store.addCartDrawer).toBe(false);
      expect(store.cartDrawer).toBe(false);
      expect(store.dataDrawer).toBe(false);
      expect(store.paymentDrawer).toBe(false);
      expect(store.validationDialog).toBe(false);
    });
  });

  describe("addToCart", () => {
    beforeEach(() => {
      store.companyStore.company = { isOpen: true };
      store.productStore.product = {
        name: "Tacos",
        price: "50",
        qty: 1,
        totalPrice: 50,
        extras: [],
      };
    });

    it("adds product when store is open and valid", () => {
      store.addToCart();
      expect(store.cartStore.cart).toHaveLength(1);
      expect(store.addCartDrawer).toBe(false);
    });

    it("shows error when establishment is closed", () => {
      store.companyStore.company = { isOpen: false };
      store.addToCart();
      expect(store.cartStore.cart).toHaveLength(0);
    });

    it("shows error when qty is 0", () => {
      store.productStore.product.qty = 0;
      store.addToCart();
      expect(store.cartStore.cart).toHaveLength(0);
    });

    it("shows error when totalPrice is 0", () => {
      store.productStore.product.totalPrice = 0;
      store.addToCart();
      expect(store.cartStore.cart).toHaveLength(0);
    });

    it("shows error for required extras without selection", () => {
      store.productStore.product.extras = [
        {
          name: "Salsa",
          is_required: true,
          hasError: false,
          options: [{ qty: 0 }, { qty: 0 }],
        },
      ];
      store.addToCart();
      expect(store.cartStore.cart).toHaveLength(0);
      expect(store.productStore.product.extras[0].hasError).toBe(true);
    });

    it("allows non-required extras without selection", () => {
      store.productStore.product.extras = [
        {
          name: "Salsa",
          is_required: false,
          hasError: false,
          options: [{ qty: 0 }],
        },
      ];
      store.addToCart();
      expect(store.cartStore.cart).toHaveLength(1);
    });

    it("shows multiple errors at once (qty 0 + required extra)", () => {
      store.productStore.product.qty = 0;
      store.productStore.product.extras = [
        {
          name: "Salsa",
          is_required: true,
          hasError: false,
          options: [{ qty: 0 }],
        },
      ];
      store.addToCart();
      expect(store.cartStore.cart).toHaveLength(0);
    });

    it("opens cartDrawer when editing", () => {
      store.cartStore.editing = 0;
      store.cartStore.cart = [{ name: "Old", totalPrice: 10, qty: 1 }];
      store.addToCart();
      expect(store.cartDrawer).toBe(true);
    });
  });

  describe("removeProduct", () => {
    it("removes product and keeps cartDrawer open if cart not empty", () => {
      store.cartStore.addToCart({ name: "A", totalPrice: 10, qty: 1 });
      store.cartStore.addToCart({ name: "B", totalPrice: 20, qty: 1 });
      store.cartDrawer = true;

      store.removeProduct(0);
      expect(store.cartStore.cart).toHaveLength(1);
      expect(store.cartDrawer).toBe(true);
    });

    it("closes cartDrawer when cart becomes empty", () => {
      store.cartStore.addToCart({ name: "A", totalPrice: 10, qty: 1 });
      store.cartDrawer = true;

      store.removeProduct(0);
      expect(store.cartStore.isEmpty).toBe(true);
      expect(store.cartDrawer).toBe(false);
    });
  });

  describe("getters", () => {
    it("btnType returns 'Agregar' when not editing", () => {
      expect(store.btnType).toBe("Agregar");
    });

    it("btnType returns 'Actualizar' when editing", () => {
      store.cartStore.editing = 0;
      expect(store.btnType).toBe("Actualizar");
    });

    it("deliveryCharge returns 0 when not delivery", () => {
      store.userStore.data = { delivery: "Recoger" };
      store.companyStore.company = { delivery_charge: 50 };
      expect(store.deliveryCharge).toBe(0);
    });

    it("getTip returns tip value", () => {
      store.tip.value = 30;
      expect(store.getTip).toBe(30);
    });

    it("totalToPay sums total + tip + delivery", () => {
      store.cartStore.addToCart({ name: "A", totalPrice: 100, qty: 1 });
      store.tip.value = 20;
      store.userStore.data = { delivery: "Envio" };
      store.companyStore.company = { delivery_charge: 30 };
      expect(store.totalToPay).toBe(150); // 100 + 20 + 30
    });
  });

  describe("creatingOrder", () => {
    const cartProduct = {
      name: "Tacos",
      totalPrice: 50,
      qty: 1,
      extras: [
        {
          name: "Salsa",
          qty: 1,
          options: [{ name: "Verde", qty: 1, price: 0 }],
        },
      ],
    };

    beforeEach(() => {
      store.cartStore.addToCart(cartProduct);
      store.userStore.data = { name: "Omar", phone: "123", delivery: "Recoger" };
      store.companyStore.company = {
        name: "Test",
        whatsapp: "1234567890",
        features: [],
      };
      store.companyStore.slug = "test-slug";
      store.orderStore.order = { order_code: "ORD-1" };
    });

    it("creates order successfully", async () => {
      store.payment = { type: "Tarjeta", value: "" };

      api.post.mockResolvedValueOnce({
        data: { id: 1, order_code: "ORD-1" },
      });

      const result = await store.creatingOrder();
      expect(result).toBe(true);
      expect(store.validationDialog).toBe(true);
      expect(store.paymentDrawer).toBe(false);
    });

    it("shows error when cash amount is less than total", async () => {
      store.payment = { type: "Efectivo", value: 10 };

      await store.creatingOrder();
      expect(store.hasError.payment).toBe(true);
    });

    it("does not show error when payment is not Efectivo", async () => {
      store.payment = { type: "Tarjeta", value: 0 };

      api.post.mockResolvedValueOnce({
        data: { id: 1, order_code: "ORD-1" },
      });

      const result = await store.creatingOrder();
      expect(store.hasError.payment).toBe(false);
      expect(result).toBe(true);
    });

    it("allows Efectivo when value >= total", async () => {
      store.payment = { type: "Efectivo", value: 100 };

      api.post.mockResolvedValueOnce({
        data: { id: 1, order_code: "ORD-1" },
      });

      const result = await store.creatingOrder();
      expect(store.hasError.payment).toBe(false);
      expect(result).toBe(true);
    });
  });

  describe("getEstablishment", () => {
    it("returns false for inactive establishment", async () => {
      store.companyStore.slug = "";
      api.get.mockResolvedValueOnce({
        data: {
          status: "Inactivo",
          dishes: [],
          dish_categories: [],
        },
      });

      const result = await store.getEstablishment("test-slug");
      expect(result).toBe(false);
    });

    it("sets products and categories on success", async () => {
      store.companyStore.slug = "";
      api.get.mockResolvedValueOnce({
        data: {
          status: "Activo",
          dishes: [{ id: 1, name: "Tacos" }],
          dish_categories: [{ id: 1, name: "Cat" }],
          color: "#ff0000",
        },
      });

      // Mock body for setPrimaryColor
      vi.stubGlobal("document", {
        querySelector: () => ({
          style: { setProperty: vi.fn() },
        }),
      });

      const result = await store.getEstablishment("test-slug");
      expect(result).toBe(true);
      expect(store.productStore.items).toHaveLength(1);
    });
  });

  describe("setSlug", () => {
    it("clears cart and drawers when slug changes", () => {
      store.companyStore.slug = "old";
      store.cartStore.addToCart({ name: "A", totalPrice: 10, qty: 1 });
      store.addCartDrawer = true;

      store.setSlug("new");
      expect(store.cartStore.cart).toEqual([]);
      expect(store.addCartDrawer).toBe(false);
    });

    it("does nothing when slug is the same", () => {
      store.companyStore.slug = "same";
      store.cartStore.addToCart({ name: "A", totalPrice: 10, qty: 1 });

      store.setSlug("same");
      expect(store.cartStore.cart).toHaveLength(1);
    });
  });

  describe("hasService", () => {
    it("returns true when feature value is 1", () => {
      store.companyStore.company = {
        features: [{ feature_id: 1, value: "1" }],
      };
      expect(store.hasService(1)).toBe(true);
    });

    it("returns false when feature value is 0", () => {
      store.companyStore.company = {
        features: [{ feature_id: 1, value: "0" }],
      };
      expect(store.hasService(1)).toBe(false);
    });

    it("returns falsy when feature not found", () => {
      store.companyStore.company = { features: [] };
      expect(store.hasService(999)).toBeFalsy();
    });
  });

  // El mensaje de WhatsApp es lo que el restaurante lee para preparar el pedido:
  // si la nota no sale aquí, la cocina nunca se entera.
  describe("buildWhatsAppUrl: comentario por platillo", () => {
    const prepararPedido = () => {
      store.companyStore.company = { name: "Test", whatsapp: "9876543210", features: [] };
      store.userStore.data = { name: "Omar", phone: "1234567890", delivery: "Recoger" };
      store.orderStore.order = { order_code: "ORD-1" };
      store.payment = { type: "Efectivo", value: 0 };
    };

    const mensaje = () => decodeURIComponent(store.whatsappUrl.split("?text=")[1] ?? "");

    beforeEach(prepararPedido);

    it("imprime la nota debajo de su platillo", () => {
      store.cartStore.addToCart({ name: "Charola", totalPrice: 550, qty: 1, extras: [], notes: "Sin cebolla" });
      store.buildWhatsAppUrl();

      const texto = mensaje();
      expect(texto).toContain("Sin cebolla");
      // Debe ir DESPUÉS del platillo al que pertenece, no al final del mensaje.
      expect(texto.indexOf("Sin cebolla")).toBeGreaterThan(texto.indexOf("Charola"));
    });

    it("cada platillo lleva la suya", () => {
      store.cartStore.addToCart({ name: "Charola", totalPrice: 550, qty: 1, extras: [], notes: "Sin cebolla" });
      store.cartStore.addToCart({ name: "Bazuka", totalPrice: 170, qty: 1, extras: [], notes: "Extra picante" });
      store.buildWhatsAppUrl();

      const texto = mensaje();
      expect(texto.indexOf("Sin cebolla")).toBeGreaterThan(texto.indexOf("Charola"));
      expect(texto.indexOf("Sin cebolla")).toBeLessThan(texto.indexOf("Bazuka"));
      expect(texto.indexOf("Extra picante")).toBeGreaterThan(texto.indexOf("Bazuka"));
    });

    it("un platillo sin nota no imprime línea de más", () => {
      store.cartStore.addToCart({ name: "Charola", totalPrice: 550, qty: 1, extras: [] });
      store.buildWhatsAppUrl();

      expect(mensaje()).not.toContain("Nota:");
    });

    // WhatsApp usa * para negrita: un asterisco suelto en la nota rompería el
    // formato del resto del mensaje.
    it("un asterisco en la nota no rompe el formato", () => {
      store.cartStore.addToCart({ name: "Charola", totalPrice: 550, qty: 1, extras: [], notes: "Sin *cebolla*" });
      store.buildWhatsAppUrl();

      const texto = mensaje();
      expect(texto).toContain("Sin cebolla");
      expect(texto).not.toContain("*cebolla*");
    });
  });

  describe("buildWhatsAppUrl", () => {
    it("builds URL with delivery info", () => {
      store.cartStore.addToCart({
        name: "Tacos",
        totalPrice: 50,
        qty: 2,
        extras: [],
      });
      store.userStore.data = {
        name: "Omar",
        phone: "1234567890",
        delivery: "Envio",
        street: "Calle 1",
        ext_number: "100",
        int_number: null,
        town: "Centro",
        zip: "80000",
        references: "Casa azul",
      };
      store.companyStore.company = {
        name: "Test",
        whatsapp: "9876543210",
        delivery_charge: 30,
        features: [],
      };
      store.orderStore.order = { order_code: "ORD-1" };
      store.tip.value = 10;
      store.payment = { type: "Efectivo", value: 200 };

      store.buildWhatsAppUrl();

      // Números de 10 dígitos reciben el prefijo de país 52 (México) para WhatsApp
      expect(store.whatsappUrl).toContain("wa.me/529876543210");
      expect(store.whatsappUrl).toContain("Omar");
      expect(store.whatsappUrl).toContain("Tacos");
      expect(store.whatsappUrl).toContain("ORD-1");
    });

    it("builds URL for pickup", () => {
      store.cartStore.addToCart({
        name: "Tacos",
        totalPrice: 50,
        qty: 1,
        extras: [],
      });
      store.userStore.data = {
        name: "Omar",
        phone: "123",
        delivery: "Recoger",
      };
      store.companyStore.company = {
        name: "Test",
        whatsapp: "123",
        features: [],
      };
      store.orderStore.order = { order_code: "ORD-1" };

      store.buildWhatsAppUrl();

      expect(decodeURIComponent(store.whatsappUrl)).toContain("recoger");
    });

    it("builds URL for dine-in with table number", () => {
      store.cartStore.addToCart({
        name: "Tacos",
        totalPrice: 50,
        qty: 1,
        extras: [],
      });
      store.userStore.data = {
        name: "Omar",
        phone: "123",
        delivery: "Mesa",
        table: 5,
      };
      store.companyStore.company = {
        name: "Test",
        whatsapp: "123",
        features: [],
      };
      store.orderStore.order = { order_code: "ORD-1" };

      store.buildWhatsAppUrl();

      expect(decodeURIComponent(store.whatsappUrl)).toContain("Mesa");
    });
  });

  describe("openWhatsApp", () => {
    it("does not open when URL is empty", () => {
      store.whatsappUrl = "";
      store.openWhatsApp();
      expect(window.open).not.toHaveBeenCalled();
    });

    it("opens URL in new tab", () => {
      store.whatsappUrl = "https://wa.me/123";
      store.openWhatsApp();
      expect(window.open).toHaveBeenCalledWith("https://wa.me/123", "_blank");
    });
  });

  describe("getDistance", () => {
    it("calculates distance between two points", () => {
      store.userStore.data = { latitude: 24.8, longitude: -107.4 };
      store.companyStore.company = { coordinates: "24.81, -107.39" };

      store.getDistance();

      expect(store.userStore.data.distance).toBeDefined();
      expect(store.userStore.data.distance).toBeGreaterThan(0);
    });

    it("does nothing with invalid coordinates", () => {
      store.userStore.data = { latitude: 24.8, longitude: -107.4 };
      store.companyStore.company = { coordinates: "" };

      store.getDistance(); // should not throw
      expect(store.userStore.data.distance).toBeUndefined();
    });

    it("handles coordinates with multiple spaces", () => {
      store.userStore.data = { latitude: 24.8, longitude: -107.4 };
      store.companyStore.company = { coordinates: "24.81,  -107.39" };

      store.getDistance();
      expect(store.userStore.data.distance).toBeDefined();
      expect(store.userStore.data.distance).toBeGreaterThan(0);
    });
  });

  describe("deliveryCharge y deliveryEstimated", () => {
    // Config real de Bajamar en produccion.
    const bajamar = {
      delivery_mode: "distance",
      delivery_charge: 40,
      delivery_base_fee: 35,
      delivery_base_km: 2,
      delivery_per_km: 5,
      delivery_max_km: 15,
      delivery_free_from: 0,
    };

    const setup = (distance, company = bajamar) => {
      store.userStore.data = { delivery: "Envio", distance };
      store.companyStore.company = company;
    };

    it("dentro de los km base cobra solo la base", () => {
      setup(1.5);
      expect(store.deliveryCharge).toBe(35);
      expect(store.deliveryEstimated).toBe(false);
    });

    it("cobra los km extra", () => {
      setup(7); // 35 + (7-2)*5 = 60
      expect(store.deliveryCharge).toBe(60);
    });

    it("fuera del radio no esta cubierto", () => {
      setup(20);
      expect(store.deliveryCovered).toBe(false);
    });

    it("sin distancia usa la tarifa fija y marca estimado", () => {
      setup(undefined);
      expect(store.deliveryCharge).toBe(40);
      expect(store.deliveryEstimated).toBe(true);
    });

    it("sin distancia y sin tarifa fija cae a la base", () => {
      setup(undefined, { ...bajamar, delivery_charge: 0 });
      expect(store.deliveryCharge).toBe(35);
      expect(store.deliveryEstimated).toBe(true);
    });

    it("envio gratis desde cierto monto", () => {
      setup(7, { ...bajamar, delivery_free_from: 400 });
      store.cartStore.addToCart({ name: "A", totalPrice: 500, qty: 1 });
      expect(store.deliveryCharge).toBe(0);
    });

    it("en modo tarifa fija nunca es estimado", () => {
      setup(undefined, { ...bajamar, delivery_mode: "flat" });
      expect(store.deliveryCharge).toBe(40);
      expect(store.deliveryEstimated).toBe(false);
    });

    it("al recoger no hay costo ni estimado", () => {
      store.userStore.data = { delivery: "Recoger" };
      store.companyStore.company = bajamar;
      expect(store.deliveryCharge).toBe(0);
      expect(store.deliveryEstimated).toBe(false);
    });
  });

  describe("clearGeo", () => {
    it("borra coordenadas y distancia", () => {
      store.userStore.data = {
        latitude: 1, longitude: 2, distance: 3, geo_precision: "street",
      };
      store.clearGeo();
      expect(store.userStore.data.latitude).toBeNull();
      expect(store.userStore.data.longitude).toBeNull();
      expect(store.userStore.data.distance).toBeNull();
      expect(store.userStore.data.geo_precision).toBeNull();
    });
  });

  describe("geocodeAddress", () => {
    beforeEach(() => {
      store.companyStore.slug = "bajamar";
      store.companyStore.company = {
        coordinates: "25.792506,-108.980737",
        delivery_mode: "distance",
        delivery_charge: 40,
        delivery_base_fee: 35,
        delivery_base_km: 2,
        delivery_per_km: 5,
        delivery_max_km: 15,
        delivery_free_from: 0,
      };
      store.userStore.data = {
        delivery: "Envio", zip: "81200", town: "Centro",
        street: "Aldama", ext_number: "500",
      };
    });

    it("guarda lat/lng y recalcula la distancia", async () => {
      api.post = vi.fn().mockResolvedValue({
        data: { lat: 25.75, lng: -108.99, match_precision: "street" },
      });

      await store.geocodeAddress();

      expect(store.userStore.data.latitude).toBe(25.75);
      expect(store.userStore.data.longitude).toBe(-108.99);
      expect(Number(store.userStore.data.distance)).toBeGreaterThan(0);
      expect(store.deliveryEstimated).toBe(false);
    });

    it("deja la distancia vacia cuando no se pudo ubicar", async () => {
      api.post = vi.fn().mockResolvedValue({
        data: { lat: null, lng: null, match_precision: "none" },
      });

      await store.geocodeAddress();

      expect(store.userStore.data.distance).toBeFalsy();
      expect(store.deliveryEstimated).toBe(true);
    });

    it("no revienta si el endpoint falla", async () => {
      api.post = vi.fn().mockRejectedValue(new Error("network"));

      await expect(store.geocodeAddress()).resolves.not.toThrow();
      expect(store.deliveryEstimated).toBe(true);
    });

    it("no llama al endpoint si falta CP y colonia", async () => {
      api.post = vi.fn();
      store.userStore.data.zip = "";
      store.userStore.data.town = "";

      await store.geocodeAddress();

      expect(api.post).not.toHaveBeenCalled();
    });
  });

});
