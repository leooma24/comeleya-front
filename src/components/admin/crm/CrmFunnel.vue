<template>
  <div>
    <div v-if="loading" class="text-center q-py-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <template v-else>
      <!-- KPI row -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-6 col-md-3">
          <q-card flat bordered class="mc-kpi-card text-center q-py-md">
            <div class="text-h4 text-weight-bold text-primary">{{ data.total }}</div>
            <div class="text-caption text-grey-6">Total prospectos</div>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card flat bordered class="mc-kpi-card text-center q-py-md">
            <div class="text-h4 text-weight-bold text-positive">{{ data.win_rate }}%</div>
            <div class="text-caption text-grey-6">Tasa de cierre</div>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card flat bordered class="mc-kpi-card text-center q-py-md">
            <div class="text-h4 text-weight-bold text-teal">${{ formatNum(data.pipeline_value) }}</div>
            <div class="text-caption text-grey-6">Pipeline</div>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card flat bordered class="mc-kpi-card text-center q-py-md">
            <div class="text-h4 text-weight-bold text-blue">{{ data.avg_days_to_close }}d</div>
            <div class="text-caption text-grey-6">Dias promedio para cerrar</div>
          </q-card>
        </div>
      </div>

      <!-- Funnel visualization -->
      <q-card flat bordered class="q-pa-lg q-mb-lg" style="border-radius: 12px">
        <div class="text-subtitle1 text-weight-bold q-mb-md">Embudo de conversion</div>
        <div class="mc-funnel">
          <div v-for="(conv, i) in data.conversions" :key="i" class="mc-funnel-step">
            <div class="mc-funnel-bar-row">
              <div class="mc-funnel-label">{{ stageLabel(conv.from) }}</div>
              <div class="mc-funnel-bar-wrapper">
                <div class="mc-funnel-bar" :style="{ width: barWidth(conv.from_count) + '%', background: stageColor(conv.from) }">
                  <span class="mc-funnel-count">{{ conv.from_count }}</span>
                </div>
              </div>
              <div class="mc-funnel-rate">
                <q-icon name="arrow_downward" size="14px" :color="conv.rate >= 50 ? 'positive' : conv.rate >= 25 ? 'warning' : 'negative'" />
                {{ conv.rate }}%
              </div>
            </div>
          </div>
          <!-- Last stage -->
          <div class="mc-funnel-step">
            <div class="mc-funnel-bar-row">
              <div class="mc-funnel-label">Ganado</div>
              <div class="mc-funnel-bar-wrapper">
                <div class="mc-funnel-bar" :style="{ width: barWidth(data.counts?.cerrado_ganado || 0) + '%', background: '#4CAF50' }">
                  <span class="mc-funnel-count">{{ data.counts?.cerrado_ganado || 0 }}</span>
                </div>
              </div>
              <div class="mc-funnel-rate"></div>
            </div>
          </div>
        </div>
      </q-card>

      <!-- Loss reasons -->
      <q-card v-if="data.loss_reasons?.length" flat bordered class="q-pa-lg" style="border-radius: 12px">
        <div class="text-subtitle1 text-weight-bold q-mb-md">Razones de perdida</div>
        <div v-for="reason in data.loss_reasons" :key="reason.loss_reason" class="mc-reason-row">
          <span class="mc-reason-label">{{ reason.loss_reason }}</span>
          <q-linear-progress :value="reason.count / maxLossCount" color="negative" track-color="grey-3" rounded size="10px" class="mc-reason-bar" />
          <span class="mc-reason-count">{{ reason.count }}</span>
        </div>
      </q-card>
    </template>
  </div>
</template>

<script setup>
defineOptions({ name: "CrmFunnel" });
import { ref, computed, onMounted } from "vue";
import { api } from "boot/axios";

const data = ref({});
const loading = ref(true);

const formatNum = (n) => n ? Number(n).toLocaleString("es-MX") : "0";
const stageLabel = (s) => ({ nuevo: "Nuevo", contactado: "Contactado", demo: "Demo", negociando: "Negociando", cerrado_ganado: "Ganado", cerrado_perdido: "Perdido" })[s] || s;
const stageColor = (s) => ({ nuevo: "#2196F3", contactado: "#00BCD4", demo: "#9C27B0", negociando: "#FF9800" })[s] || "#9E9E9E";

const maxCount = computed(() => {
  if (!data.value.conversions?.length) return 1;
  return data.value.conversions[0]?.from_count || 1;
});

const barWidth = (count) => Math.max(5, (count / maxCount.value) * 100);

const maxLossCount = computed(() => {
  if (!data.value.loss_reasons?.length) return 1;
  return data.value.loss_reasons[0]?.count || 1;
});

onMounted(async () => {
  try {
    const { data: res } = await api.get("/admin/prospects/funnel");
    data.value = res;
  } catch (e) {} finally { loading.value = false; }
});
</script>

<style lang="scss" scoped>
.mc-kpi-card { border-radius: 12px; }
.mc-funnel { display: flex; flex-direction: column; gap: 8px; }
.mc-funnel-step { }
.mc-funnel-bar-row { display: flex; align-items: center; gap: 12px; }
.mc-funnel-label { width: 100px; font-size: 12px; font-weight: 600; text-align: right; color: var(--color-text-secondary); }
.mc-funnel-bar-wrapper { flex: 1; background: #f5f5f5; border-radius: 6px; height: 32px; overflow: hidden; }
.mc-funnel-bar { height: 100%; border-radius: 6px; display: flex; align-items: center; justify-content: center; min-width: 40px; transition: width 0.5s ease; }
.mc-funnel-count { color: white; font-size: 12px; font-weight: 700; }
.mc-funnel-rate { width: 60px; font-size: 12px; font-weight: 600; }
.mc-reason-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.mc-reason-label { width: 160px; font-size: 13px; color: var(--color-text-secondary); }
.mc-reason-bar { flex: 1; }
.mc-reason-count { width: 30px; font-size: 13px; font-weight: 600; text-align: right; }
</style>
