import { defineStore } from "pinia";
import { api } from "boot/axios";

export const useUserStore = defineStore("user", {
  persist: true,
  state: () => ({
    user: null,
    users: [],
    userForm: null,
    token: null,
    data: {},
  }),
  getters: {
    isAuthenticated() {
      return !!this.user;
    },
    name() {
      return this.user?.name;
    },
    isSuperAdmin() {
      return this.user?.role === "super_admin";
    },
  },
  actions: {
    setUsers(users) {
      this.users = users;
    },
    setForm(data) {
      this.userForm = Object.assign({}, data);
    },
    setProfileForm() {
      this.userForm = Object.assign({}, this.user);
    },
    async loginWithFacebook(payload) {
      this.user = null;
      try {
        const { data } = await api.post("/login/facebook", payload);
        this.token = data.token;

        await this.getUser();
        return true;
      } catch (error) {
        if (error.code === "ERR_NETWORK") {
          return "No hay conexión a internet";
        }

        return false;
      }
    },
    async login(user) {
      this.user = null;
      try {
        const { data } = await api.post("/login", user);
        this.token = data.token;
        this.user = data.user;

        await this.getUser();
        return true;
      } catch (error) {
        if (error.code === "ERR_NETWORK") {
          return "No hay conexión a internet";
        }

        return "Credenciales incorrectas";
      }
    },
    async getUser() {
      const { data } = await api.get("/user");
      this.user = data;
    },
    logout() {
      this.token = null;
      this.user = null;
    },
  },
});
