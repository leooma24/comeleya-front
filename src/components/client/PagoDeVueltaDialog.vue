<template>
  <!-- persistent: Quasar cierra un dialogo cuando cambia la ruta, y el menu limpia el
       ?payment=... de la liga justo al abrir este aviso. Se cierra con sus botones. -->
  <q-dialog v-model="abierto" persistent backdrop-filter="blur(8px)" @hide="mainStore.pagoDeVuelta = null">
    <q-card v-if="textos" class="mc-pago-vuelta">
      <!-- span y no div: QCard le pone a su primer div hijo el redondeo de la tarjeta -->
      <span class="mc-pago-vuelta__icono" :class="`mc-pago-vuelta__icono--${textos.tono}`">
        <q-icon :name="textos.icono" size="34px" />
      </span>

      <h3 class="mc-pago-vuelta__titulo">{{ textos.titulo }}</h3>
      <p class="mc-pago-vuelta__mensaje">{{ textos.mensaje }}</p>

      <!-- Un pedido que no se pagó no existe para el restaurante: no se le enseña número. -->
      <div v-if="!rechazado && mainStore.pagoDeVuelta?.codigo" class="mc-pago-vuelta__codigo">
        <span>Número de pedido</span>
        <strong>{{ mainStore.pagoDeVuelta.codigo }}</strong>
      </div>

      <div class="mc-pago-vuelta__acciones">
        <!-- El pago no pasó: volver a intentarlo o pagar de otra forma. Nada que "seguir". -->
        <template v-if="rechazado">
          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="refresh"
            label="Volver a intentar el pago"
            class="full-width"
            :loading="reintentando"
            @click="reintentar"
          />
          <q-btn
            outline
            no-caps
            color="primary"
            icon="payments"
            label="Cambiar forma de pago"
            class="full-width"
            :disable="reintentando"
            @click="cambiarFormaDePago"
          />
          <q-btn
            flat
            no-caps
            color="grey-7"
            label="Cancelar"
            class="full-width"
            :disable="reintentando"
            @click="abierto = false"
          />
        </template>

        <template v-else>
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
        </template>
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
const reintentando = ref(false);
watch(
  () => mainStore.pagoDeVuelta,
  (pago) => {
    abierto.value = !!pago;
    reintentando.value = false;
  },
  { immediate: true }
);

const textos = computed(() => {
  const pago = mainStore.pagoDeVuelta;
  return pago ? textosDePago(pago.estado, pago.codigo) : null;
});

const rechazado = computed(() => mainStore.pagoDeVuelta?.estado === "rechazado");

// El token del seguimiento quedó guardado en este navegador al crear el pedido. Sin él (otro
// aparato, o un pedido sin token) no se ofrece el botón: no se inventa una liga que no abre.
const rutaSeguimiento = computed(() => {
  const pago = mainStore.pagoDeVuelta;
  if (!pago?.codigo || pago.estado === "rechazado") return null;

  const slug = mainStore.companyStore.slug;
  const guardado = (mainStore.orderStore.orderHistory ?? []).find(
    (o) => o.establishment === slug && String(o.order_code) === String(pago.codigo)
  );

  return guardado ? rutaDeSeguimiento(slug, guardado.order_code, guardado.tracking_token) : null;
});

// Regresa a Mercado Pago con el mismo cobro. Si lo logra, la página se va; si no, el aviso queda
// abierto con el error y los otros botones.
const reintentar = async () => {
  reintentando.value = true;
  const ok = await mainStore.reintentarPago(mainStore.pagoDeVuelta?.codigo);
  if (!ok) reintentando.value = false;
};

const cambiarFormaDePago = () => {
  if (mainStore.cambiarFormaDePago()) abierto.value = false;
};
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
