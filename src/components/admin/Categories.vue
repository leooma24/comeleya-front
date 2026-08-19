<template>
  <div>
    <q-card flat class="mc-admin-card" :class="{ 'mc-seccion-app': modoApp }">
      <mc-encabezado
        v-if="modoApp"
        atras
        titulo="Categorías"
        @atras="volverAMas"
        :subtitulo="adminStore.company?.name || 'Tu negocio'"
        :cifras="[
          { v: adminStore.categories.length, l: 'Categorías' },
          { v: activasCuenta, l: 'Activas' },
          { v: adminStore.categories.length - activasCuenta, l: 'Inactivas' },
        ]"
      >
        <template v-slot:acciones>
          <button type="button" class="mc-head__ic" @click="buscarAbierto = !buscarAbierto">
            <mc-icon name="buscar" :size="17" />
          </button>
          <button type="button" class="mc-head__ic mc-head__ic--fuerte" @click="adminStore.addCategory()">
            <mc-icon name="plus" :size="17" />
          </button>
        </template>
        <template v-slot:pie>
          <div class="mc-head__pie" v-if="buscarAbierto">
            <q-input
              filled dense rounded debounce="300" v-model="filter"
              placeholder="Buscar categoría..." autofocus
            >
              <template v-slot:prepend><q-icon name="search" size="18px" /></template>
            </q-input>
          </div>
        </template>
      </mc-encabezado>

      <!-- La lista de celular. La tabla sigue intacta para escritorio: el arrastre
           para reordenar necesita un cursor, con el dedo pelea con el desplazamiento. -->
      <div class="mc-lista" v-if="modoApp">
        <div
          v-for="element in filteredCategories"
          :key="element.id"
          class="mc-lista__fila"
          :class="{ 'mc-lista__fila--off': element.status !== 'Activa' }"
        >
          <span class="mc-lista__ini">{{ (element.name || '?').trim().slice(0, 2).toUpperCase() }}</span>
          <div class="mc-lista__txt">
            <div class="mc-lista__nom">{{ element.name }}</div>
            <div class="mc-lista__meta" v-if="element.status !== 'Activa'">
              <span class="mc-lista__apagado">Oculta del menú</span>
            </div>
          </div>
          <div class="mc-lista__der">
            <row-actions-menu
              :actions="[
                { key: 'edit', icon: 'edit', color: 'grey-7', label: 'Editar', handler: () => editCategory(element) },
                { key: 'delete', icon: 'delete_outline', color: 'negative', label: 'Eliminar', handler: () => deleteCategory(element) },
              ]"
            />
          </div>
        </div>

        <div v-if="!filteredCategories.length" class="mc-lista__vacio">
          {{ filter ? "Ninguna categoría con ese nombre." : "Todavía no hay categorías." }}
        </div>
      </div>

      <div class="mc-admin-card__header" v-if="!modoApp">
        <div class="mc-admin-card__title">
          <q-icon name="category" size="24px" color="primary" class="q-mr-sm" />
          Categorías
        </div>

        <div class="row items-center q-gutter-sm">
          <q-input
            v-model="filter"
            filled
            dense
            rounded
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
            @click="adminStore.addCategory"
          />
        </div>
      </div>

      <div class="mc-admin-table-wrapper" v-if="!modoApp">
      <table class="mc-admin-table">
        <thead>
          <tr>
            <th style="width: 48px"></th>
            <th class="text-left">Categoría</th>
            <th class="text-center">Estado</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>

        <draggable
          v-model="adminStore.categories"
          tag="tbody"
          item-key="id"
          @end="onDragEnd"
          handle=".drag-handle"
          filter=".q-btn"
          :preventOnFilter="false"
          :disabled="!canReorder"
          :force-fallback="true"
          :fallback-tolerance="4"
        >
          <tr
            v-for="(element, index) in filteredCategories"
            :key="element.id"
            v-show="isInPage(index)"
          >
            <td>
              <q-icon
                v-if="canReorder"
                name="drag_indicator"
                class="drag-handle cursor-pointer"
                color="grey-5"
                size="20px"
              />
            </td>
            <td class="text-left">
              <span class="text-weight-medium">{{ element.name }}</span>
            </td>
            <td class="text-center">
              <q-chip
                dense
                :color="element.status === 'Activa' ? 'positive' : 'grey-4'"
                :text-color="element.status === 'Activa' ? 'white' : 'grey-7'"
                size="sm"
              >
                {{ element.status === 'Activa' ? 'Activo' : 'Inactivo' }}
              </q-chip>
            </td>
            <td class="text-right">
              <row-actions-menu
                :actions="[
                  { key: 'edit', icon: 'edit', color: 'grey-7', label: 'Editar', handler: () => editCategory(element) },
                  { key: 'delete', icon: 'delete_outline', color: 'negative', label: 'Eliminar', handler: () => deleteCategory(element) },
                ]"
              />
            </td>
          </tr>
        </draggable>
      </table>
      </div>

      <div
        v-if="filteredCategories.length === 0 && !modoApp"
        class="mc-empty-state"
      >
        <q-icon name="category" size="48px" color="grey-4" />
        <p>No se encontraron categorías</p>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1 && !modoApp" class="mc-pagination">
        <span class="mc-pagination__info">
          {{ (currentPage - 1) * rowsPerPage + 1 }}-{{ Math.min(currentPage * rowsPerPage, filteredCategories.length) }}
          de {{ filteredCategories.length }}
        </span>
        <q-pagination
          v-model="currentPage"
          :max="totalPages"
          :max-pages="5"
          direction-links
          boundary-links
          color="primary"
          active-design="unelevated"
          size="sm"
        />
        <q-select
          v-model="rowsPerPage"
          :options="rowsPerPageOptions"
          dense
          borderless
          class="mc-pagination__select"
          @update:model-value="currentPage = 1"
        />
      </div>
    </q-card>

    <FormDrawer />
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useModoApp } from "src/composables/useModoApp";
import McIcon from "./movil/McIcon.vue";
import McEncabezado from "./movil/Encabezado.vue";
import { VueDraggableNext } from "vue-draggable-next";
import { useAdminStore } from "src/stores/admin-store";
import { useConfirmDialog } from "src/composables/useConfirmDialog";
import FormDrawer from "./categories/FormDrawer.vue";
import RowActionsMenu from "./RowActionsMenu.vue";

