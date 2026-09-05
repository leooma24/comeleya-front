<template>
  <q-card flat class="mc-admin-card">
    <div class="mc-admin-card__header">
      <div class="mc-admin-card__title">
        <q-icon name="category" size="24px" color="primary" class="q-mr-sm" />
        Categorías
      </div>

      <div class="row items-center q-gutter-sm">
        <q-input
          color="primary"
          filled
          dense
          rounded
          debounce="300"
          v-model="filter"
          placeholder="Buscar categoría..."
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
          @click="adminStore.addEstablishmentCategory"
        />
      </div>
    </div>

    <q-table
      flat
      :rows="adminStore.establishmentCategories"
      :columns="columns"
      row-key="name"
      :filter="filter"
      no-data-label="No se encontraron categorías"
      rows-per-page-label="Registros por página:"
      v-model:pagination="pagination"
      :rows-per-page-options="[5, 10, 15, 20]"
      class="mc-inner-table mc-tabla-apilada"
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="name" data-label="Categoría" :props="props">
            <span class="text-weight-medium">{{ props.row.name }}</span>
          </q-td>
          <q-td key="status" data-label="Estado" :props="props">
            <q-chip
              dense
              :color="props.row.status === 'Activo' ? 'positive' : 'grey-4'"
              :text-color="props.row.status === 'Activo' ? 'white' : 'grey-7'"
              size="sm"
            >
              {{ props.row.status === 'Activo' ? 'Activo' : 'Inactivo' }}
            </q-chip>
          </q-td>
          <q-td key="actions" data-label="Acciones" :props="props">
            <q-btn flat size="sm" dense round icon="edit" color="grey-7" @click="editCategory(props.row)">
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
            <q-btn flat size="sm" dense round icon="delete_outline" color="negative" @click="deleteCategory(props.row)">
              <q-tooltip>Eliminar</q-tooltip>
            </q-btn>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </q-card>
  <FormDrawer />
</template>

<script setup>
defineOptions({
  name: "EstablishmentCategoriesComponent",
});
defineProps(["status"]);

import { ref } from "vue";

import { useAdminStore } from "src/stores/admin-store";
import { useConfirmDialog } from "src/composables/useConfirmDialog";
import FormDrawer from "./establishment_categories/FormDrawer.vue";
const adminStore = useAdminStore();
const { confirmDelete } = useConfirmDialog();

const filter = ref("");

adminStore.getEstablishmentCategories();

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
});

const editCategory = (row) => {
  adminStore.editEstablishmentCategory(row);
};

const deleteCategory = (row) => {
  confirmDelete("categoría", () => adminStore.deleteEstablishmentCategory(row));
};

const columns = [
  {
    name: "name",
    required: true,
    label: "Categoría",
    align: "left",
    field: (row) => row.name,
    sortable: true,
  },
  {
    name: "status",
    label: "Estado",
    align: "center",
    field: "status",
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
