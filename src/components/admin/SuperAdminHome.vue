<template>
  <q-card flat class="mc-admin-card">
    <div class="mc-admin-card__header">
      <div class="mc-admin-card__title">
        <q-icon name="insights" size="24px" color="primary" class="q-mr-sm" />
        Panel del negocio
      </div>
      <q-btn flat round dense icon="refresh" :loading="loading" @click="loadAll">
        <q-tooltip>Actualizar</q-tooltip>
      </q-btn>
    </div>

    <div v-if="loading" class="mc-sa-loading">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <template v-else>
      <!-- KPIs -->
      <div class="mc-sa-kpis">
        <div class="mc-sa-kpi">
          <span class="mc-sa-kpi__label">MRR (ingreso mensual)</span>
          <span class="mc-sa-kpi__value">${{ formatNumber(overview.mrr) }}</span>
        </div>
        <div class="mc-sa-kpi">
          <span class="mc-sa-kpi__label">Clientes activos</span>
          <span class="mc-sa-kpi__value">{{ overview.active_clients }}</span>
          <span class="mc-sa-kpi__sub">de {{ overview.total_establishments }} negocios</span>
        </div>
        <div class="mc-sa-kpi">
          <span class="mc-sa-kpi__label">Churn (30 días)</span>
          <span class="mc-sa-kpi__value" :class="overview.churn_rate > 5 ? 'text-negative' : 'text-positive'">
            {{ overview.churn_rate }}%
          </span>
          <span class="mc-sa-kpi__sub">{{ overview.expired_last_month }} bajas</span>
        </div>
        <div class="mc-sa-kpi">
          <span class="mc-sa-kpi__label">En pipeline (CRM)</span>
          <span class="mc-sa-kpi__value">{{ overview.pipeline_count }}</span>
        </div>
      </div>

      <!-- Alertas -->
      <div class="mc-sa-section">
        <div class="mc-sa-section__title">Renovaciones</div>
        <div class="mc-sa-alerts">
          <button
            class="mc-sa-alert mc-sa-alert--danger"
            :class="{ 'mc-sa-alert--empty': !health.counts.expired }"
            @click="goTo('subscriptions')"
          >
            <q-icon name="error" size="22px" />
            <div>
              <div class="mc-sa-alert__num">{{ health.counts.expired }}</div>
              <div class="mc-sa-alert__lbl">Vencidas</div>
            </div>
          </button>
          <button
            class="mc-sa-alert mc-sa-alert--warn"
            :class="{ 'mc-sa-alert--empty': !health.counts.expiring_7 }"
            @click="goTo('subscriptions')"
          >
            <q-icon name="schedule" size="22px" />
            <div>
              <div class="mc-sa-alert__num">{{ health.counts.expiring_7 }}</div>
              <div class="mc-sa-alert__lbl">Vencen ≤7 días</div>
            </div>
          </button>
          <button
            class="mc-sa-alert"
            @click="goTo('subscriptions')"
          >
            <q-icon name="event" size="22px" color="primary" />
            <div>
              <div class="mc-sa-alert__num">{{ health.counts.expiring_30 }}</div>
              <div class="mc-sa-alert__lbl">Vencen ≤30 días</div>
            </div>
          </button>
        </div>
      </div>

      <!-- Gráfica ingresos por mes -->
      <div class="mc-sa-section">
        <div class="mc-sa-section__title">Ingresos por suscripción (12 meses)</div>
        <div class="mc-sa-chart">
          <div
            v-for="(m, i) in chart"
            :key="i"
            class="mc-sa-bar-wrap"
          >
            <div class="mc-sa-bar" :style="{ height: barHeight(m.revenue) + '%' }">
              <q-tooltip>${{ formatNumber(m.revenue) }} · {{ m.new_subscriptions }} altas</q-tooltip>
            </div>
            <span class="mc-sa-bar-label">{{ shortMonth(m.label) }}</span>
          </div>
        </div>
      </div>

      <!-- CRM hoy -->
      <div class="mc-sa-section">
        <div class="mc-sa-section__title">
          CRM hoy
          <q-btn flat dense no-caps size="sm" color="primary" label="Ir al CRM" @click="goTo('crm')" />
        </div>
        <div class="mc-sa-crm">
          <div class="mc-sa-crm__item">
            <span class="mc-sa-crm__num text-negative">{{ (crm.overdue || []).length }}</span>
            <span>Seguimientos vencidos</span>
          </div>
          <div class="mc-sa-crm__item">
            <span class="mc-sa-crm__num text-primary">{{ (crm.today || []).length }}</span>
            <span>Para hoy</span>
          </div>
          <div class="mc-sa-crm__item">
            <span class="mc-sa-crm__num text-grey-7">{{ (crm.stale || []).length }}</span>
            <span>Sin actividad +3d</span>
          </div>
          <div class="mc-sa-crm__item">
            <span class="mc-sa-crm__num text-positive">${{ formatNumber(crm.pipeline_value) }}</span>
            <span>Valor del pipeline</span>
          </div>
        </div>
      </div>
    </template>
  </q-card>
