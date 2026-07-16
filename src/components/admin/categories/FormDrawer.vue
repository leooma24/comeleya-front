<template>
  <BaseFormDrawer
    v-model="adminStore.categoryFormDrawer"
    :title="(adminStore.categoryForm.id ? 'Editar' : 'Nueva') + ' Categoría'"
    save-label="Guardar Categoría"
    :loading="adminStore.loading"
    @save="adminStore.saveCategory"
  >
    <q-input
      v-model="adminStore.categoryForm.name"
      label="Nombre"
      filled
      dense
      class="q-mb-md"
    />

    <q-select
      v-model="adminStore.categoryForm.status"
      label="Estado"
      filled
      dense
      :options="['Activa', 'Inactiva']"
    />
  </BaseFormDrawer>
</template>

<script setup>
defineOptions({
  name: "CategoryFormDrawer",
});

import { useAdminStore } from "src/stores/admin-store";
import BaseFormDrawer from "../BaseFormDrawer.vue";
const adminStore = useAdminStore();
</script>
