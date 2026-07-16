import { defineStore } from "pinia";
import { api } from "boot/axios";

export const useOrderStore = defineStore("order", {
  persist: {
    pick: ["orderHistory"],
  },
  state: () => ({
    order: {},
    orders: [],
    counts: [],
    orderHistory: [],
  }),
  getters: {
    orderCode() {
      return this.order.order_code ?? 1;
    },
  },
  actions: {
    async getMoreOrders(status, slug) {
      const { data } = await api.get(`/admin/${slug}/orders/${status}/more`);

      let newCount = 0;
      data.orders.forEach((order) => {
        if (!this.orders.find((o) => o.id === order.id)) {
          this.orders.unshift(order);
          newCount++;
        }
      });
      return newCount;
    },
    async startOrder(order, slug) {
      this.counts[order.current_status_id] =
        this.counts[order.current_status_id] - 1;
      this.counts[2] = (this.counts[2] ?? 0) + 1;
      this.orders = this.orders.filter((o) => {
        return o.id !== order.id;
      });

      return await this.updateStatusOrder(order, slug, 2);
    },
    async sendOrder(order, slug) {
      this.counts[order.current_status_id] =
        this.counts[order.current_status_id] - 1;
      this.counts[3] = (this.counts[3] ?? 0) + 1;
      this.orders = this.orders.filter((o) => {
        return o.id !== order.id;
      });
      return await this.updateStatusOrder(order, slug, 3);
    },
    async deliverOrder(order, slug) {
      this.counts[order.current_status_id] =
        this.counts[order.current_status_id] - 1;
      this.counts[4] = (this.counts[4] ?? 0) + 1;
      this.orders = this.orders.filter((o) => {
        return o.id !== order.id;
      });
      return await this.updateStatusOrder(order, slug, 4);
    },
    async cancelOrder(order, slug) {
      this.counts[order.current_status_id] =
        this.counts[order.current_status_id] - 1;
      this.counts[5] = (this.counts[5] ?? 0) + 1;
      this.orders = this.orders.filter((o) => {
        return o.id !== order.id;
      });
      return await this.updateStatusOrder(order, slug, 5);
    },
    async updateStatusOrder(order, slug, status) {
      const { data } = await api.get(
        `/admin/${slug}/orders/${order.id}/${status}/update`
      );
      return data;
    },
    saveToHistory(orderData) {
      this.orderHistory.unshift({
        ...orderData,
        savedAt: new Date().toISOString(),
      });
      if (this.orderHistory.length > 20) {
        this.orderHistory = this.orderHistory.slice(0, 20);
      }
    },
    removeFromHistory(index) {
      this.orderHistory.splice(index, 1);
    },
    setOrder(order) {
      this.order = order;
    },
    clear() {
      this.order = {};
    },
    setCounts(counts) {
      this.counts = counts;
    },
    async getOrders(slug, status) {
      const { data } = await api.get(`/admin/${slug}/orders/${status}`);

      this.orders = data.orders;
    },
  },
});