</template>

<script setup>
defineOptions({ name: "SuperAdminHome" });

import { ref, onMounted } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";

const adminStore = useAdminStore();
const loading = ref(true);
const overview = ref({ mrr: 0, active_clients: 0, total_establishments: 0, churn_rate: 0, pipeline_count: 0, expired_last_month: 0 });
const health = ref({ counts: { expired: 0, expiring_7: 0, expiring_30: 0 } });
const chart = ref([]);
const crm = ref({ overdue: [], today: [], stale: [], pipeline_value: 0 });

const formatNumber = (n) => Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const shortMonth = (label) => (label || "").split(" ")[0];
const barHeight = (v) => {
  const max = Math.max(...chart.value.map((m) => Number(m.revenue) || 0), 1);
  return Math.max((Number(v) / max) * 100, 2);
};
const goTo = (tab) => { adminStore.tab = tab; };

const loadAll = async () => {
  loading.value = true;
  try {
    const [ov, he, rc, cd] = await Promise.allSettled([
      api.get("/admin/super/overview"),
      api.get("/admin/super/subscription-health"),
      api.get("/admin/super/revenue-chart"),
      api.get("/admin/prospects/dashboard"),
    ]);
    if (ov.status === "fulfilled") overview.value = ov.value.data;
    if (he.status === "fulfilled") health.value = he.value.data;
    if (rc.status === "fulfilled") chart.value = rc.value.data.chart || [];
    if (cd.status === "fulfilled") crm.value = cd.value.data || crm.value;
  } finally {
    loading.value = false;
  }
};

onMounted(loadAll);
</script>

<style lang="scss" scoped>
.mc-sa-loading { display: flex; justify-content: center; padding: 60px 0; }

.mc-sa-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-md);
  padding: var(--space-lg);
}
.mc-sa-kpi {
  background: var(--color-surface-variant);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  display: flex; flex-direction: column; gap: 2px;
  &__label { font-size: var(--text-xs); color: var(--color-text-secondary); font-weight: 600; }
  &__value { font-size: 1.7rem; font-weight: 800; letter-spacing: -0.02em; color: var(--color-text-primary); }
  &__sub { font-size: var(--text-xs); color: var(--color-text-tertiary); }
}

.mc-sa-section {
  padding: 0 var(--space-lg) var(--space-lg);
  &__title {
    display: flex; align-items: center; justify-content: space-between;
    font-weight: 700; font-size: var(--text-base); color: var(--color-text-primary);
    margin-bottom: var(--space-sm);
  }
}

.mc-sa-alerts { display: flex; gap: var(--space-sm); flex-wrap: wrap; }
.mc-sa-alert {
  flex: 1; min-width: 120px;
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px; border-radius: var(--radius-md);
  border: 1px solid var(--color-border); background: var(--color-surface);
  cursor: pointer; transition: var(--transition-fast); text-align: left;
  &:hover { border-color: var(--q-primary); }
  &__num { font-size: 1.4rem; font-weight: 800; line-height: 1; }
  &__lbl { font-size: var(--text-xs); color: var(--color-text-secondary); }
  &--danger { .q-icon { color: var(--q-negative); } .mc-sa-alert__num { color: var(--q-negative); } }
  &--warn { .q-icon { color: #f57c00; } .mc-sa-alert__num { color: #f57c00; } }
  &--empty { opacity: 0.5; }
}

.mc-sa-chart {
  display: flex; align-items: flex-end; gap: 4px;
  height: 140px; padding: 8px;
  background: var(--color-surface-variant); border-radius: var(--radius-md);
}
.mc-sa-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; gap: 4px; }
.mc-sa-bar {
  width: 70%; min-height: 2px;
  background: linear-gradient(to top, var(--q-primary), color-mix(in srgb, var(--q-primary) 55%, white));
  border-radius: 4px 4px 0 0; transition: height 0.3s;
}
.mc-sa-bar-label { font-size: 9px; color: var(--color-text-tertiary); }

.mc-sa-crm {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--space-sm);
}
.mc-sa-crm__item {
  background: var(--color-surface); border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md); padding: var(--space-md);
  display: flex; flex-direction: column; gap: 2px;
  font-size: var(--text-sm); color: var(--color-text-secondary);
  .mc-sa-crm__num { font-size: 1.3rem; font-weight: 800; }
}
</style>
