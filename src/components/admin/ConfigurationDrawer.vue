<template>
  <q-drawer
    v-model="adminStore.configurationDrawer"
    bordered
    overlay
    side="right"
    :width="$q.screen.width <= 440 ? $q.screen.width : 440"
    class="mc-form-drawer"
  >
    <div class="mc-form-drawer__header">
      <h6>Configuración</h6>
      <q-btn
        flat
        round
        dense
        icon="close"
        color="grey-6"
        @click="adminStore.configurationDrawer = false"
      />
    </div>

    <q-scroll-area style="height: calc(100% - 130px)">
      <div class="mc-form-drawer__body">
        <!-- Services section -->
        <div class="mc-config-section">
          <div class="mc-config-section__header">
            <q-icon name="tune" size="xs" color="primary" />
            <span class="mc-config-section__title">Servicios</span>
          </div>

          <div
            v-for="item in adminStore.companyConfiguration.features"
            :key="item.id"
            class="mc-config-toggle"
          >
            <q-toggle
              v-model="item.value"
              checked-icon="check"
              :label="item.name"
              color="primary"
              unchecked-icon="clear"
              dense
            />
          </div>
        </div>

        <!-- Bank transfer section -->
        <div class="mc-config-section q-mt-md">
          <div class="mc-config-section__header">
            <q-icon name="account_balance" size="xs" color="primary" />
            <span class="mc-config-section__title">Transferencias</span>
          </div>

          <q-input
            v-model="adminStore.companyConfiguration.clabe"
            label="CLABE Interbancaria"
            filled
            dense
            class="q-mb-md"
            :disable="!adminStore.hasService(9)"
          />

          <q-input
            v-model="adminStore.companyConfiguration.bank_name"
            label="Nombre del Banco"
            filled
            dense
            class="q-mb-md"
            :disable="!adminStore.hasService(9)"
          />

          <q-input
            v-model="adminStore.companyConfiguration.account_name"
            label="Titular de la Cuenta"
            filled
            dense
            :disable="!adminStore.hasService(9)"
          />

          <p v-if="!adminStore.hasService(9)" class="mc-config-hint">
            Activa el servicio de transferencias para configurar estos datos.
          </p>
        </div>
      </div>
    </q-scroll-area>

    <div class="mc-form-drawer__save">
      <q-btn
        :loading="adminStore.loading"
        unelevated
        color="primary"
        icon="save"
        no-caps
        label="Guardar Configuración"
        @click="adminStore.saveConfiguration"
      />
    </div>
  </q-drawer>
</template>

<script setup>
defineOptions({
  name: "ConfigurationDrawer",
});

import { useQuasar } from "quasar";
import { useAdminStore } from "src/stores/admin-store";
const adminStore = useAdminStore();
const $q = useQuasar();
</script>

<style lang="scss" scoped>
.mc-config-section {
  background: var(--color-surface-variant);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  border: 1px solid var(--color-border-subtle);

  &__header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    margin-bottom: var(--space-md);
  }

  &__title {
    font-weight: 600;
    font-size: var(--text-sm);
    color: var(--color-text-primary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.mc-config-toggle {
  padding: var(--space-xs) 0;
  border-bottom: 1px solid var(--color-border-subtle);

  &:last-child {
    border-bottom: none;
  }
}

.mc-config-hint {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin: var(--space-sm) 0 0;
  font-style: italic;
}
</style>
