<template>
  <q-dialog v-model="abierto" backdrop-filter="blur(8px)" @hide="mainStore.pagoDeVuelta = null">
    <q-card v-if="textos" class="mc-pago-vuelta">
      <div class="mc-pago-vuelta__icono" :class="`mc-pago-vuelta__icono--${textos.tono}`">
        <q-icon :name="textos.icono" size="34px" />
      </div>

      <h3 class="mc-pago-vuelta__titulo">{{ textos.titulo }}</h3>
      <p class="mc-pago-vuelta__mensaje">{{ textos.mensaje }}</p>

      <div v-if="mainStore.pagoDeVuelta?.codigo" class="mc-pago-vuelta__codigo">
        <span>Número de pedido</span>
        <strong>{{ mainStore.pagoDeVuelta.codigo }}</strong>
      </div>

      <div class="mc-pago-vuelta__acciones">
        <q-btn
          v-if="rutaSeguimiento"
          unelevated
          no-caps
          color="primary"
          icon="local_shipping"
          label="Seguir mi pedido"
          class="full-width"
          :to="rutaSeguimiento"
          @click="abierto = false"
        />
        <q-btn
          flat
          no-caps
          color="primary"
          label="Entendido"
          class="full-width"
          @click="abierto = false"
        />
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup>
defineOptions({ name: "PagoDeVueltaDialog" });

import { ref, computed, watch } from "vue";
import { useMainStore } from "src/stores/main-store";
import { textosDePago } from "src/utils/pagoDeVuelta";
import { rutaDeSeguimiento } from "src/utils/seguimiento";

const mainStore = useMainStore();

const abierto = ref(false);
watch(
  () => mainStore.pagoDeVuelta,
  (pago) => { abierto.value = !!pago; },
  { immediate: true }
);

const textos = computed(() => {
  const pago = mainStore.pagoDeVuelta;
  return pago ? textosDePago(pago.estado, pago.codigo) : null;
});

// El token del seguimiento quedó guardado en este navegador al crear el pedido. Sin él (otro
// aparato, o un pedido sin token) no se ofrece el botón: no se inventa una liga que no abre.
const rutaSeguimiento = computed(() => {
  const pago = mainStore.pagoDeVuelta;
  if (!pago?.codigo) return null;

  const slug = mainStore.companyStore.slug;
  const guardado = (mainStore.orderStore.orderHistory ?? []).find(
    (o) => o.establishment === slug && String(o.order_code) === String(pago.codigo)
  );

  return guardado ? rutaDeSeguimiento(slug, guardado.order_code, guardado.tracking_token) : null;
});
</script>

<style scoped lang="scss">
.mc-pago-vuelta {
  width: min(92vw, 380px);
  padding: var(--space-lg, 20px);
  border-radius: 20px;
  text-align: center;

  &__icono {
    width: 64px;
    height: 64px;
    margin: 4px auto 14px;
    border-radius: 50%;
    display: grid;
    place-items: center;

    &--positive { background: var(--color-success-bg); color: var(--q-positive); }
    &--warning { background: var(--color-warning-bg); color: var(--q-warning); }
    &--negative { background: var(--color-error-bg); color: var(--q-negative); }
  }

  &__titulo {
    margin: 0 0 8px;
    font-size: 20px;
    font-weight: 700;
    line-height: 1.2;
  }

  &__mensaje {
    margin: 0 0 14px;
    font-size: var(--text-sm, 14px);
    line-height: 1.45;
    color: var(--color-text-secondary);
  }

  &__codigo {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0 0 16px;
    padding: 10px;
    border-radius: 12px;
    background: var(--color-surface-variant);

    span { font-size: 12px; color: var(--color-text-secondary); }
    strong { font-size: 24px; letter-spacing: 0.02em; }
  }

  &__acciones {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
}
</style>
