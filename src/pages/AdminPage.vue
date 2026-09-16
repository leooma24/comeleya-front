<template>
  <q-page class="mc-admin-page">
    <div class="mc-admin-content">
      <!-- Los avisos de plan y de configuracion pendiente. En celular NO van aqui:
           dibujados antes de la cabecera la empujaban hacia abajo y le cortaban el
           titulo, asi que la pantalla empezaba con un aviso a medias. Ahi los pone la
           propia banda, pegados abajo, donde no mueven nada. -->
      <admin-avisos v-if="!isAdmin && !modoApp" />

      <!-- La banda de arriba para las secciones que no traen la suya.
           Antes cada una empezaba con su propia cabecera blanca y una pastilla suelta
           de "Más" encima, asi que entrar a Cupones se sentia como salir del panel.
           Ahora todas arrancan igual: la misma franja oscura, el mismo regreso.
           Las que tienen cifras propias -Pedidos, Hoy, Menú, Categorías, Extras- traen
           la suya y aqui no se dibuja. -->
      <mc-encabezado
        v-if="bandaGenerica"
        atras
        :titulo="tituloSeccion"
        :subtitulo="adminStore.company?.name || 'Tu negocio'"
        @atras="volverAMas"
      />

      <!-- Regreso a "Mas" en escritorio: ahi no hay banda que lo lleve dentro. -->
      <button
        v-if="mostrarAtras && !modoApp"
        type="button"
        class="mc-atras"
        @click="volverAMas"
      >
        <mc-icon name="flecha" :size="16" />
        Más
      </button>

      <!-- Una cajera de un negocio cuyo plan ya no incluye cajeros: el servidor le niega
           todo el panel, asi que en vez de una pantalla llena de errores se le dice por
           que y se le deja salir. -->
      <div v-if="adminStore.bloqueoCajero" class="mc-bloqueo">
        <q-icon name="lock" size="40px" color="grey-5" />
        <p>{{ adminStore.bloqueoCajero }}</p>
        <q-btn unelevated no-caps color="primary" label="Cerrar sesión" @click="salir" />
      </div>
      <component
        v-else
        :is="getComponentName(adminStore.tab)"
        :status="getStatus(adminStore.tab, adminStore.orderTab)"
        :key="claveSeccion"
      />
    </div>
  </q-page>
</template>

<script setup>
defineOptions({
  name: "AdminPage",
});
import { ref, computed, watch, defineAsyncComponent } from "vue";
import { useRoute } from "vue-router";
import { useAdminStore } from "src/stores/admin-store";
import { useModoApp } from "src/composables/useModoApp";
import McIcon from "src/components/admin/movil/McIcon.vue";
import McEncabezado from "src/components/admin/movil/Encabezado.vue";
import AdminAvisos from "src/components/admin/Avisos.vue";
import { useOrderAlerts } from "src/composables/useOrderAlerts";
import { puedeVerSeccion } from "src/utils/permisos";

// Carga diferida de cada sección: parte el bundle admin (no se descarga lo que no se usa)
const lazy = (name) =>
  defineAsyncComponent(() => import(`../components/admin/${name}.vue`));

const Dashboard = lazy("Dashboard");
const Mas = lazy("Mas");
const Products = lazy("Products");
const Categories = lazy("Categories");
const Sucursales = lazy("Sucursales");
const Difusion = lazy("Difusion");
const Extras = lazy("Extras");
const Coupons = lazy("Coupons");
const Orders = lazy("Orders");
const Establishments = lazy("Establishments");
const SuperAdminHome = lazy("SuperAdminHome");
const EstablishmentsHealth = lazy("EstablishmentsHealth");
const Users = lazy("Users");
const EstablishmentCategories = lazy("EstablishmentCategories");
const EstablishmentTypes = lazy("EstablishmentTypes");
const Packages = lazy("Packages");
const Reservations = lazy("Reservations");
const Drivers = lazy("Drivers");
const Loyalty = lazy("Loyalty");
const ThemeCustomizer = lazy("ThemeCustomizer");
const SeoSettings = lazy("SeoSettings");
const FacebookCatalog = lazy("FacebookCatalog");
const Analytics = lazy("Analytics");
const Crm = lazy("Crm");
const SalesGoals = lazy("SalesGoals");
const Subscriptions = lazy("Subscriptions");
const MySubscription = lazy("MySubscription");
const Reviews = lazy("Reviews");
const Equipo = lazy("Equipo");

const adminStore = useAdminStore();
const { modoApp } = useModoApp();
const enPedidos = computed(() => String(adminStore.tab || "").startsWith("pedidos"));

