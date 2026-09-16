import { defineStore } from "pinia";
import { api } from "boot/axios";

/**
 * Si una respuesta se pidio para otro local que el que se esta viendo ahora.
 *
 * El dueño cambia el selector mientras hay una peticion en camino: sin esto, la lista de
 * Centro llegaba tarde y se mezclaba con la de la Matriz, o la alerta sonaba por pedidos
 * que ya no le tocan.
 */
const deOtroLocal = (store, params) => (params?.local ?? null) !== store.localActual;

export const useOrderStore = defineStore("order", {
  persist: {
    pick: ["orderHistory"],
  },
  state: () => ({
    order: {},
    orders: [],
    counts: [],
    // Si el negocio ya vendio alguna vez, cerrado o no. Lo manda el servidor: los
    // contadores ya no cuentan lo cerrado y no alcanzan para saberlo.
    hayPedidos: false,
    orderHistory: [],
    // Seguimiento GLOBAL de pendientes (para la alerta que no depende de la pestaña)
    pendingSeenIds: null,
    pendingCount: 0,
    // El local cuyos pedidos se estan viendo (null = todos). Lo fija el panel con
    // cambiarLocal; las respuestas pedidas para otro se tiran.
    localActual: null,
  }),
  getters: {
    orderCode() {
      return this.order.order_code ?? 1;
    },
  },
  actions: {
    async getMoreOrders(status, slug, params = {}) {
      const { data } = await api.get(`/admin/${slug}/orders/${status}/more`, { params });
      if (deOtroLocal(this, params)) return 0;

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
      // Number() y no confiar en lo que venga: el conteo llegaba como la cadena
      // "1847.00" —el backend lo aliaseaba como `total` y le caia el cast del dinero—
      // y "1847.00" + 1 en JavaScript no suma, concatena: el badge pasaba a 1847.001.
      // El backend ya manda enteros; esto evita que el mismo tipo de dato vuelva a
      // colarse desde otro lado.
      const from = order.status?.id ?? order.current_status_id;
      if (from != null) {
        this.counts[from] = Number(this.counts[from] ?? 0) - 1;
      }
      this.counts[toStatus] = Number(this.counts[toStatus] ?? 0) + 1;
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
    async getOrders(slug, status, params = {}) {
      const { data } = await api.get(`/admin/${slug}/orders/${status}`, { params });
      if (deOtroLocal(this, params)) return;

      this.orders = data.orders;
    },
    /**
     * Pasa a ver otro local. La alerta vuelve a aprender que pendientes hay sin sonar: si
     * no, cambiar de la Matriz a Centro sonaba por cada pedido de Centro que ya estaba ahi.
     */
    cambiarLocal(local) {
      this.localActual = local ?? null;
      this.pendingSeenIds = null;
    },
    aplicarConteos(data) {
      this.counts = data.counts ?? {};
      this.hayPedidos = !!data.hay_pedidos;
    },
    /** Los contadores de las pestañas, sin tocar lo que la alerta ya vio. */
    async getCounts(slug, params = {}) {
      const { data } = await api.get(`/admin/${slug}/orders/counts`, { params });
      if (deOtroLocal(this, params)) return;

      this.aplicarConteos(data);
    },
    // Consulta los PENDIENTES y detecta pedidos nuevos sin tocar la lista visible del
    // tab actual. Devuelve cuántos nuevos hay. De paso deja los contadores al dia: es la
    // misma peticion.
    async refreshPending(slug, params = {}) {
      const { data } = await api.get(`/admin/${slug}/orders/counts`, { params });
      if (deOtroLocal(this, params)) return { newCount: 0 };

      this.aplicarConteos(data);
      const ids = data.pendientes || [];
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
