<template>
  <q-card flat class="mc-admin-card">
    <div class="mc-admin-card__header">
      <div class="mc-admin-card__title">
        <q-icon name="add_circle_outline" size="24px" color="primary" class="q-mr-sm" />
        Extras
      </div>

      <div class="row items-center q-gutter-sm">
        <q-input
          color="primary"
          filled
          dense
          rounded
          debounce="300"
          v-model="filter"
          placeholder="Buscar extra..."
          class="mc-admin-search"
        >
          <template v-slot:prepend>
            <q-icon name="search" size="18px" color="grey-5" />
          </template>
        </q-input>

        <q-btn
          unelevated
          color="primary"
          icon="add"
          no-caps
          label="Agregar"
          class="mc-admin-add-btn"
          @click="adminStore.addGroup"
        />
      </div>
    </div>

    <q-table
      flat
      :rows="adminStore.groups"
      :columns="columns"
      row-key="name"
      :filter="filter"
      v-model:pagination="pagination"
      no-data-label="No se encontraron extras"
      rows-per-page-label="Registros por página:"
      :rows-per-page-options="rowsPerPageOptions"
      class="mc-inner-table"
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="name" :props="props">
            <span class="text-weight-medium">{{ props.row.name }}</span>
          </q-td>
          <q-td key="status" :props="props">
            <q-chip
              dense
              :color="props.row.status === 'Activo' ? 'positive' : 'grey-4'"
              :text-color="props.row.status === 'Activo' ? 'white' : 'grey-7'"
              size="sm"
            >
              {{ props.row.status === 'Activo' ? 'Activo' : 'Inactivo' }}
            </q-chip>
          </q-td>

          <q-td key="actions" :props="props">
            <q-btn flat size="sm" dense round icon="edit" color="grey-7" @click="editGroup(props.row)">
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
            <q-btn flat size="sm" dense round icon="delete_outline" color="negative" @click="deleteGroup(props.row)">
              <q-tooltip>Eliminar</q-tooltip>
            </q-btn>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </q-card>
  <form-drawer />
</template>

<script setup>
defineOptions({
  name: "ExtrasComponent",
});

defineProps(["status"]);

import { ref, computed } from "vue";

import { useAdminStore } from "src/stores/admin-store";
import { useConfirmDialog } from "src/composables/useConfirmDialog";
import FormDrawer from "./groups/FormDrawer.vue";

const adminStore = useAdminStore();
const { confirmDelete } = useConfirmDialog();

const filter = ref("");

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
});

const editGroup = (product) => {
  adminStore.editGroup(product);
};

const deleteGroup = (product) => {
  confirmDelete("extra", () => adminStore.deleteGroup(product));
};

const rowsPerPageOptions = [5, 10, 15, 20];
const columns = [
  {
    name: "name",
    required: true,
    label: "Extra",
    align: "left",
    field: (row) => row.name,
    format: (val) => `${val}`,
    sortable: true,
  },
  {
    name: "status",
    align: "center",
    label: "Estado",
    field: (row) => row.status,
    sortable: true,
  },
  { name: "actions", label: "Acciones", align: "right", field: "actions", sortable: false },
];
</script>

<style lang="scss" scoped>
.mc-inner-table {
  box-shadow: none;
  background: transparent;

  :deep(.q-table__top) {
    display: none;
  }
}
</style>
