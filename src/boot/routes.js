import { useUserStore } from "src/stores/user-store";
import { guardarReferencia } from "src/utils/referencia";
import { aplicarTemaComeleya } from "src/utils/temaComeleya";
const userStore = useUserStore();

export default ({ router }) => {
  router.beforeEach((to, from, next) => {
    // De que menu viene, si viene de uno: la liga "Menu hecho con ComeleYa" trae ?ref=.
    // Se guarda aqui, entre por la pagina que entre, y el alta la manda al servidor.
    guardarReferencia(to.query);

    // Fuera de un negocio (landing, alta, legales, super admin) van los colores de
    // ComeleYa, aunque se llegue navegando desde un menu con otro color.
    if (!to.params.slug) aplicarTemaComeleya();

    if (
      window.location.protocol === "http:" &&
      process.env.NODE_ENV === "production"
    ) {
      window.location.replace(`https://${window.location.host}${to.fullPath}`);
    }
    const token = userStore.token;
    // Si la ruta requiere autenticación y no hay token, redirigir al login
    if (to.matched.some((record) => record.meta.requiresAuth)) {
      if (!token) {
        userStore.logout();
        if (to.params.slug === undefined) {
          next("/admin/iniciar-sesion"); // Redirigir al login si no está autenticado
        } else {
          next(`/${to.params.slug}/admin/iniciar-sesion`); // Redirigir al login si no está autentic
        }
      } else if (
        to.matched.some((record) => record.meta.role === "super_admin") &&
        !userStore.isSuperAdmin
      ) {
        // Requiere super-admin y el usuario no lo es: fuera del panel global
        next("/");
      } else {
        next(); // Continuar a la ruta solicitada si está autenticado
      }
    } else {
      next(); // Continuar a la ruta solicitada si no requiere autenticación
    }
  });
};
