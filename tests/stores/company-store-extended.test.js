import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useCompanyStore } from "stores/company-store";

describe("company-store - extended coverage", () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useCompanyStore();
  });

  describe("setForm", () => {
    it("creates a copy of the current company", () => {
      store.company = { name: "Test", slug: "test" };
      store.setForm();
      expect(store.companyForm.name).toBe("Test");
      store.companyForm.name = "Changed";
      expect(store.company.name).toBe("Test");
    });

    it("creates empty form when company is empty", () => {
      store.company = {};
      store.setForm();
      expect(store.companyForm).toEqual({});
    });
  });

  describe("setTypes", () => {
    it("sets types array", () => {
      store.setTypes([{ id: 1, name: "Restaurante" }, { id: 2, name: "Cafetería" }]);
      expect(store.types).toHaveLength(2);
      expect(store.types[0].name).toBe("Restaurante");
    });

    it("overwrites previous types", () => {
      store.setTypes([{ id: 1, name: "Old" }]);
      store.setTypes([{ id: 2, name: "New" }]);
      expect(store.types).toHaveLength(1);
      expect(store.types[0].name).toBe("New");
    });
  });

  describe("setCategories", () => {
    it("sets categories array", () => {
      store.setCategories([{ id: 1, name: "Comida" }]);
      expect(store.categories).toHaveLength(1);
    });
  });

  describe("setCompanyTip / setCompanyPayment", () => {
    it("sets tip", () => {
      store.setCompanyTip({ type: "percent", value: 15 });
      expect(store.companyTip.type).toBe("percent");
      expect(store.companyTip.value).toBe(15);
    });

    it("sets payment", () => {
      store.setCompanyPayment({ type: "Tarjeta", value: 0 });
      expect(store.companyPayment.type).toBe("Tarjeta");
    });
  });

  describe("setAddressForm", () => {
    it("creates a copy of company address", () => {
      store.company = { address: { street: "Calle 1", city: "CDMX" } };
      store.setAddressForm();
      expect(store.addressForm.street).toBe("Calle 1");
      store.addressForm.street = "Changed";
      expect(store.company.address.street).toBe("Calle 1");
    });

    it("handles undefined address", () => {
      store.company = {};
      store.setAddressForm();
      expect(store.addressForm).toEqual({});
    });
  });

  describe("getters - extended", () => {
    it("coordinates returns company coordinates", () => {
      store.company = { coordinates: "24.81, -107.39" };
      expect(store.coordinates).toBe("24.81, -107.39");
    });

    it("coordinates returns empty string when not set", () => {
      expect(store.coordinates).toBe("");
    });

    it("companyData returns company.data", () => {
      store.company = { data: { delivery: "Envio" } };
      expect(store.companyData.delivery).toBe("Envio");
    });

    it("companyCategories returns company categories", () => {
      store.company = { categories: [{ id: 1 }] };
      expect(store.companyCategories).toHaveLength(1);
    });

    it("companyCategories returns empty array when not set", () => {
      expect(store.companyCategories).toEqual([]);
    });

    it("companyProduct returns company.product", () => {
      store.company = { product: { id: 1, name: "Test" } };
      expect(store.companyProduct.name).toBe("Test");
    });

    it("companyTotalToPay returns payment value", () => {
      store.company = { payment: { value: 250 } };
      expect(store.companyTotalToPay).toBe(250);
    });

    it("companyTotalToPay returns undefined when no payment", () => {
      expect(store.companyTotalToPay).toBeUndefined();
    });
  });

  describe("setScheduleForm - accent matching", () => {
    it("matches days with and without accents", () => {
      store.company = {
        hours: [
          { day_of_week: "miercoles", open_time: "10:00", close_time: "20:00" },
        ],
      };
      store.setScheduleForm();
      const wed = store.scheduleForm.find((d) =>
        d.day_of_week.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === "miercoles"
      );
      expect(wed.open_time).toBe("10:00");
    });
  });

  describe("clear - full reset", () => {
    it("resets all payment-related state", () => {
      store.company = { name: "Test" };
      store.companyTip = { type: "percent", value: 20 };
      store.companyPayment = { type: "Tarjeta", value: 100 };

      store.clear();

      expect(store.company).toEqual({});
      expect(store.companyTip.type).toBe("price");
      expect(store.companyTip.value).toBe(0);
      expect(store.companyPayment.type).toBe("Efectivo");
      expect(store.companyPayment.value).toBe(0);
    });
  });
});