// Las cuatro pestañas de la barra. Cualquier otra seccion se abrio desde "Mas".
const TABS_PRINCIPALES = ["dashboard", "productos", "mc_mas"];
/**
 * Las secciones que traen su propia banda, porque tienen cifras que mostrar en ella.
 * El resto la recibe de aqui, con el titulo de esta tabla.
 */
const SECCIONES_CON_BANDA_PROPIA = [
  "pedidos_pendientes",
  "dashboard",
  "productos",
  "mc_mas",
  "categorias",
  "extras",
  "sucursales",
  "difusion",
  "equipo",
];

/** El nombre de cada seccion, el mismo que aparece en su renglon de "Más". */
const TITULOS = {
  cupones: "Cupones",
  resenas: "Reseñas",
  repartidores: "Repartidores",
  reservaciones: "Reservaciones",
  lealtad: "Lealtad",
  analiticas: "Analíticas",
  tema: "Tema del menú",
  seo: "SEO",
  facebook: "Meta",
  difusion: "Comparte tu menú",
  mi_plan: "Mi plan",
  crm: "Prospectos",
  goals: "Metas de venta",
};

const tituloSeccion = computed(() => TITULOS[adminStore.tab] || "Panel");

const bandaGenerica = computed(
  () =>
    modoApp.value &&
    adminStore.isEstablishment &&
    !SECCIONES_CON_BANDA_PROPIA.includes(adminStore.tab)
);

const mostrarAtras = computed(
  () =>
    modoApp.value &&
    adminStore.isEstablishment &&
    !enPedidos.value &&
    !TABS_PRINCIPALES.includes(adminStore.tab)
);
const volverAMas = () => {
  adminStore.tab = "mc_mas";
  window.scrollTo({ top: 0, behavior: "instant" });
};
const route = useRoute();
const isAdmin = ref(false);

const slug = route.params.slug ?? "";
adminStore.setSlug(slug);
adminStore.getEstablishment();
// El QR del menu es cosa del dueño: a la cajera el servidor se lo niega.
if (!adminStore.esCajero) adminStore.getQr();
if (route.path === "/admin") {
  isAdmin.value = true;
}

// Alerta global de pedidos nuevos (suena en cualquier pestaña). Solo aplica al
// panel de un establecimiento (no en el super-admin, donde no hay slug).
useOrderAlerts(() => slug);

// Cambiar de local es ver otro juego de pedidos: la alerta aprende de nuevo sin sonar y
// los contadores se piden otra vez. La primera vuelta solo fija el local; los contadores
// ya vienen con el negocio. Tambien corre cuando llega el negocio y resulta que el local
// guardado en este aparato ya no existe.
watch(
  () => adminStore.localEfectivo,
  (local, antes) => {
    adminStore.orderStore.cambiarLocal(local);
    if (antes !== undefined) adminStore.recargarConteos();
  },
  { immediate: true }
);

// Pedidos se vuelve a montar al cambiar de local: la lista, la paginacion y el sondeo
// arrancan de cero con el local nuevo en vez de mezclar los dos. Las demas secciones no
// dependen del local y no tienen por que recargarse.
const claveSeccion = computed(() => {
  const base = `${adminStore.tab}-${adminStore.orderTab}`;
  return enPedidos.value ? `${base}-${adminStore.localEfectivo ?? "todos"}` : base;
});

// Unos treinta lugares del panel cambian de seccion: avisos, atajos del Dashboard, el
// asistente, botones de regreso. En vez de cuidar cada uno, aqui se regresa a Pedidos
// cualquier seccion que el rol no permite. Corre tambien cuando llega el rol del servidor.
watch(
  () => [adminStore.tab, adminStore.rolActual],
  ([tab, rol]) => {
    if (puedeVerSeccion(rol, tab)) return;
    adminStore.tab = "pedidos_pendientes";
    adminStore.orderTab = "pedidos_pendientes";
  },
  { immediate: true }
);

const salir = () => {
  adminStore.logout();
  adminStore.router.push(slug ? `/${slug}/admin/iniciar-sesion` : "/admin/iniciar-sesion");
};

