<template>
  <q-page class="mc-admin-page">
    <div class="mc-admin-content">
      <!-- Setup Banners -->
      <div class="mc-setup-banners" v-if="!isAdmin && adminStore.showBanners">
        <!-- Active plan banner -->
        <div
          class="mc-setup-banner"
          v-if="trialDaysLeft !== null && trialDaysLeft > 3"
          :style="{ borderLeftColor: '#2196F3' }"
        >
          <div class="mc-setup-banner__icon" style="background: #E3F2FD;">
            <q-icon name="card_membership" size="20px" color="primary" />
          </div>
          <div class="mc-setup-banner__text">
            <strong>{{ planName }} — {{ trialDaysLeft }} {{ trialDaysLeft === 1 ? 'día' : 'días' }} restantes</strong>
            <span>Tu plan vence el {{ new Date(adminStore.company?.active_subscription?.end_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) }}</span>
          </div>
        </div>

        <!-- Plan about to expire banner (3 days or less) -->
        <div
          class="mc-setup-banner mc-setup-banner--trial"
          v-if="trialDaysLeft !== null && trialDaysLeft <= 3 && trialDaysLeft > 0"
        >
          <div class="mc-setup-banner__icon" style="background: #FFF3E0;">
            <q-icon name="hourglass_top" size="20px" color="orange" />
          </div>
          <div class="mc-setup-banner__text">
            <strong>{{ planName }} — {{ trialDaysLeft === 1 ? 'Vence mañana' : `Vence en ${trialDaysLeft} días` }}</strong>
            <span>Renueva tu plan para no perder acceso a las funciones premium.</span>
          </div>
          <q-btn
            unelevated
            no-caps
            color="orange"
            text-color="white"
            size="sm"
            label="Ver planes"
            icon="rocket_launch"
            class="mc-setup-banner__btn"
            @click="scrollToPlanes"
          />
        </div>

        <!-- Plan expires today -->
        <div
          class="mc-setup-banner mc-setup-banner--trial"
          v-if="trialDaysLeft === 0"
        >
          <div class="mc-setup-banner__icon" style="background: #FFF3E0;">
            <q-icon name="warning" size="20px" color="orange" />
          </div>
          <div class="mc-setup-banner__text">
            <strong>{{ planName }} — Vence hoy</strong>
            <span>Renueva ahora para no perder acceso.</span>
          </div>
          <q-btn
            unelevated
            no-caps
            color="orange"
            text-color="white"
            size="sm"
            label="Renovar"
            icon="rocket_launch"
            class="mc-setup-banner__btn"
            @click="scrollToPlanes"
          />
        </div>

        <!-- Plan expired / no plan banner -->
        <div
          class="mc-setup-banner mc-setup-banner--expired"
          v-if="trialExpired"
        >
          <div class="mc-setup-banner__icon" style="background: #FFEBEE;">
            <q-icon name="error" size="20px" color="negative" />
          </div>
          <div class="mc-setup-banner__text">
            <strong>No tienes un plan activo</strong>
            <span>Elige un plan para disfrutar de todas las funciones premium como repartidores, reservaciones, lealtad y mas.</span>
          </div>
          <q-btn
            unelevated
            no-caps
            color="negative"
            text-color="white"
            size="sm"
            label="Elegir plan"
            icon="rocket_launch"
            class="mc-setup-banner__btn"
            @click="scrollToPlanes"
          />
        </div>

        <div
          class="mc-setup-banner"
          v-if="!adminStore?.categories.length"
        >
          <div class="mc-setup-banner__icon">
            <q-icon name="category" size="20px" />
          </div>
          <div class="mc-setup-banner__text">
            <strong>Categorías pendientes</strong>
            <span>Agrega al menos una categoría para organizar tus productos</span>
          </div>
          <q-btn
            unelevated
            no-caps
            color="primary"
            size="sm"
            label="Agregar"
            icon="add"
            class="mc-setup-banner__btn"
            @click="addCategory"
          />
        </div>

        <div
          class="mc-setup-banner"
          v-if="!adminStore?.products.length"
        >
          <div class="mc-setup-banner__icon">
            <q-icon name="restaurant_menu" size="20px" />
          </div>
          <div class="mc-setup-banner__text">
            <strong>Productos pendientes</strong>
            <span>Agrega productos para que tus clientes puedan realizar pedidos</span>
          </div>
          <q-btn
            unelevated
            no-caps
            color="primary"
            size="sm"
            label="Agregar"
            icon="add"
            class="mc-setup-banner__btn"
            @click="addProduct"
          />
        </div>

        <div
          class="mc-setup-banner"
          v-if="
            !adminStore?.company ||
            !adminStore.company.hours ||
            !adminStore.company.hours.length
          "
        >
          <div class="mc-setup-banner__icon">
            <q-icon name="schedule" size="20px" />
          </div>
          <div class="mc-setup-banner__text">
            <strong>Horario no configurado</strong>
            <span>Establece tu horario de atención para que los clientes sepan cuándo pueden ordenar</span>
          </div>
          <q-btn
            unelevated
            no-caps
            color="primary"
            size="sm"
            label="Configurar"
            icon="settings"
            class="mc-setup-banner__btn"
            @click="adminStore.setScheduleDrawer(true)"
          />
        </div>

        <div
          class="mc-setup-banner"
          v-if="!adminStore?.company.address"
        >
          <div class="mc-setup-banner__icon">
            <q-icon name="location_on" size="20px" />
          </div>
          <div class="mc-setup-banner__text">
            <strong>Dirección no registrada</strong>
            <span>Agrega la dirección de tu establecimiento</span>
          </div>
          <q-btn
            unelevated
            no-caps
            color="primary"
            size="sm"
            label="Agregar"
            icon="add"
            class="mc-setup-banner__btn"
            @click="adminStore.addressDrawer = true"
          />
        </div>

        <div
          class="mc-setup-banner"
          v-if="
            !adminStore.company ||
            !adminStore.company.features ||
            !adminStore.company?.features.length
          "
        >
          <div class="mc-setup-banner__icon">
            <q-icon name="tune" size="20px" />
          </div>
          <div class="mc-setup-banner__text">
            <strong>Servicios no configurados</strong>
            <span>Configura los servicios que ofrece tu establecimiento</span>
          </div>
          <q-btn
            unelevated
            no-caps
            color="primary"
            size="sm"
            label="Configurar"
            icon="settings"
            class="mc-setup-banner__btn"
            @click="adminStore.configurationDrawer = true"
          />
        </div>
      </div>

      <component
        :is="getComponentName(adminStore.tab)"
        :status="getStatus(adminStore.tab, adminStore.orderTab)"
        :key="adminStore.tab + '-' + adminStore.orderTab"
      />
    </div>
  </q-page>
