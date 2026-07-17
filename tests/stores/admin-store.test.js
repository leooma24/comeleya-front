import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAdminStore } from "stores/admin-store";
import { api } from "boot/axios";

describe("admin-store", () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useAdminStore();
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("starts with default values", () => {
      expect(store.slug).toBe("");
      expect(store.products).toEqual([]);
      expect(store.categories).toEqual([]);
      expect(store.loading).toBe(false);
      expect(store.isExternal).toBe(true);
    });
  });

  describe("getters", () => {
    it("hideIfExternal returns false when isExternal is true", () => {
      store.isExternal = true;
      expect(store.hideIfExternal).toBe(false);
    });

    it("hideIfExternal returns true when isExternal is false", () => {
      store.isExternal = false;
      expect(store.hideIfExternal).toBe(true);
    });

    it("isEstablishment returns false when slug is empty", () => {
      expect(store.isEstablishment).toBe(false);
    });

    it("isEstablishment returns true when slug is set", () => {
      store.slug = "tacos-el-pastor";
      expect(store.isEstablishment).toBe(true);
    });

    it("usersToSearch filters by name case-insensitive", () => {
      store.userStore.users = [
        { name: "Omar Lerma" },
        { name: "Juan Perez" },
        { name: "Maria Lopez" },
      ];
      store.searchUser = "omar";
      expect(store.usersToSearch).toHaveLength(1);
      expect(store.usersToSearch[0].name).toBe("Omar Lerma");
    });

    it("usersToSearch returns max 8 users when no search", () => {
      store.userStore.users = Array.from({ length: 15 }, (_, i) => ({
        name: `User ${i}`,
      }));
      store.searchUser = "";
      expect(store.usersToSearch).toHaveLength(8);
    });
  });

  describe("setSlug", () => {
    it("sets tab to establecimientos when slug is empty", () => {
      store.setSlug("");
      expect(store.tab).toBe("establecimientos");
    });

    it("sets tab to dashboard when slug is set", () => {
      store.setSlug("test-slug");
      expect(store.tab).toBe("dashboard");
    });
  });

  describe("saveProduct validations", () => {
    it("returns false when photo is missing", async () => {
      store.productForm = { name: "Test", price: 50, description: "Desc" };
      const result = await store.saveProduct();
      expect(result).toBe(false);
    });

    it("returns false when name is missing", async () => {
      store.productForm = { photo: "https://cdn.test/img.jpg", price: 50, description: "Desc" };
      const result = await store.saveProduct();
      expect(result).toBe(false);
    });

    it("returns false when category is missing", async () => {
      store.productForm = {
        photo: "https://cdn.test/img.jpg",
        name: "Test",
        price: 50,
        description: "Desc",
      };
      const result = await store.saveProduct();
      expect(result).toBe(false);
    });

    it("returns false when price is missing", async () => {
      store.productForm = {
        photo: "https://cdn.test/img.jpg",
        name: "Test",
        dish_category: { id: 1 },
        description: "Desc",
      };
      const result = await store.saveProduct();
      expect(result).toBe(false);
    });

    it("returns false when description is missing", async () => {
      store.productForm = {
        photo: "https://cdn.test/img.jpg",
        name: "Test",
        dish_category: { id: 1 },
        price: 50,
      };
      const result = await store.saveProduct();
      expect(result).toBe(false);
    });

    it("creates new product when form has no id", async () => {
      store.slug = "test";
      store.productForm = {
        photo: "https://cdn.test/img.jpg",
        name: "Tacos",
        dish_category: { id: 1 },
        price: 50,
        description: "Desc",
      };

      api.post.mockResolvedValueOnce({
        data: { product: { id: 1, name: "Tacos" } },
      });

      await store.saveProduct();
      expect(store.products).toHaveLength(1);
      expect(store.productFormDrawer).toBe(false);
    });

    it("updates existing product when form has id", async () => {
      store.slug = "test";
      store.products = [{ id: 1, name: "Old" }];
      store.productForm = {
        id: 1,
        photo: "https://cdn.test/img.jpg",
        name: "Tacos",
        dish_category: { id: 1 },
        price: 50,
        description: "Desc",
      };

      api.put.mockResolvedValueOnce({
        data: { product: { id: 1, name: "Tacos Updated" } },
      });

      await store.saveProduct();
      expect(store.products[0].name).toBe("Tacos Updated");
    });
  });

  describe("checkErrorFields", () => {
    it("shows error messages for 422 response", () => {
      const response = {
        status: 422,
        data: {
          errors: {
            name: ["El nombre es requerido"],
            email: ["El email ya está en uso"],
          },
        },
      };

      store.checkErrorFields(response);
      // Should not throw
    });

    it("does not crash when response is undefined (network error)", () => {
      expect(() => store.checkErrorFields(undefined)).not.toThrow();
    });

    it("does not crash when response has no data.errors", () => {
      expect(() => store.checkErrorFields({ status: 422, data: {} })).not.toThrow();
    });

    it("does nothing for non-422 status", () => {
      expect(() =>
        store.checkErrorFields({ status: 500, data: {} })
      ).not.toThrow();
    });
  });

  describe("clearDrawers", () => {
    it("closes all drawers", () => {
      store.productFormDrawer = true;
      store.categoryFormDrawer = true;
      store.establishmentDrawer = true;
      store.scheduleDrawer = true;
      store.configurationDrawer = true;
      store.profileDrawer = true;
      store.addressDrawer = true;

      store.clearDrawers();

      expect(store.productFormDrawer).toBe(false);
      expect(store.categoryFormDrawer).toBe(false);
      expect(store.establishmentDrawer).toBe(false);
      expect(store.scheduleDrawer).toBe(false);
      expect(store.configurationDrawer).toBe(false);
      expect(store.profileDrawer).toBe(false);
      expect(store.addressDrawer).toBe(false);
    });
  });

  describe("CRUD operations", () => {
    it("addCategory sets form and opens drawer", () => {
      store.addCategory();
      expect(store.categoryForm.status).toBe("Activa");
      expect(store.categoryFormDrawer).toBe(true);
    });

    it("editCategory copies category and opens drawer", () => {
      const cat = { id: 1, name: "Entradas", status: "Activa" };
      store.editCategory(cat);
      expect(store.categoryForm.name).toBe("Entradas");
      expect(store.categoryFormDrawer).toBe(true);
      // should be a copy
      store.categoryForm.name = "Changed";
      expect(cat.name).toBe("Entradas");
    });

    it("addProduct sets form and opens drawer", () => {
      store.addProduct();
      expect(store.productForm.status).toBe("Activo");
      expect(store.productFormDrawer).toBe(true);
    });

    it("editProduct copies product and opens drawer", () => {
      const product = { id: 1, name: "Tacos" };
      store.editProduct(product);
      expect(store.productForm.name).toBe("Tacos");
      expect(store.productFormDrawer).toBe(true);
    });

    it("addGroup creates form with default item", () => {
      store.addGroup();
      expect(store.groupForm.items).toHaveLength(1);
      expect(store.groupForm.items[0].name).toBe("Item 1");
      expect(store.groupFormDrawer).toBe(true);
    });

    it("addOptionGroup adds item with incremented name", () => {
      store.addGroup();
      store.addOptionGroup();
      expect(store.groupForm.items).toHaveLength(2);
      expect(store.groupForm.items[1].name).toBe("Item 2");
    });

    it("addPackage sets form and opens drawer", () => {
      store.addPackage();
      expect(store.packageForm.status).toBe("Activo");
      expect(store.packageFormDrawer).toBe(true);
    });

    it("editPackage copies and opens drawer", () => {
      const pkg = { id: 1, name: "Premium" };
      store.editPackage(pkg);
      expect(store.packageForm.name).toBe("Premium");
      expect(store.packageFormDrawer).toBe(true);
    });
  });

  describe("deleteProduct", () => {
    it("removes product from list on success", async () => {
      store.slug = "test";
      store.products = [
        { id: 1, name: "A" },
        { id: 2, name: "B" },
      ];

      api.delete.mockResolvedValueOnce({ data: {} });

      await store.deleteProduct({ id: 1 });
      expect(store.products).toHaveLength(1);
      expect(store.products[0].name).toBe("B");
    });

    it("keeps products on API error", async () => {
      store.slug = "test";
      store.products = [{ id: 1, name: "A" }];

      api.delete.mockRejectedValueOnce(new Error("Server error"));

      await store.deleteProduct({ id: 1 });
      expect(store.products).toHaveLength(1);
    });
  });

  describe("deleteCategory", () => {
    it("removes category from list on success", async () => {
      store.slug = "test";
      store.categories = [
        { id: 1, name: "Cat A" },
        { id: 2, name: "Cat B" },
      ];

      api.delete.mockResolvedValueOnce({});

      await store.deleteCategory(1);
      expect(store.categories).toHaveLength(1);
      expect(store.categories[0].id).toBe(2);
    });
  });

  describe("getEstablishment", () => {
    it("sets empty company when slug is empty", async () => {
      store.slug = "";
      await store.getEstablishment();
      expect(store.companyStore.company).toEqual({});
    });

    it("loads establishment data on success", async () => {
      store.slug = "test-slug";

      api.get.mockResolvedValueOnce({
        data: {
          establishment: {
            name: "Test",
            dishes: [{ id: 1 }],
            categories: [{ id: 1 }],
            groups: [{ id: 1 }],
          },
          categories: [],
          features: [],
          types: [],
          counts: [],
        },
      });

      store.companyStore.company = { features: [] };
      await store.getEstablishment();

      expect(store.products).toHaveLength(1);
      expect(store.categories).toHaveLength(1);
      expect(store.showBanners).toBe(true);
    });

    it("shows error on API failure", async () => {
      store.slug = "test-slug";
      api.get.mockRejectedValueOnce(new Error("Network error"));

      await store.getEstablishment();
      expect(store.showBanners).toBe(false);
    });
  });

  describe("addExtra / addOption", () => {
    it("addExtra creates empty extra with default options", () => {
      store.extras = [];
      store.addExtra();
      expect(store.extras).toHaveLength(1);
      expect(store.extras[0].qty).toBe(1);
      expect(store.extras[0].options).toHaveLength(1);
    });

    it("addOption adds option to extra", () => {
      const extra = { options: [{ name: "A", price: 10 }] };
      store.addOption(extra);
      expect(extra.options).toHaveLength(2);
    });

    it("addOption creates options array if missing", () => {
      const extra = {};
      store.addOption(extra);
      expect(extra.options).toHaveLength(1);
    });
  });

  describe("addGroupToProduct", () => {
    it("maps group items to extra options", () => {
      store.extras = [];
      store.addGroupToProduct({
        name: "Salsas",
        items: [
          { name: "Verde", price: 0 },
          { name: "Roja", price: 5 },
        ],
      });
      expect(store.extras).toHaveLength(1);
      expect(store.extras[0].name).toBe("Salsas");
      expect(store.extras[0].options).toHaveLength(2);
    });
  });

  describe("logout", () => {
    it("calls userStore logout", () => {
      store.userStore.user = { name: "Omar" };
      store.userStore.token = "abc123";

      store.logout();
      expect(store.userStore.user).toBeNull();
      expect(store.userStore.token).toBeNull();
    });
  });

  describe("getOrderCounts", () => {
    it("returns count for status", () => {
      store.orderStore.counts = [0, 5, 3, 0, 0, 0];
      expect(store.getOrderCounts(1)).toBe(5);
    });

    it("returns 0 for missing status", () => {
      store.orderStore.counts = [];
      expect(store.getOrderCounts(99)).toBe(0);
    });
  });

  describe("saveNewEstablishment error handling", () => {
    it("does not crash on network error (no response)", async () => {
      api.post.mockRejectedValueOnce(new Error("Network error"));

      await expect(store.saveNewEstablishment()).resolves.not.toThrow();
    });
  });

  describe("removeExtraOption with await", () => {
    it("calls api.delete with await for persisted options", async () => {
      store.slug = "test";
      store.product = { id: 1 };
      const extra = {
        id: 10,
        options: [{ id: 100, name: "Verde" }],
      };

      api.delete.mockResolvedValueOnce({ data: {} });

      await store.removeExtraOption(extra, 0);
      expect(api.delete).toHaveBeenCalled();
      expect(extra.options).toHaveLength(0);
    });

    it("does not call api for non-persisted options", async () => {
      const extra = {
        id: 10,
        options: [{ name: "New option" }],
      };

      await store.removeExtraOption(extra, 0);
      expect(api.delete).not.toHaveBeenCalled();
    });
  });

  describe("removeExtra with await", () => {
    it("calls api.delete with await for persisted extras", async () => {
      store.slug = "test";
      store.product = { id: 1 };
      store.extras = [{ id: 10, name: "Salsa" }];

      api.delete.mockResolvedValueOnce({ data: {} });

      await store.removeExtra(0);
      expect(api.delete).toHaveBeenCalled();
      expect(store.extras).toHaveLength(0);
    });

    it("does not call api for non-persisted extras", async () => {
      store.extras = [{ name: "New extra" }];

      await store.removeExtra(0);
      expect(api.delete).not.toHaveBeenCalled();
    });
  });

  describe("saveProduct - change category", () => {
    it("updates product category when saving with a different category", async () => {
      store.slug = "test";
      store.products = [
        {
          id: 1,
          name: "Ebi Spicy",
          photo: "https://cdn.test/img.jpg",
          price: 120,
          description: "Roll de camarón",
          dish_category: { id: 1, name: "Rollos" },
          dish_category_id: 1,
        },
      ];
      store.productForm = {
        id: 1,
        name: "Ebi Spicy",
        photo: "https://cdn.test/img.jpg",
        price: 120,
        description: "Roll de camarón",
        dish_category: { id: 2, name: "Especiales" },
      };

      api.put.mockResolvedValueOnce({
        data: {
          product: {
            id: 1,
            name: "Ebi Spicy",
            photo: "https://cdn.test/img.jpg",
            price: 120,
            description: "Roll de camarón",
            dish_category: { id: 2, name: "Especiales" },
            dish_category_id: 2,
          },
        },
      });

      await store.saveProduct();

      expect(api.put).toHaveBeenCalledWith("/admin/test/1", store.productForm);
      expect(store.products[0].dish_category.id).toBe(2);
      expect(store.products[0].dish_category.name).toBe("Especiales");
      expect(store.productFormDrawer).toBe(false);
    });

    it("sends the correct category id in the payload", async () => {
      store.slug = "sushi-place";
      store.products = [
        { id: 5, name: "Ebi Spicy", dish_category_id: 3 },
      ];
      store.productForm = {
        id: 5,
        name: "Ebi Spicy",
        photo: "https://cdn.test/img.jpg",
        price: 100,
        description: "Desc",
        dish_category: { id: 7, name: "Nueva Cat" },
      };

      api.put.mockResolvedValueOnce({
        data: {
          product: {
            id: 5,
            name: "Ebi Spicy",
            dish_category: { id: 7, name: "Nueva Cat" },
            dish_category_id: 7,
          },
        },
      });

      await store.saveProduct();

      const payload = api.put.mock.calls[0][1];
      expect(payload.dish_category.id).toBe(7);
      expect(store.products[0].dish_category_id).toBe(7);
    });
  });

  describe("toggleFeatured", () => {
    it("toggles product to featured", async () => {
      store.slug = "test";
      store.products = [
        { id: 1, name: "Tacos", is_featured: false },
        { id: 2, name: "Burritos", is_featured: false },
      ];

      api.put.mockResolvedValueOnce({
        data: { is_featured: true },
      });

      await store.toggleFeatured({ id: 1 });

      expect(api.put).toHaveBeenCalledWith("/admin/test/1/featured");
      expect(store.products[0].is_featured).toBe(true);
      expect(store.products[1].is_featured).toBe(false);
    });

    it("toggles product from featured to not featured", async () => {
      store.slug = "test";
      store.products = [
        { id: 1, name: "Tacos", is_featured: true },
      ];

      api.put.mockResolvedValueOnce({
        data: { is_featured: false },
      });

      await store.toggleFeatured({ id: 1 });

      expect(store.products[0].is_featured).toBe(false);
    });

    it("does not change products on API error", async () => {
      store.slug = "test";
      store.products = [
        { id: 1, name: "Tacos", is_featured: false },
      ];

      api.put.mockRejectedValueOnce(new Error("Server error"));

      await store.toggleFeatured({ id: 1 });

      expect(store.products[0].is_featured).toBe(false);
    });
  });

  describe("saveProfile - map result assignment fix", () => {
    it("updates user in users list when editing other profile", async () => {
      store.slug = "test";
      store.isNotMyProfile = true;
      store.userStore.userForm = { id: 1, name: "Old Name" };
      store.userStore.users = [
        { id: 1, name: "Old Name" },
        { id: 2, name: "Other" },
      ];

      api.put.mockResolvedValueOnce({
        data: { user: { id: 1, name: "Updated Name" } },
      });

      await store.saveProfile();

      expect(store.userStore.users[0].name).toBe("Updated Name");
    });
  });
});
