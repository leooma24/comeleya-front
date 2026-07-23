import { defineStore } from "pinia";
import { api } from "boot/axios";

import { useProductStore } from "./products";
import { useUserStore } from "./user-store";
import { useCartStore } from "./cart-store";
import { useCompanyStore } from "./company-store";
import { useOrderStore } from "./order-store";
import { useMessageStore } from "./message-store";
import { initPixel, trackFb } from "src/utils/fbpixel";

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
    tab: 0,
    // true cuando la carga del establecimiento falló tras reintentar (para mostrar
    // un estado de "reintentar" en vez de skeletons pegados).
    loadError: false,
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
    hasError: {
      payment: false,
    },
    coupon: {
      id: null,
      code: "",
      discount: 0,
      applied: false,
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
      return this.data.delivery !== "Envio"
        ? 0
        : this.establishment.delivery_charge ?? 0;
    },
    getTip() {
      return this.tip.value;
    },
    totalToPay() {
      // El descuento del cupón se guarda como monto absoluto al aplicarlo; si el
      // carrito baja después, el total no debe volverse negativo.
      return Math.max(0, this.total + this.tip.value + this.deliveryCharge - this.coupon.discount);
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

      let establisment;
      try {
        establisment = await this.getEstablishmentFromApi(slug);
      } catch (error) {
        this.loadError = true;
        // Solo mostramos el toast si es un 404 real (negocio inexistente); para
        // fallos de red el estado de "Reintentar" en pantalla es más claro.
        if (error?.response?.status === 404) {
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

      // Píxel de Meta por establecimiento (si está activado y configurado).
      const fb = establisment.facebook_public;
      if (fb?.enabled && fb.pixel_id) {
        initPixel(fb.pixel_id);
      }
      return true;
    },
    async getEstablishmentFromApi(slug, retries = 2) {
      try {
        const { data } = await api.get(`/establishment/${slug}`);
        return data;
      } catch (error) {
        // Reintenta ante fallos transitorios (red móvil/5G, timeouts). No reintenta
        // en 404 (negocio inexistente): no tiene caso.
        const status = error?.response?.status;
        if (retries > 0 && status !== 404) {
          await new Promise((resolve) => setTimeout(resolve, 900));
          return this.getEstablishmentFromApi(slug, retries - 1);
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
      lines.push(`- - - - - - - - - - - - - -`);

      // Products
      this.cart.forEach((product) => {
        const total = product.totalPrice * product.qty;
        lines.push(`*${product.qty}x ${b(product.name)}* — $${f(total)}`);

        product.extras.forEach((extra) => {
          extra.options.forEach((option) => {
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
      });

      // Totals
      lines.push(`- - - - - - - - - - - - - -`);
      lines.push(`Subtotal: $${f(this.total)}`);
      if (this.deliveryCharge > 0) {
        lines.push(`Envio: $${f(this.deliveryCharge)}`);
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
    getPositions() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.userStore.data.latitude = position.coords.latitude;
            this.userStore.data.longitude = position.coords.longitude;
            this.getDistance();
          },
          function (error) {
            console.error("Error Code = " + error.code + " - " + error.message);
          }
        );
      } else {
        console.error("Geolocation is not supported by this browser.");
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
