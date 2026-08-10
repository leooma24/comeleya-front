<template>
  <q-card flat class="mc-admin-card">
    <div class="mc-admin-card__header">
      <div class="mc-admin-card__title">
        <q-icon name="health_and_safety" size="24px" color="primary" class="q-mr-sm" />
        Salud de clientes
      </div>
      <q-btn flat round dense icon="refresh" :loading="loading" @click="load" />
    </div>

    <!-- Filtros por estado -->
    <div class="mc-eh-filters">
      <q-chip
        v-for="s in filters"
        :key="s.value"
        clickable
        :selected="filter === s.value"
        :color="filter === s.value ? s.color : 'grey-3'"
        :text-color="filter === s.value ? 'white' : 'grey-8'"
        @click="filter = s.value"
      >
        {{ s.label }} ({{ counts[s.value] ?? 0 }})
      </q-chip>
    </div>

    <q-table
      flat
      :rows="filteredRows"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :pagination="{ rowsPerPage: 15, sortBy: 'orders_month', descending: false }"
      rows-per-page-label="Por página:"
      class="mc-inner-table"
      :filter="search"
    >
      <template v-slot:top-left>
        <q-input v-model="search" filled dense rounded debounce="300" placeholder="Buscar negocio..." style="min-width: 200px">
          <template v-slot:prepend><q-icon name="search" size="18px" color="grey-5" /></template>
        </q-input>
      </template>

      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="name" :props="props">
            <div class="text-weight-medium">{{ props.row.name }}</div>
            <div class="text-caption text-grey-6">{{ props.row.plan || 'Sin plan' }}</div>
          </q-td>
          <q-td key="state" :props="props">
            <q-chip dense size="sm" :color="stateMeta[props.row.state].color" text-color="white">
              {{ stateMeta[props.row.state].label }}
            </q-chip>
          </q-td>
          <q-td key="orders_month" :props="props">
            <span class="text-weight-bold">{{ props.row.orders_month }}</span>
          </q-td>
          <q-td key="last_order" :props="props">
            <span class="text-caption">{{ props.row.last_order_at ? timeAgo(props.row.last_order_at) : 'Nunca' }}</span>
          </q-td>
          <q-td key="photo_pct" :props="props">
            <div class="mc-eh-photo">
              <q-linear-progress :value="props.row.photo_pct / 100" size="8px" rounded :color="props.row.photo_pct >= 80 ? 'positive' : props.row.photo_pct >= 40 ? 'orange' : 'negative'" />
              <span class="text-caption">{{ props.row.photo_pct }}%</span>
            </div>
          </q-td>
          <q-td key="actions" :props="props">
            <q-btn flat dense round size="sm" icon="open_in_new" color="primary" @click="openPanel(props.row)">
              <q-tooltip>Abrir panel</q-tooltip>
            </q-btn>
            <q-btn v-if="props.row.phone" flat dense round size="sm" icon="fab fa-whatsapp" color="green" @click="contact(props.row)">
              <q-tooltip>Contactar</q-tooltip>
            </q-btn>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </q-card>
</template>

<script setup>
defineOptions({ name: "EstablishmentsHealth" });

import { ref, computed, onMounted } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";

const adminStore = useAdminStore();
const loading = ref(true);
const rows = ref([]);
const counts = ref({});
const filter = ref("all");
const search = ref("");

const filters = [
  { value: "all", label: "Todos", color: "primary" },
  { value: "en_riesgo", label: "En riesgo", color: "negative" },
  { value: "dormido", label: "Dormidos", color: "orange-8" },
  { value: "activo", label: "Activos", color: "positive" },
];
const stateMeta = {
  activo: { label: "Activo", color: "positive" },
  dormido: { label: "Dormido", color: "orange-8" },
  en_riesgo: { label: "En riesgo", color: "negative" },
};

const columns = [
  { name: "name", label: "Negocio", align: "left", field: "name", sortable: true },
  { name: "state", label: "Estado", align: "left", field: "state" },
  { name: "orders_month", label: "Pedidos (mes)", align: "center", field: "orders_month", sortable: true },
  { name: "last_order", label: "Última actividad", align: "left", field: "last_order_at", sortable: true },
  { name: "photo_pct", label: "Menú con foto", align: "left", field: "photo_pct", sortable: true },
  { name: "actions", label: "", align: "right" },
];

const filteredRows = computed(() =>
  filter.value === "all" ? rows.value : rows.value.filter((r) => r.state === filter.value)
);

const timeAgo = (d) => {
  const days = Math.floor((Date.now() - new Date(d)) / 86400000);
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 30) return `Hace ${days}d`;
  if (days < 365) return `Hace ${Math.floor(days / 30)} mes(es)`;
  return `Hace ${Math.floor(days / 365)} año(s)`;
};

const openPanel = (row) => window.open(`/${row.slug}/admin`, "_blank");
const contact = (row) => {
  const phone = (row.phone || "").replace(/\D/g, "");
  const normalized = phone.length === 10 ? "52" + phone : phone;
  const msg = encodeURIComponent(`Hola ${row.name}, te saludamos de ComeleYa. ¿Cómo va todo con tu menú?`);
  window.open(`https://wa.me/${normalized}?text=${msg}`, "_blank");
};

const load = async () => {
  loading.value = true;
  try {
    const { data } = await api.get("/admin/super/establishments-health");
    rows.value = data.establishments || [];
    counts.value = data.counts || {};
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>

<style lang="scss" scoped>
.mc-eh-filters {
  display: flex; flex-wrap: wrap; gap: 6px;
  padding: 0 var(--space-lg) var(--space-sm);
}
.mc-eh-photo {
  display: flex; align-items: center; gap: 8px;
  min-width: 110px;
  .q-linear-progress { flex: 1; }
}
</style>
