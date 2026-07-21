<template>
  <q-card flat class="mc-admin-card">
    <div class="mc-admin-card__header">
      <div class="mc-admin-card__title">
        <q-icon name="restaurant_menu" size="24px" color="primary" class="q-mr-sm" />
        Productos
      </div>

      <div class="row items-center q-gutter-sm">
        <q-input
          color="primary"
          filled
          dense
          rounded
          debounce="300"
          v-model="filter"
          placeholder="Buscar producto..."
          class="mc-admin-search"
        >
          <template v-slot:prepend>
            <q-icon name="search" size="18px" color="grey-5" />
          </template>
        </q-input>

        <q-select
          filled
          dense
          rounded
          v-model="categoryFilter"
          :options="categoryOptions"
          emit-value
          map-options
          options-dense
          label="Categoría"
          class="mc-category-filter"
          style="min-width: 160px"
        />

        <div class="mc-view-toggle">
          <q-btn
            flat
            round
            :color="showResults === 'table' ? 'primary' : 'grey-5'"
            icon="view_list"
            size="sm"
            @click="showResults = 'table'"
          >
            <q-tooltip>Vista lista</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            :color="showResults === 'card' ? 'primary' : 'grey-5'"
            icon="grid_view"
            size="sm"
            @click="showResults = 'card'"
          >
            <q-tooltip>Vista tarjeta</q-tooltip>
          </q-btn>
        </div>

        <q-btn
          unelevated
          color="primary"
          icon="add"
          no-caps
          label="Agregar"
          class="mc-admin-add-btn"
          @click="adminStore.addProduct"
        />
      </div>
    </div>

    <!-- Filtros por estado -->
    <div class="mc-status-filters">
      <q-chip
        v-for="sf in statusFilters"
        :key="sf.value"
        clickable
        :outline="statusFilter !== sf.value"
        :color="statusFilter === sf.value ? 'primary' : 'grey-6'"
        :text-color="statusFilter === sf.value ? 'white' : 'grey-8'"
        :icon="sf.icon"
        :label="sf.label"
        @click="statusFilter = sf.value"
      />
    </div>

    <!-- Table view with drag-and-drop -->
    <template v-if="showResults === 'table'">
      <div class="mc-admin-table-wrapper">
      <table class="mc-admin-table">
        <thead>
          <tr>
            <th style="width: 48px"></th>
            <th style="width: 56px">Foto</th>
            <th class="text-left">Producto</th>
            <th class="text-left">Categoría</th>
            <th class="text-center">Estado</th>
            <th class="text-right">Precio</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>

        <draggable
          v-model="adminStore.products"
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
            v-for="(element, index) in filteredProducts"
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
            <td>
              <q-img
                :src="element.photo"
                class="mc-product-thumb"
                :ratio="1"
              />
            </td>
            <td class="text-left">
              <span class="text-weight-medium">{{ element.name }}</span>
            </td>
            <td class="text-left">
              <q-chip dense size="sm" color="grey-3" text-color="grey-8">
                {{ element.dish_category?.name }}
              </q-chip>
            </td>
            <td class="text-center">
              <q-chip
                dense
                size="sm"
                :color="element.status === 'Inactivo' ? 'red-1' : 'green-1'"
                :text-color="element.status === 'Inactivo' ? 'negative' : 'positive'"
                :icon="element.status === 'Inactivo' ? 'cancel' : 'check_circle'"
                :label="element.status === 'Inactivo' ? 'Inactivo' : 'Activo'"
              />
            </td>
            <td class="text-right">
              <span class="mc-text-price">${{ element.price }}</span>
            </td>
            <td class="text-right">
              <q-btn
                flat size="sm" dense round
                :icon="element.is_featured ? 'star' : 'star_border'"
                :color="element.is_featured ? 'amber-8' : 'grey-5'"
                @click="adminStore.toggleFeatured(element)"
              >
                <q-tooltip>{{ element.is_featured ? 'Quitar destacado' : 'Destacar' }}</q-tooltip>
              </q-btn>
              <q-btn
                flat size="sm" dense round
                icon="local_offer"
                :color="element.special_price ? 'red-6' : 'grey-5'"
                @click="openOfferDialog(element)"
              >
                <q-tooltip>{{ element.special_price ? 'Editar oferta' : 'Crear oferta' }}</q-tooltip>
              </q-btn>
              <q-btn
                flat size="sm" dense round
                :icon="element.is_sold_out ? 'remove_shopping_cart' : 'shopping_cart_checkout'"
                :color="element.is_sold_out ? 'negative' : 'grey-5'"
                @click="adminStore.toggleSoldOut(element)"
              >
                <q-tooltip>{{ element.is_sold_out ? 'Marcar disponible' : 'Marcar agotado' }}</q-tooltip>
              </q-btn>
              <q-btn flat size="sm" dense round icon="edit" color="grey-7" @click="editProduct(element)">
                <q-tooltip>Editar</q-tooltip>
              </q-btn>
              <q-btn flat size="sm" dense round icon="add_circle_outline" color="grey-7" @click="adminStore.extraProduct(element)">
                <q-tooltip>Agregar Extras</q-tooltip>
              </q-btn>
              <q-btn flat size="sm" dense round icon="content_copy" color="grey-7" @click="cloneProduct(element)">
                <q-tooltip>Clonar</q-tooltip>
              </q-btn>
              <q-btn flat size="sm" dense round icon="delete_outline" color="negative" @click="deleteProduct(element)">
                <q-tooltip>Eliminar</q-tooltip>
              </q-btn>
            </td>
          </tr>
        </draggable>
      </table>
      </div>

      <div
        v-if="filteredProducts.length === 0"
        class="mc-empty-state"
      >
        <q-icon name="restaurant_menu" size="48px" color="grey-4" />
        <p>No se encontraron productos</p>
      </div>
    </template>

    <!-- Card/grid view -->
    <template v-if="showResults === 'card'">
      <div class="row q-pa-md">
        <div
          v-for="(product, index) in filteredProducts"
          :key="product.id"
          v-show="isInPage(index)"
          class="q-pa-sm col-xs-12 col-sm-6 col-md-4"
        >
          <q-card flat class="mc-product-card">
            <div class="mc-product-card__image">
              <q-img :src="product.photo" :ratio="16 / 9" />
              <q-chip
                dense
                size="sm"
                class="mc-product-card__status"
                :color="product.status === 'Inactivo' ? 'negative' : 'positive'"
                text-color="white"
                :icon="product.status === 'Inactivo' ? 'cancel' : 'check_circle'"
                :label="product.status === 'Inactivo' ? 'Inactivo' : 'Activo'"
              />
            </div>
            <q-card-section class="mc-product-card__content">
              <div class="mc-product-card__name">{{ product.name }}</div>
              <div class="mc-product-card__meta">
                <q-chip dense size="sm" color="grey-3" text-color="grey-8">
                  {{ product.dish_category?.name }}
                </q-chip>
                <span class="mc-text-price">${{ product.price }}</span>
              </div>
            </q-card-section>
            <q-card-actions class="mc-product-card__actions">
              <q-btn
                flat size="sm" dense round
                :icon="product.is_featured ? 'star' : 'star_border'"
                :color="product.is_featured ? 'amber-8' : 'grey-5'"
                @click="adminStore.toggleFeatured(product)"
              >
                <q-tooltip>{{ product.is_featured ? 'Quitar destacado' : 'Destacar' }}</q-tooltip>
              </q-btn>
              <q-btn
                flat size="sm" dense round
                icon="local_offer"
                :color="product.special_price ? 'red-6' : 'grey-5'"
                @click="openOfferDialog(product)"
              >
                <q-tooltip>{{ product.special_price ? 'Editar oferta' : 'Crear oferta' }}</q-tooltip>
              </q-btn>
              <q-btn
                flat size="sm" dense round
                :icon="product.is_sold_out ? 'remove_shopping_cart' : 'shopping_cart_checkout'"
                :color="product.is_sold_out ? 'negative' : 'grey-5'"
                @click="adminStore.toggleSoldOut(product)"
              >
                <q-tooltip>{{ product.is_sold_out ? 'Marcar disponible' : 'Marcar agotado' }}</q-tooltip>
              </q-btn>
              <q-btn flat size="sm" dense round icon="edit" color="grey-7" @click="editProduct(product)">
                <q-tooltip>Editar</q-tooltip>
              </q-btn>
              <q-btn flat size="sm" dense round icon="add_circle_outline" color="grey-7" @click="adminStore.extraProduct(product)">
                <q-tooltip>Agregar Extras</q-tooltip>
              </q-btn>
              <q-btn flat size="sm" dense round icon="content_copy" color="grey-7" @click="cloneProduct(product)">
                <q-tooltip>Clonar</q-tooltip>
              </q-btn>
              <q-btn flat size="sm" dense round icon="delete_outline" color="negative" @click="deleteProduct(product)">
                <q-tooltip>Eliminar</q-tooltip>
              </q-btn>
            </q-card-actions>
          </q-card>
        </div>

        <div
          v-if="filteredProducts.length === 0"
          class="mc-empty-state full-width"
        >
          <q-icon name="restaurant_menu" size="48px" color="grey-4" />
          <p>No se encontraron productos</p>
        </div>
      </div>
    </template>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mc-pagination">
      <span class="mc-pagination__info">
        {{ (currentPage - 1) * rowsPerPage + 1 }}-{{ Math.min(currentPage * rowsPerPage, filteredProducts.length) }}
        de {{ filteredProducts.length }}
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
  <form-drawer />

  <!-- Special Offer Dialog -->
  <q-dialog v-model="offerDialog" backdrop-filter="blur(8px)">
    <q-card style="border-radius: 16px; min-width: 340px; max-width: 420px">
      <q-card-section class="row items-center">
        <q-icon name="local_offer" size="24px" color="red-6" class="q-mr-sm" />
        <span style="font-size: 18px; font-weight: 700">Oferta especial</span>
        <q-space />
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-card-section v-if="offerProduct">
        <p class="text-grey-7 q-mb-md">
          {{ offerProduct.name }} — Precio actual: <strong>${{ offerProduct.price }}</strong>
        </p>
        <q-input filled dense rounded v-model="offerPrice" type="number" label="Precio de oferta ($)" class="q-mb-md" />
        <q-input filled dense rounded v-model="offerUntil" type="datetime-local" label="Válido hasta (opcional)" />
      </q-card-section>

      <q-card-actions class="q-px-lg q-pb-lg">
        <q-btn
          v-if="offerProduct?.special_price"
          flat no-caps color="negative" label="Quitar oferta"
          :disable="adminStore.loading"
          @click="removeOffer"
        />
        <q-space />
        <q-btn
          unelevated no-caps color="primary" label="Guardar"
          :loading="adminStore.loading"
          :disable="adminStore.loading"
          @click="saveOffer"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
