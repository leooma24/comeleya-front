<template>
  <q-layout class="mc-admin-layout">
    <q-header class="mc-admin-header">
      <q-toolbar class="mc-admin-toolbar">
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

      <!-- Establishment tabs -->
      <div
        class="mc-admin-tabs"
        v-if="adminStore.user.isAuthenticated && adminStore.isEstablishment"
      >
        <q-tabs
          v-model="adminStore.tab"
          shrink
          active-color="primary"
          indicator-color="primary"
          class="mc-tabs"
          no-caps
        >
          <q-tab name="dashboard" icon="dashboard" label="Dashboard" />
          <q-tab name="productos" icon="restaurant_menu" label="Productos" />
          <q-tab name="categorias" icon="category" label="Categorías" />
          <q-tab name="extras" icon="add_circle_outline" label="Extras" />
          <q-tab name="cupones" icon="confirmation_number" label="Cupones" />
          <q-tab name="pedidos_pendientes" icon="receipt_long" label="Pedidos">
            <q-badge v-if="adminStore.getOrderCounts(1)" color="negative" floating>
              {{ adminStore.getOrderCounts(1) }}
            </q-badge>
          </q-tab>
          <q-tab name="reservaciones" icon="event_seat" label="Reservaciones" v-if="hasFeature('reservations')" />
          <q-tab name="repartidores" icon="delivery_dining" label="Repartidores" v-if="hasFeature('delivery')" />
          <q-tab name="lealtad" icon="loyalty" label="Lealtad" v-if="hasFeature('loyalty')" />
          <q-tab name="tema" icon="palette" label="Tema" />
          <q-tab name="seo" icon="travel_explore" label="SEO" />
          <q-tab name="facebook" icon="fab fa-facebook" label="Facebook" />
          <q-tab name="resenas" icon="star" label="Resenas" />
          <q-tab name="analiticas" icon="analytics" label="Analíticas" />
          <q-tab name="mi_plan" icon="card_membership" label="Mi plan" />
        </q-tabs>
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
  </q-layout>
</template>

<script setup>
defineOptions({
  name: "AdminLayout",
});
import { useQuasar } from "quasar";
import ExtraDrawer from "src/components/admin/ExtraDrawer.vue";
import EstablishmentDrawer from "src/components/admin/EstablishmentDrawer.vue";
import ScheduleDrawer from "src/components/admin/ScheduleDrawer.vue";
import ConfigurationDrawer from "src/components/admin/ConfigurationDrawer.vue";
import ProfileDrawer from "src/components/admin/ProfileDrawer.vue";
import AddressDrawer from "src/components/admin/AddressDrawer.vue";
import HelpAssistant from "src/components/admin/HelpAssistant.vue";

import { useAdminStore } from "src/stores/admin-store";

const adminStore = useAdminStore();
const $q = useQuasar();

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
  };
  return !!pkg[map[featureName]];
};

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
</style>
