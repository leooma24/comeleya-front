import { defineStore } from "pinia";
import { api } from "boot/axios";
import { scrollOffsetFor } from "src/utils/categoryScroll";

import { useProductStore } from "./products";
import { useUserStore } from "./user-store";
import { useCartStore } from "./cart-store";
import { useCompanyStore } from "./company-store";
import { useOrderStore } from "./order-store";
import { useMessageStore } from "./message-store";
import { initPixel, trackFb } from "src/utils/fbpixel";
import { initMessenger } from "src/utils/fbchat";
import { describeRequestError } from "src/utils/requestError";

/**
 * Cuánto esperar antes de cada reintento del menú.
 *
 * Antes eran 900ms fijos dos veces: los tres intentos cabían en 1.8 segundos, así que
 * solo sobrevivía a fallas más cortas que eso. Un cambio de antena en el celular, un
 * reinicio del servidor o una racha de 429 duran más, y el comensal acababa en la
 * pantalla de error por algo que se iba a componer solo.
 *
 * Creciente y no plano por la misma razón: si el servidor viene saturado, tres golpes
 * seguidos lo empujan más. Es un GET, así que reintentar es seguro.
 */
const ESPERAS_DE_REINTENTO = [1000, 3000];

export const useMainStore = defineStore("main", {
  state: () => ({
    addCartDrawer: false,
    cartDrawer: false,
    dataDrawer: false,
    paymentDrawer: false,

    validationDialog: false,

    productStore: useProductStore(),
    cartStore: useCartStore(),
    userStore: useUserStore(),
    companyStore: useCompanyStore(),
    orderStore: useOrderStore(),
    messageStore: useMessageStore(),
    search: "",
    // Menú embebido en iframe (se fija desde MainLayout según ?isExternal=true).
    isExternal: false,
    // true solo cuando el sitio contenedor cargó embed.js y dibuja la barra del
    // carrito por fuera. Si no (embed viejo sin script), se mantiene la barra interna.
    externalCartBar: false,
    tab: 0,
    // Timestamp hasta el cual el scroll-spy NO debe cambiar el tab (durante el scroll
    // provocado por un click en un tab), para que no pise la categoría elegida.
    spyLockUntil: 0,
    // true cuando la carga del establecimiento falló tras reintentar (para mostrar
    // un estado de "reintentar" en vez de skeletons pegados).
    loadError: false,
    // Qué falló exactamente, de describeRequestError. Null mientras no haya fallado.
    loadErrorInfo: null,
    // Vista del menú: "Tarjeta" (cuadrícula) o "Lista" (recordada entre visitas)
    viewType:
      (typeof localStorage !== "undefined" &&
        localStorage.getItem("mc-view")) ||
      "Tarjeta",
    tip: {
      type: "price",
      value: 0,
    },
    payment: {
      type: "Efectivo",
      value: "",
    },
    // Pedido programado ("para más tarde"). at = "YYYY-MM-DDTHH:mm" (datetime-local).
    schedule: {
      enabled: false,
      at: "",
    },
    hasError: {
      payment: false,
    },
    coupon: {
      id: null,
      code: "",
      discount: 0,
      applied: false,
    },
    // Lealtad en el checkout: config del negocio + puntos del cliente (por teléfono).
    loyalty: {
      config: null, // { points_value, min_points_redeem, ... } o null si no aplica
      points: 0, // saldo del cliente consultado
      phone: "", // teléfono con el que se consultó
      use: false, // el cliente eligió canjear
      loading: false,
    },
    whatsappUrl: "",
  }),
  getters: {
    data() {
      return this.userStore.data;
    },
    categories() {
      return this.productStore.categories ?? [];
    },
    featuredProducts() {
      return this.productStore.featuredProducts;
    },
    specialOffers() {
      return this.productStore.specialOffers;
    },
    getHours() {
      return this.companyStore.hours ?? [];
    },
    // Texto de próxima apertura (reusado por Sidebar y el banner de "Cerrado")
    nextOpenText() {
      const hours = this.getHours;
      if (!hours || !hours.length) return "";
      const dayNames = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
      const now = new Date();
      const todayIndex = now.getDay();

      for (let offset = 0; offset < 7; offset++) {
        const checkIndex = (todayIndex + offset) % 7;
        const dayName = dayNames[checkIndex];
        const schedule = hours.find(
          (h) => h.day_of_week.toLowerCase() === dayName
        );
        if (!schedule || schedule.is_closed) continue;

        if (offset === 0) {
          const [openH, openM] = schedule.open_time.split(":").map(Number);
          if (now.getHours() < openH || (now.getHours() === openH && now.getMinutes() < openM)) {
            return `Abre hoy a las ${schedule.open_time.substring(0, 5)}`;
          }
          continue;
        }

        const label = offset === 1 ? "mañana" : dayName;
        return `Abre ${label} a las ${schedule.open_time.substring(0, 5)}`;
      }
      return "";
    },
    product() {
      return this.productStore.product;
    },
    businessAddress() {
      return this.companyStore.companyAddress;
    },
    bussinessMap() {
      return this.companyStore.company.coordinates ?? "";
    },
    deliveryCharge() {
      if (this.data.delivery !== "Envio") return 0;
      const e = this.establishment || {};
      if ((e.delivery_mode ?? "flat") !== "distance") {
        return Number(e.delivery_charge ?? 0);
      }
      // Modo distancia: usa la distancia (km) a la dirección geocodificada.
      const dist = Number(this.data.distance);
      if (!dist || Number.isNaN(dist)) {
        // Sin ubicación: respaldo a la tarifa fija si está configurada. La base
        // es el piso para quien vive cerca; cobrársela a todos regala los lejanos.
        const flat = Number(e.delivery_charge ?? 0);
        return flat > 0 ? flat : Number(e.delivery_base_fee ?? 0);
      }
      const max = Number(e.delivery_max_km ?? 0);
      if (max > 0 && dist > max) return 0; // fuera de cobertura
      const extra = Math.max(0, dist - Number(e.delivery_base_km ?? 0));
      let fee = Number(e.delivery_base_fee ?? 0) + extra * Number(e.delivery_per_km ?? 0);
      const freeFrom = Number(e.delivery_free_from ?? 0);
      if (freeFrom > 0 && Number(this.total) >= freeFrom) fee = 0;
      return Math.round(fee * 100) / 100;
    },
    // El envío se cobró sin conocer la distancia real (no se pudo ubicar la
    // dirección). Se le avisa al cliente y se marca el pedido para que el dueño
    // pueda ajustarlo.
    deliveryEstimated() {
      if (this.data.delivery !== "Envio") return false;
      const e = this.establishment || {};
      if ((e.delivery_mode ?? "flat") !== "distance") return false;
      const dist = Number(this.data.distance);
      return !dist || Number.isNaN(dist);
    },
    // ¿La dirección del cliente está dentro del área de entrega? (modo distancia)
    deliveryCovered() {
      if (this.data.delivery !== "Envio") return true;
      const e = this.establishment || {};
      if ((e.delivery_mode ?? "flat") !== "distance") return true;
      const dist = Number(this.data.distance);
      if (!dist || Number.isNaN(dist)) return true; // sin GPS no bloqueamos
      const max = Number(e.delivery_max_km ?? 0);
      return !(max > 0 && dist > max);
    },
    getTip() {
      return this.tip.value;
    },
    // ¿El cliente puede canjear puntos? (config activa + saldo >= mínimo)
    canRedeemLoyalty() {
      const c = this.loyalty.config;
      return !!c && this.loyalty.points >= (c.min_points_redeem || 0) && (c.points_value || 0) > 0;
    },
    // Descuento estimado por puntos (autoritativo en el servidor). Solo usa los puntos
    // que caben en el pedido (subtotal - cupón), sin desperdiciar ni pasar el mínimo.
    loyaltyDiscount() {
      if (!this.loyalty.use || !this.canRedeemLoyalty) return 0;
      const c = this.loyalty.config;
      const maxDiscount = Math.max(0, this.total - this.coupon.discount);
      const affordable = Math.floor(maxDiscount / c.points_value);
      const use = Math.min(this.loyalty.points, affordable);
      if (use < (c.min_points_redeem || 0)) return 0;
      return Math.round(use * c.points_value * 100) / 100;
    },
    totalToPay() {
      // Los descuentos se guardan como monto absoluto; si el carrito baja después,
      // el total no debe volverse negativo.
      return Math.max(
        0,
        this.total + this.tip.value + this.deliveryCharge - this.coupon.discount - this.loyaltyDiscount
      );
    },
    cart() {
      return this.cartStore.cart;
    },
    total() {
      return this.cartStore.total;
    },
    totalPrice() {
      return (
        this.productStore.product.totalPrice * this.productStore.product.qty
      );
    },
    establishment() {
      return this.companyStore.company;
    },
    company() {
      return this.companyStore;
    },
    // Ajustes de pedidos configurables por el dueño.
    minOrder() {
      return Number(this.establishment?.min_order ?? 0);
    },
    belowMinOrder() {
      return this.minOrder > 0 && Number(this.total) < this.minOrder;
    },
    /**
     * ¿El negocio toma pedidos por la plataforma?
     *
     * Con la feature 12 ("delivery") apagada el menú queda de SOLO LECTURA: se ven
     * platillos y precios pero no hay forma de agregar al carrito. Es distinto de
     * `ordersPaused`, que es una pausa temporal del dueño ("hoy ya no alcanzo") y
     * sí muestra el carrito con su aviso.
     *
     * OJO: no confundir con la feature 1 ("Servicio a Domicilio"), que solo decide
     * si aparece la opción de envío en el checkout. Un negocio que solo hace
     * recoger debe poder seguir vendiendo.
     */
    orderingEnabled() {
      // Sin features cargadas todavía no se apaga nada: si no, el menú parpadearía
      // a solo lectura mientras carga.
      const features = this.company?.features;
      if (!Array.isArray(features) || !features.length) return true;
      return this.hasService(12);
    },
    /**
     * ¿El menú va DENTRO de un iframe de verdad?
     *
     * `isExternal` sale de `?isExternal=true`, que es la intención de quien pegó el
     * código; `window.parent !== window` es el hecho. Cualquiera puede abrir esa URL
     * con el flag en una pestaña normal de comeleya.com, y ahí no hay página
     * contenedora ni marco del que salir.
     */
    isEmbedded() {
      if (!this.isExternal) return false;
      if (typeof window === "undefined") return false;
      try {
        return window.parent !== window;
      } catch {
        // Un throw de origen cruzado al leer window.parent ya es prueba de que hay marco.
        return true;
      }
    },
    ordersPaused() {
      return !!this.establishment?.orders_paused;
    },
    pausedMessage() {
      return this.establishment?.paused_message || "";
    },
    btnType() {
      return this.cartStore.isEditing ? "Actualizar" : "Agregar";
    },
    orderHistory() {
      return this.orderStore.orderHistory.filter(
        (o) => o.establishment === this.companyStore.slug
      );
    },
    searchResults() {
      if (!this.search) return [];
      const query = this.search.toLowerCase();
      return this.productStore.items.filter((item) =>
        item.name.toLowerCase().includes(query)
      );
    },
    isSearching() {
      return this.search && this.search.length > 0;
    },
  },
  actions: {
    checkColor() {
      if (this.companyStore.color) {
        this.setPrimaryColor(this.companyStore.color);
      }
    },
    setPrimaryColor(color) {
      color = color.replace("#", "");
      this.companyStore.setPrimaryColor(color);
      window.document
        .querySelector("body")
        .style.setProperty("--q-primary", `#${color}`);
    },
    applyThemeConfig(config) {
      if (!config) return;
      const body = document.querySelector("body");
      if (config.secondary_color) {
        body.style.setProperty("--q-secondary", config.secondary_color);
      }
      if (config.accent_color) {
        body.style.setProperty("--q-accent", config.accent_color);
      }
      if (config.background_color) {
        body.style.setProperty("--mc-bg", config.background_color);
        body.style.backgroundColor = config.background_color;
      }
      if (config.text_color) {
        body.style.setProperty("--mc-text", config.text_color);
        body.style.color = config.text_color;
      }
      if (config.font_family) {
        body.style.fontFamily = config.font_family;
      }
      if (config.border_radius) {
        body.style.setProperty("--mc-radius", config.border_radius + "px");
      }
    },
    setSlug(slug) {
      if (!this.companyStore.changeSlug(slug)) return;

      this.companyStore.setSlug(slug);

      this.productStore.clear();
      this.clearAll();
    },
    clearAll() {
      this.cartStore.clear();

      this.validationDialog = false;
      this.addCartDrawer = false;
      this.cartDrawer = false;
      this.dataDrawer = false;
      this.paymentDrawer = false;
      this.whatsappUrl = null;
      this.removeCoupon();
      this.schedule = { enabled: false, at: "" };
      this.loyalty.use = false;
    },
    async applyCoupon(code) {
      if (!code) {
        this.messageStore.error("Ingresa un código de cupón");
        return false;
      }
      try {
        const { data } = await api.post(
          `/establishment/${this.companyStore.slug}/coupon/validate`,
          { code, total: this.cartStore.total }
        );
        this.coupon = {
          id: data.coupon_id,
          code: code.toUpperCase(),
          discount: data.discount,
          applied: true,
        };
        this.messageStore.success(
          `Cupón aplicado: -$${data.discount.toFixed(2)}`
        );
        return true;
      } catch (error) {
        this.messageStore.error(
          error.response?.data?.message || "Cupón no válido"
        );
        return false;
      }
    },
    removeCoupon() {
      this.coupon = { id: null, code: "", discount: 0, applied: false };
    },
    // Consulta la config de lealtad + el saldo de puntos del cliente por su teléfono.
    // Se llama al abrir el pago si hay teléfono capturado.
    async checkLoyalty() {
      const phone = (this.data.phone || "").replace(/\D/g, "");
      if (!phone || phone.length < 10) return;
      // Evita re-consultar el mismo teléfono.
      if (this.loyalty.phone === phone && this.loyalty.config !== null) return;
      this.loyalty.loading = true;
      const slug = this.companyStore.slug;
      try {
        const [{ data: cfg }, { data: look }] = await Promise.all([
          api.get(`/establishment/${slug}/loyalty/config`),
          api.post(`/establishment/${slug}/loyalty/lookup`, { phone }),
        ]);
        this.loyalty.config = cfg?.config ?? null;
        this.loyalty.points = look?.loyalty?.points ?? 0;
        this.loyalty.phone = phone;
        if (!this.canRedeemLoyalty) this.loyalty.use = false;
      } catch {
        this.loyalty.config = null;
        this.loyalty.points = 0;
      } finally {
        this.loyalty.loading = false;
      }
    },
    resetLoyalty() {
      this.loyalty = { config: null, points: 0, phone: "", use: false, loading: false };
    },
    isDisabled(extra) {
      return this.productStore.isDisabled(extra);
    },
    updatePrice() {
      this.productStore.updatePrice();
    },
    incrementProduct() {
      this.productStore.increment();
    },
    decrementProduct() {
      this.productStore.decrement();
    },
    async creatingOrder() {
      this.hasError.payment = false;
      if (this.payment.type === "Efectivo") {
        // Comparar contra el total real (con envío/propina/descuento), no el subtotal
        const dueAmount = this.totalToPay;
        const entered = this.payment.value;
        if (entered === "" || entered == null) {
          this.payment.value = dueAmount;
        } else if (Number(entered) < dueAmount) {
          this.hasError.payment = true;
          this.messageStore.error("El monto es menor al total a pagar");
          return;
        }
      }

      const payload = {
        cart: this.cartStore.cart,
        total: this.cartStore.total,
        user: this.userStore.data,
        tip: this.tip,
        payment: this.payment,
        coupon_id: this.coupon.applied ? this.coupon.id : null,
        use_loyalty: this.loyalty.use && this.canRedeemLoyalty,
        schedule_at:
          this.schedule.enabled && this.schedule.at
            ? this.schedule.at.replace("T", " ") + ":00"
            : null,
        date: new Date().toISOString().slice(0, 19).replace("T", " "),
      };

      try {
        const { data } = await api.post(
          `/establishment/${this.companyStore.slug}/order`,
          payload
        );
        this.orderStore.setOrder(data);
        this.orderStore.saveToHistory({
          order_code: data.order_code,
          cart: JSON.parse(JSON.stringify(this.cartStore.cart)),
          total: this.cartStore.total,
          establishment: this.companyStore.slug,
          establishmentName: this.establishment?.name || "",
        });

        // Pago en línea (MercadoPago): si el backend devolvió la preferencia de pago,
        // se redirige al checkout de MercadoPago en vez de continuar por WhatsApp.
        const mpUrl = data.payment?.init_point;
        if (mpUrl) {
          this.paymentDrawer = false;
          this.dataDrawer = false;
          window.location.href = mpUrl;
          return true;
        }

        this.buildWhatsAppUrl();
        this.validationDialog = true;
        this.paymentDrawer = false;
        this.dataDrawer = false;

        trackFb("Purchase", {
          value: Number(this.totalToPay) || 0,
          currency: "MXN",
          num_items: this.cartStore.cart.length,
          content_type: "product",
        });

        return true;
      } catch (error) {
        this.messageStore.error(
          error.response?.data?.message || "Error al crear el pedido. Intenta de nuevo."
        );
        return false;
      }
    },
    async getEstablishment(slug) {
      this.setSlug(slug);
      this.loadError = false;
      this.loadErrorInfo = null;

      let establisment;
      try {
        establisment = await this.getEstablishmentFromApi(slug);
      } catch (error) {
        this.loadError = true;
        // Aquí se perdía el error. Durante quién sabe cuánto tiempo el menú respondió
        // 500 por una zona horaria rota del teléfono y la pantalla decía "Revisa tu
        // conexión": nadie —ni el comensal, ni el dueño, ni nosotros— tenía forma de
        // saber que la falla era de este lado. Ahora se guarda y se reporta.
        this.loadErrorInfo = describeRequestError(error);
        this.reportarFalla(slug, this.loadErrorInfo);
        // El toast solo para el 404 real (negocio inexistente); en lo demás el estado
        // de "Reintentar" en pantalla es más claro.
        if (this.loadErrorInfo.status === 404) {
          this.messageStore.error("Restaurante no encontrado");
        }
        this.productStore.clear();
        return false;
      }
      if (!establisment || establisment.status === "Inactivo") {
        this.messageStore.error("Establecimiento inactivo");
        this.productStore.clear();
        return false;
      }
      this.productStore.setProducts(establisment.dishes);
      this.productStore.setCategories(establisment.dish_categories);

      this.tab = establisment.dish_categories[0]?.id ?? 0;
      establisment.dish_categories = null;
      establisment.items = null;

      if (establisment.color) {
        this.setPrimaryColor(establisment.color);
      }

      this.applyThemeConfig(establisment.theme_config);

      this.companyStore.setCompany(establisment);

      // Si el negocio ya no toma pedidos, el carrito guardado del comensal deja de
      // servir. Se limpia aquí y no al pagar: descubrir que no puede mandar nada
      // después de armar el pedido completo es peor que perderlo al entrar.
      if (!this.orderingEnabled && this.cartStore.cart.length) {
        this.cartStore.clear();
        this.messageStore.error(
          "Este restaurante no está recibiendo pedidos en línea. Puedes consultar el menú."
        );
      }

      // Píxel de Meta por establecimiento (si está activado y configurado).
      const fb = establisment.facebook_public;
      if (fb?.enabled && fb.pixel_id) {
        initPixel(fb.pixel_id);
      }
      // Chat de Messenger (si configuró su page_id). No en modo embebido (iframe)
      // para no encimar el widget dentro de la página del cliente.
      if (fb?.enabled && fb.page_id && !this.isExternal) {
        initMessenger(fb.page_id);
      }
      return true;
    },
    /**
     * Avisa al servidor que el menú no cargó.
     *
     * Sin esto, la única forma de enterarse de una falla es que un cliente se queje
     * por WhatsApp y que alguien baje el log por FTP. No espera respuesta ni le
     * importa fallar: si la API es justo lo que está caído, el reporte no llega y no
     * pasa nada — pero un 500, un 429 o un timeout sí dejan rastro, que son la mayoría.
     *
     * Va sin `await` a propósito: el comensal ya está viendo la pantalla de error y no
     * tiene por qué esperar a que terminemos de anotar.
     */
    reportarFalla(slug, info) {
      try {
        api
          .post(`/establishment/${slug}/client-error`, {
            codigo: info.codigo,
            status: info.status,
            url: typeof window !== "undefined" ? window.location.href : "",
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          })
          .catch(() => {});
      } catch {
        // Reportar una falla no puede provocar otra.
      }
    },

    async getEstablishmentFromApi(slug, intento = 0) {
      try {
        const { data } = await api.get(`/establishment/${slug}`);
        return data;
      } catch (error) {
        // No reintenta en 404 (negocio inexistente): la respuesta no va a cambiar.
        const espera = ESPERAS_DE_REINTENTO[intento];
        if (espera !== undefined && error?.response?.status !== 404) {
          await new Promise((resolve) => setTimeout(resolve, espera));
          return this.getEstablishmentFromApi(slug, intento + 1);
        }
        throw error;
      }
    },
    async getProducts() {
      await this.productStore.getProducts();
    },
    getProductsByCategoryId(categoryId) {
      const items = this.productStore.getProductsByCategoryId(
        categoryId,
        this.search
      );

      return items;
    },
    async seeProduct(product) {
      if (product.is_sold_out) {
        this.messageStore.error("Este producto está agotado");
        return;
      }
      const seeProducto = Object.assign({}, product);
      this.productStore.seeProduct(seeProducto);
      this.addCartDrawer = true;
      trackFb("ViewContent", {
        content_name: product.name,
        content_ids: [product.id],
        content_type: "product",
        value: Number(product.price) || 0,
        currency: "MXN",
      });
    },
    // Abre el detalle de un platillo por id (usado por el link compartido ?dish=<id>).
    seeProductById(id) {
      const prod = (this.productStore.items || []).find(
        (p) => String(p.id) === String(id)
      );
      if (prod) {
        this.seeProduct(JSON.parse(JSON.stringify(prod)));
      }
    },
    editProduct(product) {
      const productCart = this.cartStore.editProduct(product);
      this.productStore.editProduct(productCart);
      this.cartDrawer = false;
      this.addCartDrawer = true;
    },
    countByCategory(categoryId) {
      return this.productStore.countByCategory[categoryId] > 0;
    },
    addToCart() {
      // Última barrera: los botones ya están ocultos, pero un carrito viejo o un
      // atajo del teclado no deben poder colarse.
      if (!this.orderingEnabled) {
        this.messageStore.error("Este restaurante no está recibiendo pedidos en línea");
        return;
      }
      if (!this.companyStore.isOpen) {
        this.messageStore.error("Establecimiento cerrado");

        return;
      }
      if (this.productStore.product?.is_sold_out) {
        this.messageStore.error("Este producto está agotado");
        return;
      }
      if (this.cartStore.isEditing) {
        this.cartDrawer = true;
      }
      /*VALIDATIONS*/
      let hasErrors = false;
      if (this.productStore.product.qty === 0) {
        this.messageStore.error("La cantidad no puede ser 0");
        hasErrors = true;
      }
      if (this.productStore.product.totalPrice === 0) {
        this.messageStore.error("El precio no puede ser 0");
        hasErrors = true;
      }

      this.productStore.product.extras.forEach((extra) => {
        extra.hasError = false;
        if (extra.is_required) {
          const hasQty = extra.options.some((option) => option.qty > 0);
          if (!hasQty) {
            extra.hasError = true;
            hasErrors = true;
            this.messageStore.error(`El campo ${extra.name} es requerido`);
          }
        }
      });
      if (hasErrors) return;

      const wasEditing = this.cartStore.isEditing;
      const added = this.productStore.product;
      this.cartStore.addToCart(Object.assign({}, added));
      if (!wasEditing) {
        trackFb("AddToCart", {
          content_name: added.name,
          content_ids: [added.id],
          content_type: "product",
          value: Number(added.totalPrice) * Number(added.qty || 1) || 0,
          currency: "MXN",
        });
      }
      this.productStore.product = {};
      this.addCartDrawer = false;
      this.messageStore.cartAdded(
        wasEditing ? "Producto actualizado" : "Agregado a tu pedido",
        wasEditing ? null : () => { this.cartDrawer = true; }
      );
    },
    reorder(historyEntry) {
      if (historyEntry.establishment !== this.companyStore.slug) {
        this.messageStore.error("Este pedido es de otro establecimiento");
        return;
      }
      this.cartStore.clear();
      historyEntry.cart.forEach((product) => {
        this.cartStore.addToCart(JSON.parse(JSON.stringify(product)));
      });
      this.cartDrawer = true;
      this.messageStore.success("Pedido cargado al carrito");
    },
    removeProduct(index) {
      const removed = this.cartStore.cart[index];
      const snapshot = removed ? JSON.parse(JSON.stringify(removed)) : null;
      this.cartStore.removeProduct(index);
      if (snapshot) {
        this.messageStore.cartRemoved(snapshot.name, () => {
          this.cartStore.restoreProduct(index, snapshot);
          this.cartDrawer = true;
        });
      }
      if (this.cartStore.isEmpty) {
        this.cartDrawer = false;
      }
    },
    setViewType(value) {
      this.viewType = value;
      try {
        localStorage.setItem("mc-view", value);
      } catch {
        // ignore
      }
    },
    /**
     * Salta a una categoría del menú y la deja seleccionada.
     *
     * La usan los DOS caminos que existen: el click en un tab y el deep-link
     * ?cat= del iframe. Antes cada uno tenía su propia versión y se
     * desincronizaron: el deep-link no ponía el candado del spy y usaba un
     * offset fijo, así que el tab se quedaba en la categoría anterior.
     */
    goToCategory(id, isNarrow = false) {
      this.tab = id;
      // Sin este candado el spy recalcula durante el scroll suave y, como todavía
      // va pasando por la categoría anterior, le regresa el tab.
      this.spyLockUntil = Date.now() + 1000;

      const section = document.getElementById(String(id));
      if (!section) return;

      const offset = scrollOffsetFor({ isExternal: !!this.isExternal, isNarrow });
      const y = section.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top: y, behavior: "smooth" });
    },
    setTip(value) {
      if (value === "otro") {
        this.tip.type = "otro";
        this.tip.value = 0;
      } else {
        this.tip.type = "price";
        this.tip.value = value;
      }
    },
    async getTowns() {
      try {
        const { data } = await api.get(`/towns/${this.data.zip}`);
        this.data.towns = data.towns;
      } catch (error) {
        this.messageStore.error("No se encontraron colonias para ese codigo postal");
        this.data.towns = [];
      }
    },
    hasService(service) {
      return (
        this.company.features.find((f) => f.feature_id === service)?.value ===
        "1"
      );
    },
    buildWhatsAppUrl() {
      const rawPhone = (this.company.whatsapp || "").replace(/\D/g, "");
      const phoneNumber = rawPhone.length === 10 ? "52" + rawPhone : rawPhone;
      const f = (n) => Number(n || 0).toFixed(2);
      // Limpia el texto para que las negritas de WhatsApp (*texto*) siempre
      // apliquen: recorta espacios (un espacio antes del * de cierre rompe el
      // formato) y quita asteriscos sueltos internos.
      const b = (text) => String(text ?? "").replace(/\*/g, "").trim();
      const lines = [];

      // Header
      lines.push(`Hola *${b(this.establishment.name)}*`);
      lines.push(`Soy *${b(this.data.name)}*, quisiera hacer el siguiente pedido:`);
      lines.push(``);

      // Order number
      lines.push(`*Orden #${this.orderStore.orderCode}*`);
      if (this.schedule.enabled && this.schedule.at) {
        lines.push(`🕒 *Programado para:* ${this.schedule.at.replace("T", " ")}`);
      }
      lines.push(`- - - - - - - - - - - - - -`);

      // Products
      this.cart.forEach((product) => {
        const total = product.totalPrice * product.qty;
        lines.push(`*${product.qty}x ${b(product.name)}* — $${f(total)}`);

        (product.extras || []).forEach((extra) => {
          (extra.options || []).forEach((option) => {
            if (option.qty > 0) {
              let line = `   ↳ ${option.name}`;
              if (option.qty * product.qty > 1) {
                line = `   ↳ ${option.qty * product.qty}x ${option.name}`;
              }
              if (option.price > 0) {
                line += ` $${f(option.price * product.qty * option.qty)}`;
              }
              lines.push(line);
            }
          });
        });

        // La nota va pegada a SU platillo, no al final del mensaje: el restaurante
        // tiene que saber a cuál se refiere. Pasa por b() como el nombre, porque un
        // asterisco suelto rompe el negrita de WhatsApp.
        // Sin emoji a propósito: este mismo texto se imprime en tickets térmicos,
        // que no saben renderizarlos, y no todos los clientes de WhatsApp los
        // muestran igual. El ↳ es el mismo que ya se usa para los extras.
        if (product.notes) {
          lines.push(`   ↳ Nota: ${b(product.notes)}`);
        }
      });

      // Totals
      lines.push(`- - - - - - - - - - - - - -`);
      lines.push(`Subtotal: $${f(this.total)}`);
      if (this.deliveryCharge > 0) {
        // Marcado cuando no se pudo ubicar la dirección: le avisa al dueño por
        // WhatsApp que ese envío se cobró sin conocer la distancia real.
        lines.push(
          this.deliveryEstimated
            ? `Envio: $${f(this.deliveryCharge)} (ESTIMADO - revisar distancia)`
            : `Envio: $${f(this.deliveryCharge)}`
        );
      }
      if (this.tip.value > 0) {
        lines.push(`Propina: $${f(this.tip.value)}`);
      }
      if (this.coupon.applied) {
        lines.push(`Cupon *${this.coupon.code}*: -$${f(this.coupon.discount)}`);
      }
      lines.push(`*Total: $${f(this.totalToPay)}*`);
      lines.push(``);

      // Payment
      lines.push(`- - - - - - - - - - - - - -`);
      if (this.payment.type === "Efectivo") {
        lines.push(`*Pago*: Efectivo`);
        if (this.payment.value > this.totalToPay) {
          lines.push(`Pago con: $${f(this.payment.value)} (cambio: $${f(this.payment.value - this.totalToPay)})`);
        }
      } else {
        lines.push(`*Pago*: ${this.payment.type}`);
      }

      // Delivery info
      lines.push(`*Contacto*: ${this.data.phone}`);
      if (this.data.delivery === "Envio") {
        const addr = [
          this.data.street,
          this.data.ext_number ? `#${this.data.ext_number}` : "",
          this.data.int_number ? `Int. ${this.data.int_number}` : "",
          this.data.town,
          this.data.zip,
        ].filter(Boolean).join(", ");
        lines.push(`*Direccion*: ${addr}`);
        if (this.data.references) {
          lines.push(`*Referencia*: ${this.data.references}`);
        }
      } else if (this.data.delivery === "Recoger") {
        lines.push(`*Paso a recoger*`);
      } else {
        lines.push(`*Mesa*: ${this.data.table}`);
      }

      // Comments
      if (this.data.comments) {
        lines.push(``);
        lines.push(`*Comentarios*:`);
        lines.push(this.data.comments);
      }

      // Footer
      lines.push(``);
      lines.push(`_Pedido generado desde ${this.establishment.name}_`);

      const messageUri = encodeURIComponent(lines.join("\n"));
      this.whatsappUrl = `https://wa.me/${phoneNumber}?text=${messageUri}`;
    },
    openWhatsApp() {
      if (!this.whatsappUrl) return;
      const popup = window.open(this.whatsappUrl, "_blank");
      if (!popup) {
        window.location.href = this.whatsappUrl;
      }
    },
    // Borra la ubicación derivada. user-store es persistido, así que sin esto un
    // cliente arrastraría la coordenada de otro establecimiento, o la de una
    // dirección que ya corrigió.
    clearGeo() {
      this.userStore.data.latitude = null;
      this.userStore.data.longitude = null;
      this.userStore.data.distance = null;
      this.userStore.data.geo_precision = null;
    },
    // Convierte la dirección escrita en lat/lng para poder cobrar por distancia.
    // Antes esto salía del GPS del dispositivo, que mide dónde está el celular y
    // no a dónde va el pedido — y que la mayoría de los clientes ni autoriza.
    // Nunca lanza: si falla, el envío queda como estimado y el checkout sigue.
    async geocodeAddress() {
      const d = this.userStore.data;
      if (!d.zip && !d.town) return;
      try {
        const { data } = await api.post(
          `/establishment/${this.companyStore.slug}/geocode`,
          {
            zip: d.zip ?? null,
            town: d.town ?? null,
            street: d.street ?? null,
            ext_number: d.ext_number ?? null,
          }
        );
        d.geo_precision = data.match_precision ?? null;
        if (data.lat == null || data.lng == null) {
          d.latitude = null;
          d.longitude = null;
          d.distance = null;
          return;
        }
        d.latitude = data.lat;
        d.longitude = data.lng;
        this.getDistance();
      } catch (e) {
        this.clearGeo();
      }
    },
    getDistance() {
      const { latitude, longitude } = this.userStore.data;

      const coordinates = this.companyStore.companyMap
        .replaceAll(" ", "")
        .split(",");

      if (coordinates.length < 2) return;

      const lat = parseFloat(coordinates[0]);
      const lng = parseFloat(coordinates[1]);

      const R = 6371e3; // metres
      const φ1 = (lat * Math.PI) / 180; // φ, λ in radians
      const φ2 = (latitude * Math.PI) / 180;
      const Δφ = ((latitude - lat) * Math.PI) / 180;
      const Δλ = ((longitude - lng) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      const distance = R * c; // in metres

      this.userStore.data.distance = distance.toFixed(2) / 1000;
    },
  },
});
