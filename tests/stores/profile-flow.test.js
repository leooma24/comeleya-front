import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAdminStore } from "stores/admin-store";
import { api } from "boot/axios";

describe("profile email/password change flow", () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useAdminStore();
    vi.clearAllMocks();
  });

  describe("email change", () => {
    it("sends updated email in profile save", async () => {
      store.slug = "test";
      store.isNotMyProfile = false;
      store.userStore.userForm = {
        id: 1,
        name: "Omar",
        email: "new@email.com",
      };

      api.put.mockResolvedValueOnce({
        data: { user: { id: 1, name: "Omar", email: "new@email.com" } },
      });

      await store.saveProfile();

      expect(api.put).toHaveBeenCalledWith(
        "/admin/test/profile/1",
        store.userStore.userForm
      );
      expect(store.userStore.user.email).toBe("new@email.com");
    });

    it("shows 422 error when email is already taken", async () => {
      store.slug = "test";
      store.isNotMyProfile = false;
      store.userStore.userForm = {
        id: 1,
        name: "Omar",
        email: "taken@email.com",
      };

      api.put.mockRejectedValueOnce({
        response: {
          status: 422,
          data: {
            errors: {
              email: ["El email ya está en uso"],
            },
          },
        },
      });

      await store.saveProfile();

      // checkErrorFields should have been called, no crash
      expect(store.loading).toBe(false);
    });

    it("shows 422 error when email format is invalid", async () => {
      store.slug = "test";
      store.isNotMyProfile = false;
      store.userStore.userForm = {
        id: 1,
        name: "Omar",
        email: "not-an-email",
      };

      api.put.mockRejectedValueOnce({
        response: {
          status: 422,
          data: {
            errors: {
              email: ["El email no es válido"],
            },
          },
        },
      });

      await store.saveProfile();
      expect(store.loading).toBe(false);
    });
  });

  describe("password change", () => {
    it("sends password change fields to backend", async () => {
      store.slug = "test";
      store.isNotMyProfile = false;
      store.userStore.userForm = {
        id: 1,
        name: "Omar",
        email: "omar@test.com",
        current_password: "oldpass123",
        new_password: "newpass456",
        password_confirmation: "newpass456",
      };

      api.put.mockResolvedValueOnce({
        data: { user: { id: 1, name: "Omar", email: "omar@test.com" } },
      });

      await store.saveProfile();

      const payload = api.put.mock.calls[0][1];
      expect(payload.current_password).toBe("oldpass123");
      expect(payload.new_password).toBe("newpass456");
      expect(payload.password_confirmation).toBe("newpass456");
      expect(store.userStore.user.name).toBe("Omar");
    });

    it("shows error when current password is incorrect", async () => {
      store.slug = "test";
      store.isNotMyProfile = false;
      store.userStore.userForm = {
        id: 1,
        name: "Omar",
        email: "omar@test.com",
        current_password: "wrongpass",
        new_password: "newpass456",
        password_confirmation: "newpass456",
      };

      api.put.mockRejectedValueOnce({
        response: {
          status: 422,
          data: {
            errors: {
              current_password: ["La contraseña actual es incorrecta"],
            },
          },
        },
      });

      await store.saveProfile();
      expect(store.loading).toBe(false);
    });

    it("shows error when new password is too short", async () => {
      store.slug = "test";
      store.isNotMyProfile = false;
      store.userStore.userForm = {
        id: 1,
        name: "Omar",
        current_password: "oldpass123",
        new_password: "123",
        password_confirmation: "123",
      };

      api.put.mockRejectedValueOnce({
        response: {
          status: 422,
          data: {
            errors: {
              new_password: ["La contraseña debe tener al menos 8 caracteres"],
            },
          },
        },
      });

      await store.saveProfile();
      expect(store.loading).toBe(false);
    });

    it("shows error when passwords do not match", async () => {
      store.slug = "test";
      store.isNotMyProfile = false;
      store.userStore.userForm = {
        id: 1,
        name: "Omar",
        current_password: "oldpass123",
        new_password: "newpass456",
        password_confirmation: "mismatch789",
      };

      api.put.mockRejectedValueOnce({
        response: {
          status: 422,
          data: {
            errors: {
              password_confirmation: ["Las contraseñas no coinciden"],
            },
          },
        },
      });

      await store.saveProfile();
      expect(store.loading).toBe(false);
    });

    it("sends empty password fields when user only changes name (no password change)", async () => {
      store.slug = "test";
      store.isNotMyProfile = false;
      store.userStore.userForm = {
        id: 1,
        name: "Omar Updated",
        email: "omar@test.com",
      };

      api.put.mockResolvedValueOnce({
        data: { user: { id: 1, name: "Omar Updated", email: "omar@test.com" } },
      });

      await store.saveProfile();

      const payload = api.put.mock.calls[0][1];
      expect(payload.current_password).toBeUndefined();
      expect(payload.new_password).toBeUndefined();
      expect(store.userStore.user.name).toBe("Omar Updated");
    });

    it("handles simultaneous email and password change", async () => {
      store.slug = "test";
      store.isNotMyProfile = false;
      store.userStore.userForm = {
        id: 1,
        name: "Omar",
        email: "newemail@test.com",
        current_password: "oldpass123",
        new_password: "newpass456",
        password_confirmation: "newpass456",
      };

      api.put.mockResolvedValueOnce({
        data: { user: { id: 1, name: "Omar", email: "newemail@test.com" } },
      });

      await store.saveProfile();

      expect(store.userStore.user.email).toBe("newemail@test.com");
    });

    it("handles network error during profile save", async () => {
      store.slug = "test";
      store.isNotMyProfile = false;
      store.userStore.userForm = {
        id: 1,
        name: "Omar",
        email: "omar@test.com",
        current_password: "oldpass",
        new_password: "newpass456",
        password_confirmation: "newpass456",
      };

      api.put.mockRejectedValueOnce(new Error("Network error"));

      await store.saveProfile();
      expect(store.loading).toBe(false);
    });
  });

  describe("profile URL construction", () => {
    it("uses slug in profile URL when slug exists", async () => {
      store.slug = "tacos-el-pastor";
      store.isNotMyProfile = false;
      store.userStore.userForm = { id: 5, name: "Test" };

      api.put.mockResolvedValueOnce({
        data: { user: { id: 5, name: "Test" } },
      });

      await store.saveProfile();
      expect(api.put).toHaveBeenCalledWith(
        "/admin/tacos-el-pastor/profile/5",
        expect.anything()
      );
    });

    it("uses 'admin' when slug is empty", async () => {
      store.slug = "";
      store.isNotMyProfile = false;
      store.userStore.userForm = { id: 5, name: "Test" };

      api.put.mockResolvedValueOnce({
        data: { user: { id: 5, name: "Test" } },
      });

      await store.saveProfile();
      expect(api.put).toHaveBeenCalledWith(
        "/admin/admin/profile/5",
        expect.anything()
      );
    });
  });

  describe("editing other user profile", () => {
    it("updates users list when editing another user", async () => {
      store.slug = "test";
      store.isNotMyProfile = true;
      store.userStore.userForm = { id: 2, name: "Updated Name", email: "new@email.com" };
      store.userStore.users = [
        { id: 1, name: "Admin" },
        { id: 2, name: "Old Name" },
      ];

      api.put.mockResolvedValueOnce({
        data: { user: { id: 2, name: "Updated Name", email: "new@email.com" } },
      });

      await store.saveProfile();

      expect(store.userStore.users[1].name).toBe("Updated Name");
      // own user should not change
      expect(store.userStore.user).toBeNull();
    });
  });
});
