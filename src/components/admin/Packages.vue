<template>
  <q-card flat class="mc-admin-card">
    <div class="mc-admin-card__header">
      <div class="mc-admin-card__title">
        <q-icon name="inventory_2" size="24px" color="primary" class="q-mr-sm" />
        Paquetes
      </div>

      <div class="row items-center q-gutter-sm">
        <q-input
          color="primary"
          filled
          dense
          rounded
          debounce="300"
          v-model="filter"
          placeholder="Buscar paquete..."
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
          @click="adminStore.addPackage"
        />
      </div>
    </div>

    <q-table
      flat
      :rows="adminStore.packages"
      :columns="columns"
      row-key="name"
      :filter="filter"
      no-data-label="No se encontraron paquetes"
      rows-per-page-label="Registros por pagina:"
      v-model:pagination="pagination"
      :rows-per-page-options="[5, 10, 15, 20]"
      class="mc-inner-table"
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="name" :props="props">
            <span class="text-weight-medium">{{ props.row.name }}</span>
          </q-td>
          <q-td key="monthly_price" :props="props">
            <span class="mc-text-price">${{ props.row.monthly_price }}</span>
          </q-td>
          <q-td key="yearly_price" :props="props">
            <span class="mc-text-price">${{ props.row.yearly_price }}</span>
          </q-td>
          <q-td key="max_products" :props="props">
            <q-chip dense size="sm" :color="props.row.max_products === 0 ? 'blue-2' : 'orange-2'" :text-color="props.row.max_products === 0 ? 'blue-8' : 'orange-8'">
              {{ props.row.max_products === 0 ? 'Ilimitado' : props.row.max_products }}
            </q-chip>
          </q-td>
          <q-td key="features_count" :props="props">
            <q-chip dense size="sm" color="green-2" text-color="green-8">
              {{ countFeatures(props.row) }}/10
            </q-chip>
          </q-td>
          <q-td key="status" :props="props">
            <q-chip
              dense
              :color="props.row.status === 'activo' ? 'positive' : 'grey-4'"
              :text-color="props.row.status === 'activo' ? 'white' : 'grey-7'"
              size="sm"
            >
              {{ props.row.status === 'activo' ? 'Activo' : 'Inactivo' }}
            </q-chip>
          </q-td>
          <q-td key="actions" :props="props">
            <q-btn flat size="sm" dense round icon="edit" color="grey-7" @click="editItem(props.row)">
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
            <q-btn flat size="sm" dense round icon="delete_outline" color="negative" @click="deleteItem(props.row)">
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
  name: "PackagesComponent",
});
defineProps(["status"]);

import { ref } from "vue";

import { useAdminStore } from "src/stores/admin-store";
import { useConfirmDialog } from "src/composables/useConfirmDialog";
import FormDrawer from "./packages/FormDrawer.vue";
const adminStore = useAdminStore();
const { confirmDelete } = useConfirmDialog();

const filter = ref("");

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
});

const featureFields = [
  'has_analytics', 'has_loyalty', 'has_reservations', 'has_drivers',
  'has_online_payments', 'has_notifications', 'has_ticket_printing',
  'has_seo', 'has_theme_customization', 'has_google_business',
];

const countFeatures = (row) => {
  return featureFields.filter(f => row[f]).length;
};

const editItem = (row) => {
  adminStore.editPackage(row);
};

const deleteItem = (row) => {
  confirmDelete("paquete", () => adminStore.deletePackage(row));
};

adminStore.getPackages();

const columns = [
  {
    name: "name",
    required: true,
    label: "Paquete",
    align: "left",
    field: (row) => row.name,
    sortable: true,
  },
  {
    name: "monthly_price",
    label: "Mensual",
    align: "right",
    field: (row) => row.monthly_price,
    sortable: true,
  },
  {
    name: "yearly_price",
    label: "Anual",
    align: "right",
    field: (row) => row.yearly_price,
    sortable: true,
  },
  {
    name: "max_products",
    label: "Productos",
    align: "center",
    field: (row) => row.max_products,
    sortable: true,
  },
  {
    name: "features_count",
    label: "Features",
    align: "center",
    sortable: false,
  },
  {
    name: "status",
    label: "Estado",
    align: "center",
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