defineOptions({
  name: "establishment-categories",
});

const draggable = VueDraggableNext;
const adminStore = useAdminStore();
const { confirmDelete } = useConfirmDialog();
const { modoApp } = useModoApp();
/** Regresar a "Más", que es de donde se llega a esta sección en celular. */
const volverAMas = () => { adminStore.tab = "mc_mas"; };
const buscarAbierto = ref(false);
const filter = ref("");
const activasCuenta = computed(
  () => (adminStore.categories || []).filter((c) => c.status === "Activa").length
);
const currentPage = ref(1);
const rowsPerPage = ref(10);
const rowsPerPageOptions = [5, 10, 15, 20, 50];

watch(filter, () => {
  currentPage.value = 1;
});

const filteredCategories = computed(() => {
  if (!filter.value) return adminStore.categories;
  const search = filter.value.toLowerCase();
  return adminStore.categories.filter((c) =>
    c.name?.toLowerCase().includes(search)
  );
});

// Reordenar solo es seguro sin búsqueda (evita corromper el orden real)
const canReorder = computed(() => !filter.value);

const totalPages = computed(() =>
  Math.ceil(filteredCategories.value.length / rowsPerPage.value)
);

const isInPage = (index) => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return index >= start && index < start + rowsPerPage.value;
};

const onDragEnd = () => {
  const newOrder = adminStore.categories.map((cat, index) => ({
    id: cat.id,
    order: index,
  }));
  adminStore.updateCategoriesOrder(newOrder);
};

const editCategory = (row) => adminStore.editCategory(row);

const deleteCategory = (row) => {
  confirmDelete("categoría", () => adminStore.deleteCategory(row.id));
};
</script>

<style lang="scss" scoped>
.mc-admin-table {
  .drag-handle {
    opacity: 0.4;
    transition: opacity var(--transition-fast);

    &:hover {
      opacity: 1;
    }
  }

  tr:hover .drag-handle {
    opacity: 0.7;
  }
}

.mc-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  border-top: 1px solid var(--color-border-subtle);

  &__info {
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
    white-space: nowrap;
  }

  &__select {
    width: 70px;
    font-size: var(--text-xs);
  }
}
</style>
