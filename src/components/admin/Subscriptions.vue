<template>
  <q-card flat class="mc-admin-card">
    <div class="mc-admin-card__header">
      <div class="mc-admin-card__title">
        <q-icon name="credit_card" size="24px" color="primary" class="q-mr-sm" />
        Suscripciones
      </div>
    </div>

    <!-- KPIs -->
    <div class="row q-col-gutter-md q-pa-md">
      <div class="col-6 col-md-3">
        <q-card flat bordered><q-card-section class="text-center">
          <div class="text-caption text-grey-6">MRR</div>
          <div class="text-h6 text-weight-bold text-positive">${{ formatNum(overview.mrr) }}</div>
        </q-card-section></q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered><q-card-section class="text-center">
          <div class="text-caption text-grey-6">Clientes activos</div>
          <div class="text-h6 text-weight-bold">{{ overview.active_clients }}</div>
        </q-card-section></q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered><q-card-section class="text-center">
          <div class="text-caption text-grey-6">Churn</div>
          <div class="text-h6 text-weight-bold" :class="overview.churn_rate > 5 ? 'text-negative' : 'text-positive'">{{ overview.churn_rate }}%</div>
        </q-card-section></q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered><q-card-section class="text-center">
          <div class="text-caption text-grey-6">En pipeline</div>
          <div class="text-h6 text-weight-bold text-blue">{{ overview.pipeline_count }}</div>
        </q-card-section></q-card>
      </div>
    </div>

    <!-- Alerts -->
    <div class="q-px-md q-pb-sm" v-if="counts.expiring_7 || counts.expired">
      <q-banner v-if="counts.expired" rounded class="bg-red-1 text-negative q-mb-sm">
        <template v-slot:avatar><q-icon name="error" color="negative" /></template>
        {{ counts.expired }} suscripción(es) vencida(s)
      </q-banner>
      <q-banner v-if="counts.expiring_7" rounded class="bg-orange-1 text-warning q-mb-sm">
        <template v-slot:avatar><q-icon name="warning" color="warning" /></template>
        {{ counts.expiring_7 }} vencen esta semana
      </q-banner>
    </div>

    <!-- Subscription Table -->
    <q-table flat :grid="$q.screen.lt.md" :rows="subscriptions" :columns="columns" row-key="id" no-data-label="Sin suscripciones"
      rows-per-page-label="Por página:" class="mc-inner-table q-px-md"
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="establishment" :props="props">
            <span class="text-weight-medium">{{ props.row.establishment?.name }}</span>
          </q-td>
          <q-td key="package" :props="props">{{ props.row.package?.name }}</q-td>
          <q-td key="type" :props="props">
            <q-chip dense size="sm" :color="props.row.type === 'yearly' ? 'purple-2' : 'blue-2'">{{ props.row.type === 'yearly' ? 'Anual' : 'Mensual' }}</q-chip>
          </q-td>
          <q-td key="end_date" :props="props">
            {{ formatDate(props.row.end_date) }}
          </q-td>
          <q-td key="days_left" :props="props">
            <q-chip dense size="sm" :color="daysColor(daysLeft(props.row))" text-color="white">
              {{ daysLeft(props.row) > 0 ? daysLeft(props.row) + ' días' : 'Vencida' }}
            </q-chip>
          </q-td>
          <q-td key="actions" :props="props">
            <q-btn flat dense size="sm" icon="notifications" color="primary" @click="sendReminder(props.row)" :loading="remindingId === props.row.id">
              <q-tooltip>Enviar recordatorio</q-tooltip>
            </q-btn>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </q-card>
</template>

<script setup>
defineOptions({ name: "SubscriptionsComponent" });
import { ref, onMounted } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";
import { useQuasar } from "quasar";

const adminStore = useAdminStore();
const $q = useQuasar();
const overview = ref({ mrr: 0, active_clients: 0, churn_rate: 0, pipeline_count: 0 });
const subscriptions = ref([]);
const counts = ref({});
const remindingId = ref(null);

const formatNum = (n) => Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 });
const formatDate = (d) => d ? new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }) : "-";
const daysLeft = (sub) => {
  if (!sub.end_date) return 999;
  return Math.ceil((new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24));
};
const daysColor = (d) => d <= 0 ? "negative" : d <= 7 ? "warning" : d <= 15 ? "orange" : "positive";

const loadError = ref(false);

const loadOverview = async () => {
  try {
    const { data } = await api.get("/admin/super/overview");
    overview.value = data;
  } catch (e) {
    loadError.value = true;
    adminStore.messageStore.error("No se pudo cargar el resumen de suscripciones");
  }
};

const loadHealth = async () => {
  try {
    const { data } = await api.get("/admin/super/subscription-health");
    subscriptions.value = [...(data.expired || []), ...(data.expiring_7 || []), ...(data.expiring_15 || []), ...(data.expiring_30 || []), ...(data.all_active || [])];
    // Deduplicate by id
    const seen = new Set();
    subscriptions.value = subscriptions.value.filter((s) => { if (seen.has(s.id)) return false; seen.add(s.id); return true; });
    counts.value = data.counts;
  } catch (e) {
    loadError.value = true;
    adminStore.messageStore.error("No se pudo cargar la salud de suscripciones");
  }
};

const sendReminder = async (sub) => {
  remindingId.value = sub.id;
  try {
    const { data } = await api.post(`/admin/super/send-renewal/${sub.id}`);
    adminStore.messageStore.success(data.message);
  } catch (e) {
    adminStore.messageStore.error(e.response?.data?.message || "Error al enviar");
  } finally {
    remindingId.value = null;
  }
};

onMounted(() => { loadOverview(); loadHealth(); });

const columns = [
  { name: "establishment", label: "Establecimiento", align: "left", sortable: true },
  { name: "package", label: "Paquete", align: "left" },
  { name: "type", label: "Tipo", align: "center" },
  { name: "end_date", label: "Vence", align: "center", sortable: true },
  { name: "days_left", label: "Días restantes", align: "center", sortable: true },
  { name: "actions", label: "", align: "right" },
];
</script>

<style lang="scss" scoped>
.mc-inner-table { box-shadow: none; background: transparent; }
</style>
