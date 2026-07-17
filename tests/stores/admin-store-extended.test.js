import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAdminStore } from "stores/admin-store";
import { api } from "boot/axios";

describe("admin-store - extended coverage", () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useAdminStore();
    vi.clearAllMocks();
  });

  // --- CRM Prospects ---
  describe("CRM - prospects", () => {
    it("addProspect sets form and opens drawer", () => {
      store.addProspect();
      expect(store.prospectForm.source).toBe("otro");
      expect(store.prospectDrawer).toBe(true);
    });

    it("editProspect copies prospect and opens drawer", () => {
      const prospect = { id: 1, name: "Juan", source: "web" };
      store.editProspect(prospect);
      expect(store.prospectForm.name).toBe("Juan");
      expect(store.prospectDrawer).toBe(true);
      store.prospectForm.name = "Changed";
      expect(prospect.name).toBe("Juan");
    });

    it("getProspects fetches and sets prospects", async () => {
      api.get.mockResolvedValueOnce({
        data: { prospects: [{ id: 1, name: "Juan" }, { id: 2, name: "Maria" }] },
      });

      await store.getProspects();
      expect(store.prospects).toHaveLength(2);
    });

    it("getProspects handles paginated response", async () => {
      api.get.mockResolvedValueOnce({
        data: { prospects: { data: [{ id: 1 }] } },
      });

      await store.getProspects();
      expect(store.prospects).toHaveLength(1);
    });

    it("getProspects handles API error", async () => {
      api.get.mockRejectedValueOnce(new Error("Network"));

      await store.getProspects();
      expect(store.prospects).toEqual([]);
    });

    it("saveProspect creates new prospect", async () => {
      store.prospectForm = { name: "Nuevo", source: "web" };

      api.post.mockResolvedValueOnce({
        data: { prospect: { id: 1, name: "Nuevo", source: "web" } },
      });

      await store.saveProspect();
      expect(store.prospects).toHaveLength(1);
      expect(store.prospects[0].name).toBe("Nuevo");
      expect(store.prospectDrawer).toBe(false);
    });

    it("saveProspect updates existing prospect", async () => {
      store.prospects = [{ id: 1, name: "Old" }];
      store.prospectForm = { id: 1, name: "Updated" };

      api.put.mockResolvedValueOnce({
        data: { prospect: { id: 1, name: "Updated" } },
      });

      await store.saveProspect();
      expect(store.prospects[0].name).toBe("Updated");
      expect(store.prospectDrawer).toBe(false);
    });

    it("saveProspect handles API error", async () => {
      store.prospectForm = { name: "Test" };

      api.post.mockRejectedValueOnce({
        response: { data: { message: "Validation error" } },
      });

      await store.saveProspect();
      // Should not crash
    });

    it("deleteProspect removes from list", async () => {
      store.prospects = [{ id: 1 }, { id: 2 }];

      api.delete.mockResolvedValueOnce({});

      await store.deleteProspect({ id: 1 });
      expect(store.prospects).toHaveLength(1);
      expect(store.prospects[0].id).toBe(2);
    });

    it("deleteProspect handles API error", async () => {
      store.prospects = [{ id: 1 }];

      api.delete.mockRejectedValueOnce(new Error("Server error"));

      await store.deleteProspect({ id: 1 });
      expect(store.prospects).toHaveLength(1);
    });
  });

  // --- Packages ---
  describe("packages", () => {
    it("getPackages fetches and sets packages", async () => {
      api.get.mockResolvedValueOnce({
        data: { packages: [{ id: 1, name: "Free" }, { id: 2, name: "Pro" }] },
      });

      await store.getPackages();
      expect(store.packages).toHaveLength(2);
    });

    it("getPackages handles error", async () => {
      api.get.mockRejectedValueOnce(new Error("Error"));

      await store.getPackages();
      expect(store.packages).toEqual([]);
    });

    it("savePackage creates new package", async () => {
      store.packageForm = { name: "Basic" };

      api.post.mockResolvedValueOnce({
        data: { package: { id: 1, name: "Basic" } },
      });

      store.savePackage();
      await vi.waitFor(() => expect(store.packages).toHaveLength(1));
    });

    it("savePackage updates existing package", async () => {
      store.packages = [{ id: 1, name: "Old" }];
      store.packageForm = { id: 1, name: "Updated" };

      api.put.mockResolvedValueOnce({
        data: { package: { id: 1, name: "Updated" } },
      });

      store.savePackage();
      await vi.waitFor(() => expect(store.packages[0].name).toBe("Updated"));
    });

    it("deletePackage removes from list", async () => {
      store.packages = [{ id: 1 }, { id: 2 }];

      api.delete.mockResolvedValueOnce({});

      await store.deletePackage({ id: 1 });
      expect(store.packages).toHaveLength(1);
      expect(store.packages[0].id).toBe(2);
    });

    it("deletePackage handles error", async () => {
      store.packages = [{ id: 1 }];

      api.delete.mockRejectedValueOnce({
        response: { data: { message: "Cannot delete" } },
      });

      await store.deletePackage({ id: 1 });
      expect(store.packages).toHaveLength(1);
    });
  });

  // --- Groups ---
  describe("groups", () => {
    it("editGroup copies group and opens drawer", () => {
      const group = { id: 1, name: "Salsas" };
      store.editGroup(group);
      expect(store.groupForm.name).toBe("Salsas");
      expect(store.groupFormDrawer).toBe(true);
    });

    it("saveGroup creates new group", async () => {
      store.slug = "test";
      store.groupForm = { name: "New Group", items: [] };

      api.post.mockResolvedValueOnce({ data: { id: 1, name: "New Group" } });

      store.saveGroup();
      await vi.waitFor(() => expect(store.groups).toHaveLength(1));
      expect(store.loading).toBe(false);
    });

    it("saveGroup updates existing group", async () => {
      store.slug = "test";
      store.groups = [{ id: 1, name: "Old" }];
      store.groupForm = { id: 1, name: "Updated" };

      api.put.mockResolvedValueOnce({ data: { id: 1, name: "Updated" } });

      store.saveGroup();
      await vi.waitFor(() => expect(store.groups[0].name).toBe("Updated"));
    });

    it("deleteGroup removes from list", async () => {
      store.slug = "test";
      store.groups = [{ id: 1 }, { id: 2 }];

      api.delete.mockResolvedValueOnce({ data: {} });

      await store.deleteGroup({ id: 1 });
      expect(store.groups).toHaveLength(1);
    });

    it("deleteGroup handles error", async () => {
      store.slug = "test";
      store.groups = [{ id: 1 }];

      api.delete.mockRejectedValueOnce(new Error("Error"));

      await store.deleteGroup({ id: 1 });
      expect(store.groups).toHaveLength(1);
    });
  });

  // --- Establishment Types ---
  describe("establishment types", () => {
    it("addEstablishmentType opens drawer with empty form", () => {
      store.addEstablishmentType();
      expect(store.establishmentTypeFormDrawer).toBe(true);
      expect(store.establishmentTypesForm).toEqual({});
    });

    it("editEstablishmentType copies type and opens drawer", () => {
      const type = { id: 1, name: "Restaurante" };
      store.editEstablishmentType(type);
      expect(store.establishmentTypesForm.name).toBe("Restaurante");
      expect(store.establishmentTypeFormDrawer).toBe(true);
    });

    it("deleteEstablishmentType removes from list", async () => {
      store.establishmentTypes = [{ id: 1 }, { id: 2 }];

      api.delete.mockResolvedValueOnce({ data: {} });

      store.deleteEstablishmentType({ id: 1 });
      await vi.waitFor(() => expect(store.establishmentTypes).toHaveLength(1));
    });

    it("saveEstablishType creates new type", async () => {
      store.establishmentTypesForm = { name: "Bar" };

      api.post.mockResolvedValueOnce({
        data: { type: { id: 1, name: "Bar" } },
      });

      store.saveEstablishType();
      await vi.waitFor(() => expect(store.establishmentTypes).toHaveLength(1));
    });

    it("saveEstablishType updates existing type", async () => {
      store.establishmentTypes = [{ id: 1, name: "Old" }];
      store.establishmentTypesForm = { id: 1, name: "Updated" };

      api.put.mockResolvedValueOnce({
        data: { type: { id: 1, name: "Updated" } },
      });

      store.saveEstablishType();
      await vi.waitFor(() => expect(store.establishmentTypes[0].name).toBe("Updated"));
    });

    it("getEstablishmentTypes fetches types", async () => {
      api.get.mockResolvedValueOnce({
        data: { types: [{ id: 1, name: "Restaurant" }] },
      });

      store.getEstablishmentTypes();
      await vi.waitFor(() => expect(store.establishmentTypes).toHaveLength(1));
    });
  });

  // --- Establishment Categories ---
  describe("establishment categories", () => {
    it("addEstablishmentCategory opens drawer", () => {
      store.addEstablishmentCategory();
      expect(store.establishmentCategoryFormDrawer).toBe(true);
      expect(store.categoryForm.status).toBe("Activa");
    });

    it("editEstablishmentCategory copies and opens drawer", () => {
      const cat = { id: 1, name: "Comida" };
      store.editEstablishmentCategory(cat);
      expect(store.categoryForm.name).toBe("Comida");
      expect(store.establishmentCategoryFormDrawer).toBe(true);
    });

    it("deleteEstablishmentCategory removes from list", async () => {
      store.establishmentCategories = [{ id: 1 }, { id: 2 }];

      api.delete.mockResolvedValueOnce({ data: {} });

      store.deleteEstablishmentCategory({ id: 1 });
      await vi.waitFor(() => expect(store.establishmentCategories).toHaveLength(1));
    });

    it("saveEstablishCategory creates new category", async () => {
      store.categoryForm = { name: "Bebidas", status: "Activa" };

      api.post.mockResolvedValueOnce({
        data: { category: { id: 1, name: "Bebidas" } },
      });

      store.saveEstablishCategory();
      await vi.waitFor(() => expect(store.establishmentCategories).toHaveLength(1));
    });

    it("saveEstablishCategory updates existing category", async () => {
      store.establishmentCategories = [{ id: 1, name: "Old" }];
      store.categoryForm = { id: 1, name: "Updated" };

      api.put.mockResolvedValueOnce({
        data: { category: { id: 1, name: "Updated" } },
      });

      store.saveEstablishCategory();
      await vi.waitFor(() => expect(store.establishmentCategories[0].name).toBe("Updated"));
    });

    it("getEstablishmentCategories fetches categories", async () => {
      api.get.mockResolvedValueOnce({
        data: { categories: [{ id: 1, name: "Comida" }] },
      });

      store.getEstablishmentCategories();
      await vi.waitFor(() => expect(store.establishmentCategories).toHaveLength(1));
    });
  });

  // --- Orders delegation ---
  describe("order delegation", () => {
    it("startOrder delegates to orderStore and changes tab", async () => {
      store.slug = "test";
      store.orderStore.counts = [0, 3, 0, 0, 0, 0];
      store.orderStore.orders = [{ id: 1, current_status_id: 1 }];

      api.get.mockResolvedValueOnce({ data: { message: "En preparación" } });

      await store.startOrder({ id: 1, current_status_id: 1 });
      expect(store.orderTab).toBe("pedidos_en_preparacion");
    });

    it("sendOrder delegates and changes tab", async () => {
      store.slug = "test";
      store.orderStore.counts = [0, 0, 2, 0, 0, 0];
      store.orderStore.orders = [{ id: 1, current_status_id: 2 }];

      api.get.mockResolvedValueOnce({ data: { message: "Enviado" } });

      await store.sendOrder({ id: 1, current_status_id: 2 });
      expect(store.orderTab).toBe("pedidos_enviados");
    });

    it("deliverOrder delegates and changes tab", async () => {
      store.slug = "test";
      store.orderStore.counts = [0, 0, 0, 2, 0, 0];
      store.orderStore.orders = [{ id: 1, current_status_id: 3 }];

      api.get.mockResolvedValueOnce({ data: { message: "Entregado" } });

      await store.deliverOrder({ id: 1, current_status_id: 3 });
      expect(store.orderTab).toBe("pedidos_entregados");
    });

    it("cancelOrder delegates and changes tab", async () => {
      store.slug = "test";
      store.orderStore.counts = [0, 1, 0, 0, 0, 0];
      store.orderStore.orders = [{ id: 1, current_status_id: 1 }];

      api.get.mockResolvedValueOnce({ data: { message: "Cancelado" } });

      await store.cancelOrder({ id: 1, current_status_id: 1 });
      expect(store.orderTab).toBe("pedidos_cancelados");
    });

    it("getMoreOrders delegates to orderStore", async () => {
      store.slug = "test";

      api.get.mockResolvedValueOnce({ data: { orders: [{ id: 1 }] } });

      const count = await store.getMoreOrders("pending");
      expect(count).toBe(1);
    });
  });

  // --- Drawers ---
  describe("drawer setters", () => {
    it("setAddressDrawer clears other drawers and initializes form", () => {
      store.profileDrawer = true;
      store.companyStore.company = { address: { street: "Test" } };

      store.setAddressDrawer(true);

      expect(store.addressDrawer).toBe(true);
      expect(store.profileDrawer).toBe(false);
    });

    it("setAddressDrawer(false) just closes", () => {
      store.addressDrawer = true;
      store.setAddressDrawer(false);
      expect(store.addressDrawer).toBe(false);
    });

    it("setConfigurationDrawer clears and sets", () => {
      store.profileDrawer = true;
      store.setConfigurationDrawer(true);
      expect(store.configurationDrawer).toBe(true);
      expect(store.profileDrawer).toBe(false);
    });

    it("setProfileDrawer sets isNotMyProfile to false and initializes form", () => {
      store.isNotMyProfile = true;
      store.userStore.user = { name: "Omar" };
      store.setProfileDrawer(true);
      expect(store.isNotMyProfile).toBe(false);
      expect(store.profileDrawer).toBe(true);
    });

    it("setScheduleDrawer initializes schedule form", () => {
      store.companyStore.company = { hours: [] };
      store.setScheduleDrawer(true);
      expect(store.scheduleDrawer).toBe(true);
      expect(store.companyStore.scheduleForm).toHaveLength(7);
    });

    it("setEstablishmentDrawer initializes company form", () => {
      store.companyStore.company = { name: "Test" };
      store.setEstablishmentDrawer(true);
      expect(store.establishmentDrawer).toBe(true);
    });
  });

  // --- Upload images ---
  describe("image upload", () => {
    it("uploadDishImage posts FormData and sets photo", async () => {
      store.slug = "test";
      store.productForm = {};

      api.post.mockResolvedValueOnce({ data: { ruta: "/img/dish.jpg" } });

      await store.uploadDishImage("fake-image-blob");

      expect(api.post).toHaveBeenCalled();
      expect(store.productForm.photo).toBe("/img/dish.jpg");
    });

    it("uploadDishImage handles error", async () => {
      store.slug = "test";
      store.productForm = {};

      api.post.mockRejectedValueOnce(new Error("Upload failed"));

      await store.uploadDishImage("fake-image-blob");
      // En error se limpia el preview base64 a "" (para no enviarlo al backend)
      expect(store.productForm.photo).toBe("");
    });

    it("uploadEstablishmentImage posts FormData and sets logo", async () => {
      store.slug = "test";
      store.companyStore.companyForm = {};

      api.post.mockResolvedValueOnce({ data: { ruta: "/img/logo.jpg" } });

      await store.uploadEstablishmentImage("fake-image-blob");

      expect(store.companyStore.companyForm.logo).toBe("/img/logo.jpg");
    });

    it("uploadEstablishmentImage handles error", async () => {
      store.slug = "test";
      store.companyStore.companyForm = {};

      api.post.mockRejectedValueOnce(new Error("Upload failed"));

      await store.uploadEstablishmentImage("fake-image-blob");
      // En error se limpia el preview base64 a "" (para no enviarlo al backend)
      expect(store.companyStore.companyForm.logo).toBe("");
    });
  });

  // --- Users & Establishments ---
  describe("users and establishments", () => {
    it("getEstablishments fetches and sets companies", async () => {
      api.get.mockResolvedValueOnce({
        data: { establishments: [{ id: 1, name: "Test" }] },
      });

      await store.getEstablishments();
      expect(store.companyStore.companies).toHaveLength(1);
    });

    it("getEstablishments handles error", async () => {
      api.get.mockRejectedValueOnce(new Error("Error"));

      await store.getEstablishments();
      // Should not crash
    });

    it("getUsers fetches and sets users", async () => {
      api.get.mockResolvedValueOnce({
        data: { users: [{ id: 1, name: "Omar" }] },
      });

      await store.getUsers();
      expect(store.userStore.users).toHaveLength(1);
    });

    it("getUsers handles error", async () => {
      api.get.mockRejectedValueOnce(new Error("Error"));

      await store.getUsers();
      // Should not crash
    });

    it("deleteEstablishment removes from list", async () => {
      store.companyStore.companies = [{ id: 1 }, { id: 2 }];

      api.delete.mockResolvedValueOnce({});

      await store.deleteEstablishment({ id: 1 });
      expect(store.companyStore.companies).toHaveLength(1);
    });

    it("deleteEstablishment handles error", async () => {
      store.companyStore.companies = [{ id: 1 }];

      api.delete.mockRejectedValueOnce({
        response: { data: { message: "Cannot delete" } },
      });

      await store.deleteEstablishment({ id: 1 });
      expect(store.companyStore.companies).toHaveLength(1);
    });

    it("deleteUser removes from list", async () => {
      store.userStore.users = [{ id: 1 }, { id: 2 }];

      api.delete.mockResolvedValueOnce({});

      await store.deleteUser({ id: 1 });
      expect(store.userStore.users).toHaveLength(1);
    });

    it("deleteUser handles error", async () => {
      store.userStore.users = [{ id: 1 }];

      api.delete.mockRejectedValueOnce({
        response: { data: { message: "Cannot delete" } },
      });

      await store.deleteUser({ id: 1 });
      expect(store.userStore.users).toHaveLength(1);
    });

    it("addUser opens profile drawer for new user", () => {
      store.addUser();
      expect(store.isNotMyProfile).toBe(true);
      expect(store.profileDrawer).toBe(true);
    });

    it("editUser opens profile drawer with user data", () => {
      store.editUser({ id: 1, name: "Omar", email: "omar@test.com" });
      expect(store.isNotMyProfile).toBe(true);
      expect(store.userStore.userForm.name).toBe("Omar");
      expect(store.profileDrawer).toBe(true);
    });

    it("addEstablishment opens drawer with empty form", () => {
      store.addEstablishment();
      expect(store.establishmentDrawer).toBe(true);
    });

    it("editEstablishment opens drawer with company data", () => {
      store.editEstablishment({ name: "Test", slug: "test" });
      expect(store.companyStore.company.name).toBe("Test");
      expect(store.establishmentDrawer).toBe(true);
    });
  });

  // --- Save operations ---
  describe("saveAddress", () => {
    it("saves address and updates company", async () => {
      store.slug = "test";
      store.companyStore.company = { address: { street: "Old St" } };
      store.companyStore.setAddressForm();
      store.companyStore.addressForm.street = "New St";

      api.put.mockResolvedValueOnce({
        data: { establishment: { name: "Test", address: { street: "New St" } } },
      });

      await store.saveAddress();
      expect(store.companyStore.company.address.street).toBe("New St");
      expect(store.addressDrawer).toBe(false);
      expect(store.loading).toBe(false);
    });

    it("saveAddress handles error", async () => {
      store.slug = "test";
      store.companyStore.company = { address: {} };
      store.companyStore.setAddressForm();

      api.put.mockRejectedValueOnce({
        response: { status: 422, data: { errors: { street: ["Required"] } } },
      });

      await store.saveAddress();
      expect(store.addressDrawer).toBe(false);
      expect(store.loading).toBe(false);
    });
  });

  describe("saveSchedule", () => {
    it("saves schedule and updates company hours", async () => {
      store.slug = "test";
      store.companyStore.scheduleForm = [{ day_of_week: "lunes" }];
      store.companyStore.companyForm = {};
      store.companyStore.company = {};

      api.put.mockResolvedValueOnce({
        data: { hours: [{ day_of_week: "lunes", open_time: "10:00" }] },
      });

      await store.saveSchedule();
      expect(store.companyStore.company.hours).toHaveLength(1);
      expect(store.loading).toBe(false);
    });

    it("saveSchedule handles error", async () => {
      store.slug = "test";
      store.companyStore.scheduleForm = [];

      api.put.mockRejectedValueOnce(new Error("Error"));

      await store.saveSchedule();
      expect(store.loading).toBe(false);
    });
  });

  describe("saveConfiguration", () => {
    it("saves configuration successfully", async () => {
      store.slug = "test";

      api.put.mockResolvedValueOnce({ data: {} });

      await store.saveConfiguration();
      expect(store.loading).toBe(false);
    });

    it("saveConfiguration handles error", async () => {
      store.slug = "test";

      api.put.mockRejectedValueOnce(new Error("Error"));

      await store.saveConfiguration();
      expect(store.loading).toBe(false);
    });
  });

  describe("saveEstablishment", () => {
    it("creates new establishment when no slug", async () => {
      store.slug = "";
      store.companyStore.companyForm = { name: "New Place" };

      api.post.mockResolvedValueOnce({
        data: { establishment: { id: 1, name: "New Place", slug: "new-place" } },
      });

      await store.saveEstablishment();
      expect(store.companyStore.company.name).toBe("New Place");
      expect(store.establishmentDrawer).toBe(false);
      expect(store.loading).toBe(false);
    });

    it("updates existing establishment when slug exists", async () => {
      store.slug = "test";
      store.companyStore.companyForm = { name: "Updated", delivery_charge: "35" };

      api.put.mockResolvedValueOnce({
        data: { establishment: { name: "Updated", slug: "test" } },
      });

      await store.saveEstablishment();
      expect(store.companyStore.company.name).toBe("Updated");
      expect(store.loading).toBe(false);
    });

    it("saveEstablishment handles error", async () => {
      store.slug = "test";
      store.companyStore.companyForm = {};

      api.put.mockRejectedValueOnce({
        response: { status: 422, data: { errors: { name: ["Required"] } } },
      });

      await store.saveEstablishment();
      expect(store.loading).toBe(false);
    });
  });

  describe("cloneProduct", () => {
    it("clones product and adds to list", async () => {
      store.slug = "test";
      store.products = [{ id: 1, name: "Original" }];

      api.post.mockResolvedValueOnce({
        data: { product: { id: 2, name: "Original (copy)" } },
      });

      await store.cloneProduct({ id: 1 });
      expect(store.products).toHaveLength(2);
    });

    it("cloneProduct handles error", async () => {
      store.slug = "test";
      store.products = [{ id: 1 }];

      api.post.mockRejectedValueOnce(new Error("Error"));

      await store.cloneProduct({ id: 1 });
      expect(store.products).toHaveLength(1);
    });
  });

  describe("setSpecialOffer", () => {
    it("sets special offer on product", async () => {
      store.slug = "test";
      store.products = [{ id: 1, name: "Tacos" }];

      api.put.mockResolvedValueOnce({
        data: { product: { id: 1, name: "Tacos", special_price: 50 } },
      });

      await store.setSpecialOffer({ id: 1 }, 50, "2026-12-31");
      expect(store.products[0].special_price).toBe(50);
    });

    it("removes special offer", async () => {
      store.slug = "test";
      store.products = [{ id: 1, special_price: 50 }];

      api.put.mockResolvedValueOnce({
        data: { product: { id: 1, special_price: null } },
      });

      await store.setSpecialOffer({ id: 1 }, null, null);
      expect(store.products[0].special_price).toBeNull();
    });

    it("handles error", async () => {
      store.slug = "test";
      store.products = [{ id: 1 }];

      api.put.mockRejectedValueOnce(new Error("Error"));

      await store.setSpecialOffer({ id: 1 }, 50, null);
      // Should not crash
    });
  });

  describe("saveCategory", () => {
    it("creates new category", async () => {
      store.slug = "test";
      store.categoryForm = { name: "Bebidas", status: "Activa" };

      api.post.mockResolvedValueOnce({
        data: { category: { id: 1, name: "Bebidas" } },
      });

      await store.saveCategory();
      expect(store.categories).toHaveLength(1);
      expect(store.categoryFormDrawer).toBe(false);
    });

    it("updates existing category", async () => {
      store.slug = "test";
      store.categories = [{ id: 1, name: "Old" }];
      store.categoryForm = { id: 1, name: "Updated" };

      api.put.mockResolvedValueOnce({
        data: { id: 1, name: "Updated" },
      });

      await store.saveCategory();
      expect(store.categories[0].name).toBe("Updated");
    });
  });

  describe("updateCategoriesOrder / updateProductsOrder", () => {
    it("updates categories order", async () => {
      store.slug = "test";

      api.post.mockResolvedValueOnce({});

      store.updateCategoriesOrder([3, 1, 2]);
      await vi.waitFor(() => expect(api.post).toHaveBeenCalledWith(
        "/admin/test/categories/order",
        { newOrder: [3, 1, 2] }
      ));
    });

    it("updates products order", async () => {
      store.slug = "test";

      api.post.mockResolvedValueOnce({});

      store.updateProductsOrder([2, 1, 3]);
      await vi.waitFor(() => expect(api.post).toHaveBeenCalledWith(
        "/admin/test/dishes/order",
        { newOrder: [2, 1, 3] }
      ));
    });
  });

  describe("saveExtras", () => {
    it("saves extras and updates product", async () => {
      store.slug = "test";
      store.product = { id: 1, extras: [] };
      store.extras = [{ name: "Salsa", options: [] }];
      store.products = [{ id: 1, name: "Tacos" }];

      api.post.mockResolvedValueOnce({
        data: {
          product: {
            id: 1,
            name: "Tacos",
            extras: [{ id: 1, name: "Salsa" }],
          },
        },
      });

      await store.saveExtras();
      expect(store.products[0].extras).toHaveLength(1);
      expect(store.loading).toBe(false);
    });
  });

  describe("extraProduct", () => {
    it("sets product extras with types mapped", () => {
      store.extraProduct({
        id: 1,
        name: "Tacos",
        price: 50,
        extras: [
          { id: 1, name: "Salsa", type: "price", order: 2, options: [] },
          { id: 2, name: "Bebida", type: "plus", order: 1, options: [] },
        ],
      });

      expect(store.extraDrawer).toBe(true);
      expect(store.extras[0].name).toBe("Bebida"); // sorted by order
      expect(store.extras[0].type.value).toBe("plus");
    });

    it("creates default extra for product with no extras", () => {
      store.extraProduct({
        id: 1,
        name: "Tacos",
        price: 50,
        extras: [],
      });

      expect(store.extras).toHaveLength(1);
      expect(store.extras[0].name).toBe("Opciones");
      expect(store.extras[0].options[0].price).toBe(50);
    });
  });

  describe("hasService (admin)", () => {
    it("returns value when feature found", () => {
      store.companyStore.configuration.features = [
        { id: 1, value: true },
        { id: 2, value: false },
      ];
      expect(store.hasService(1)).toBe(true);
      expect(store.hasService(2)).toBe(false);
    });

    it("returns undefined when feature not found", () => {
      store.companyStore.configuration.features = [];
      expect(store.hasService(99)).toBeUndefined();
    });
  });

  describe("improveImage", () => {
    it("improves image and updates form", async () => {
      store.slug = "test";
      store.productForm = { id: 1, photo: "old.jpg" };

      api.post.mockResolvedValueOnce({ data: { image: "improved.jpg" } });

      await store.improveImage();
      expect(store.productForm.photo).toBe("improved.jpg");
      expect(store.loading).toBe(false);
    });

    it("handles error", async () => {
      store.slug = "test";
      store.productForm = { id: 1, photo: "old.jpg" };

      api.post.mockRejectedValueOnce(new Error("Error"));

      await store.improveImage();
      expect(store.productForm.photo).toBe("old.jpg");
      expect(store.loading).toBe(false);
    });
  });

  describe("getTowns (admin)", () => {
    it("fetches and sets towns", async () => {
      store.companyStore.addressForm = { postal_code: "80000" };

      api.get.mockResolvedValueOnce({
        data: {
          towns: ["Centro", "Norte"],
          d_ciudad: "Culiacán",
          d_estado: "Sinaloa",
        },
      });

      await store.getTowns();
      expect(store.companyStore.addressForm.towns).toEqual(["Centro", "Norte"]);
      expect(store.companyStore.addressForm.city).toBe("Culiacán");
      expect(store.companyStore.addressForm.country).toBe("México");
    });
  });

  describe("getQr", () => {
    it("generates QR URL", async () => {
      vi.stubGlobal("location", { href: "https://test.com/test/admin" });
      await store.getQr();
      expect(store.qr).toContain("qrserver.com");
      expect(store.qr).toContain("test.com/test");
      expect(store.qr).not.toContain("/admin");
    });
  });
});
