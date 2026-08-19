<template>
  <q-card flat class="mc-admin-card" :class="{ 'mc-seccion-app': modoApp }">
    <mc-encabezado
      v-if="modoApp"
      atras
      titulo="Extras"
      @atras="volverAMas"
      :subtitulo="adminStore.company?.name || 'Tu negocio'"
      :cifras="[
        { v: adminStore.groups.length, l: 'Grupos' },
        { v: activosCuenta, l: 'Activos' },
        { v: opcionesCuenta, l: 'Opciones' },
      ]"
    >
      <template v-slot:acciones>
        <button type="button" class="mc-head__ic" @click="buscarAbierto = !buscarAbierto">
          <mc-icon name="buscar" :size="17" />
        </button>
        <button type="button" class="mc-head__ic mc-head__ic--fuerte" @click="adminStore.addGroup()">
          <mc-icon name="plus" :size="17" />
        </button>
      </template>
      <template v-slot:pie>
        <div class="mc-head__pie" v-if="buscarAbierto">
          <q-input
            filled dense rounded debounce="300" v-model="filter"
            placeholder="Buscar extra..." autofocus
          >
            <template v-slot:prepend><q-icon name="search" size="18px" /></template>
          </q-input>
        </div>
      </template>
    </mc-encabezado>

    <!-- En celular, filas en vez de tabla. Cada grupo dice cuantas opciones tiene:
         un grupo sin opciones no le aparece al cliente, y desde la tabla eso no se
         veia sin entrar a abrirlo. -->
    <div class="mc-lista" v-if="modoApp">
      <div
        v-for="g in gruposFiltrados"
        :key="g.id || g.name"
        class="mc-lista__fila"
        :class="{ 'mc-lista__fila--off': g.status !== 'Activo' }"
        @click="editGroup(g)"
      >
        <span class="mc-lista__ini">{{ (g.name || '?').trim().slice(0, 2).toUpperCase() }}</span>
        <div class="mc-lista__txt">
          <div class="mc-lista__nom">{{ g.name }}</div>
          <div class="mc-lista__meta">
            {{ cuantasOpciones(g) }}
            {{ cuantasOpciones(g) === 1 ? "opción" : "opciones" }}
            <span v-if="g.status !== 'Activo'" class="mc-lista__apagado">· inactivo</span>
          </div>
        </div>
        <div class="mc-lista__der" @click.stop>
          <row-actions-menu
            :actions="[
              { key: 'edit', icon: 'edit', color: 'grey-7', label: 'Editar', handler: () => editGroup(g) },
              { key: 'delete', icon: 'delete_outline', color: 'negative', label: 'Eliminar', handler: () => deleteGroup(g) },
            ]"
          />
        </div>
      </div>

      <div v-if="!gruposFiltrados.length" class="mc-lista__vacio">
        {{ filter ? "Ningún extra con ese nombre." : "Todavía no hay extras." }}
      </div>
    </div>

    <div class="mc-admin-card__header" v-if="!modoApp">
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
      v-if="!modoApp"
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
import { useModoApp } from "src/composables/useModoApp";
import FormDrawer from "./groups/FormDrawer.vue";
import RowActionsMenu from "./RowActionsMenu.vue";
import McIcon from "./movil/McIcon.vue";
import McEncabezado from "./movil/Encabezado.vue";

const adminStore = useAdminStore();
const { confirmDelete } = useConfirmDialog();

const { modoApp } = useModoApp();
/** Regresar a "Más", que es de donde se llega a esta sección en celular. */
const volverAMas = () => { adminStore.tab = "mc_mas"; };
const buscarAbierto = ref(false);
const filter = ref("");

/** Las opciones del grupo. El panel las carga con `groups.items`, que es como se
    llama la relacion en el backend; las otras dos formas quedan por si algun endpoint
    las manda con su nombre viejo. */
const cuantasOpciones = (g) => (g?.items || g?.extras || g?.options || []).length;

const activosCuenta = computed(
  () => (adminStore.groups || []).filter((g) => g.status === "Activo").length
);
const opcionesCuenta = computed(() =>
  (adminStore.groups || []).reduce((suma, g) => suma + cuantasOpciones(g), 0)
);

// En escritorio el filtrado lo hace la tabla con `:filter`; la lista de celular no
// pasa por ella, asi que aqui se hace a mano -si no, se escribe y no pasa nada-.
const gruposFiltrados = computed(() => {
  const q = filter.value.trim().toLowerCase();
  const lista = adminStore.groups || [];
  return q ? lista.filter((g) => (g.name || "").toLowerCase().includes(q)) : lista;
});

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
