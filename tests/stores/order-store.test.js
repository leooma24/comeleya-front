import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useOrderStore } from "stores/order-store";
import { api } from "boot/axios";

describe("order-store", () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useOrderStore();
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("starts with empty order", () => {
      expect(store.order).toEqual({});
      expect(store.orders).toEqual([]);
      expect(store.counts).toEqual([]);
    });

    it("orderCode defaults to 1 when no order", () => {
      expect(store.orderCode).toBe(1);
    });
  });

  describe("setOrder / clear", () => {
    it("sets order data", () => {
      store.setOrder({ id: 1, order_code: "ABC123" });
      expect(store.order.id).toBe(1);
      expect(store.orderCode).toBe("ABC123");
    });

    it("clear resets order", () => {
      store.setOrder({ id: 1 });
      store.clear();
      expect(store.order).toEqual({});
    });
  });

  describe("setCounts", () => {
    it("sets counts array", () => {
      store.setCounts([0, 5, 3, 2, 1, 0]);
      expect(store.counts[1]).toBe(5);
    });
  });

  // El contador de las pestañas salia con decimales: el backend aliaseaba el conteo
  // como `total`, que es tambien la columna del DINERO del pedido, casteada como
  // decimal:2. El conteo llegaba entonces como la cadena "1847.00", y en JavaScript
  // "1847.00" + 1 no suma: concatena. Marcar un pedido como entregado dejaba el badge
  // en 1847.001.
  describe("el contador siempre es un numero, aunque llegue como cadena", () => {
    it("no concatena al mover un pedido de estado", async () => {
      store.counts = { 3: "1847.00", 4: "12.00" };
      store.orders = [{ id: 1, current_status_id: 3 }];

      api.get.mockResolvedValueOnce({ data: { message: "OK" } });

      await store.deliverOrder({ id: 1, current_status_id: 3 }, "test-slug");

      expect(store.counts[3]).toBe(1846);
      expect(store.counts[4]).toBe(13);
    });

    it("un contador que no existia arranca en 1 y no en '01'", async () => {
      store.counts = {};
      store.orders = [{ id: 1, current_status_id: 3 }];

      api.get.mockResolvedValueOnce({ data: { message: "OK" } });

      await store.deliverOrder({ id: 1, current_status_id: 3 }, "test-slug");

      expect(store.counts[4]).toBe(1);
    });
  });

  describe("startOrder", () => {
    it("decrements current status count and increments status 2", async () => {
      store.counts = [0, 5, 0, 0, 0, 0];
      store.orders = [
        { id: 1, current_status_id: 1 },
        { id: 2, current_status_id: 1 },
      ];

      api.get.mockResolvedValueOnce({ data: { message: "OK" } });

      await store.startOrder({ id: 1, current_status_id: 1 }, "test-slug");

      expect(store.counts[1]).toBe(4);
      expect(store.counts[2]).toBe(1);
      expect(store.orders).toHaveLength(1);
      expect(store.orders[0].id).toBe(2);
    });

    it("handles API error", async () => {
      store.counts = [0, 1, 0, 0, 0, 0];
      store.orders = [{ id: 1, current_status_id: 1 }];

      api.get.mockRejectedValueOnce(new Error("Network error"));

      // counts are updated optimistically before API call
      await expect(
        store.startOrder({ id: 1, current_status_id: 1 }, "slug")
      ).rejects.toThrow("Network error");
    });
  });

  describe("sendOrder", () => {
    it("moves order to status 3", async () => {
      store.counts = [0, 0, 3, 0, 0, 0];
      store.orders = [{ id: 1, current_status_id: 2 }];

      api.get.mockResolvedValueOnce({ data: { message: "Enviado" } });

      const result = await store.sendOrder({ id: 1, current_status_id: 2 }, "slug");
      expect(store.counts[2]).toBe(2);
      expect(store.counts[3]).toBe(1);
      expect(result.message).toBe("Enviado");
    });
  });

  describe("deliverOrder", () => {
    it("moves order to status 4", async () => {
      store.counts = [0, 0, 0, 2, 0, 0];
      store.orders = [{ id: 1, current_status_id: 3 }];

      api.get.mockResolvedValueOnce({ data: { message: "Entregado" } });

      await store.deliverOrder({ id: 1, current_status_id: 3 }, "slug");
      expect(store.counts[3]).toBe(1);
      expect(store.counts[4]).toBe(1);
    });
  });

  describe("cancelOrder", () => {
    it("moves order to status 5", async () => {
      store.counts = [0, 1, 0, 0, 0, 0];
      store.orders = [{ id: 1, current_status_id: 1 }];

      api.get.mockResolvedValueOnce({ data: { message: "Cancelado" } });

      await store.cancelOrder({ id: 1, current_status_id: 1 }, "slug");
      expect(store.counts[1]).toBe(0);
      expect(store.counts[5]).toBe(1);
    });
  });

  describe("getMoreOrders", () => {
    it("adds new orders without duplicates", async () => {
      store.orders = [{ id: 1, name: "Existing" }];

      api.get.mockResolvedValueOnce({
        data: {
          orders: [
            { id: 1, name: "Duplicate" },
            { id: 2, name: "New" },
          ],
        },
      });

      await store.getMoreOrders("pending", "slug");
      expect(store.orders).toHaveLength(2);
      expect(store.orders[0].id).toBe(2); // new orders added with unshift
    });

    it("handles API error on getMoreOrders", async () => {
      api.get.mockRejectedValueOnce(new Error("Failed"));

      await expect(store.getMoreOrders("pending", "slug")).rejects.toThrow(
        "Failed"
      );
    });
  });

  describe("getOrders", () => {
    it("fetches and sets orders", async () => {
      api.get.mockResolvedValueOnce({
        data: { orders: [{ id: 1 }, { id: 2 }] },
      });

      await store.getOrders("slug", "pending");
      expect(store.orders).toHaveLength(2);
    });

    it("throws on API failure", async () => {
      api.get.mockRejectedValueOnce(new Error("Server error"));

      await expect(store.getOrders("slug", "pending")).rejects.toThrow();
    });
  });

  describe("edge cases", () => {
    it("startOrder initializes counts[2] when undefined", async () => {
      store.counts = [0, 5];
      store.orders = [{ id: 1, current_status_id: 1 }];

      api.get.mockResolvedValueOnce({ data: { message: "OK" } });

      await store.startOrder({ id: 1, current_status_id: 1 }, "slug");
      expect(store.counts[2]).toBe(1);
    });

    it("orderCode returns order_code when set", () => {
      store.order = { order_code: "ORD-999" };
      expect(store.orderCode).toBe("ORD-999");
    });

    it("orderCode returns 1 when order_code is null", () => {
      store.order = { order_code: null };
      expect(store.orderCode).toBe(1);
    });
  });
});