</template>

<script setup>
defineOptions({
  name: "AdminPage",
});
import { ref, computed, defineAsyncComponent } from "vue";
import { useRoute } from "vue-router";
import { useAdminStore } from "src/stores/admin-store";
import { useOrderAlerts } from "src/composables/useOrderAlerts";

// Carga diferida de cada sección: parte el bundle admin (no se descarga lo que no se usa)
const lazy = (name) =>
  defineAsyncComponent(() => import(`../components/admin/${name}.vue`));

const Dashboard = lazy("Dashboard");
const Mas = lazy("Mas");
const Products = lazy("Products");
const Categories = lazy("Categories");
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

const adminStore = useAdminStore();
const route = useRoute();
const isAdmin = ref(false);

// Trial/subscription days calculation
const trialDaysLeft = computed(() => {
  const sub = adminStore.company?.active_subscription;
  if (!sub || !sub.end_date) return null;
  const end = new Date(sub.end_date);
  const now = new Date();
  const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
});

// Subscription package name
const planName = computed(() => {
  return adminStore.company?.active_subscription?.package?.name || 'Plan temporal';
});

// Trial expired detection (no active subscription at all)
const trialExpired = computed(() => {
  const sub = adminStore.company?.active_subscription;
  if (sub) return false;
  // No active subscription
  if (!adminStore.company?.created_at) return false;
  return true;
});

const scrollToPlanes = () => {
  adminStore.tab = "mi_plan";
};

const slug = route.params.slug ?? "";
adminStore.setSlug(slug);
adminStore.getEstablishment();
adminStore.getQr();
if (route.path === "/admin") {
  isAdmin.value = true;
}

// Alerta global de pedidos nuevos (suena en cualquier pestaña). Solo aplica al
// panel de un establecimiento (no en el super-admin, donde no hay slug).
useOrderAlerts(() => slug);

const addCategory = () => {
  adminStore.tab = "categorias";
  adminStore.categoryFormDrawer = true;
};

const addProduct = () => {
  adminStore.tab = "productos";
  adminStore.productFormDrawer = true;
};

const getComponentName = (tab) => {
  if (tab === "dashboard") {
    return Dashboard;
  } else if (tab === "productos") {
    return Products;
  } else if (tab === "categorias") {
    return Categories;
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
.mc-admin-page {
  background: var(--color-surface-variant);
  min-height: calc(100vh - 100px);
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
