<template>
  <q-card flat class="mc-admin-card">
    <div class="mc-admin-card__header">
      <div class="mc-admin-card__title">
        <q-icon name="flag" size="24px" color="primary" class="q-mr-sm" />
        Metas de Ventas
      </div>
    </div>

    <!-- Current Month Progress -->
    <div class="q-pa-md">
      <div class="text-subtitle1 text-weight-bold q-mb-md">
        {{ currentMonthLabel }}
      </div>

      <!-- Main KPIs -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-6 col-md-3">
          <q-card flat bordered class="mc-goal-card">
            <q-card-section>
              <div class="text-caption text-grey-6">Ingresos</div>
              <div class="text-h5 text-weight-bold">${{ formatNum(actuals.revenue) }}</div>
              <div class="text-caption text-grey-5">Meta: ${{ formatNum(goal?.target_revenue || 0) }}</div>
              <q-linear-progress :value="revenueProgress" :color="revenueProgress >= 1 ? 'positive' : revenueProgress >= 0.5 ? 'warning' : 'negative'" rounded size="8px" class="q-mt-sm" />
              <div class="text-caption text-right q-mt-xs">{{ Math.round(revenueProgress * 100) }}%</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card flat bordered class="mc-goal-card">
            <q-card-section>
              <div class="text-caption text-grey-6">Clientes nuevos</div>
              <div class="text-h5 text-weight-bold">{{ actuals.new_clients }}</div>
              <div class="text-caption text-grey-5">Meta: {{ goal?.target_new_clients || 0 }}</div>
              <q-linear-progress :value="clientsProgress" :color="clientsProgress >= 1 ? 'positive' : clientsProgress >= 0.5 ? 'warning' : 'negative'" rounded size="8px" class="q-mt-sm" />
              <div class="text-caption text-right q-mt-xs">{{ Math.round(clientsProgress * 100) }}%</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card flat bordered class="mc-goal-card">
            <q-card-section>
              <div class="text-caption text-grey-6">Renovaciones</div>
              <div class="text-h5 text-weight-bold">{{ actuals.renewals }}</div>
              <div class="text-caption text-grey-5">Meta: {{ goal?.target_renewals || 0 }}</div>
              <q-linear-progress :value="renewalsProgress" :color="renewalsProgress >= 1 ? 'positive' : renewalsProgress >= 0.5 ? 'warning' : 'negative'" rounded size="8px" class="q-mt-sm" />
              <div class="text-caption text-right q-mt-xs">{{ Math.round(renewalsProgress * 100) }}%</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card flat bordered class="mc-goal-card">
            <q-card-section>
              <div class="text-caption text-grey-6">Tasa de cierre</div>
              <div class="text-h5 text-weight-bold" :class="crm.win_rate >= 50 ? 'text-positive' : crm.win_rate >= 25 ? 'text-warning' : 'text-negative'">
                {{ crm.win_rate }}%
              </div>
              <div class="text-caption text-grey-5">{{ crm.conversions }} ganados · {{ crm.lost }} perdidos</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Pipeline + Forecast -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-md-6">
          <q-card flat bordered class="mc-goal-card">
            <q-card-section>
              <div class="row items-center justify-between q-mb-md">
                <div class="text-subtitle2 text-weight-bold">Pipeline del CRM</div>
                <q-chip dense color="teal-1" text-color="teal-9">${{ formatNum(pipeline.value) }} total</q-chip>
              </div>
              <div v-for="stage in pipeline.by_stage" :key="stage.status" class="row items-center q-mb-sm">
                <span class="text-caption" style="width: 90px">{{ stageLabel(stage.status) }}</span>
                <q-linear-progress
                  :value="pipeline.value > 0 ? stage.value / pipeline.value : 0"
                  :color="stageColor(stage.status)"
                  track-color="grey-3" rounded size="10px"
                  style="flex: 1"
                  class="q-mx-sm"
                />
                <span class="text-caption text-weight-bold" style="width: 70px; text-align: right">
                  ${{ formatNum(stage.value) }}
                </span>
                <q-badge :label="stage.count" class="q-ml-xs" color="grey-4" text-color="grey-8" />
              </div>
              <div v-if="!pipeline.by_stage?.length" class="text-center text-grey-5 text-caption q-py-md">
                Sin prospectos en pipeline
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-6">
          <q-card flat bordered class="mc-goal-card">
            <q-card-section>
              <div class="text-subtitle2 text-weight-bold q-mb-md">Pronóstico e Inteligencia</div>

              <div class="mc-forecast-row">
                <q-icon name="trending_up" size="20px" color="teal" />
                <div>
                  <div class="text-body2 text-weight-bold">${{ formatNum(pipeline.forecast) }}</div>
                  <div class="text-caption text-grey-6">Ingreso esperado (ponderado por etapa)</div>
                </div>
              </div>

              <div class="mc-forecast-row">
                <q-icon name="people" size="20px" color="primary" />
                <div>
                  <div class="text-body2 text-weight-bold">{{ pipeline.active_prospects }} prospectos activos</div>
                  <div class="text-caption text-grey-6">En pipeline este mes</div>
                </div>
              </div>

              <q-separator class="q-my-sm" />
              <div class="text-caption text-weight-bold q-mb-xs">Conversiones por fuente</div>
              <div v-for="src in crm.by_source" :key="src.source" class="row items-center q-mb-xs">
                <q-chip dense size="sm" :color="sourceColor(src.source)" class="q-mr-sm">{{ src.source }}</q-chip>
                <span class="text-caption text-weight-bold">{{ src.count }} {{ src.count === 1 ? 'conversión' : 'conversiones' }}</span>
              </div>
              <div v-if="!crm.by_source?.length" class="text-caption text-grey-5">Sin conversiones este mes</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Set Goal Form -->
      <q-expansion-item icon="edit" label="Definir meta del mes" header-class="text-primary text-weight-medium">
        <q-card flat>
          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-4">
                <q-input v-model.number="form.target_revenue" type="number" filled dense label="Meta de ingresos" prefix="$" />
              </div>
              <div class="col-4">
                <q-input v-model.number="form.target_new_clients" type="number" filled dense label="Clientes nuevos" />
              </div>
              <div class="col-4">
                <q-input v-model.number="form.target_renewals" type="number" filled dense label="Renovaciones" />
              </div>
            </div>
            <q-btn unelevated no-caps color="primary" label="Guardar meta" icon="save" class="q-mt-md" @click="saveGoal" :loading="saving" />
          </q-card-section>
        </q-card>
      </q-expansion-item>

      <!-- History -->
      <div class="text-subtitle2 text-weight-bold q-mt-lg q-mb-sm">Historial</div>
      <!-- La lista de celular. Cuatro columnas de metas se leen mejor como un
           renglon por mes, con la de ingresos a la derecha y las otras dos debajo
           del mes. -->
      <div class="mc-lista" v-if="modoApp">
        <div v-for="h in history" :key="h.id" class="mc-lista__fila">
          <div class="mc-lista__txt">
            <div class="mc-lista__nom">
              {{ new Date(h.month).toLocaleDateString("es-MX", { month: "long", year: "numeric" }) }}
            </div>
            <div class="mc-lista__meta">
              {{ h.target_new_clients }} clientes · {{ h.target_renewals }} renovaciones
            </div>
          </div>
          <span class="mc-lista__monto">${{ formatNum(h.target_revenue) }}</span>
        </div>

        <div v-if="!history.length" class="mc-lista__vacio">Sin historial.</div>
      </div>

      <q-table v-if="!modoApp" flat :rows="history" :columns="historyColumns" row-key="id" no-data-label="Sin historial" class="mc-inner-table" />
    </div>
  </q-card>
