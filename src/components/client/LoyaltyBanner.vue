<template>
  <div class="mc-loyalty-banner" v-if="visible" @click="showLookup = true">
    <q-icon name="loyalty" size="20px" />
    <span>Acumula puntos con cada pedido</span>
    <q-icon name="chevron_right" size="18px" />
  </div>

  <q-dialog v-model="showLookup" backdrop-filter="blur(8px)">
    <q-card class="mc-loyalty-dialog">
      <q-card-section class="mc-dialog-header">
        <span class="mc-dialog-title">Mis puntos</span>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-input
          filled dense rounded
          v-model="phone"
          label="Tu número de teléfono"
          class="q-mb-md"
          @keyup.enter="lookup"
        >
          <template v-slot:prepend><q-icon name="phone" /></template>
        </q-input>
        <q-btn unelevated no-caps color="primary" label="Consultar puntos" class="full-width" @click="lookup" :loading="loading" />
      </q-card-section>

      <q-card-section v-if="points !== null" class="mc-points-result">
        <div class="mc-points-badge">
          <span class="mc-points-value">{{ points }}</span>
          <span class="mc-points-label">puntos</span>
        </div>
        <p class="mc-points-info" v-if="config.points_value">
          Equivalen a <strong>${{ (points * config.points_value).toFixed(2) }}</strong> en descuentos
        </p>
        <p class="mc-points-info">{{ earnText }}</p>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
defineOptions({ name: "LoyaltyBanner" });

import { ref, computed } from "vue";
import { api } from "boot/axios";
import { useCompanyStore } from "src/stores/company-store";
import { useNegocioCargado } from "src/composables/useNegocioCargado";

const companyStore = useCompanyStore();

const visible = ref(false);
const showLookup = ref(false);
const phone = ref("");
const loading = ref(false);
const points = ref(null);
const config = ref({
  earn_mode: "per_amount",
  points_per_amount: 1,
  amount_step: 10,
  points_per_order: 10,
  points_value: 1,
  min_points_redeem: 50,
});

const earnText = computed(() => {
  const c = config.value;
  if (c.earn_mode === "per_order") {
    return `Ganas ${c.points_per_order || 0} puntos por cada pedido`;
  }
  const pts = c.points_per_amount || 1;
  return `Ganas ${pts} punto${pts === 1 ? "" : "s"} por cada $${c.amount_step || 10} que gastas`;
});

const lookup = async () => {
  if (!phone.value) return;
  loading.value = true;
  points.value = null;
  try {
    const { data } = await api.post(`/establishment/${companyStore.slug}/loyalty/lookup`, { phone: phone.value });
    points.value = data.loyalty?.points ?? 0;
  } catch (e) {
    points.value = 0;
  } finally {
    loading.value = false;
  }
};

// Cuando ya cargo el negocio de la ruta: al montar, companyStore puede seguir siendo el de
// la visita anterior y se enseñaban los puntos de otro restaurante.
useNegocioCargado(async (slug) => {
  visible.value = false;
  try {
    const { data } = await api.get(`/establishment/${slug}/loyalty/config`);
    if (data.config) {
      Object.assign(config.value, data.config);
      visible.value = true;
    }
  } catch (e) {
    // Loyalty not enabled
  }
});
</script>

<style lang="scss" scoped>
.mc-loyalty-banner {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: linear-gradient(135deg, var(--q-primary), color-mix(in srgb, var(--q-primary) 80%, black));
  color: white;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 500;
  margin: var(--space-sm);
  transition: opacity var(--transition-fast);

  &:hover { opacity: 0.9; }
}

.mc-loyalty-dialog {
  border-radius: var(--radius-xl);
  min-width: 340px;
  max-width: 420px;
}

.mc-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mc-dialog-title {
  font-size: var(--text-xl);
  font-weight: 700;
}

.mc-points-result {
  text-align: center;
}

.mc-points-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(135deg, var(--q-primary), color-mix(in srgb, var(--q-primary) 70%, black));
  color: white;
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  margin-bottom: var(--space-md);
}

.mc-points-value {
  font-size: var(--text-3xl);
  font-weight: 800;
  line-height: 1.2;
}

.mc-points-label {
  font-size: var(--text-sm);
  opacity: 0.85;
}

.mc-points-info {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xs);
}

@media screen and (max-width: 600px) {
  .mc-loyalty-dialog {
    min-width: 300px;
    max-width: calc(100vw - 32px);
  }
}
</style>
