<template>
  <nav class="mc-tabbar">
    <button
      v-for="t in pestanas"
      :key="t.id"
      type="button"
      :class="['mc-tabbar__item', { 'mc-tabbar__item--on': activa === t.id }]"
      @click="ir(t)"
    >
      <span class="mc-tabbar__ico">
        <mc-icon :name="t.icono" :size="22" />
        <span v-if="t.globo" class="mc-tabbar__globo">{{ t.globo }}</span>
      </span>
      {{ t.texto }}
    </button>
  </nav>
</template>

<script setup>
defineOptions({ name: "AdminTabBar" });
import { computed } from "vue";
import { useAdminStore } from "src/stores/admin-store";
import McIcon from "./McIcon.vue";

const adminStore = useAdminStore();

/**
 * Cuatro destinos y ni uno más: en el pulgar solo caben cuatro objetivos cómodos, y
 * el quinto siempre termina siendo el que nadie toca.
 *
 * Cada pestaña apunta a una sección que YA existe en el panel; esto solo cambia por
 * dónde se llega. "Más" es la única que no tiene sección propia todavía.
 */
const pestanas = computed(() => [
  {
    id: "pedidos",
    tab: "pedidos_pendientes",
    texto: "Pedidos",
    icono: "ticket",
    // Los pendientes son los que esperan una decisión; los demás estados ya van solos.
    globo: adminStore.getOrderCounts(1) || 0,
  },
  { id: "hoy", tab: "dashboard", texto: "Hoy", icono: "panel" },
  { id: "menu", tab: "productos", texto: "Menú", icono: "menu" },
  { id: "mas", tab: "mc_mas", texto: "Más", icono: "mas" },
]);

const activa = computed(() => {
  const t = adminStore.tab || "";
  if (t.startsWith("pedidos")) return "pedidos";
  if (t === "dashboard") return "hoy";
  if (t === "productos") return "menu";
  return "mas";
});

const ir = (t) => {
  adminStore.tab = t.tab;
  // Al volver a Pedidos se aterriza siempre en los que esperan respuesta, no en el
  // estado donde el dueño se quedó la última vez.
  if (t.id === "pedidos") adminStore.orderTab = "pedidos_pendientes";
  window.scrollTo({ top: 0, behavior: "instant" });
};
</script>

<style lang="scss">
.mc-tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2500;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  align-items: start;
  padding-top: 8px;
  // El respiro de abajo es el del gesto de inicio del teléfono: sin él, la última
  // pestaña queda debajo de la barra del sistema y se toca sin querer.
  padding-bottom: calc(6px + env(safe-area-inset-bottom, 0px));
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: saturate(180%) blur(16px);
  border-top: 0.5px solid var(--color-border);
}

.mc-tabbar__item {
  appearance: none;
  border: 0;
  background: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 9.5px;
  font-weight: 560;
  letter-spacing: -0.005em;
  color: var(--color-text-tertiary);
  cursor: pointer;
  font-family: inherit;

  &--on {
    color: var(--q-primary);
    font-weight: 640;
  }

  &:focus-visible {
    outline: 2px solid var(--q-primary);
    outline-offset: 3px;
    border-radius: 8px;
  }
}

.mc-tabbar__ico {
  position: relative;
  display: block;
}

.mc-tabbar__globo {
  position: absolute;
  top: -4px;
  left: 50%;
  margin-left: 4px;
  min-width: 15px;
  height: 15px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--q-primary);
  color: #fff;
  font-size: 8px;
  font-weight: 700;
  display: grid;
  place-items: center;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.95);
}

// Todo lo que scrollea tiene que librar la barra, si no el último bloque de cada
// pantalla queda a medias debajo.
body.mc-modo-app .mc-admin-content {
  padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px));
}

// El botón de ayuda vivía a 24 px del fondo, o sea justo detrás de la barra: se veía
// media rueda roja asomando entre las pestañas. Sube por encima de ella.
body.mc-modo-app .mc-help-fab {
  bottom: calc(74px + env(safe-area-inset-bottom, 0px));
  right: 14px;
}
</style>
