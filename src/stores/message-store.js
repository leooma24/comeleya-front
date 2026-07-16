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
    error(message) {
      Notify.create({
        message,
        color: "negative",
      });
    },
  },
});
