import { defineStore } from "pinia";

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
      return this.items.filter((item) => item.is_featured);
    },
    specialOffers() {
      const now = new Date();
      return this.items.filter(
        (item) =>
          item.special_price &&
          (!item.special_until || new Date(item.special_until) > now)
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
        (item) => item.dish_category_id === categoryId
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
      this.product.extras = [...product.extras].sort((a, b) => a.order - b.order);
      this.product.extras.forEach((extra) => {
        if (extra.qty === 1 && extra.is_required) {
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
      const sum = extra.options.reduce((acc, option) => {
        return acc + option.qty;
      }, 0);
      this.updatePrice();
      if (sum >= extra.qty) {
        return true;
      }
      return false;
    },
    updatePrice() {
      // Dos formas de configurar extras (detectadas automáticamente, igual que
      // checkOptionType en AddCartDrawer.vue):
      //  - "VARIANTE": extra de elegir 1 donde TODAS las opciones tienen precio > 0.
      //    El precio de la opción es ABSOLUTO y REEMPLAZA al precio base
      //    (ej. Yakimeshi $190 -> opción "de pollo" $190 = $190).
      //  - "ADITIVO": el precio base se cuenta una vez y las opciones se SUMAN
      //    encima (la opción base va en $0 y las demás llevan la diferencia).
      const base = parseFloat(this.product.price) || 0;

      if (!this.product.extras || this.product.extras.length === 0) {
        this.product.totalPrice = base;
        return;
      }

      let variantSum = 0; // opciones absolutas (reemplazan la base)
      let hasVariant = false;
      let addSum = 0; // opciones que se suman a la base

      this.product.extras.forEach((extra) => {
        const allPriced = extra.options.every((o) => (o.price ?? 0) > 0);
        const isVariant = extra.qty === 1 && allPriced;
        const sum = extra.options.reduce((acc, option) => {
          option.qty = option.qty ?? 0;
          option.price = option.price ?? 0;
          return acc + parseFloat(option.qty * option.price);
        }, 0);

        if (isVariant) {
          hasVariant = true;
          variantSum += sum;
        } else {
          addSum += sum;
        }
      });

      // Si hay extra tipo variante, su precio reemplaza la base; si no, se usa la base.
      this.product.totalPrice = (hasVariant ? variantSum : base) + addSum;
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
