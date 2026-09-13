<template>
  <!-- En otra pestaña: quien la toca esta a medio pedido y no debe perder su carrito. -->
  <a class="mc-hecho-con" :href="liga" target="_blank" rel="noopener">
    <img class="mc-hecho-con__logo" src="~/src/assets/logo.svg" alt="" width="22" height="22" />
    <span class="mc-hecho-con__texto">
      <span>Menú hecho con <strong>ComeleYa</strong></span>
      <span class="mc-hecho-con__cta">¿Tienes un negocio? Crea el tuyo sin comisiones</span>
    </span>
  </a>
</template>

<script setup>
/**
 * La leyenda al pie de cada menu publico.
 *
 * Cada comensal que pide ve el producto funcionando, y alguno es dueño de un negocio o
 * conoce a uno. La liga lleva el slug del negocio (?ref=) para saber que menu trajo cada
 * alta: la guarda src/utils/referencia.js y el alta la manda al servidor.
 */
defineOptions({ name: "HechoConComeleya" });

import { computed } from "vue";

const props = defineProps({
  slug: { type: String, default: "" },
});

const liga = computed(() => {
  const base = window.location.origin;
  return props.slug ? `${base}/?ref=${encodeURIComponent(props.slug)}` : `${base}/`;
});
</script>

<style lang="scss" scoped>
.mc-hecho-con {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  max-width: 420px;
  margin: 32px auto 12px;
  padding: 12px 16px;
  border-radius: 14px;
  text-decoration: none;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  box-shadow: 0 0 0 1px var(--color-border-subtle);

  &:hover .mc-hecho-con__cta {
    text-decoration: underline;
  }
}

.mc-hecho-con__logo {
  flex: 0 0 auto;
}

.mc-hecho-con__texto {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  line-height: 1.35;
}

.mc-hecho-con__cta {
  color: var(--q-primary);
  font-weight: 600;
}
</style>
