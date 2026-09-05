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
      class="mc-inner-table mc-tabla-apilada"
      :filter="search"
    >
      <template v-slot:top-left>
        <q-input v-model="search" filled dense rounded debounce="300" placeholder="Buscar negocio..." style="min-width: 200px">
          <template v-slot:prepend><q-icon name="search" size="18px" color="grey-5" /></template>
        </q-input>
      </template>

      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="name" data-label="Negocio" :props="props">
            <div class="text-weight-medium">{{ props.row.name }}</div>
            <div class="text-caption text-grey-6">{{ props.row.plan || 'Sin plan' }}</div>
          </q-td>
          <q-td key="state" data-label="Estado" :props="props">
            <q-chip dense size="sm" :color="stateMeta[props.row.state].color" text-color="white">
              {{ stateMeta[props.row.state].label }}
            </q-chip>
          </q-td>
          <!-- Lo unico que hay que resolver para que ese negocio pueda estrenarse.
               Con esto la lista deja de ser un tablero y pasa a ser una lista de
               llamadas: a cada uno se le sabe que pedirle antes de marcar. -->
          <q-td key="falta" data-label="Para poder vender" :props="props">
            <div class="mc-eh-falta">
              <q-chip
                v-if="props.row.puede_vender"
                dense size="sm" color="positive" text-color="white" label="Ya puede vender"
              />
              <q-chip
                v-for="f in props.row.falta"
                :key="f"
                dense size="sm" color="grey-3" text-color="grey-9"
                :label="ETIQUETA_FALTA[f] || f"
              />
              <q-chip
                v-if="props.row.numero_por_confirmar"
                dense size="sm" color="orange-8" text-color="white" label="número sin confirmar"
              >
                <q-tooltip>
                  No tiene WhatsApp aparte: los pedidos le llegarían a su teléfono, y
                  nadie ha comprobado que ese número reciba WhatsApp
                </q-tooltip>
              </q-chip>
              <q-btn
                v-if="props.row.phone"
                flat dense round size="sm" color="green-7" icon="fab fa-whatsapp"
                @click="escribirle(props.row)"
              >
                <q-tooltip>Escribirle al dueño</q-tooltip>
              </q-btn>
            </div>
          </q-td>

          <q-td key="orders_month" data-label="Pedidos (mes)" :props="props">
            <span class="text-weight-bold">{{ props.row.orders_month }}</span>
          </q-td>
          <q-td key="last_order" data-label="Última actividad" :props="props">
            <span class="text-caption">{{ props.row.last_order_at ? timeAgo(props.row.last_order_at) : 'Nunca' }}</span>
          </q-td>
          <q-td key="photo_pct" data-label="Menú con foto" :props="props">
            <div class="mc-eh-photo">
              <q-linear-progress :value="props.row.photo_pct / 100" size="8px" rounded :color="props.row.photo_pct >= 80 ? 'positive' : props.row.photo_pct >= 40 ? 'orange' : 'negative'" />
              <span class="text-caption">{{ props.row.photo_pct }}%</span>
            </div>
          </q-td>
          <!-- Cero ofertas no es un número neutro: significa que a los clientes de
               ese negocio NUNCA les aparece el bloque de arriba del menú. -->
          <q-td key="offers" data-label="Ofertas" :props="props">
            <q-chip
              v-if="props.row.offers"
              dense size="sm" color="red-6" text-color="white"
              :label="props.row.offers"
            />
            <span v-else class="text-caption text-grey-5">
              ninguna
              <q-tooltip>Su menú nunca enseña el bloque "Ofertas del día"</q-tooltip>
            </span>
          </q-td>

          <!-- El 100% es la señal: marcar todo es igual que no marcar nada, y ahí el
               carrusel repite la carta completa. -->
          <q-td key="featured_pct" data-label="Destacados" :props="props">
            <span v-if="!props.row.featured" class="text-caption text-grey-5">ninguno</span>
            <q-chip
              v-else-if="props.row.featured_pct >= 100"
              dense size="sm" color="negative" text-color="white"
              label="todo el menú"
            >
              <q-tooltip>
                Los {{ props.row.featured }} platillos están marcados: "Recomendados"
                repite la carta completa
              </q-tooltip>
            </q-chip>
            <span v-else class="text-caption">
              {{ props.row.featured }} ({{ props.row.featured_pct }}%)
            </span>
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
  // Los que nunca han recibido un pedido van primero: es el grupo mas grande y el
  // que se trabaja distinto -no hay que recuperarlos, hay que estrenarlos-.
  { value: "sin_estrenar", label: "Sin estrenar", color: "indigo-7" },
  { value: "listos", label: "Listos para vender", color: "positive" },
  { value: "por_confirmar", label: "Número por confirmar", color: "orange-8" },
  { value: "en_riesgo", label: "En riesgo", color: "negative" },
  { value: "dormido", label: "Dormidos", color: "orange-8" },
  { value: "activo", label: "Activos", color: "positive" },
];
const stateMeta = {
  sin_estrenar: { label: "Sin estrenar", color: "indigo-7" },
  activo: { label: "Activo", color: "positive" },
  dormido: { label: "Dormido", color: "orange-8" },
  en_riesgo: { label: "En riesgo", color: "negative" },
};