</template>

<script setup>
import { useModoApp } from "src/composables/useModoApp";
const { modoApp } = useModoApp();
defineOptions({ name: "SalesGoalsComponent" });
import { ref, computed, onMounted } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";

const adminStore = useAdminStore();
const goal = ref(null);
const actuals = ref({ revenue: 0, new_clients: 0, renewals: 0 });
const pipeline = ref({ value: 0, forecast: 0, by_stage: [], active_prospects: 0 });
const crm = ref({ conversions: 0, lost: 0, win_rate: 0, by_source: [] });
const history = ref([]);
const saving = ref(false);
const form = ref({ target_revenue: 0, target_new_clients: 0, target_renewals: 0 });

const currentMonthLabel = new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" });
const formatNum = (n) => Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 });
const stageLabel = (s) => ({ nuevo: "Nuevo", contactado: "Contactado", demo: "Demo", negociando: "Negociando" })[s] || s;
const stageColor = (s) => ({ nuevo: "blue", contactado: "cyan", demo: "purple", negociando: "orange" })[s] || "grey";
const sourceColor = (s) => ({ referido: "teal-3", redes: "blue-3", llamada: "orange-3", web: "purple-3", otro: "grey-4" })[s] || "grey-4";

const progress = (actual, target) => target > 0 ? Math.min(actual / target, 1.5) : 0;
const revenueProgress = computed(() => progress(actuals.value.revenue, goal.value?.target_revenue));
const clientsProgress = computed(() => progress(actuals.value.new_clients, goal.value?.target_new_clients));
const renewalsProgress = computed(() => progress(actuals.value.renewals, goal.value?.target_renewals));

const loadCurrent = async () => {
  try {
    const { data } = await api.get("/admin/sales-goals/current");
    goal.value = data.goal;
    actuals.value = data.actuals;
    pipeline.value = data.pipeline || pipeline.value;
    crm.value = data.crm || crm.value;
    if (data.goal) {
      form.value = { target_revenue: data.goal.target_revenue, target_new_clients: data.goal.target_new_clients, target_renewals: data.goal.target_renewals };
    }
  } catch (e) {}
};

const loadHistory = async () => {
  try {
    const { data } = await api.get("/admin/sales-goals");
    history.value = data.goals;
  } catch (e) {}
};

const saveGoal = async () => {
  saving.value = true;
  try {
    await api.post("/admin/sales-goals", { ...form.value, month: new Date().toISOString().slice(0, 10) });
    adminStore.messageStore.success("Meta guardada");
    loadCurrent();
  } catch (e) {
    adminStore.messageStore.error("Error al guardar meta");
  } finally {
    saving.value = false;
  }
};

onMounted(() => { loadCurrent(); loadHistory(); });

const historyColumns = [
  { name: "month", label: "Mes", align: "left", field: (r) => new Date(r.month).toLocaleDateString("es-MX", { month: "short", year: "numeric" }), sortable: true },
  { name: "target_revenue", label: "Meta ingresos", align: "right", field: (r) => "$" + formatNum(r.target_revenue) },
  { name: "target_new_clients", label: "Meta clientes", align: "center", field: "target_new_clients" },
  { name: "target_renewals", label: "Meta renovaciones", align: "center", field: "target_renewals" },
];
</script>

<style lang="scss" scoped>
.mc-goal-card { border-radius: 12px; transition: box-shadow 0.2s; &:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); } }
.mc-inner-table { box-shadow: none; background: transparent; }
.mc-forecast-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
</style>
