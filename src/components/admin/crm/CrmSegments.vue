<template>
  <div>
    <!-- Action buttons -->
    <div class="row q-gutter-sm q-mb-md">
      <q-btn unelevated no-caps color="blue" icon="download" label="Importar gratuitos" @click="importFree" :loading="importing" size="sm" />
      <q-btn unelevated no-caps color="teal" icon="refresh" label="Actualizar segmentos" @click="refreshSegments" :loading="refreshing" size="sm" />
    </div>

    <!-- Segment cards -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-6 col-md-3" v-for="seg in segments" :key="seg.value">
        <q-card flat bordered :class="['mc-segment-card cursor-pointer', selectedSegment === seg.value ? 'mc-segment-card--active' : '']"
          @click="selectSegment(seg.value)" :style="{ borderColor: selectedSegment === seg.value ? seg.color : '' }">
          <q-card-section class="text-center q-py-md">
            <q-icon :name="seg.icon" :color="seg.qcolor" size="28px" />
            <div class="text-h5 text-weight-bold q-mt-xs">{{ stats[seg.value] || 0 }}</div>
            <div class="text-caption text-grey-6">{{ seg.label }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Campaign button -->
    <div class="row items-center q-mb-md" v-if="selectedSegment">
      <q-chip :color="currentSeg?.qcolor" text-color="white" icon="filter_alt">
        {{ currentSeg?.label }}
      </q-chip>
      <q-space />
      <q-btn unelevated no-caps color="primary" icon="campaign" label="Enviar campaña a segmento" size="sm" @click="$emit('openCampaign', selectedSegment)" />
      <q-btn flat no-caps color="grey-6" label="Limpiar filtro" size="sm" class="q-ml-sm" @click="selectedSegment = null" />
    </div>

    <!-- Filtered prospects table -->
    <q-table flat :rows="filteredProspects" :columns="columns" row-key="id" no-data-label="Sin prospectos en este segmento"
      rows-per-page-label="Por página:" class="mc-inner-table" :loading="loading">
      <template v-slot:body="props">
        <q-tr :props="props" class="cursor-pointer" @click="$emit('openActivities', props.row)">
          <q-td key="business_name" :props="props">
            <span class="text-weight-medium">{{ props.row.business_name || '-' }}</span>
            <div class="text-caption text-grey-6">{{ props.row.name }}</div>
          </q-td>
          <q-td key="score" :props="props">
            <q-badge :color="scoreColor(props.row.engagement_score)" :label="props.row.engagement_score" />
          </q-td>
          <q-td key="phone" :props="props">{{ props.row.phone || '-' }}</q-td>
          <q-td key="email" :props="props">
            <span class="text-caption">{{ props.row.email || '-' }}</span>
          </q-td>
          <q-td key="notes" :props="props">
            <span class="text-caption text-grey-6" style="max-width:200px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ props.row.notes }}</span>
          </q-td>
          <q-td key="actions" :props="props">
            <q-btn v-if="props.row.phone" flat dense size="xs" icon="fab fa-whatsapp" color="green"
              @click.stop.prevent="$emit('whatsapp', props.row)"><q-tooltip>WhatsApp</q-tooltip></q-btn>
            <q-btn v-if="props.row.email" flat dense size="xs" icon="mail" color="teal"
              @click.stop="$emit('sendEmail', props.row)"><q-tooltip>Email</q-tooltip></q-btn>
            <q-btn flat dense size="xs" icon="phone_callback" color="blue"
              @click.stop="$emit('scheduleCall', props.row)"><q-tooltip>Agendar llamada</q-tooltip></q-btn>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script setup>
defineOptions({ name: "CrmSegments" });
import { ref, computed, onMounted } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";

const props = defineProps({ search: { type: String, default: "" } });
const emit = defineEmits(["openActivities", "openCampaign", "whatsapp", "sendEmail", "scheduleCall"]);
const adminStore = useAdminStore();

const stats = ref({});
const prospects = ref([]);
const selectedSegment = ref(null);
const loading = ref(false);
const importing = ref(false);
const refreshing = ref(false);

const segments = [
  { value: "pedidos_sin_pago", label: "Pedidos sin pago", icon: "local_fire_department", qcolor: "red", color: "#E53935" },
  { value: "menu_sin_pedidos", label: "Menú sin pedidos", icon: "restaurant_menu", qcolor: "orange", color: "#FB8C00" },
  { value: "sin_configurar", label: "Sin configurar", icon: "help_outline", qcolor: "blue", color: "#1976D2" },
  { value: "inactivo", label: "Inactivo", icon: "schedule", qcolor: "grey", color: "#9E9E9E" },
];

const currentSeg = computed(() => segments.find((s) => s.value === selectedSegment.value));

const filteredProspects = computed(() => {
  if (!props.search) return prospects.value;
  const q = props.search.toLowerCase();
  return prospects.value.filter((p) =>
    (p.name || "").toLowerCase().includes(q) ||
    (p.business_name || "").toLowerCase().includes(q) ||
    (p.phone || "").includes(q) ||
    (p.email || "").toLowerCase().includes(q)
  );
});
const scoreColor = (score) => score >= 60 ? "positive" : score >= 30 ? "warning" : "negative";

const loadStats = async () => {
  try {
    const { data } = await api.get("/admin/prospects/segment-stats");
    stats.value = data.stats;
  } catch (e) {}
};

const selectSegment = async (seg) => {
  selectedSegment.value = selectedSegment.value === seg ? null : seg;
  if (!selectedSegment.value) { prospects.value = []; return; }
  loading.value = true;
  try {
    const { data } = await api.get("/admin/prospects", { params: { segment: seg } });
    prospects.value = data.prospects?.data ?? data.prospects ?? [];
  } catch (e) {} finally { loading.value = false; }
};

const importFree = async () => {
  importing.value = true;
  try {
    const { data } = await api.post("/admin/prospects/import-free");
    adminStore.messageStore.success(`Importados: ${data.imported}, Ya existentes: ${data.skipped}`);
    loadStats();
    if (selectedSegment.value) selectSegment(selectedSegment.value);
  } catch (e) {
    adminStore.messageStore.error("Error al importar");
  } finally { importing.value = false; }
};

const refreshSegments = async () => {
  refreshing.value = true;
  try {
    const { data } = await api.post("/admin/prospects/refresh-segments");
    adminStore.messageStore.success(`Actualizados: ${data.updated}`);
    loadStats();
    if (selectedSegment.value) selectSegment(selectedSegment.value);
  } catch (e) {
    adminStore.messageStore.error("Error al actualizar");
  } finally { refreshing.value = false; }
};

onMounted(() => { loadStats(); });

const columns = [
  { name: "business_name", label: "Negocio", align: "left", field: "business_name", sortable: true },
  { name: "score", label: "Score", align: "center", field: "engagement_score", sortable: true },
  { name: "phone", label: "Teléfono", align: "left", field: "phone" },
  { name: "email", label: "Email", align: "left", field: "email" },
  { name: "notes", label: "Info", align: "left", field: "notes" },
  { name: "actions", label: "Acciones", align: "right" },
];
</script>

<style lang="scss" scoped>
.mc-segment-card {
  transition: all 0.2s; border: 2px solid transparent;
  &:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); transform: translateY(-2px); }
}
.mc-segment-card--active { box-shadow: 0 2px 12px rgba(0,0,0,0.15); }
.mc-inner-table { box-shadow: none; background: transparent; }
</style>
