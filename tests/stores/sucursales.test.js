import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useMainStore } from "stores/main-store";
import { MATRIZ } from "src/utils/sucursales.js";

/**
 * Sucursales: de dónde sale el pedido y qué cambia por eso.
 *
 * La regla completa cabe en dos frases. El menú, los precios y las reglas de cobro son
 * del negocio; cada local solo aporta el punto desde el que se mide el envío y el
 * número al que llega el pedido. Y los locales son la Matriz -el negocio mismo- más
 * las sucursales que dé de alta: la Matriz no se captura en ningún lado.
 *
 * Lo que se prueba aquí es lo que el comensal ve ANTES de mandar. El cobro definitivo
 * lo vuelve a calcular el servidor con la misma regla, así que estas pruebas cuidan
 * que las dos cuentas no se separen: si el navegador muestra $35 y el servidor cobra
 * $57, el cliente se entera cuando ya aceptó.
 */
describe("sucursales", () => {
  let store;

  // Los Mochis. La Matriz está en el Centro; Norte, ~6 km arriba.
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

  const clienteEn = (lat, lng) => {
    store.userStore.data.delivery = "Envio";
    store.userStore.data.latitude = lat;
    store.userStore.data.longitude = lng;
    store.getDistance();
  };

  /** El cliente vive junto a la sucursal Norte. */
  const clienteEnElNorte = () => clienteEn(25.85, -108.98);

  /** El cliente vive junto a la Matriz. */
  const clienteEnElCentro = () => clienteEn(25.793, -108.981);

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
    it("no ofrece ninguna, ni siquiera la Matriz", () => {
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

  // ------------------------------------------------------------ la Matriz

  describe("la Matriz", () => {
    beforeEach(() => {
      conSucursales([{ id: 2, name: "Norte", coordinates: NORTE, whatsapp: "6684445566" }]);
    });

    it("cuenta como un local más: con una sola sucursal ya hay dos para elegir", () => {
      expect(store.sucursales.map((s) => s.name)).toEqual(["Matriz", "Norte"]);
    });

    it("sale de los datos del negocio, no de una sucursal capturada", () => {
      conNegocio({
        whatsapp: "6689990000",
        address: { street: "Rio Presidio", exterior_number: "351", city: "Los Mochis" },
      });
      const matriz = store.sucursales[0];

      expect(matriz.id).toBe(MATRIZ);
      expect(matriz.coordinates).toBe(CENTRO);
      expect(matriz.whatsapp).toBe("6689990000");
      expect(matriz.full_address).toBe("Rio Presidio 351, Los Mochis");
    });

    it("al que vive junto a la Matriz le toca la Matriz", () => {
      clienteEnElCentro();
      expect(store.sucursalElegida.name).toBe("Matriz");
      expect(store.origenDelEnvio).toBe(CENTRO);
    });

    it("sin dirección ubicada, el pedido sale de la Matriz", () => {
      store.userStore.data.latitude = null;
      store.userStore.data.longitude = null;
      expect(store.sucursalMasCercana).toBeNull();
      expect(store.sucursalElegida.name).toBe("Matriz");
    });

    it("si el negocio no está ubicado, la Matriz no compite por ser la más cercana", () => {
      conNegocio({ coordinates: null });
      clienteEnElCentro();
      expect(store.sucursalMasCercana.name).toBe("Norte");
    });
  });

  // ------------------------------------------------------------ la cercana

  describe("con sucursales", () => {
    beforeEach(() => {
      conSucursales([{ id: 2, name: "Norte", coordinates: NORTE, whatsapp: "6684445566" }]);
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

    it("elegir la Matriz, más lejana, sube el costo del envío", () => {
      clienteEnElNorte();
      const cerca = store.deliveryCharge;

      store.elegirSucursal(MATRIZ);

      expect(store.sucursalElegida.name).toBe("Matriz");
      expect(store.origenDelEnvio).toBe(CENTRO);
      expect(store.deliveryCharge).toBeGreaterThan(cerca);
    });

    it("volver a la cercana devuelve el costo de antes", () => {
      clienteEnElNorte();
      const cerca = store.deliveryCharge;

      store.elegirSucursal(MATRIZ);
      store.elegirSucursal(2);

      expect(store.deliveryCharge).toBe(cerca);
    });

    it("una sucursal sin coordenadas no compite por ser la más cercana", () => {
      conSucursales([{ id: 3, name: "Sin ubicar", coordinates: null }]);
      clienteEnElNorte();
      expect(store.sucursalMasCercana.name).toBe("Matriz");
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

    it("al del negocio cuando el cliente eligió la Matriz", () => {
      conSucursales([{ id: 2, name: "Norte", coordinates: NORTE, whatsapp: "6684445566" }]);
      clienteEnElNorte();
      store.elegirSucursal(MATRIZ);
      expect(liga()).toContain("526689990000");
    });

    it("el mensaje dice de qué sucursal es", () => {
      conSucursales([{ id: 2, name: "Norte", coordinates: NORTE }]);
      clienteEnElNorte();
      expect(decodeURIComponent(liga())).toContain("Sucursal:");
      expect(decodeURIComponent(liga())).toContain("Norte");
    });

    it("y dice Matriz cuando sale de la Matriz", () => {
      conSucursales([{ id: 2, name: "Norte", coordinates: NORTE }]);
      store.elegirSucursal(MATRIZ);
      expect(decodeURIComponent(liga())).toContain("Matriz");
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

  // ------------------------------------------------- locales en pausa

  describe("un local en pausa", () => {
    const norte = (props = {}) => ({ id: 2, name: "Norte", coordinates: NORTE, ...props });

    it("no es el mas cercano: el pedido sale del siguiente abierto", () => {
      conSucursales([norte({ orders_paused: true })]);
      clienteEnElNorte();

      expect(store.sucursalMasCercana.id).toBe(MATRIZ);
      expect(store.sucursalElegida.id).toBe(MATRIZ);
    });

    it("si era el elegido, se cae a otro local abierto", () => {
      conSucursales([norte()]);
      store.elegirSucursal(2);
      expect(store.sucursalElegida.id).toBe(2);

      conSucursales([norte({ orders_paused: true })]);
      expect(store.sucursalElegida.id).toBe(MATRIZ);
    });

    it("con la Matriz en pausa sale de la sucursal", () => {
      conNegocio({ matriz_pausada: true });
      conSucursales([norte()]);
      clienteEnElCentro();

      expect(store.sucursalElegida.id).toBe(2);
      expect(store.ordersPaused).toBe(false);
    });

    it("con todos en pausa se bloquea el checkout, sin el mensaje viejo del dueño", () => {
      conNegocio({ matriz_pausada: true, paused_message: "Cerrado por vacaciones" });
      conSucursales([norte({ orders_paused: true })]);

      expect(store.ordersPaused).toBe(true);
      expect(store.pausedMessage).toBe("");
    });

    it("el rechazo del servidor marca los locales en pausa sin recargar el menu", () => {
      conSucursales([norte(), { id: 3, name: "Sur", coordinates: CENTRO }]);

      store.aplicarPausas({ matriz_pausada: true, sucursales_pausadas: [2] });

      expect(store.companyStore.company.matriz_pausada).toBe(true);
      expect(store.companyStore.company.active_branches.map((s) => s.orders_paused)).toEqual([true, false]);
      expect(store.sucursalElegida.id).toBe(3);
    });
  });
});
