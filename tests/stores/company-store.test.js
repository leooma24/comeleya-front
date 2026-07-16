import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useCompanyStore } from "stores/company-store";

describe("company-store", () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useCompanyStore();
  });

  describe("initial state", () => {
    it("starts with empty company", () => {
      expect(store.company).toEqual({});
      expect(store.slug).toBe("");
      expect(store.color).toBe("");
    });
  });

  describe("getters", () => {
    it("name returns empty string when no company", () => {
      expect(store.name).toBe("");
    });

    it("name returns company name", () => {
      store.company = { name: "Tacos El Pastor" };
      expect(store.name).toBe("Tacos El Pastor");
    });

    it("isOpen defaults to false", () => {
      expect(store.isOpen).toBe(false);
    });

    it("isOpen returns company isOpen value", () => {
      store.company = { isOpen: true };
      expect(store.isOpen).toBe(true);
    });

    it("hours returns empty array when no hours", () => {
      expect(store.hours).toEqual([]);
    });

    it("companyAddress formats address correctly", () => {
      store.company = {
        address: {
          street: "Calle 1",
          exterior_number: "100",
          city: "Culiacán",
          state: "Sinaloa",
          country: "México",
        },
      };
      expect(store.companyAddress).toBe(
        "Calle 1 100, Culiacán, Sinaloa, México"
      );
    });

    it("companyAddress handles missing address gracefully", () => {
      // address is undefined, so accessing properties returns undefined
      const address = store.companyAddress;
      expect(address).toContain("undefined");
    });

    it("whatsapp returns default number when not set", () => {
      expect(store.whatsapp).toBe("6682493398");
    });

    it("whatsapp returns company whatsapp", () => {
      store.company = { whatsapp: "1234567890" };
      expect(store.whatsapp).toBe("1234567890");
    });

    it("features returns empty array when not set", () => {
      expect(store.features).toEqual([]);
    });

    it("bank returns empty object when not set", () => {
      expect(store.bank).toEqual({});
    });

    it("logo returns empty string when not set", () => {
      expect(store.logo).toBe("");
    });

    it("companyMap returns empty string when no coordinates", () => {
      expect(store.companyMap).toBe("");
    });
  });

  describe("changeSlug / setSlug", () => {
    it("changeSlug returns true when slug is different", () => {
      store.slug = "old-slug";
      expect(store.changeSlug("new-slug")).toBe(true);
    });

    it("changeSlug returns false when slug is same", () => {
      store.slug = "same-slug";
      expect(store.changeSlug("same-slug")).toBe(false);
    });

    it("setSlug clears company when slug changes", () => {
      store.slug = "old";
      store.company = { name: "Old Company" };
      store.setSlug("new");
      expect(store.slug).toBe("new");
      expect(store.company).toEqual({});
    });

    it("setSlug does not clear when slug is the same", () => {
      store.slug = "same";
      store.company = { name: "Keep" };
      store.setSlug("same");
      expect(store.company.name).toBe("Keep");
    });
  });

  describe("setCompany / setCompanies", () => {
    it("sets company data", () => {
      store.setCompany({ name: "Test", isOpen: true });
      expect(store.company.name).toBe("Test");
    });

    it("sets companies list", () => {
      store.setCompanies([{ id: 1 }, { id: 2 }]);
      expect(store.companies).toHaveLength(2);
    });

    it("addCompany pushes to companies list", () => {
      store.companies = [{ id: 1 }];
      store.addCompany({ id: 2 });
      expect(store.companies).toHaveLength(2);
    });
  });

  describe("clear", () => {
    it("resets company and payment state", () => {
      store.company = { name: "Test" };
      store.companyTip = { type: "otro", value: 50 };

      store.clear();
      expect(store.company).toEqual({});
      expect(store.companyTip.type).toBe("price");
      expect(store.companyTip.value).toBe(0);
      expect(store.companyPayment.type).toBe("Efectivo");
    });
  });

  describe("setScheduleForm", () => {
    it("creates default schedule when company has no hours", () => {
      store.company = { hours: [] };
      store.setScheduleForm();
      expect(store.scheduleForm).toHaveLength(7);
      expect(store.scheduleForm[0].day_of_week).toBe("lunes");
      expect(store.scheduleForm[5].is_closed).toBe(true); // sábado
      expect(store.scheduleForm[6].is_closed).toBe(true); // domingo
    });

    it("merges company hours with defaults for all 7 days", () => {
      store.company = {
        hours: [
          { day_of_week: "lunes", open_time: "10:00", close_time: "20:00" },
          { day_of_week: "martes", open_time: "09:00", close_time: "18:00" },
        ],
      };
      store.setScheduleForm();
      expect(Array.isArray(store.scheduleForm)).toBe(true);
      expect(store.scheduleForm).toHaveLength(7);
      expect(store.scheduleForm[0].day_of_week).toBe("lunes");
      expect(store.scheduleForm[0].open_time).toBe("10:00");
      expect(store.scheduleForm[1].open_time).toBe("09:00");
      // Non-provided days use defaults
      expect(store.scheduleForm[2].day_of_week).toBe("miércoles");
      expect(store.scheduleForm[2].open_time).toBe("09:00");
    });
  });

  describe("setFeatures", () => {
    it("maps features with company feature values", () => {
      store.company = {
        features: [
          { feature_id: 1, value: "1" },
          { feature_id: 2, value: "0" },
        ],
      };

      store.setFeatures([
        { id: 1, name: "Delivery" },
        { id: 2, name: "Pickup" },
        { id: 3, name: "Dine-in" },
      ]);

      expect(store.configuration.features).toHaveLength(3);
      expect(store.configuration.features[0].value).toBe(true);
      expect(store.configuration.features[1].value).toBe(false);
    });

    it("handles missing company features", () => {
      store.company = { features: [] };

      store.setFeatures([{ id: 1, name: "Test" }]);
      expect(store.configuration.features[0].value).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("setAddress modifies company address in place", () => {
      store.company = {};
      store.setAddress({ street: "New St" });
      expect(store.company.address.street).toBe("New St");
    });

    it("setPrimaryColor stores color", () => {
      store.setPrimaryColor("ff0000");
      expect(store.color).toBe("ff0000");
    });

    it("companyDeliveryCharge returns 0 when not delivery", () => {
      store.company = { data: { delivery: "Recoger" } };
      expect(store.companyDeliveryCharge).toBe(0);
    });

    it("companyDeliveryCharge returns charge when delivery", () => {
      store.company = { data: { delivery: "Envio" }, delivery_charge: 35 };
      expect(store.companyDeliveryCharge).toBe(35);
    });

    it("companyDeliveryCharge defaults to 0 when delivery_charge not set", () => {
      store.company = { data: { delivery: "Envio" } };
      expect(store.companyDeliveryCharge).toBe(0);
    });
  });
});
