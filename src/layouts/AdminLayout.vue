<template>
  <q-layout class="mc-admin-layout">
    <q-header class="mc-admin-header" v-if="!ocultarBarraSuperior">
      <!-- En celular esta barra desaparece: dejaba dos cabeceras apiladas, que es el
           problema que el rediseño viene a quitar. Todo lo que traia -Ver menu, perfil,
           horario, establecimiento, direccion, configuracion, cambiar de negocio y
           cerrar sesion- vive ahora en la pestaña "Mas". El super admin la conserva,
           porque su panel no entra en el rediseño. -->
      <q-toolbar class="mc-admin-toolbar" v-if="!ocultarBarraSuperior">
        <q-img
          src="~/src/assets/logo.svg"
          alt="ComeleYa"
          class="mc-admin-logo"
          width="44px"
        />

        <q-space />

        <div
          class="row items-center q-gutter-sm no-wrap"
          v-if="adminStore.user.isAuthenticated"
        >
          <q-btn
            v-if="adminStore.isEstablishment"
            unelevated
            no-caps
            dense
            icon="visibility"
            label="Ver menú"
            color="positive"
            size="sm"
            class="mc-view-menu-btn"
            @click="openMenu"
          />

          <q-btn
            v-if="$q.screen.gt.xs"
            flat
            round
            dense
            icon="notifications_none"
            color="grey-7"
            size="sm"
          >
            <q-tooltip>Notificaciones</q-tooltip>
          </q-btn>

          <q-btn flat dense no-wrap class="mc-user-btn">
            <q-avatar size="28px" color="primary" text-color="white" class="mc-user-avatar">
              <span>{{ adminStore.user.name?.charAt(0)?.toUpperCase() }}</span>
            </q-avatar>
            <span class="mc-user-name gt-xs q-ml-sm">{{ adminStore.user.name }}</span>
            <q-icon name="expand_more" size="18px" color="grey-6" class="q-ml-xs" />

            <q-menu auto-close class="mc-user-menu">
              <q-list style="min-width: 200px">
                <q-item class="mc-menu-header">
                  <q-item-section>
                    <q-item-label class="text-weight-bold">{{ adminStore.user.name }}</q-item-label>
                    <q-item-label caption class="text-grey-6">Administrador</q-item-label>
                  </q-item-section>
                </q-item>
                <q-separator />

                <q-item
                  clickable
                  v-ripple
                  class="mc-menu-item"
                  @click="adminStore.setProfileDrawer(true)"
                >
                  <q-item-section avatar><q-icon name="person_outline" size="20px" /></q-item-section>
                  <q-item-section>Perfil</q-item-section>
                </q-item>
                <q-item
                  clickable
                  v-ripple
                  class="mc-menu-item"
                  @click="adminStore.setScheduleDrawer(true)"
                  v-if="adminStore.isEstablishment"
                >
                  <q-item-section avatar><q-icon name="schedule" size="20px" /></q-item-section>
                  <q-item-section>Horario</q-item-section>
                </q-item>
                <q-item
                  clickable
                  v-ripple
                  class="mc-menu-item"
                  @click="adminStore.setEstablishmentDrawer(true)"
                  v-if="adminStore.isEstablishment"
                >
                  <q-item-section avatar><q-icon name="storefront" size="20px" /></q-item-section>
                  <q-item-section>Establecimiento</q-item-section>
                </q-item>
                <q-item
                  clickable
                  v-ripple
                  class="mc-menu-item"
                  @click="adminStore.setAddressDrawer(true)"
                  v-if="adminStore.isEstablishment"
                >
                  <q-item-section avatar><q-icon name="location_on" size="20px" /></q-item-section>
                  <q-item-section>Dirección</q-item-section>
                </q-item>
                <q-item
                  clickable
                  v-ripple
                  class="mc-menu-item"
                  @click="adminStore.setConfigurationDrawer(true)"
                  v-if="adminStore.isEstablishment"
                >
                  <q-item-section avatar><q-icon name="settings" size="20px" /></q-item-section>
                  <q-item-section>Configuración</q-item-section>
                </q-item>

                <div v-if="!adminStore.user.isSuperAdmin">
                  <q-separator class="q-my-sm" />
                  <q-item-label header class="text-caption text-grey-6 text-uppercase" style="font-size: 11px; letter-spacing: 0.05em">Establecimientos</q-item-label>
                  <q-item
                    dense
                    v-for="company in adminStore.user.user.establishments"
                    :key="company.id"
                    :to="`/${company.slug}/admin`"
                    clickable
                    v-ripple
                    class="mc-menu-item"
                  >
                    <q-item-section avatar><q-icon name="store" size="18px" color="grey-6" /></q-item-section>
                    <q-item-section>{{ company.name }}</q-item-section>
                  </q-item>
                </div>

                <q-separator class="q-my-sm" />
                <q-item clickable v-ripple class="mc-menu-item mc-menu-item--danger" @click="logout">
                  <q-item-section avatar><q-icon name="logout" size="20px" /></q-item-section>
                  <q-item-section>Cerrar sesión</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-toolbar>

      <!-- Establishment tabs (agrupadas por sección) -->
      <div
        class="mc-admin-tabs mc-admin-nav"
        v-if="adminStore.user.isAuthenticated && adminStore.isEstablishment && !modoApp"
      >
        <div class="mc-nav-row">
         <div class="mc-nav-inner">
          <!-- Accesos directos (más usados) -->
          <button
            v-for="item in leadingTabs"
            :key="item.name"
            type="button"
            :class="['mc-nav-item', { 'mc-nav-item--active': adminStore.tab === item.name }]"
            @click="adminStore.tab = item.name"
          >
            <q-icon :name="item.icon" size="18px" />
            <span>{{ item.label }}</span>
            <q-badge v-if="item.badge && item.badge()" color="negative" class="mc-nav-badge">
              {{ item.badge() }}
            </q-badge>
          </button>

          <!-- Grupos -->
          <q-btn-dropdown
            v-for="group in visibleGroups"
            :key="group.label"
            flat
            no-caps
            :class="['mc-nav-item', 'mc-nav-item--group', { 'mc-nav-item--active': groupActive(group) }]"
            :icon="group.icon"
            :label="group.label"
          >
            <q-list style="min-width: 190px">
              <q-item
                v-for="item in group.items"
                :key="item.name"
                clickable
                v-close-popup
                :active="adminStore.tab === item.name"
                active-class="mc-nav-menu-active"
                @click="adminStore.tab = item.name"
              >
                <q-item-section avatar>
                  <q-icon :name="item.icon" size="20px" />
                </q-item-section>
                <q-item-section>{{ item.label }}</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>

          <!-- Cierre -->
          <button
            v-for="item in trailingTabs"
            :key="item.name"
            type="button"
            :class="['mc-nav-item', { 'mc-nav-item--active': adminStore.tab === item.name }]"
            @click="adminStore.tab = item.name"
          >
            <q-icon :name="item.icon" size="18px" />
            <span>{{ item.label }}</span>
          </button>
         </div>
        </div>
      </div>

      <!-- Super admin tabs -->
      <div
        class="mc-admin-tabs"
        v-if="
          adminStore.user.isAuthenticated &&
          adminStore.user.isSuperAdmin &&
          !adminStore.isEstablishment
        "
      >
        <q-tabs
          v-model="adminStore.tab"
          shrink
          active-color="primary"
          indicator-color="primary"
          class="mc-tabs"
          no-caps
        >
          <q-tab name="inicio" icon="insights" label="Inicio" />
          <q-tab name="salud" icon="health_and_safety" label="Salud" />
          <q-tab name="establecimientos" icon="store" label="Establecimientos" />
          <q-tab name="usuarios" icon="people" label="Usuarios" />
          <q-tab name="categorias_establecimiento" icon="category" label="Categorías" />
          <q-tab name="tipos_establecimiento" icon="label" label="Tipos" />
          <q-tab name="packages" icon="inventory_2" label="Paquetes" />
          <q-tab name="crm" icon="contact_phone" label="CRM" />
          <q-tab name="goals" icon="flag" label="Metas" />
          <q-tab name="subscriptions" icon="credit_card" label="Suscripciones" />
        </q-tabs>
      </div>
    </q-header>

    <extra-drawer />

    <establishment-drawer />

    <schedule-drawer />

    <configuration-drawer />

    <profile-drawer />

    <address-drawer />

    <q-page-container>
      <router-view />
    </q-page-container>

    <help-assistant v-if="adminStore.isEstablishment" />

    <!-- En celular la navegacion se muda abajo: es donde llega el pulgar sin
         reacomodar la mano, y es la señal que mas dice "aplicacion". -->
    <admin-tab-bar
      v-if="modoApp && adminStore.user.isAuthenticated && adminStore.isEstablishment"
    />
  </q-layout>
