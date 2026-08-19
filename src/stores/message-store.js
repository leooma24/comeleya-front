import { defineStore } from "pinia";
import { Notify } from "quasar";

export const useMessageStore = defineStore("messages", {
  state: () => ({}),
  getters: {},
  actions: {
    success(message) {
      Notify.create({
        message,
        color: "positive",
      });
    },
    // Feedback al agregar/actualizar en el carrito: toast con check y acción opcional "Ver"
    cartAdded(message, onView) {
      Notify.create({
        message,
        color: "positive",
        icon: "check_circle",
        position: "top",
        timeout: 1800,
        actions: onView
          ? [{ label: "Ver", color: "white", handler: onView }]
          : [],
      });
    },
    // Feedback al eliminar del carrito con opción de deshacer
    cartRemoved(name, onUndo) {
      Notify.create({
        message: name ? `Eliminaste ${name}` : "Producto eliminado",
        color: "grey-9",
        icon: "delete_outline",
        position: "top",
        timeout: 4000,
        actions: [{ label: "Deshacer", color: "amber", handler: onUndo }],
      });
    },
    error(message) {
      Notify.create({
        message,
        color: "negative",
      });
    },
  },
});
