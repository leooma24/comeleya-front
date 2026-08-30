const routes = [
  {
    path: "/nuevo-establecimiento",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", component: () => import("pages/NewEstablishmentPage.vue") },
    ],
  },
  {
    path: "/recuperar-contrasena",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", component: () => import("pages/ForgotPasswordPage.vue") },
    ],
  },
  {
    path: "/restablecer-contrasena",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", component: () => import("pages/ResetPasswordPage.vue") },
    ],
  },
  {
    path: "/suscripcion/resultado",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", component: () => import("pages/SubscriptionResultPage.vue") },
    ],
  },
  {
    path: "/",
    component: () => import("layouts/PageLayout.vue"),
    children: [{ path: "", component: () => import("pages/MainPage.vue") }],
  },
  {
    path: "/privacidad",
    component: () => import("layouts/PageLayout.vue"),
    children: [{ path: "", component: () => import("pages/PrivacyPage.vue") }],
  },
  {
    path: "/terminos",
    component: () => import("layouts/PageLayout.vue"),
    children: [{ path: "", component: () => import("pages/TermsPage.vue") }],
  },
  {
    path: "/eliminar-datos",
    component: () => import("layouts/PageLayout.vue"),
    children: [{ path: "", component: () => import("pages/DataDeletionPage.vue") }],
  },
  {
    path: "/guia-facebook",
    component: () => import("layouts/PageLayout.vue"),
    children: [{ path: "", component: () => import("pages/GuideFacebookPage.vue") }],
  },
  {
    path: "/:slug/pedido/:code",
    component: () => import("pages/OrderTrackingPage.vue"),
  },
  {
    path: "/:slug",
    component: () => import("layouts/MainLayout.vue"),
    children: [{ path: "", component: () => import("pages/IndexPage.vue") }],
  },
  {
    path: "/:slug/admin",
    component: () => import("layouts/AdminLayout.vue"),
    children: [
      {
        path: "",
        component: () => import("pages/AdminPage.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "iniciar-sesion",
        component: () => import("pages/LoginPage.vue"),
      },
    ],
  },
  {
    path: "/admin",
    component: () => import("layouts/AdminLayout.vue"),
    children: [
      {
        path: "",
        component: () => import("pages/AdminPage.vue"),
        meta: { requiresAuth: true, role: "super_admin" },
      },
      {
        path: "iniciar-sesion",
        component: () => import("pages/LoginPage.vue"),
      },
    ],
  },

  // La direccion propia de cada platillo: /kazuki-sushi-delivery/maguro-roll.
  //
  // Es el mismo menu de /:slug, que al montarse abre la ficha del platillo. Existe
  // para que un negocio deje de ser UNA sola pagina para Google y pase a ser una por
  // platillo, cada una con su foto, su precio y su descripcion.
  //
  // Va al final a proposito, despues de /:slug/admin y /:slug/pedido/:code: Vue
  // Router puntua los segmentos fijos por encima de los comodines, pero dejarlo aqui
  // hace evidente al leer que este no se come a los otros.
  {
    path: "/:slug/:platillo",
    component: () => import("layouts/MainLayout.vue"),
    children: [{ path: "", component: () => import("pages/IndexPage.vue") }],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