defineOptions({
  name: "ProductsComponent",
});
defineProps(["status"]);

import { ref, computed, watch } from "vue";
import { VueDraggableNext } from "vue-draggable-next";
import { useAdminStore } from "src/stores/admin-store";
import { useConfirmDialog } from "src/composables/useConfirmDialog";
import FormDrawer from "./products/FormDrawer.vue";

const draggable = VueDraggableNext;
const adminStore = useAdminStore();
const { confirm, confirmDelete } = useConfirmDialog();

const filter = ref("");
const statusFilter = ref("all"); // all | featured | not_featured | sold_out | available | offer
const showResults = ref("table");
const currentPage = ref(1);
const rowsPerPage = ref(10);
const rowsPerPageOptions = [5, 10, 15, 20, 50];

const categoryFilter = ref(null); // id de categoría o null (todas)

const statusFilters = [
  { value: "all", label: "Todos", icon: "apps" },
  { value: "featured", label: "Destacados", icon: "star" },
  { value: "offer", label: "En oferta", icon: "local_offer" },
  { value: "sold_out", label: "Agotados", icon: "remove_shopping_cart" },
  { value: "available", label: "Disponibles", icon: "shopping_cart_checkout" },
  { value: "active", label: "Activos", icon: "visibility" },
  { value: "inactive", label: "Inactivos", icon: "visibility_off" },
];

