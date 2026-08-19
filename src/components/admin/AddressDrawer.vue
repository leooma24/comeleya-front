<template>
  <q-drawer
    :model-value="adminStore.addressDrawer"
    @update:model-value="onDrawerModel"
    bordered
    overlay
    side="right"
    :width="$q.screen.width <= 440 ? $q.screen.width : 440"
    class="mc-form-drawer"
  >
    <div class="mc-form-drawer__header">
      <h6>Dirección</h6>
      <q-btn
        flat
        round
        dense
        icon="close"
        color="grey-6"
        @click="requestClose"
      />
    </div>

    <q-scroll-area style="height: calc(100% - 130px)">
      <div class="mc-form-drawer__body">
        <div class="mc-address-section">
          <div class="mc-address-section__header">
            <q-icon name="location_on" size="xs" color="primary" />
            <span class="mc-address-section__title">Ubicación</span>
          </div>

          <q-input
            v-model="adminStore.addressForm.postal_code"
            label="Código Postal"
            filled
            dense
            class="q-mb-md"
            @blur="adminStore.getTowns"
          >
            <template v-slot:append>
              <q-icon name="search" size="xs" color="grey-5" />
            </template>
          </q-input>

          <q-select
            filled
            dense
            v-model="adminStore.addressForm.town"
            label="Colonia"
            :options="adminStore.addressForm.towns"
            class="q-mb-md"
          />

          <q-input
            v-model="adminStore.addressForm.street"
            label="Calle"
            filled
            dense
            class="q-mb-md"
          />

          <div class="row q-col-gutter-sm q-mb-md">
            <div class="col-6">
              <q-input
                v-model="adminStore.addressForm.exterior_number"
                label="Núm. Exterior"
                filled
                dense
              />
            </div>
            <div class="col-6">
              <q-input
                v-model="adminStore.addressForm.interior_number"
                label="Núm. Interior"
                filled
                dense
              />
            </div>
          </div>

          <q-input
            v-model="adminStore.addressForm.city"
            label="Ciudad"
            filled
            dense
            class="q-mb-md"
          />

          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-input
                v-model="adminStore.addressForm.state"
                label="Estado"
                filled
                dense
              />
            </div>
            <div class="col-6">
              <q-input
                v-model="adminStore.addressForm.country"
                label="País"
                filled
                dense
              />
            </div>
          </div>
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
        label="Guardar Dirección"
        @click="adminStore.saveAddress"
      />
    </div>
  </q-drawer>
</template>

<script setup>
defineOptions({
  name: "AddressDrawer",
});

import { watch } from "vue";
import { useQuasar } from "quasar";
import { useAdminStore } from "src/stores/admin-store";
import { useUnsavedChanges } from "src/composables/useUnsavedChanges";
const adminStore = useAdminStore();
const $q = useQuasar();

// Aviso de cambios sin guardar al cerrar.
const { snap, isDirty, confirmClose } = useUnsavedChanges();
watch(() => adminStore.addressDrawer, (v) => { if (v) snap(adminStore.addressForm); });
const onDrawerModel = (v) => {
  if (v) { adminStore.addressDrawer = true; return; }
  requestClose();
};
const requestClose = () =>
  confirmClose(
    isDirty(adminStore.addressForm),
    () => adminStore.saveAddress(), // saveAddress cierra el drawer al guardar bien
    () => { adminStore.addressDrawer = false; }
  );
</script>

<style lang="scss" scoped>
.mc-address-section {
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
</style>
