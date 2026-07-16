<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="mc-header">
      <q-toolbar
        v-if="!mainStore.isExternal"
        class="q-py-sm q-px-md"
      >
        <q-img
          src="~/src/assets/logo.svg"
          alt="ComeleYa"
          class="q-mr-sm mc-logo"
          width="44px"
        />
        <q-space />
        <div v-if="showSearch" class="mc-search-wrapper">
          <q-input
            v-model="mainStore.search"
            :placeholder="searchExpanded ? 'Buscar platillo...' : ''"
            dense
            rounded
            filled
            color="grey-8"
            debounce="200"
            :class="['mc-search-input', searchExpanded ? 'mc-search-input--expanded' : 'mc-search-input--collapsed']"
            @focus="searchExpanded = true"
            @blur="!mainStore.search && (searchExpanded = false)"
          >
            <template v-slot:prepend>
              <q-icon
                name="search"
                color="grey-6"
                size="20px"
                class="cursor-pointer"
                @click="searchExpanded = true"
              />
            </template>
            <template v-slot:append v-if="mainStore.search">
              <q-icon
                name="close"
                color="grey-6"
                size="16px"
                class="cursor-pointer mc-search-clear"
                @click="mainStore.search = ''; searchExpanded = false"
              />
            </template>
          </q-input>
        </div>

        <!-- Carrito siempre accesible -->
        <q-btn
          flat
          round
          dense
          color="grey-9"
          icon="shopping_cart"
          class="q-ml-sm mc-cart-btn"
          @click="mainStore.cartDrawer = true"
        >
          <q-badge
            v-if="cartCount > 0"
            color="primary"
            floating
            rounded
            class="mc-cart-badge"
          >
            {{ cartCount }}
          </q-badge>
          <q-tooltip>Ver carrito</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <add-cart-drawer />

    <cart-drawer />

    <data-drawer />

    <payment-drawer />

    <validation-dialog />

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
defineOptions({
  name: "MainLayout",
});
import { ref, computed } from "vue";
import AddCartDrawer from "src/components/client/AddCartDrawer.vue";
import CartDrawer from "src/components/client/CartDrawer.vue";
import DataDrawer from "src/components/client/DataDrawer.vue";
import PaymentDrawer from "src/components/client/PaymentDrawer.vue";

import ValidationDialog from "src/components/client/ValidationDialog.vue";

import { useMainStore } from "src/stores/main-store";

const mainStore = useMainStore();
mainStore.getPositions();
mainStore.checkColor();

// Total de unidades en el carrito (suma de cantidades, no de líneas)
const cartCount = computed(() =>
  mainStore.cartStore.cart.reduce((acc, item) => acc + (item.qty || 0), 0)
);

const showSearch = ref(true);
const searchExpanded = ref(false);
if (mainStore.router.currentRoute.value.path === "/nuevo-establecimiento") {
  showSearch.value = false;
}

const isExternal = mainStore.router.currentRoute.value.query.isExternal;
mainStore.isExternal = isExternal ?? false;

const primaryColor = mainStore.router.currentRoute.value.query.primaryColor;
if (primaryColor) {
  mainStore.setPrimaryColor(primaryColor);
}
</script>

<style lang="scss" scoped>
.mc-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
  box-shadow: none;
}

.mc-logo {
  transition: opacity var(--transition-fast);

  &:hover {
    opacity: 0.8;
  }
}

.mc-search-wrapper {
  display: flex;
  justify-content: flex-end;
}

.mc-search-input {
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &--collapsed {
    width: 44px;
    cursor: pointer;

    :deep(.q-field__control) {
      background: transparent !important;
      box-shadow: none !important;
      padding-right: 0;
    }

    :deep(.q-field__native) {
      width: 0;
      padding: 0;
      opacity: 0;
    }

    :deep(.q-field__prepend) {
      padding: 0;
    }
  }

  &--expanded {
    width: min(320px, 50vw);

    :deep(.q-field__control) {
      transition: box-shadow var(--transition-fast), background var(--transition-fast);
    }

    :deep(.q-field--focused .q-field__control) {
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--q-primary) 20%, transparent);
    }
  }
}

.mc-search-clear {
  transition: var(--transition-fast);
  border-radius: var(--radius-full);
  padding: 2px;

  &:hover {
    background: rgba(0, 0, 0, 0.08);
  }
}
</style>
