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
    // Seguimiento GLOBAL de pendientes (para la alerta que no depende de la pestaña)
    pendingSeenIds: null,
    pendingCount: 0,
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
    // Transición de estado SEGURA: primero confirma con el servidor y solo si
    // tiene éxito actualiza la UI. Si falla, no se toca nada (el pedido no
    // desaparece) y el error se propaga para mostrar aviso.
    async transitionOrder(order, slug, toStatus) {
      const data = await this.updateStatusOrder(order, slug, toStatus);
      const from = order.status?.id ?? order.current_status_id;
      if (from != null) {
        this.counts[from] = (this.counts[from] ?? 0) - 1;
      }
      this.counts[toStatus] = (this.counts[toStatus] ?? 0) + 1;
      this.orders = this.orders.filter((o) => o.id !== order.id);
      return data;
    },
    startOrder(order, slug) {
      return this.transitionOrder(order, slug, 2);
    },
    sendOrder(order, slug) {
      return this.transitionOrder(order, slug, 3);
    },
    deliverOrder(order, slug) {
      return this.transitionOrder(order, slug, 4);
    },
    cancelOrder(order, slug) {
      return this.transitionOrder(order, slug, 5);
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
    // Consulta el listado de PENDIENTES (status 1) y detecta pedidos nuevos sin
    // tocar la lista visible del tab actual. Devuelve cuántos nuevos hay.
    async refreshPending(slug) {
      const { data } = await api.get(`/admin/${slug}/orders/1`);
      const ids = (data.orders || []).map((o) => o.id);
      let newCount = 0;
      // En el primer sondeo solo memoriza (no alerta por pedidos ya existentes)
      if (this.pendingSeenIds !== null) {
        const seen = new Set(this.pendingSeenIds);
        newCount = ids.filter((id) => !seen.has(id)).length;
      }
      this.pendingSeenIds = ids;
      this.pendingCount = ids.length;
      return { newCount };
    },
  },
});
