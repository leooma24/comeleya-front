<template>
  <BaseFormDrawer
    v-model="adminStore.establishmentTypeFormDrawer"
    :title="(adminStore.establishmentTypesForm.id ? 'Editar' : 'Nuevo') + ' Tipo'"
    save-label="Guardar Tipo"
    :loading="adminStore.loading"
    @save="adminStore.saveEstablishType"
  >
    <q-input
      v-model="adminStore.establishmentTypesForm.name"
      label="Nombre del tipo"
      filled
      dense
    />
  </BaseFormDrawer>
</template>

<script setup>
defineOptions({
  name: "EstTypeFormDrawer",
});

import { useAdminStore } from "src/stores/admin-store";
import BaseFormDrawer from "../BaseFormDrawer.vue";
const adminStore = useAdminStore();
</script>
