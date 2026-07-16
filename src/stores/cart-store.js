import { defineStore } from "pinia";

export const useCartStore = defineStore("cart", {
  persist: true,
  state: () => ({
    cart: [],
    total: 0,
    editing: -1,
  }),
  getters: {
    isEmpty() {
      return this.cart.length === 0;
    },
    isEditing() {
      return this.editing !== -1;
    },
  },
  actions: {
    clear() {
      this.cart = [];
      this.total = 0;
      this.editing = -1;
    },
    addToCart(product) {
      const newProduct = Object.assign({}, product);
      if (this.editing !== -1) {
        this.cart[this.editing] = newProduct;
        this.editing = -1;
      } else {
        this.cart.push(newProduct);
      }

      this.updateTotal();
    },
    editProduct(index) {
      this.editing = index;
      const product = Object.assign({}, this.cart[index]);
      return product;
    },
    removeProduct(index) {
      this.cart.splice(index, 1);
      this.updateTotal();
    },
    updateTotal() {
      this.total = this.cart.reduce((acc, product) => {
        return acc + product.totalPrice * product.qty;
      }, 0);
    },
  },
});
