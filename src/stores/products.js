import { defineStore } from "pinia";
import { controlOf, priceModeOf, maxOf, chosenOf } from "src/utils/extraConfig";

// ¿El platillo está dentro de su horario disponible ahora? Sin horario => siempre.
// Soporta ventanas que cruzan medianoche (ej. 22:00–02:00).
function isAvailableNow(item) {
  const from = item.available_from;
  const until = item.available_until;
  if (!from || !until) return true;
  const toMin = (t) => {
    const [h, m] = String(t).split(":");
    return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0);
  };
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const f = toMin(from);
  const u = toMin(until);
  if (f === u) return true;
  if (f < u) return cur >= f && cur <= u;
  return cur >= f || cur <= u; // cruza medianoche
}

export const useProductStore = defineStore("products", {
  state: () => ({
    product: null,
    data: {
      name: "Restaurante",
      phone: "",
      delivery: false,
    },
    editing: -1,
    items: [],
    categories: [],
    countByCategory: [],
  }),
  persist: true,
  getters: {
    featuredProducts() {
      return this.items.filter((item) => item.is_featured && isAvailableNow(item));
    },
    specialOffers() {
      const now = new Date();
      return this.items.filter(
        (item) =>
          item.special_price &&
          (!item.special_until || new Date(item.special_until) > now) &&
          isAvailableNow(item)
      );
    },
  },
  actions: {
    clear() {
      this.product = null;
      this.editing = -1;
      this.items = [];
      this.categories = [];
    },
    getProductsByCategoryId(categoryId, search) {
      let items = this.items.filter(
        (item) => item.dish_category_id === categoryId && isAvailableNow(item)
      );
      if (search) {
        items = items.filter((item) =>
          item.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      this.countByCategory[categoryId] = items.length;
      return items;
    },
    seeProduct(product) {
      this.product = Object.assign({}, product);
      this.product.qty = 1;
      this.product.totalPrice = parseFloat(product.price);
      this.product.extras = [...(product.extras || [])].sort((a, b) => a.order - b.order);
      this.product.extras.forEach((extra) => {
        // Solo el radio preselecciona: es el único donde "no elegir" no es opción.
        if (controlOf(extra) === "radio" && extra.is_required && extra.options?.length) {
          extra.options[0].qty = 1;
        }
      });
      this.updatePrice();
    },
    editProduct(product) {
      this.product = product;
    },
    increment() {
      this.product.qty++;
      this.updatePrice();
    },
    decrement() {
      this.product.qty--;
      this.updatePrice();
    },
    isDisabled(extra) {
      this.updatePrice();
      return chosenOf(extra) >= maxOf(extra);
    },
    updatePrice() {
      // El modo de precio de cada extra sale de su configuración (ver
      // src/utils/extraConfig.js), no de adivinar por los precios de las opciones:
      //  - "replace": la opción ES el precio del platillo (variantes de tamaño,
      //    ej. Charola $425 -> opción "36 Piezas" $425 = $425).
      //  - "add": el precio base se cuenta una vez y las opciones se suman encima.
      // El servidor aplica exactamente la misma regla leyendo el mismo campo.
      const base = parseFloat(this.product.price) || 0;

      if (!this.product.extras || this.product.extras.length === 0) {
        this.product.totalPrice = base;
        return;
      }

      let replaceSum = 0; // opciones absolutas (reemplazan la base)
      let hasReplace = false;
      let addSum = 0; // opciones que se suman a la base

      this.product.extras.forEach((extra) => {
        const sum = extra.options.reduce((acc, option) => {
          option.qty = option.qty ?? 0;
          option.price = option.price ?? 0;
          return acc + parseFloat(option.qty * option.price);
        }, 0);

        if (priceModeOf(extra) === "replace") {
          hasReplace = true;
          replaceSum += sum;
        } else {
          addSum += sum;
        }
      });

      this.product.totalPrice = (hasReplace ? replaceSum : base) + addSum;
    },
    setProducts(products) {
      this.items = products;
    },
    setCategories(categories) {
      this.categories = categories;
    },
    removeProduct(index) {
      this.items.splice(index, 1);
    },
  },
});
