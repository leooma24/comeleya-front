import { boot } from "quasar/wrappers";
import axios from "axios";
import { useUserStore } from "src/stores/user-store";

// Sin límite, una conexión colgada gira para siempre: el comensal se queda viendo el
// spinner, no aparece el botón de Reintentar y nadie se entera de que algo fallo.
// Veinte segundos es holgado —el endpoint del menú tarda entre 150ms y 1.1s medido
// contra producción— y aun así acota la espera.
//
// OJO: las subidas de imagen mandan `timeout: 0` a mano. Una foto en una conexión
// lenta tarda más que cualquier número razonable, y cortarla a la mitad sí sería un
// problema nuevo.
const TIMEOUT_MS = 20000;

// En produccion la API se pide al mismo host del menu (/api, ver public/laravel-api.php) y
// no a app.comeleya.com: con la API en otro host de la misma IP, Safari mandaba sus
// peticiones por la conexion de comeleya.com, Apache respondia 421 sin CORS y el menu
// decia "sin conexion". .env.production lo dice igual, pero no esta en el repo: este
// default es el que queda si alguien compila sin el.
const API_POR_DEFECTO = import.meta.env.PROD ? "/api/" : "https://app.comeleya.com/api/";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || API_POR_DEFECTO,
  timeout: TIMEOUT_MS,
});

export default boot(({ app, router }) => {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  api.defaults.headers.common["X-Timezone"] = userTimezone;

  const userStore = useUserStore();

  // Request interceptor: auto-attach auth token
  api.interceptors.request.use((config) => {
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`;
    }
    return config;
  });

  // Response interceptor: handle auth errors
  api.interceptors.response.use(
    (response) => {
      if (response.data?.message === "Unauthenticated.") {
        userStore.logout();
        redirectToLogin(router);
        // Rechaza para que los callers no reciban `undefined` y truenen al
        // desestructurar `const { data } = await api.get(...)`.
        return Promise.reject(new Error("Unauthenticated"));
      }
      return response;
    },
    (error) => {
      if (error.code === "ERR_NETWORK") {
        return Promise.reject(error);
      }
      if (error.response?.status === 401) {
        userStore.logout();
        redirectToLogin(router);
      }
      return Promise.reject(error);
    }
  );

  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

function redirectToLogin(router) {
  const slug = window.location.pathname.split("/")[1];
  const path = window.location.pathname;
  if (path.includes("/admin")) {
    router.push(`/${slug}/admin/iniciar-sesion`);
  } else {
    router.push(`/${slug}/iniciar-sesion`);
  }
}

export { api };
