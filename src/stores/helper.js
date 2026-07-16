import { defineStore } from "pinia";
import { date } from "quasar";

export const useHelperStore = defineStore("helper", {
  state: () => ({
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }),
  actions: {
    formatDate(payload, format = "YYYY-MM-DD") {
      return date.formatDate(payload, format, {
        timeZone: this.timeZone,
      });
    },
  },
});
