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
    /**
     * Cierra la sesion aqui y nada mas.
     *
     * La usan tambien los caminos donde el token YA no vale -un 401, el guard de
     * rutas-, y ahi pedirle algo al servidor con ese token es dar vueltas de mas.
     */
    logout() {
      this.token = null;
      this.user = null;
    },

    /**
     * Cerrar sesion de verdad: el servidor invalida el token (JWTAuth::invalidate) y
     * despues se limpia el estado.
     *
     * Sin esto, "Cerrar sesion" solo borraba el token del navegador: el mismo token
     * seguia sirviendo hasta que caducaba, asi que en una tableta compartida -o con un
     * token ya copiado- cerrar sesion no protegia nada. Si la llamada falla se cierra
     * igual: quedarse dentro por un error de red es peor.
     */
    async cerrarSesion() {
      // Primero se sale aqui: si el estado siguiera con sesion mientras se espera al
      // servidor, el guard de rutas regresaria al panel a medio cierre. El token se
      // guarda antes y se manda a mano, porque el interceptor ya no tiene de donde
      // tomarlo.
      const token = this.token;
      this.logout();
      if (!token) return;

      try {
        await api.post("/logout", null, { headers: { Authorization: `Bearer ${token}` } });
      } catch (e) {
        // Sin red, o el token ya vencido: da lo mismo, la sesion local ya se cerro.
      }
    },
  },
});
