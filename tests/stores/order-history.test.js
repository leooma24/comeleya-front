import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useOrderStore } from "stores/order-store";

describe("order-store - history", () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useOrderStore();
  });

  describe("saveToHistory", () => {
    it("adds order to history with timestamp", () => {
      store.saveToHistory({ order_code: "ORD-1", total: 100 });
      expect(store.orderHistory).toHaveLength(1);
      expect(store.orderHistory[0].order_code).toBe("ORD-1");
      expect(store.orderHistory[0].savedAt).toBeDefined();
    });

    it("adds new orders at the beginning (unshift)", () => {
      store.saveToHistory({ order_code: "ORD-1" });
      store.saveToHistory({ order_code: "ORD-2" });
      expect(store.orderHistory[0].order_code).toBe("ORD-2");
      expect(store.orderHistory[1].order_code).toBe("ORD-1");
    });

    it("limits history to 20 entries", () => {
      for (let i = 0; i < 25; i++) {
        store.saveToHistory({ order_code: `ORD-${i}` });
      }
      expect(store.orderHistory).toHaveLength(20);
      // Most recent should be first
      expect(store.orderHistory[0].order_code).toBe("ORD-24");
    });

    it("preserves existing entries when adding within limit", () => {
      store.saveToHistory({ order_code: "ORD-1" });
      store.saveToHistory({ order_code: "ORD-2" });
      expect(store.orderHistory).toHaveLength(2);
    });
  });

  describe("removeFromHistory", () => {
    it("removes entry at given index", () => {
      store.saveToHistory({ order_code: "ORD-1" });
      store.saveToHistory({ order_code: "ORD-2" });
      store.saveToHistory({ order_code: "ORD-3" });

      store.removeFromHistory(1); // remove middle entry
      expect(store.orderHistory).toHaveLength(2);
      expect(store.orderHistory[0].order_code).toBe("ORD-3");
      expect(store.orderHistory[1].order_code).toBe("ORD-1");
    });

    it("removes first entry", () => {
      store.saveToHistory({ order_code: "ORD-1" });
      store.saveToHistory({ order_code: "ORD-2" });

      store.removeFromHistory(0);
      expect(store.orderHistory).toHaveLength(1);
      expect(store.orderHistory[0].order_code).toBe("ORD-1");
    });

    it("removes last entry", () => {
      store.saveToHistory({ order_code: "ORD-1" });
      store.removeFromHistory(0);
      expect(store.orderHistory).toHaveLength(0);
    });
  });

  describe("updateStatusOrder", () => {
    it("returns data from API on status update", async () => {
      const { api } = await import("boot/axios");
      api.get.mockResolvedValueOnce({ data: { message: "OK" } });

      const result = await store.updateStatusOrder(
        { id: 1 },
        "test-slug",
        2
      );
      expect(result.message).toBe("OK");
      expect(api.get).toHaveBeenCalledWith("/admin/test-slug/orders/1/2/update");
    });
  });
});
