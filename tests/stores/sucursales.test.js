import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useMainStore } from "stores/main-store";

/**
 * Sucursales: de dónde sale el pedido y qué cambia por eso.
 *
 * La regla completa cabe en una frase: el menú, los precios y las reglas de cobro son
 * del negocio; la sucursal solo aporta el punto desde el que se mide el envío y el
 * número al que llega el pedido.
 *
 * Lo que se prueba aquí es lo que el comensal ve ANTES de mandar. El cobro definitivo
 * lo vuelve a calcular el servidor con la misma regla, así que estas pruebas cuidan
 * que las dos cuentas no se separen: si el navegador muestra $35 y el servidor cobra
 * $57, el cliente se entera cuando ya aceptó.
 */
describe("sucursales", () => {
  let store;

  // Los Mochis. Norte está ~6 km arriba de Centro.
  const CENTRO = "25.7925,-108.9807";
  const NORTE = "25.8465,-108.9807";

  const conNegocio = (props) => {
    store.companyStore.company = { ...(store.companyStore.company || {}), ...props };
  };

  /** Cobro por distancia: base $35 hasta 2 km, $5 por km extra, radio de 15 km. */
  const cobroPorDistancia = () =>
    conNegocio({
      coordinates: CENTRO,
      delivery_mode: "distance",
      delivery_base_fee: 35,
      delivery_base_km: 2,
      delivery_per_km: 5,
      delivery_max_km: 15,
      delivery_free_from: 0,
    });

  const conSucursales = (lista) => conNegocio({ active_branches: lista });

  /** El cliente vive junto a la sucursal Norte. */
  const clienteEnElNorte = () => {
    store.userStore.data.delivery = "Envio";
    store.userStore.data.latitude = 25.85;
    store.userStore.data.longitude = -108.98;
    store.getDistance();
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useMainStore();
    store.cartStore.cart = [
      { id: 1, name: "Platillo", price: 200, totalPrice: 200, qty: 1, extras: [] },
    ];
    store.cartStore.total = 200;
    cobroPorDistancia();
  });

  // ------------------------------------------------- negocio sin sucursales

  describe("un negocio sin sucursales", () => {
    it("no ofrece ninguna", () => {
      expect(store.sucursales).toEqual([]);
      expect(store.sucursalElegida).toBeNull();
    });

    it("mide el envío desde el negocio, como siempre", () => {
      clienteEnElNorte();
      expect(store.origenDelEnvio).toBe(CENTRO);
      // ~6 km: 35 de base + 4 km extra x 5.
      expect(store.deliveryCharge).toBeGreaterThan(50);
    });

    it("no mete el renglón de sucursal en el mensaje de WhatsApp", () => {
      expect(store.sucursalElegida).toBeNull();
    });
  });

  // ------------------------------------------------------------ la cercana

  describe("con sucursales", () => {
    beforeEach(() => {
      conSucursales([
        { id: 1, name: "Centro", coordinates: CENTRO, whatsapp: "6681112233" },
        { id: 2, name: "Norte", coordinates: NORTE, whatsapp: "6684445566" },
      ]);
    });

    it("elige sola la más cercana al cliente", () => {
      clienteEnElNorte();
      expect(store.sucursalMasCercana.name).toBe("Norte");
      expect(store.sucursalElegida.name).toBe("Norte");
    });

    it("mide el envío desde esa sucursal y no desde el negocio", () => {
      clienteEnElNorte();
      expect(store.origenDelEnvio).toBe(NORTE);
      // Vive a menos de los 2 km de la base: paga la base, no el recargo.
      expect(store.deliveryCharge).toBe(35);
    });

    it("elegir una más lejana sube el costo del envío", () => {
      clienteEnElNorte();
      const cerca = store.deliveryCharge;

      store.elegirSucursal(1); // Centro, a ~6 km

      expect(store.sucursalElegida.name).toBe("Centro");
      expect(store.deliveryCharge).toBeGreaterThan(cerca);
    });

    it("volver a la cercana devuelve el costo de antes", () => {
      clienteEnElNorte();
      const cerca = store.deliveryCharge;

      store.elegirSucursal(1);
      store.elegirSucursal(2);

      expect(store.deliveryCharge).toBe(cerca);
    });

    it("sin dirección ubicada no se puede saber cuál es la más cercana", () => {
      store.userStore.data.latitude = null;
      store.userStore.data.longitude = null;
      expect(store.sucursalMasCercana).toBeNull();
      // Aun así hay de dónde salir: la primera de la lista.
      expect(store.sucursalElegida.name).toBe("Centro");
    });

    it("una sucursal sin coordenadas no compite por ser la más cercana", () => {
      conSucursales([
        { id: 1, name: "Centro", coordinates: CENTRO },
        { id: 3, name: "Sin ubicar", coordinates: null },
      ]);
      clienteEnElNorte();
      expect(store.sucursalMasCercana.name).toBe("Centro");
    });
  });

  // ------------------------------------------------------------- WhatsApp

  describe("a qué número llega el pedido", () => {
    /** buildWhatsAppUrl deja la liga en el estado; el botón del diálogo la lee de ahí. */
    const liga = () => {
      store.buildWhatsAppUrl();
      return store.whatsappUrl;
    };

    beforeEach(() => {
      conNegocio({ name: "Kazuki", whatsapp: "6689990000" });
      store.orderStore.order = { order_code: "A-1" };
      store.userStore.data.name = "Cliente";
    });

    it("al del negocio cuando no hay sucursales", () => {
      expect(liga()).toContain("526689990000");
    });

    it("al de la sucursal que va a preparar el pedido", () => {
      conSucursales([{ id: 2, name: "Norte", coordinates: NORTE, whatsapp: "6684445566" }]);
      clienteEnElNorte();
      expect(liga()).toContain("526684445566");
    });

    it("al del negocio si la sucursal no tiene número propio", () => {
      conSucursales([{ id: 2, name: "Norte", coordinates: NORTE, whatsapp: null }]);
      clienteEnElNorte();
      expect(liga()).toContain("526689990000");
    });

    it("el mensaje dice de qué sucursal es", () => {
      conSucursales([{ id: 2, name: "Norte", coordinates: NORTE }]);
      clienteEnElNorte();
      expect(decodeURIComponent(liga())).toContain("Sucursal:");
      expect(decodeURIComponent(liga())).toContain("Norte");
    });

    it("y no lo dice cuando el negocio no tiene sucursales", () => {
      expect(decodeURIComponent(liga())).not.toContain("Sucursal:");
    });
  });

  // ---------------------------------------------------------------- medida

  describe("la medida de distancia", () => {
    it("da cero contra el mismo punto", () => {
      expect(store.kmEntre(CENTRO, 25.7925, -108.9807)).toBeCloseTo(0, 2);
    });

    it("no inventa una distancia cuando faltan coordenadas", () => {
      expect(store.kmEntre(null, 25.79, -108.98)).toBeNull();
      expect(store.kmEntre("sin comas", 25.79, -108.98)).toBeNull();
    });

    it("mide los ~6 km que separan Centro de Norte", () => {
      const km = store.kmEntre(CENTRO, 25.8465, -108.9807);
      expect(km).toBeGreaterThan(5.5);
      expect(km).toBeLessThan(6.5);
    });
  });
});
