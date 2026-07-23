<template>
  <q-layout view="lHh Lpr lFf">
    <q-header :class="['mc-header', scrolled ? 'mc-header--scrolled' : '']">
      <q-toolbar
        v-if="!mainStore.isExternal"
        class="q-py-sm q-px-md"
      >
        <q-img
          src="~/src/assets/logo.svg"
          alt="ComeleYa — ir al inicio"
          class="q-mr-sm mc-logo cursor-pointer"
          width="44px"
          role="button"
          tabindex="0"
          @click="scrollTop"
          @keyup.enter="scrollTop"
        />
        <q-space />
        <div v-if="showSearch" class="mc-search-wrapper">
          <q-input
            v-model="mainStore.search"
            :placeholder="searchExpanded ? 'Buscar platillo...' : ''"
            aria-label="Buscar platillo"
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
                role="button"
                aria-label="Buscar"
                @click="searchExpanded = true"
              />
            </template>
            <template v-slot:append v-if="mainStore.search">
              <q-icon
                name="close"
                color="grey-6"
                size="16px"
                class="cursor-pointer mc-search-clear"
                role="button"
                aria-label="Limpiar búsqueda"
                @click="mainStore.search = ''; searchExpanded = false"
              />
            </template>
          </q-input>
        </div>

        <!-- Toggle de vista: cuadrícula / lista -->
        <div
          v-if="showSearch && mainStore.categories.length"
          class="mc-view-toggle q-ml-sm"
        >
          <q-btn
            flat
            dense
            round
            size="sm"
            :color="mainStore.viewType === 'Tarjeta' ? 'primary' : 'grey-6'"
            icon="grid_view"
            aria-label="Vista cuadrícula"
            @click="mainStore.setViewType('Tarjeta')"
          >
            <q-tooltip>Vista cuadrícula</q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            round
            size="sm"
            :color="mainStore.viewType === 'Lista' ? 'primary' : 'grey-6'"
            icon="view_list"
            aria-label="Vista lista"
            @click="mainStore.setViewType('Lista')"
          >
            <q-tooltip>Vista lista</q-tooltip>
          </q-btn>
        </div>

        <!-- Toggle modo claro/oscuro -->
        <q-btn
          flat
          round
          dense
          :icon="isDark ? 'light_mode' : 'dark_mode'"
          :color="isDark ? 'amber-6' : 'grey-8'"
          class="q-ml-sm"
          :aria-label="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
          @click="toggleTheme"
        >
          <q-tooltip>{{ isDark ? 'Modo claro' : 'Modo oscuro' }}</q-tooltip>
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
import { ref, onMounted, onUnmounted } from "vue";
import { useQuasar } from "quasar";
import AddCartDrawer from "src/components/client/AddCartDrawer.vue";
import CartDrawer from "src/components/client/CartDrawer.vue";
import DataDrawer from "src/components/client/DataDrawer.vue";
import PaymentDrawer from "src/components/client/PaymentDrawer.vue";

import ValidationDialog from "src/components/client/ValidationDialog.vue";

import { useMainStore } from "src/stores/main-store";

const mainStore = useMainStore();
mainStore.getPositions();
mainStore.checkColor();
const showSearch = ref(true);
const searchExpanded = ref(false);

// Sombra del header al hacer scroll (separa el contenido del header translúcido)
const scrolled = ref(false);
const onScroll = () => {
  scrolled.value = window.scrollY > 8;
};

const scrollTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// Modo claro/oscuro — activo SOLO en el menú del cliente (se revierte al salir)
const $q = useQuasar();
const isDark = ref(false);
const toggleTheme = () => {
  isDark.value = !isDark.value;
  $q.dark.set(isDark.value);
  try {
    localStorage.setItem("mc-theme", isDark.value ? "dark" : "light");
  } catch {
    // ignore
  }
};
let heightObserver = null;
let heightInterval = null;
onMounted(() => {
  try {
    // Default siempre claro; solo oscuro si el usuario lo activó manualmente antes
    isDark.value = localStorage.getItem("mc-theme") === "dark";
  } catch {
    isDark.value = false;
  }
  $q.dark.set(isDark.value);
  window.addEventListener("scroll", onScroll, { passive: true });

  // Auto-alto del iframe: cuando el menú va embebido, publica su alto al sitio
  // contenedor para que ajuste el <iframe> y no haya scroll doble.
  if (mainStore.router.currentRoute.value.query.isExternal && window.parent !== window) {
    const postHeight = () => {
      const h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      window.parent.postMessage({ type: "comeleya:height", height: h }, "*");
    };
    postHeight();
    try {
      heightObserver = new ResizeObserver(() => postHeight());
      heightObserver.observe(document.body);
    } catch {
      // ResizeObserver no disponible: red de seguridad por intervalo (abajo)
    }
    window.addEventListener("load", postHeight);
    // Refuerzo los primeros segundos mientras cargan imágenes/datos.
    let ticks = 0;
    heightInterval = setInterval(() => {
      postHeight();
      if (++ticks > 15) clearInterval(heightInterval);
    }, 800);
  }
});
onUnmounted(() => {
  // Al salir del menú (p. ej. al admin) volvemos a claro
  $q.dark.set(false);
  window.removeEventListener("scroll", onScroll);
  if (heightObserver) heightObserver.disconnect();
  if (heightInterval) clearInterval(heightInterval);
});
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
  background: var(--color-header-bg);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
  box-shadow: none;
  transition: box-shadow var(--transition-normal);

  &--scrolled {
    box-shadow: var(--shadow-sm);
  }
}

.mc-view-toggle {
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--color-surface-variant);
  border-radius: var(--radius-full);
  padding: 2px;
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