const categoryOptions = computed(() => [
  { label: "Todas las categorías", value: null },
  ...(adminStore.categories || []).map((c) => ({ label: c.name, value: c.id })),
]);

watch([filter, statusFilter, categoryFilter], () => {
  currentPage.value = 1;
});

const filteredProducts = computed(() => {
  let list = adminStore.products;

  // Filtro por categoría
  if (categoryFilter.value != null) {
    list = list.filter(
      (p) => (p.dish_category?.id ?? p.dish_category_id) === categoryFilter.value
    );
  }

  // Filtro por estado
  switch (statusFilter.value) {
    case "featured":
      list = list.filter((p) => p.is_featured);
      break;
    case "offer":
      list = list.filter((p) => p.special_price);
      break;
    case "sold_out":
      list = list.filter((p) => p.is_sold_out);
      break;
    case "available":
      list = list.filter((p) => !p.is_sold_out);
      break;
    case "active":
      list = list.filter((p) => p.status === "Activo");
      break;
    case "inactive":
      list = list.filter((p) => p.status === "Inactivo");
      break;
  }

  // Filtro por texto
  if (filter.value) {
    const search = filter.value.toLowerCase();
    list = list.filter(
      (p) =>
        p.name?.toLowerCase().includes(search) ||
        p.dish_category?.name?.toLowerCase().includes(search)
    );
  }

  return list;
});

