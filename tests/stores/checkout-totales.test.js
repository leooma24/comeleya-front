import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useMainStore } from "stores/main-store";

/**
 * Todo lo que altera el total a pagar, probado pieza por pieza y luego junto.
 *
 * El total se arma así (main-store.js `totalToPay`):
 *
 *   max(0, subtotal + propina + envío − cupón − lealtad)
 *
 * Cada sumando tiene su propia lógica y sus propios bordes. Hoy los bugs que
 * dolieron (propina fuera del ticket, precio de extras al doble) vivían justo
 * aquí y ninguno tenía prueba.
 */
describe("composición del total a pagar", () => {
  let store;

  /** Deja el carrito en un subtotal conocido sin depender del cálculo de extras. */
  const conSubtotal = (monto) => {
    store.cartStore.cart = [
      { id: 1, name: "Platillo", price: monto, totalPrice: monto, qty: 1, extras: [] },
    ];
    store.cartStore.total = monto;
  };

  const conEstablecimiento = (props) => {
    store.companyStore.company = { ...(store.companyStore.company || {}), ...props };
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useMainStore();
    conSubtotal(200);
  });

  // ------------------------------------------------------------------ base

  describe("subtotal", () => {
    it("sin nada más, el total a pagar es el subtotal", () => {
      expect(store.totalToPay).toBe(200);
    });

    it("con el carrito vacío es cero, no negativo", () => {
      store.cartStore.cart = [];
      store.cartStore.total = 0;
      expect(store.totalToPay).toBe(0);
    });
  });

  // --------------------------------------------------------------- propina

  describe("propina", () => {
    it("se suma al total", () => {
      store.setTip(30);
      expect(store.getTip).toBe(30);
      expect(store.totalToPay).toBe(230);
    });

    it('"otro" la deja en cero hasta que el cliente escriba un monto', () => {
      store.setTip(50);
      store.setTip("otro");
      expect(store.tip.type).toBe("otro");
      expect(store.tip.value).toBe(0);
      expect(store.totalToPay).toBe(200);
    });

    it("cambiar de un monto a otro no acumula", () => {
      store.setTip(20);
      store.setTip(50);
      expect(store.totalToPay).toBe(250);
    });
  });

  // ----------------------------------------------------- envío tarifa fija

  describe("envío, tarifa fija", () => {
    beforeEach(() => {
      conEstablecimiento({ delivery_mode: "flat", delivery_charge: 45 });
    });

    it("no se cobra si el cliente pasa a recoger", () => {
      store.userStore.data.delivery = "Recoger";
      expect(store.deliveryCharge).toBe(0);
      expect(store.totalToPay).toBe(200);
    });

    it("se cobra si es a domicilio", () => {
      store.userStore.data.delivery = "Envio";
      expect(store.deliveryCharge).toBe(45);
      expect(store.totalToPay).toBe(245);
    });

    it("sin delivery_mode configurado se comporta como tarifa fija", () => {
      conEstablecimiento({ delivery_mode: undefined, delivery_charge: 30 });
      store.userStore.data.delivery = "Envio";
      expect(store.deliveryCharge).toBe(30);
    });
  });

  // ------------------------------------------------- envío por distancia

  describe("envío por distancia", () => {
    beforeEach(() => {
      conEstablecimiento({
        delivery_mode: "distance",
        delivery_base_fee: 20, // piso
        delivery_base_km: 2, // los primeros 2 km van en el piso
        delivery_per_km: 10, // cada km extra
        delivery_max_km: 8, // fuera de cobertura
        delivery_free_from: 0,
        delivery_charge: 0,
      });
      store.userStore.data.delivery = "Envio";
    });

    it("dentro del radio base cobra solo el piso", () => {
      store.userStore.data.distance = 1.5;
      expect(store.deliveryCharge).toBe(20);
    });

    it("justo en el radio base sigue siendo el piso", () => {
      store.userStore.data.distance = 2;
      expect(store.deliveryCharge).toBe(20);
    });

    it("cobra los kilómetros extra", () => {
      store.userStore.data.distance = 5; // 3 km extra x 10 = 30, + 20 de piso
      expect(store.deliveryCharge).toBe(50);
    });

    it("redondea a dos decimales", () => {
      store.userStore.data.distance = 3.333;
      // 20 + (1.333 x 10) = 33.33
      expect(store.deliveryCharge).toBe(33.33);
    });

    it("fuera de cobertura marca la dirección como no cubierta", () => {
      store.userStore.data.distance = 12;
      expect(store.deliveryCovered).toBe(false);
    });

    it("envío gratis a partir del monto configurado", () => {
      conEstablecimiento({ delivery_free_from: 300 });
      store.userStore.data.distance = 5;
      expect(store.deliveryCharge).toBe(50); // subtotal 200, no alcanza

      conSubtotal(300);
      expect(store.deliveryCharge).toBe(0); // justo en el umbral
    });

    it("sin distancia conocida usa la tarifa fija si está configurada", () => {
      conEstablecimiento({ delivery_charge: 60 });
      store.userStore.data.distance = null;
      expect(store.deliveryCharge).toBe(60);
      expect(store.deliveryEstimated).toBe(true);
    });

    it("sin distancia y sin tarifa fija cae al piso", () => {
      store.userStore.data.distance = null;
      expect(store.deliveryCharge).toBe(20);
      expect(store.deliveryEstimated).toBe(true);
    });

    it("con distancia conocida el envío no va marcado como estimado", () => {
      store.userStore.data.distance = 5;
      expect(store.deliveryEstimated).toBe(false);
    });
  });

  // ----------------------------------------------------------------- cupón

  describe("cupón", () => {
    it("resta del total", () => {
      store.coupon = { id: 1, code: "PROMO", discount: 50, applied: true };
      expect(store.totalToPay).toBe(150);
    });

    it("un descuento mayor al consumo no deja el total en negativo", () => {
      store.coupon = { id: 1, code: "REGALO", discount: 500, applied: true };
      expect(store.totalToPay).toBe(0);
    });

    it("el descuento se aplica sobre el subtotal, no sobre el envío", () => {
      conEstablecimiento({ delivery_mode: "flat", delivery_charge: 45 });
      store.userStore.data.delivery = "Envio";
      store.coupon = { id: 1, code: "PROMO", discount: 50, applied: true };
      // 200 + 45 - 50 = 195: el envío se sigue cobrando completo
      expect(store.totalToPay).toBe(195);
    });
  });

  // --------------------------------------------------------------- lealtad

  describe("lealtad", () => {
    const conLealtad = (props) => {
      store.loyalty = {
        config: { points_value: 1, min_points_redeem: 50 },
        points: 100,
        phone: "6680000000",
        use: true,
        loading: false,
        ...props,
      };
    };

    it("no se puede canjear sin alcanzar el mínimo de puntos", () => {
      conLealtad({ points: 20 });
      expect(store.canRedeemLoyalty).toBe(false);
      expect(store.loyaltyDiscount).toBe(0);
    });

    it("canjea cuando alcanza el mínimo", () => {
      conLealtad();
      expect(store.canRedeemLoyalty).toBe(true);
      expect(store.loyaltyDiscount).toBe(100);
      expect(store.totalToPay).toBe(100);
    });

    it("no descuenta si el cliente no eligió canjear", () => {
      conLealtad({ use: false });
      expect(store.loyaltyDiscount).toBe(0);
    });

    it("solo usa los puntos que caben en el pedido, sin desperdiciar", () => {
      conSubtotal(70);
      conLealtad({ points: 100 }); // vale 100 pero el pedido son 70
      expect(store.loyaltyDiscount).toBe(70);
      expect(store.totalToPay).toBe(0);
    });

    it("si lo que cabe queda por debajo del mínimo, no canjea nada", () => {
      conSubtotal(30);
      conLealtad({ points: 100, config: { points_value: 1, min_points_redeem: 50 } });
      // solo caben 30 puntos y el mínimo son 50
      expect(store.loyaltyDiscount).toBe(0);
      expect(store.totalToPay).toBe(30);
    });

    it("respeta el valor por punto", () => {
      conLealtad({ points: 100, config: { points_value: 0.5, min_points_redeem: 10 } });
      expect(store.loyaltyDiscount).toBe(50);
    });

    it("sin configuración de lealtad no aplica", () => {
      conLealtad({ config: null });
      expect(store.canRedeemLoyalty).toBe(false);
      expect(store.loyaltyDiscount).toBe(0);
    });

    it("el cupón reduce el margen disponible para los puntos", () => {
      conSubtotal(100);
      store.coupon = { id: 1, code: "X", discount: 40, applied: true };
      conLealtad({ points: 100, config: { points_value: 1, min_points_redeem: 10 } });
      // caben 60 (100 - 40), no 100
      expect(store.loyaltyDiscount).toBe(60);
      expect(store.totalToPay).toBe(0);
    });
  });

  // ------------------------------------------------------- pedido mínimo

  describe("pedido mínimo", () => {
    it("detecta cuando el carrito no alcanza", () => {
      conEstablecimiento({ min_order: 250 });
      expect(store.belowMinOrder).toBe(true);
    });

    it("justo en el mínimo ya alcanza", () => {
      conEstablecimiento({ min_order: 200 });
      expect(store.belowMinOrder).toBe(false);
    });

    it("sin mínimo configurado nunca bloquea", () => {
      conEstablecimiento({ min_order: 0 });
      expect(store.belowMinOrder).toBe(false);
    });

    it("se mide contra el subtotal, no contra el total con propina y envío", () => {
      conEstablecimiento({ min_order: 250, delivery_mode: "flat", delivery_charge: 45 });
      store.userStore.data.delivery = "Envio";
      store.setTip(30);
      // el total a pagar son 275, pero el subtotal sigue siendo 200
      expect(store.totalToPay).toBe(275);
      expect(store.belowMinOrder).toBe(true);
    });
  });

  // ------------------------------------------ menú de solo consulta

  // Con la feature 12 ("delivery") apagada el menú se ve pero no se puede pedir.
  // OJO: distinto de la feature 1 ("Servicio a Domicilio"), que solo esconde la
  // opción de envío. Un negocio que solo hace recoger debe seguir vendiendo.
  describe("pedidos deshabilitados", () => {
    const conFeatures = (lista) => {
      store.companyStore.company = { ...(store.companyStore.company || {}), features: lista };
    };

    it("con la feature de pedidos encendida se puede pedir", () => {
      conFeatures([{ feature_id: 12, value: "1" }]);
      expect(store.orderingEnabled).toBe(true);
    });

    it("apagada, el menú queda de solo consulta", () => {
      conFeatures([{ feature_id: 12, value: "0" }]);
      expect(store.orderingEnabled).toBe(false);
    });

    it("apagar solo el servicio a domicilio NO apaga los pedidos", () => {
      conFeatures([
        { feature_id: 1, value: "0" }, // sin envío a domicilio
        { feature_id: 12, value: "1" }, // pero sí toma pedidos
      ]);
      expect(store.orderingEnabled).toBe(true);
    });

    it("mientras no cargan las features no se apaga nada", () => {
      conFeatures([]);
      expect(store.orderingEnabled).toBe(true);
    });

    it("no deja agregar al carrito aunque se llame directo", () => {
      conFeatures([{ feature_id: 12, value: "0" }]);
      store.productStore.product = { id: 1, name: "X", qty: 1, totalPrice: 100, extras: [] };
      const antes = store.cartStore.cart.length;

      store.addToCart();

      expect(store.cartStore.cart.length).toBe(antes);
    });
  });

  // ------------------------------------------------------- todo combinado

  describe("todo junto", () => {
    it("subtotal + propina + envío − cupón − lealtad", () => {
      conSubtotal(500);
      conEstablecimiento({ delivery_mode: "flat", delivery_charge: 45 });
      store.userStore.data.delivery = "Envio";
      store.setTip(50);
      store.coupon = { id: 1, code: "PROMO", discount: 100, applied: true };
      store.loyalty = {
        config: { points_value: 1, min_points_redeem: 10 },
        points: 80,
        phone: "6680000000",
        use: true,
        loading: false,
      };

      expect(store.total).toBe(500);
      expect(store.getTip).toBe(50);
      expect(store.deliveryCharge).toBe(45);
      expect(store.coupon.discount).toBe(100);
      expect(store.loyaltyDiscount).toBe(80);
      // 500 + 50 + 45 - 100 - 80 = 415
      expect(store.totalToPay).toBe(415);
    });

    it("los descuentos combinados nunca dejan el total en negativo", () => {
      conSubtotal(100);
      store.coupon = { id: 1, code: "X", discount: 90, applied: true };
      store.loyalty = {
        config: { points_value: 1, min_points_redeem: 1 },
        points: 500,
        phone: "6680000000",
        use: true,
        loading: false,
      };
      expect(store.totalToPay).toBe(0);
    });
  });
});