</template>

<script setup>
defineOptions({
  name: "AdminLayout",
});
import { computed, watch, onBeforeUnmount } from "vue";
import { useQuasar } from "quasar";
import ExtraDrawer from "src/components/admin/ExtraDrawer.vue";
import EstablishmentDrawer from "src/components/admin/EstablishmentDrawer.vue";
import ScheduleDrawer from "src/components/admin/ScheduleDrawer.vue";
import ConfigurationDrawer from "src/components/admin/ConfigurationDrawer.vue";
import ProfileDrawer from "src/components/admin/ProfileDrawer.vue";
import AddressDrawer from "src/components/admin/AddressDrawer.vue";
import HelpAssistant from "src/components/admin/HelpAssistant.vue";
import AdminTabBar from "src/components/admin/movil/TabBar.vue";

import { useAdminStore } from "src/stores/admin-store";
import { useModoApp } from "src/composables/useModoApp";

const adminStore = useAdminStore();
const $q = useQuasar();
const { modoApp } = useModoApp();

const ocultarBarraSuperior = computed(
  () => modoApp.value && adminStore.user.isAuthenticated && adminStore.isEstablishment
);

// La clase en el body es la que deja que cualquier vista reserve el espacio de la
// barra de abajo sin tener que saber si existe.
watch(
  modoApp,
  (activo) => document.body.classList.toggle("mc-modo-app", !!activo),
  { immediate: true }
);