const getComponentName = (tab) => {
  // Lo que el rol no permite ni se monta: el componente del dueño pediria datos que el
  // servidor le niega a la cajera. El watch de arriba la regresa a Pedidos.
  if (!puedeVerSeccion(adminStore.rolActual, tab)) return null;
  if (tab === "equipo") return Equipo;
  if (tab === "dashboard") {
    return Dashboard;
  } else if (tab === "productos") {
    return Products;
  } else if (tab === "categorias") {
    return Categories;
  } else if (tab === "sucursales") {
    return Sucursales;
  } else if (tab === "difusion") {
    return Difusion;
  } else if (tab === "extras") {
    return Extras;
  } else if (tab === "cupones") {
    return Coupons;
  } else if (tab === "pedidos_pendientes") {
    return Orders;
  } else if (tab === "inicio") {
    return SuperAdminHome;
  } else if (tab === "salud") {
    return EstablishmentsHealth;
  } else if (tab === "establecimientos") {
    return Establishments;
  } else if (tab === "usuarios") {
    return Users;
  } else if (tab === "categorias_establecimiento") {
    return EstablishmentCategories;
  } else if (tab === "tipos_establecimiento") {
    return EstablishmentTypes;
  } else if (tab === "packages") {
    return Packages;
  } else if (tab === "reservaciones") {
    return Reservations;
  } else if (tab === "repartidores") {
    return Drivers;
  } else if (tab === "lealtad") {
    return Loyalty;
  } else if (tab === "tema") {
    return ThemeCustomizer;
  } else if (tab === "seo") {
    return SeoSettings;
  } else if (tab === "facebook") {
    return FacebookCatalog;
  } else if (tab === "analiticas") {
    return Analytics;
  } else if (tab === "crm") {
    return Crm;
  } else if (tab === "goals") {
    return SalesGoals;
  } else if (tab === "subscriptions") {
    return Subscriptions;
  } else if (tab === "mi_plan") {
    return MySubscription;
  } else if (tab === "resenas") {
    return Reviews;
  } else if (tab === "mc_mas") {
    // Solo existe en celular: es el cajon de todo lo que no se usa en hora pico.
    return Mas;
  }
  return null;
};

const getStatus = (tab, orderTab) => {
  if (tab === "pedidos_pendientes") {
    switch (orderTab) {
      case "pedidos_pendientes":
        return 1;
      case "pedidos_en_preparacion":
        return 2;
      case "pedidos_enviados":
        return 3;
      case "pedidos_entregados":
        return 4;
      case "pedidos_cancelados":
        return 5;
      // El Historial no es un estado: es su propia vista y trae sus propios filtros.
      // El 0 le dice a Orders.vue que no consulte ni sondee ningun estado.
      case "pedidos_historial":
        return 0;
    }
  }
  return "0";
};
</script>

<style lang="scss" scoped>

/* Regreso a "Más" en las secciones que se abren desde ahí. */
.mc-atras {
  appearance: none;
  border: 0;
  background: var(--color-surface);
  box-shadow: 0 0 0 0.5px rgba(13, 16, 21, 0.06);
  border-radius: 999px;
  padding: 7px 14px 7px 10px;
  margin: 0 0 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 620;
  color: var(--color-text-primary);
  cursor: pointer;

  // La flecha del sistema apunta a la derecha; aquí se voltea para "regresar".
  :deep(svg) { transform: rotate(180deg); }
}

.mc-admin-page {
  background: var(--color-surface-variant);
  min-height: calc(100vh - 100px);
}

/* Lo que ve una cajera cuando el plan del negocio ya no incluye cajeros. */
.mc-bloqueo {
  max-width: 360px;
  margin: 64px auto;
  padding: 0 var(--space-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  text-align: center;
  color: var(--color-text-secondary);

  p {
    margin: 0;
    line-height: 1.5;
  }
}

.mc-admin-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--space-lg);
}

.mc-setup-banners {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

/* El aire de abajo solo cuando hay algo que anunciar. Sin esto el contenedor vacio
   dejaba una franja de 24 px arriba de cada pantalla, que en celular se veia como una
   banda blanca encima de la cabecera oscura. */
.mc-setup-banners:not(:empty) {
  margin-bottom: var(--space-lg);
}

.mc-setup-banner {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: white;
  border-radius: var(--radius-lg);
  border-left: 4px solid var(--q-warning, #fb8c00);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-fast);

  &:hover {
    box-shadow: var(--shadow-md);
  }

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--q-warning, #fb8c00) 12%, transparent);
    color: var(--q-warning, #fb8c00);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__text {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;

    strong {
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--color-text-primary);
      line-height: 1.3;
    }

    span {
      font-size: var(--text-xs);
      color: var(--color-text-secondary);
      line-height: 1.4;
    }
  }

  &__btn {
    flex-shrink: 0;
    border-radius: var(--radius-md);
    font-weight: 600;
  }
}

@media screen and (max-width: 600px) {
  .mc-admin-content {
    padding: var(--space-md);
  }

  .mc-setup-banner {
    flex-wrap: wrap;
    padding: var(--space-md);

    &__btn {
      width: 100%;
      margin-top: var(--space-xs);
    }
  }
}
</style>