const columns = [
  { name: "name", label: "Negocio", align: "left", field: "name", sortable: true },
  { name: "state", label: "Estado", align: "left", field: "state" },
  { name: "falta", label: "Para poder vender", align: "left", field: "falta" },
  { name: "orders_month", label: "Pedidos (mes)", align: "center", field: "orders_month", sortable: true },
  { name: "last_order", label: "Última actividad", align: "left", field: "last_order_at", sortable: true },
  { name: "photo_pct", label: "Menú con foto", align: "left", field: "photo_pct", sortable: true },
  // Adopción: qué funciones está usando de verdad. Ninguna de las dos se notaba, y
  // por eso ninguno de los negocios tenía ofertas y casi todos tenían el menú
  // completo marcado como "Recomendado".
  { name: "offers", label: "Ofertas", align: "center", field: "offers", sortable: true },
  { name: "featured_pct", label: "Destacados", align: "center", field: "featured_pct", sortable: true },
  { name: "actions", label: "", align: "right" },
];

/** Como se lee cada carencia en la lista de llamadas. */
const ETIQUETA_FALTA = {
  numero: "falta número",
  platillos: "sin menú",
  fotos: "sin fotos",
};

/**
 * Escribirle al dueño desde aquí, con el mensaje ya empezado.
 *
 * La campaña se cae en el paso mas tonto: buscar el numero, abrir WhatsApp, acordarse
 * de que le falta a ESE negocio. Aqui sale todo junto.
 */
const escribirle = (row) => {
  const n = (row.phone || "").replace(/\D/g, "");
  if (!n) return;
  const conLada = n.length === 10 ? "52" + n : n;
  const liga = `https://comeleya.com/${row.slug}`;

  const texto = row.puede_vender
    ? `Hola, le hablo de ComeleYa. Su menú de ${row.name} ya está listo para recibir pedidos en línea: ${liga}

¿Le muestro cómo le llegan al WhatsApp?`
    : `Hola, le hablo de ComeleYa. Para que ${row.name} pueda recibir pedidos por el menú solo falta ${row.falta.map((f) => ETIQUETA_FALTA[f] || f).join(" y ")}.

¿Se lo dejo listo?`;

  window.open(`https://wa.me/${conLada}?text=${encodeURIComponent(texto)}`, "_blank");
};

const filteredRows = computed(() => {
  const f = filter.value;
  if (f === "all") return rows.value;
  // Dos filtros son cortes, no estados: los que ya podrian vender y no lo saben, y
  // aquellos a los que les mandariamos los pedidos a un numero sin confirmar.
  if (f === "listos") {
    return rows.value.filter((r) => r.state === "sin_estrenar" && r.puede_vender);
  }
  if (f === "por_confirmar") return rows.value.filter((r) => r.numero_por_confirmar);
  return rows.value.filter((r) => r.state === f);
});

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
