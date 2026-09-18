<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(v) => emit('update:modelValue', v)"
    @show="cargar"
  >
    <q-card class="mc-agotados">
      <q-card-section class="mc-agotados__head">
        <div>
          <div class="mc-agotados__tit">Lo que se acabó</div>
          <!-- De qué cocina. Lo dice el servidor, no el aparato: la cajera solo puede la
               suya aunque la tableta tenga guardado otro local. -->
          <div class="mc-agotados__sub" v-if="local">{{ local.nombre }}</div>
        </div>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input
          filled
          dense
          rounded
          v-model="busca"
          placeholder="Buscar platillo"
          clearable
        >
          <template v-slot:prepend><q-icon name="search" /></template>
        </q-input>
      </q-card-section>

      <q-card-section class="mc-agotados__lista">
        <div v-if="cargando" class="mc-agotados__vacio">
          <q-spinner size="24px" color="primary" />
        </div>
        <div v-else-if="!visibles.length" class="mc-agotados__vacio">
          {{ busca ? "Ningún platillo con ese nombre" : "No hay platillos activos" }}
        </div>

        <div
          v-for="p in visibles"
          :key="p.id"
          class="mc-agotados__row"
          :class="{ 'mc-agotados__row--off': p.agotado }"
        >
          <div class="mc-agotados__nom">
            {{ p.name }}
            <!-- Lo que el dueño apagó en todos lados no se destapa desde aquí: se vería
                 como si volviera a haberlo cuando la decisión fue de otro. -->
            <em v-if="p.en_todos">agotado en todo el negocio</em>
          </div>
          <q-toggle
            :model-value="!p.agotado"
            :disable="p.en_todos || marcando === p.id"
            color="green-7"
            dense
            @update:model-value="marcar(p)"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
/**
 * Lo que se acabó hoy, a la mano en Pedidos.
 *
 * Es la pantalla de Productos en chiquito y existe por la cajera: ella ve que se acabó
 * el salmón en su cocina y no entra al menú -no lo tiene-. Toca un solo local, el que
 * el servidor decide con el mismo criterio que los pedidos, así que lo que apaga aquí
 * no le quita el platillo a las otras sucursales.
 */
defineOptions({ name: "AgotadosDialog" });

import { ref, computed } from "vue";
import { useAdminStore } from "src/stores/admin-store";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue"]);

const adminStore = useAdminStore();

const cargando = ref(false);
const marcando = ref(null);
const local = ref(null);
const platillos = ref([]);
const busca = ref("");

const visibles = computed(() => {
  const q = (busca.value || "").trim().toLowerCase();
  if (!q) return platillos.value;
  return platillos.value.filter((p) => p.name.toLowerCase().includes(q));
});

const cargar = async () => {
  cargando.value = true;
  busca.value = "";
  try {
    const data = await adminStore.cargarAgotados();
    local.value = data?.local ?? null;
    platillos.value = data?.platillos ?? [];
  } finally {
    cargando.value = false;
  }
};

const marcar = async (p) => {
  if (marcando.value) return;
  marcando.value = p.id;
  try {
    // El local va explícito: el dueño puede estar viendo una sucursal y el mismo
    // endpoint sin local agotaría el platillo en todo el negocio.
    const data = await adminStore.toggleSoldOut(p, local.value?.valor ?? null);
    if (data) {
      p.agotado = data.is_sold_out || (data.locales_agotados ?? []).includes(String(data.local));
      p.en_todos = !!data.is_sold_out;
    }
  } finally {
    marcando.value = null;
  }
};

// El padre solo abre y cierra; si necesita recargar, vuelve a abrir.
defineExpose({ cargar });
</script>

<style lang="scss" scoped>
.mc-agotados {
  width: 420px;
  max-width: 92vw;

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  &__tit {
    font-size: 17px;
    font-weight: 600;
  }

  &__sub {
    font-size: 13px;
    color: var(--q-primary);
  }

  &__lista {
    max-height: 60vh;
    overflow-y: auto;
    padding-top: 0;
  }

  &__vacio {
    padding: 24px 0;
    text-align: center;
    color: #8a8a8a;
    font-size: 13px;
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 2px;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    &--off .mc-agotados__nom {
      color: #9a9a9a;
      text-decoration: line-through;
    }
  }

  &__nom {
    font-size: 14px;
    line-height: 1.3;

    em {
      display: block;
      font-size: 11px;
      font-style: normal;
      color: #b06a00;
      text-decoration: none;
    }
  }
}
</style>