// En celular el panel abre en Pedidos, no en Dashboard.
//
// El panel se abre cuando entra un pedido, no para revisar estadisticas: aterrizar en
// el tablero obliga a un toque extra justo cuando hay prisa. Solo se corrige el valor
// inicial -si el dueño ya navego a otra seccion, no se le mueve el piso.
let aterrizajeHecho = false;
watch(
  () => [modoApp.value, adminStore.isEstablishment],
  ([app, esNegocio]) => {
    if (aterrizajeHecho || !app || !esNegocio) return;
    aterrizajeHecho = true;
    if (adminStore.tab === "dashboard") {
      adminStore.tab = "pedidos_pendientes";
      adminStore.orderTab = "pedidos_pendientes";
    }
  },
  { immediate: true }
);
onBeforeUnmount(() => document.body.classList.remove("mc-modo-app"));

const openMenu = () => {
  const slug = adminStore.slug;
  window.open(`/${slug}`, "_blank");
};

const hasFeature = (featureName) => {
  // Check establishment_features first
  const features = adminStore.companyConfiguration?.features ?? [];
  const feature = features.find((f) => f.name === featureName || f.slug === featureName);
  if (feature?.value) return true;

  // Fallback: check active subscription package flags
  const pkg = adminStore.company?.active_subscription?.package;
  if (!pkg) return false;
  const map = {
    delivery: 'has_drivers',
    reservations: 'has_reservations',
    loyalty: 'has_loyalty',
    analytics: 'has_analytics',
    seo: 'has_seo',
    theme: 'has_theme_customization',
    notifications: 'has_notifications',
    online_payments: 'has_online_payments',
    ticket_printing: 'has_ticket_printing',
    facebook: 'has_facebook',
  };
  return !!pkg[map[featureName]];
};

// --- Navegación agrupada del panel del establecimiento ---
// Solo presentación: cada item sigue cambiando adminStore.tab como antes.
const leadingTabs = [
  { name: "dashboard", icon: "dashboard", label: "Dashboard" },
  { name: "pedidos_pendientes", icon: "receipt_long", label: "Pedidos", badge: () => adminStore.getOrderCounts(1) },
];
const trailingTabs = [
  { name: "mi_plan", icon: "card_membership", label: "Mi plan" },
];
const navGroups = [
  {
    label: "Catálogo",
    icon: "restaurant_menu",
    items: [
      { name: "productos", icon: "restaurant_menu", label: "Productos" },
      { name: "categorias", icon: "category", label: "Categorías" },
      { name: "extras", icon: "add_circle_outline", label: "Extras" },
      { name: "cupones", icon: "confirmation_number", label: "Cupones" },
    ],
  },
  {
    label: "Operación",
    icon: "tune",
    items: [
      { name: "reservaciones", icon: "event_seat", label: "Reservaciones", feature: "reservations" },
      { name: "repartidores", icon: "delivery_dining", label: "Repartidores", feature: "delivery" },
      { name: "lealtad", icon: "loyalty", label: "Lealtad", feature: "loyalty" },
    ],
  },
  {
    label: "Crecimiento",
    icon: "trending_up",
    items: [
      // Primero, igual que en el menu Mas del celular: es lo unico de este grupo que
      // sirve el primer dia. Vivia SOLO en el movil, asi que desde la computadora no
      // habia forma de llegar -y ahi adentro esta la liga del negocio, su QR y lo de
      // Google-. Una seccion a la que no se puede entrar es una seccion que no existe.
      { name: "difusion", icon: "campaign", label: "Comparte tu menú" },
      { name: "tema", icon: "palette", label: "Tema" },
      { name: "seo", icon: "travel_explore", label: "SEO" },
      { name: "facebook", icon: "fab fa-facebook", label: "Meta" },
      { name: "resenas", icon: "star", label: "Reseñas" },
      { name: "analiticas", icon: "analytics", label: "Analíticas" },
    ],
  },
];

