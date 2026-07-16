<template>
  <BaseFormDrawer
    v-model="adminStore.groupFormDrawer"
    :title="(adminStore.groupForm.id ? 'Editar' : 'Nuevo') + ' Extra'"
    save-label="Guardar Extra"
    :loading="adminStore.loading"
    @save="adminStore.saveGroup"
  >
    <q-input
      v-model="adminStore.groupForm.name"
      label="Nombre del grupo"
      filled
      dense
      class="q-mb-md"
    />

    <q-select
      v-model="adminStore.groupForm.status"
      label="Estado"
      filled
      dense
      :options="['Activo', 'Inactivo']"
      class="q-mb-lg"
    />

    <!-- Options section -->
    <div class="mc-options-section">
      <div class="mc-options-section__header">
        <span class="mc-options-section__title">Opciones</span>
        <q-btn
          flat
          dense
          round
          color="primary"
          icon="add"
          size="sm"
          @click="adminStore.addOptionGroup"
        >
          <q-tooltip>Agregar opción</q-tooltip>
        </q-btn>
      </div>

      <div
        v-for="(item, index) in adminStore.groupForm.items"
        :key="index"
        class="mc-option-row"
      >
        <q-input
          v-model="item.name"
          label="Nombre"
          filled
          dense
          class="mc-option-row__name"
        />
        <q-input
          v-model="item.price"
          label="Precio"
          filled
          dense
          type="number"
          prefix="$"
          class="mc-option-row__price"
        />
        <q-btn
          flat
          round
          dense
          icon="delete_outline"
          color="negative"
          size="sm"
          @click="adminStore.groupForm.items.splice(index, 1)"
        >
          <q-tooltip>Eliminar</q-tooltip>
        </q-btn>
      </div>

      <div v-if="!adminStore.groupForm.items?.length" class="mc-options-empty">
        Agrega opciones para este extra
      </div>
    </div>
  </BaseFormDrawer>
</template>

<script setup>
defineOptions({
  name: "GroupFormDrawer",
});

import { useAdminStore } from "src/stores/admin-store";
import BaseFormDrawer from "../BaseFormDrawer.vue";
const adminStore = useAdminStore();
</script>

<style lang="scss" scoped>
.mc-options-section {
  background: var(--color-surface-variant);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  border: 1px solid var(--color-border-subtle);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
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

.mc-option-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);

  &__name {
    flex: 2;
  }

  &__price {
    flex: 1;
  }
}

.mc-options-empty {
  text-align: center;
  padding: var(--space-lg);
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}
</style>
