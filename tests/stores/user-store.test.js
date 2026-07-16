import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useUserStore } from "stores/user-store";
import { api } from "boot/axios";

describe("user-store", () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useUserStore();
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("starts unauthenticated", () => {
      expect(store.user).toBeNull();
      expect(store.token).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });

    it("name returns undefined when no user", () => {
      expect(store.name).toBeUndefined();
    });

    it("isSuperAdmin returns false when no user", () => {
      expect(store.isSuperAdmin).toBe(false);
    });
  });

  describe("getters", () => {
    it("isAuthenticated returns true when user exists", () => {
      store.user = { name: "Omar", role: "admin" };
      expect(store.isAuthenticated).toBe(true);
    });

    it("name returns user name", () => {
      store.user = { name: "Omar" };
      expect(store.name).toBe("Omar");
    });

    it("isSuperAdmin returns true for super_admin role", () => {
      store.user = { name: "Admin", role: "super_admin" };
      expect(store.isSuperAdmin).toBe(true);
    });

    it("isSuperAdmin returns false for other roles", () => {
      store.user = { name: "User", role: "user" };
      expect(store.isSuperAdmin).toBe(false);
    });
  });

  describe("setUsers / setForm", () => {
    it("sets users list", () => {
      store.setUsers([{ id: 1 }, { id: 2 }]);
      expect(store.users).toHaveLength(2);
    });

    it("setForm creates a copy of data", () => {
      const data = { name: "Omar", email: "test@test.com" };
      store.setForm(data);
      store.userForm.name = "Changed";
      expect(data.name).toBe("Omar");
    });

    it("setProfileForm copies current user", () => {
      store.user = { name: "Omar", role: "admin" };
      store.setProfileForm();
      expect(store.userForm.name).toBe("Omar");
      store.userForm.name = "Changed";
      expect(store.user.name).toBe("Omar");
    });
  });

  describe("login", () => {
    it("returns true on successful login", async () => {
      api.post.mockResolvedValueOnce({
        data: { token: "abc123", user: { name: "Omar" } },
      });
      api.get.mockResolvedValueOnce({
        data: { name: "Omar", role: "admin" },
      });

      const result = await store.login({ email: "test@test.com", password: "123" });
      expect(result).toBe(true);
      expect(store.token).toBe("abc123");
    });

    it("returns error message on network error", async () => {
      api.post.mockRejectedValueOnce({ code: "ERR_NETWORK" });

      const result = await store.login({ email: "test@test.com", password: "123" });
      expect(result).toBe("No hay conexión a internet");
      expect(store.user).toBeNull();
    });

    it("returns credentials error on other errors", async () => {
      api.post.mockRejectedValueOnce({ code: "OTHER_ERROR" });

      const result = await store.login({ email: "test@test.com", password: "123" });
      expect(result).toBe("Credenciales incorrectas");
    });

    it("resets user to null before login attempt", async () => {
      store.user = { name: "Previous" };
      api.post.mockRejectedValueOnce({ code: "OTHER_ERROR" });

      await store.login({ email: "x", password: "x" });
      expect(store.user).toBeNull();
    });
  });

  describe("loginWithFacebook", () => {
    it("returns true on success", async () => {
      api.post.mockResolvedValueOnce({ data: { token: "fb-token" } });
      api.get.mockResolvedValueOnce({ data: { name: "FB User" } });

      const result = await store.loginWithFacebook({ accessToken: "fb123" });
      expect(result).toBe(true);
      expect(store.token).toBe("fb-token");
    });

    it("returns network error message", async () => {
      api.post.mockRejectedValueOnce({ code: "ERR_NETWORK" });

      const result = await store.loginWithFacebook({ accessToken: "fb123" });
      expect(result).toBe("No hay conexión a internet");
    });

    it("returns false on non-network error", async () => {
      api.post.mockRejectedValueOnce({ code: "OTHER" });

      const result = await store.loginWithFacebook({ accessToken: "fb123" });
      expect(result).toBe(false);
    });
  });

  describe("logout", () => {
    it("clears user and token", () => {
      store.user = { name: "Omar" };
      store.token = "abc123";

      store.logout();
      expect(store.user).toBeNull();
      expect(store.token).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe("getUser", () => {
    it("fetches and sets user data", async () => {
      api.get.mockResolvedValueOnce({
        data: { name: "Omar", role: "admin" },
      });

      await store.getUser();
      expect(store.user.name).toBe("Omar");
    });

    it("throws on API failure", async () => {
      api.get.mockRejectedValueOnce(new Error("Server error"));

      await expect(store.getUser()).rejects.toThrow("Server error");
    });
  });
});