// Reordenar solo es seguro cuando la lista renderizada == el array completo.
// Con búsqueda o filtro activos, arrastrar corrompería el orden real.
const canReorder = computed(
  () =>
    !filter.value &&
    statusFilter.value === "all" &&
    categoryFilter.value == null
);

const totalPages = computed(() =>
  Math.ceil(filteredProducts.value.length / rowsPerPage.value)
);

const isInPage = (index) => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return index >= start && index < start + rowsPerPage.value;
};

const onDragEnd = () => {
  const newOrder = adminStore.products.map((product, index) => ({
    id: product.id,
    order: index,
  }));
  adminStore.updateProductsOrder(newOrder);
};

const editProduct = (product) => {
  adminStore.editProduct(product);
};

const cloneProduct = (product) => {
  confirm("Clonar producto", "¿Está seguro de clonar este producto?", () => {
    adminStore.cloneProduct(product);
  });
};

const deleteProduct = (product) => {
  confirmDelete("producto", () => adminStore.deleteProduct(product));
};

// Special offer dialog
const offerDialog = ref(false);
const offerProduct = ref(null);
const offerPrice = ref("");
const offerUntil = ref("");

const openOfferDialog = (product) => {
  offerProduct.value = product;
  offerPrice.value = product.special_price || "";
  offerUntil.value = product.special_until ? product.special_until.slice(0, 16) : "";
  offerDialog.value = true;
};

const saveOffer = async () => {
  await adminStore.setSpecialOffer(offerProduct.value, offerPrice.value, offerUntil.value);
  offerDialog.value = false;
};

const removeOffer = async () => {
  await adminStore.setSpecialOffer(offerProduct.value, null, null);
  offerDialog.value = false;
};
</script>

<style lang="scss" scoped>
.mc-view-toggle {
  display: flex;
  gap: 2px;
  background: var(--color-surface-variant);
  border-radius: var(--radius-full);
  padding: 2px;
  border: 1px solid var(--color-border);
}

.mc-status-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  padding: 0 var(--space-md) var(--space-sm);

  .q-chip {
    font-weight: 600;
  }
}

.mc-product-card__image {
  position: relative;
}

.mc-product-card__status {
  position: absolute;
  top: var(--space-xs);
  left: var(--space-xs);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

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

.mc-product-thumb {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.mc-product-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: box-shadow var(--transition-fast);

  &:hover {
    box-shadow: var(--shadow-md);
  }

  &__image {
    overflow: hidden;

    .q-img {
      transition: transform var(--transition-slow);
    }

    &:hover .q-img {
      transform: scale(1.03);
    }
  }

  &__content {
    padding: var(--space-md);
  }

  &__name {
    font-weight: 600;
    font-size: var(--text-sm);
    color: var(--color-text-primary);
    margin-bottom: var(--space-xs);
  }

  &__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__actions {
    border-top: 1px solid var(--color-border-subtle);
    justify-content: flex-end;
    padding: var(--space-xs) var(--space-sm);
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