// Filtra items premium no disponibles y oculta grupos que quedan vacíos.
const visibleGroups = computed(() =>
  navGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.feature || hasFeature(i.feature)) }))
    .filter((g) => g.items.length)
);

const groupActive = (group) => group.items.some((i) => i.name === adminStore.tab);

const logout = () => {
  $q.dialog({
    title: "Confirmación",
    message: "¿Estás seguro que deseas salir?",
    cancel: "Cancelar",
    persistent: true,
    ok: true,
  }).onOk(() => {
    adminStore.logout();
    const slug = adminStore.router.currentRoute.value.params.slug;
    if (slug === undefined) {
      adminStore.router.push("/admin/iniciar-sesion");
    } else {
      adminStore.router.push(`/${slug}/admin/iniciar-sesion`);
    }
    adminStore.messageStore.success("Sesión cerrada correctamente");
  });
};
</script>

<style lang="scss">
.mc-admin-layout {
  background: var(--color-surface-variant);
}

.mc-admin-header {
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.mc-admin-toolbar {
  padding: var(--space-sm) var(--space-lg);
  min-height: 56px;
}

.mc-admin-logo {
  opacity: 0.9;
  transition: opacity var(--transition-fast);

  &:hover {
    opacity: 1;
  }
}

.mc-view-menu-btn {
  border-radius: var(--radius-md) !important;
  font-weight: 600;
  font-size: var(--text-xs);
  padding: 4px 12px !important;
}

.mc-user-btn {
  border-radius: var(--radius-md) !important;
  padding: 4px 8px !important;
  transition: background var(--transition-fast);

  &:hover {
    background: var(--color-surface-variant) !important;
  }
}

.mc-user-avatar {
  font-size: 13px;
  font-weight: 600;
}

.mc-user-name {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-primary);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mc-user-menu {
  border-radius: var(--radius-lg) !important;
  box-shadow: var(--shadow-lg) !important;
  border: 1px solid var(--color-border);
}

.mc-menu-header {
  padding: var(--space-md) var(--space-md) var(--space-sm);
}

.mc-menu-item {
  border-radius: var(--radius-sm);
  margin: 0 var(--space-xs);
  min-height: 40px;
  font-size: var(--text-sm);
  transition: background var(--transition-fast);

  &:hover {
    background: var(--color-surface-variant);
  }

  &--danger {
    color: var(--q-negative);

    .q-icon {
      color: var(--q-negative);
    }
  }
}

.mc-admin-tabs {
  background: white;
  border-top: 1px solid var(--color-border);
  padding: 0 var(--space-md);
}

.mc-tabs {
  .q-tab {
    text-transform: none;
    font-weight: 500;
    font-size: var(--text-sm);
    letter-spacing: 0;
    min-height: 44px;
    color: var(--color-text-secondary);
    transition: color var(--transition-fast);

    &--active {
      color: var(--q-primary);
      font-weight: 600;
    }
  }
}

// Navegación agrupada (dueño)
.mc-admin-nav {
  padding: 0 var(--space-sm);

  .mc-nav-row {
    display: flex;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  // Se centra cuando cabe; cuando desborda, los márgenes colapsan y scrollea desde el inicio.
  .mc-nav-inner {
    display: flex;
    align-items: stretch;
    gap: 2px;
    margin: 0 auto;
  }
}

.mc-nav-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 14px;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  white-space: nowrap;
  cursor: pointer;
  transition: color var(--transition-fast), border-color var(--transition-fast);

  &:hover {
    color: var(--q-primary);
  }

  &--active {
    color: var(--q-primary);
    font-weight: 600;
    border-bottom-color: var(--q-primary);
  }

  // q-btn-dropdown usado como item de nav
  &--group {
    padding: 0 4px 0 12px;

    :deep(.q-btn__content) {
      gap: 6px;
      text-transform: none;
      font-weight: inherit;
      font-size: var(--text-sm);
    }
  }
}

.mc-nav-badge {
  margin-left: 2px;
}

.mc-nav-menu-active {
  color: var(--q-primary);
  font-weight: 600;
}
</style>
