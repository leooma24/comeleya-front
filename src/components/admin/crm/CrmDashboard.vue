<template>
  <div>
    <!-- KPI Cards -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-6 col-md-3">
        <q-card flat bordered class="mc-kpi-card mc-kpi-card--danger">
          <q-card-section class="text-center q-py-md">
            <q-icon name="warning" size="28px" color="negative" />
            <div class="text-h4 text-weight-bold text-negative q-mt-xs">{{ data.counts?.overdue || 0 }}</div>
            <div class="text-caption text-grey-6">Seguimientos vencidos</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="mc-kpi-card">
          <q-card-section class="text-center q-py-md">
            <q-icon name="today" size="28px" color="primary" />
            <div class="text-h4 text-weight-bold text-primary q-mt-xs">{{ data.counts?.today || 0 }}</div>
            <div class="text-caption text-grey-6">Para hoy</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="mc-kpi-card">
          <q-card-section class="text-center q-py-md">
            <q-icon name="hourglass_empty" size="28px" color="orange" />
            <div class="text-h4 text-weight-bold text-orange q-mt-xs">{{ data.counts?.stale || 0 }}</div>
            <div class="text-caption text-grey-6">Sin actividad +3 dias</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="mc-kpi-card">
          <q-card-section class="text-center q-py-md">
            <q-icon name="attach_money" size="28px" color="teal" />
            <div class="text-h4 text-weight-bold text-teal q-mt-xs">${{ formatNum(data.pipeline_value) }}</div>
            <div class="text-caption text-grey-6">Pipeline</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Overdue section -->
    <div v-if="data.overdue?.length" class="q-mb-lg">
      <div class="text-subtitle1 text-weight-bold text-negative q-mb-sm">
        <q-icon name="warning" class="q-mr-xs" /> Seguimientos vencidos
      </div>
      <q-card v-for="p in data.overdue" :key="p.id" flat bordered class="mc-dash-card mc-dash-card--overdue q-mb-xs cursor-pointer" @click="$emit('openActivities', p)">
        <q-card-section class="q-py-sm row items-center no-wrap">
          <q-avatar size="32px" color="negative" text-color="white" class="q-mr-md">{{ initial(p) }}</q-avatar>
          <div class="col">
            <div class="text-weight-bold text-body2">{{ p.business_name || p.name }}</div>
            <div class="text-caption text-grey-6">{{ p.name }} · {{ p.phone || 'Sin tel.' }}</div>
          </div>
          <div class="text-right">
            <div class="text-caption text-negative text-weight-bold">Vencio {{ timeAgo(p.next_contact_at) }}</div>
            <q-btn flat dense size="xs" icon="fab fa-whatsapp" color="green" @click.stop="$emit('whatsapp', p)" v-if="p.phone" />
            <q-btn flat dense size="xs" icon="phone" color="blue" @click.stop="$emit('openActivities', p)" />
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Today section -->
    <div v-if="data.today?.length" class="q-mb-lg">
      <div class="text-subtitle1 text-weight-bold text-primary q-mb-sm">
        <q-icon name="today" class="q-mr-xs" /> Para hoy
      </div>
      <q-card v-for="p in data.today" :key="p.id" flat bordered class="mc-dash-card q-mb-xs cursor-pointer" @click="$emit('openActivities', p)">
        <q-card-section class="q-py-sm row items-center no-wrap">
          <q-avatar size="32px" color="primary" text-color="white" class="q-mr-md">{{ initial(p) }}</q-avatar>
          <div class="col">
            <div class="text-weight-bold text-body2">{{ p.business_name || p.name }}</div>
            <div class="text-caption text-grey-6">{{ p.name }} · {{ p.phone || 'Sin tel.' }}</div>
          </div>
          <div class="text-right">
            <q-btn flat dense size="xs" icon="fab fa-whatsapp" color="green" @click.stop="$emit('whatsapp', p)" v-if="p.phone" />
            <q-btn flat dense size="xs" icon="mail" color="teal" @click.stop="$emit('sendEmail', p)" v-if="p.email" />
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Stale section -->
    <div v-if="data.stale?.length" class="q-mb-lg">
      <div class="text-subtitle1 text-weight-bold text-orange q-mb-sm">
        <q-icon name="hourglass_empty" class="q-mr-xs" /> Sin actividad reciente
      </div>
      <q-card v-for="p in data.stale" :key="p.id" flat bordered class="mc-dash-card q-mb-xs cursor-pointer" @click="$emit('openActivities', p)">
        <q-card-section class="q-py-sm row items-center no-wrap">
          <q-avatar size="32px" color="orange" text-color="white" class="q-mr-md">{{ initial(p) }}</q-avatar>
          <div class="col">
            <div class="text-weight-bold text-body2">{{ p.business_name || p.name }}</div>
            <div class="text-caption text-grey-6">{{ p.name }}</div>
          </div>
          <div class="text-right">
            <div class="text-caption text-orange">{{ p.days_without_activity }}d sin contacto</div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Recent wins -->
    <div v-if="data.recent_wins?.length" class="q-mb-lg">
      <div class="text-subtitle1 text-weight-bold text-positive q-mb-sm">
        <q-icon name="emoji_events" class="q-mr-xs" /> Conversiones recientes
      </div>
      <q-card v-for="p in data.recent_wins" :key="p.id" flat bordered class="mc-dash-card mc-dash-card--win q-mb-xs">
        <q-card-section class="q-py-sm row items-center no-wrap">
          <q-avatar size="32px" color="positive" text-color="white" class="q-mr-md">{{ initial(p) }}</q-avatar>
          <div class="col">
            <div class="text-weight-bold text-body2">{{ p.business_name || p.name }}</div>
          </div>
          <div class="text-caption text-grey-6">{{ timeAgo(p.updated_at) }}</div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Empty state -->
    <div v-if="!loading && !data.overdue?.length && !data.today?.length && !data.stale?.length" class="text-center q-py-xl">
      <q-icon name="check_circle" size="64px" color="positive" />
      <h6 class="q-mt-md text-grey-7">Todo al dia</h6>
      <p class="text-grey-5">No tienes seguimientos pendientes.</p>
    </div>

    <div v-if="loading" class="text-center q-py-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: "CrmDashboard" });
import { ref, onMounted } from "vue";
import { api } from "boot/axios";

const emit = defineEmits(["openActivities", "whatsapp", "sendEmail"]);

const data = ref({});
const loading = ref(true);

const initial = (p) => ((p.business_name || p.name || "?").charAt(0).toUpperCase());
const formatNum = (n) => n ? Number(n).toLocaleString("es-MX") : "0";
const timeAgo = (d) => {
  if (!d) return "";
  const mins = Math.floor((Date.now() - new Date(d)) / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
};

onMounted(async () => {
  try {
    const { data: res } = await api.get("/admin/prospects/dashboard");
    data.value = res;
  } catch (e) {} finally { loading.value = false; }
});
</script>

<style lang="scss" scoped>
.mc-kpi-card {
  border-radius: 12px;
  transition: all 0.2s;
  &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
  &--danger { border-left: 4px solid var(--q-negative); }
}
.mc-dash-card {
  border-radius: 10px;
  transition: all 0.15s;
  &:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
  &--overdue { border-left: 3px solid var(--q-negative); }
  &--win { border-left: 3px solid var(--q-positive); }
}
</style>
