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
      // Garantiza que siempre haya un arreglo de extras (algunos platillos no traen
      // extras y llegan como null/undefined, lo que rompía el render y el envío).
      if (!Array.isArray(newProduct.extras)) newProduct.extras = [];
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
    // Nota del comensal para UNA línea ("sin cebolla"). Aplica a toda la línea:
    // si pidió 3 del mismo platillo, la nota va para los 3.
    setNotes(index, texto) {
      const item = this.cart[index];
      if (!item) return;
      const limpio = String(texto ?? "").trim();
      // Vacío = sin nota. Se borra la llave en vez de guardar "" para que el
      // payload no mande ruido al servidor.
      if (limpio) {
        item.notes = limpio;
      } else {
        delete item.notes;
      }
    },
    removeProduct(index) {
      this.cart.splice(index, 1);
      this.updateTotal();
    },
    // Reinserta un producto en su posición original (para "Deshacer")
    restoreProduct(index, product) {
      this.cart.splice(index, 0, product);
      this.updateTotal();
    },
    incrementLine(index) {
      const item = this.cart[index];
      if (!item) return;
      item.qty = (item.qty || 1) + 1;
      this.updateTotal();
    },
    decrementLine(index) {
      const item = this.cart[index];
      if (!item) return;
      if ((item.qty || 1) <= 1) return; // no baja de 1 (para quitar, usar eliminar)
      item.qty -= 1;
      this.updateTotal();
    },
    updateTotal() {
      this.total = this.cart.reduce((acc, product) => {
        return acc + product.totalPrice * product.qty;
      }, 0);
    },
  },
});
