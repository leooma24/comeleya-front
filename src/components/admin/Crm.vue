<template>
  <q-card flat class="mc-admin-card">
    <div class="mc-admin-card__header">
      <div class="mc-admin-card__title">
        <q-icon name="people" size="24px" color="primary" class="q-mr-sm" />
        CRM — Pipeline de Ventas
      </div>
      <div class="row items-center q-gutter-sm">
        <q-input
          v-model="search"
          filled
          dense
          rounded
          debounce="300"
          placeholder="Buscar prospecto..."
          class="mc-admin-search"
        >
          <template v-slot:prepend>
            <q-icon name="search" size="18px" color="grey-5" />
          </template>
          <template v-slot:append v-if="search">
            <q-icon name="close" size="16px" color="grey-5" class="cursor-pointer" @click="search = ''" />
          </template>
        </q-input>
        <q-btn-toggle v-model="view" no-caps dense unelevated toggle-color="primary"
          :options="[
            { label: 'Hoy', value: 'dashboard' },
            { label: 'Pipeline', value: 'pipeline' },
            { label: 'Lista', value: 'list' },
            { label: 'Funnel', value: 'funnel' },
            { label: 'Segmentos', value: 'segments' },
          ]" />
        <q-btn unelevated color="primary" icon="add" no-caps label="Nuevo prospecto" class="mc-admin-add-btn" @click="adminStore.addProspect" />
      </div>
    </div>

    <!-- Stats chips -->
    <div class="mc-crm-stats q-px-md q-pb-md">
      <q-chip v-for="(count, status) in stats" :key="status" :color="statusColor(status)" text-color="white" dense>
        {{ statusLabel(status) }}: {{ count }}
      </q-chip>
    </div>

    <!-- Dashboard View (Hoy) -->
    <div v-if="view === 'dashboard'" class="q-pa-md">
      <CrmDashboard
        @openActivities="openActivities"
        @whatsapp="openWhatsApp"
        @sendEmail="sendQuickEmail"
      />
    </div>

    <!-- Funnel View -->
    <div v-if="view === 'funnel'" class="q-pa-md">
      <CrmFunnel />
    </div>

    <!-- Pipeline View -->
    <div v-if="view === 'pipeline'" class="mc-pipeline">
      <div class="mc-pipeline-col" v-for="stage in stages" :key="stage.value">
        <div class="mc-pipeline-header" :style="{ borderColor: stageColor(stage.value) }">
          {{ stage.label }}
          <q-badge :color="stageColor(stage.value)" :label="prospectsByStatus(stage.value).length" />
        </div>
        <div class="mc-pipeline-cards">
          <div
            v-for="p in prospectsByStatus(stage.value)"
            :key="p.id"
            class="mc-prospect-card"
            @click="openActivities(p)"
          >
            <!-- Header -->
            <div class="mc-prospect-card__header">
              <q-avatar size="32px" :color="stageColor(stage.value)" text-color="white" class="mc-prospect-card__avatar">
                {{ (p.business_name || p.name || '?').charAt(0).toUpperCase() }}
              </q-avatar>
              <div class="mc-prospect-card__title">
                <div class="mc-prospect-card__name">{{ p.business_name || p.name }}</div>
                <div class="mc-prospect-card__contact">{{ p.name }}</div>
              </div>
              <div class="row items-center q-gutter-xs">
                <q-chip dense size="xs" :color="sourceColor(p.source)">{{ p.source }}</q-chip>
                <q-chip v-for="tag in (p.tags || []).slice(0, 2)" :key="tag" dense size="xs" color="grey-3" text-color="grey-8">{{ tag }}</q-chip>
              </div>
            </div>

            <!-- Info rows -->
            <div class="mc-prospect-card__body">
              <div class="mc-prospect-card__row" v-if="p.phone">
                <q-icon name="phone" size="13px" color="grey-5" />
                <span>{{ p.phone }}</span>
              </div>
              <div class="mc-prospect-card__row" v-if="p.email">
                <q-icon name="mail" size="13px" color="grey-5" />
                <span>{{ p.email }}</span>
              </div>
              <div class="mc-prospect-card__row" v-if="p.deal_value > 0">
                <q-icon name="attach_money" size="13px" color="teal" />
                <span class="text-teal text-weight-bold">${{ Number(p.deal_value).toLocaleString("es-MX") }}/mes</span>
              </div>
              <div class="mc-prospect-card__row" v-if="p.next_contact_at" :class="isOverdue(p.next_contact_at) ? 'mc-prospect-card__row--overdue' : ''">
                <q-icon :name="isOverdue(p.next_contact_at) ? 'warning' : 'event'" size="13px" />
                <span>{{ formatDate(p.next_contact_at) }}</span>
              </div>
              <div class="mc-prospect-card__row mc-prospect-card__row--activity" v-if="lastActivity(p)">
                <q-icon :name="activityIcon(lastActivity(p).type)" size="13px" :color="activityColor(lastActivity(p).type)" />
                <span>{{ timeAgo(lastActivity(p).created_at) }} — {{ lastActivity(p).type }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="mc-prospect-card__actions">
              <q-btn v-if="p.phone" flat dense round size="xs" icon="fab fa-whatsapp" color="green" @click.stop="openWhatsApp(p)">
                <q-tooltip>WhatsApp</q-tooltip>
              </q-btn>
              <q-btn v-if="p.email" flat dense round size="xs" icon="mail" color="teal" @click.stop="sendQuickEmail(p)">
                <q-tooltip>Email</q-tooltip>
              </q-btn>
              <q-space />
              <q-btn flat dense round size="xs" icon="edit" color="grey-6" @click.stop="adminStore.editProspect(p)">
                <q-tooltip>Editar</q-tooltip>
              </q-btn>
              <q-btn flat dense round size="xs" icon="history" color="primary" @click.stop="openActivities(p)">
                <q-tooltip>Actividades</q-tooltip>
              </q-btn>
              <q-btn flat dense round size="xs" icon="arrow_forward" color="grey-6" @click.stop>
                <q-tooltip>Mover a...</q-tooltip>
                <q-menu auto-close>
                  <q-list dense style="min-width: 160px">
                    <q-item-label header class="text-caption text-grey-6" style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em">Mover a</q-item-label>
                    <q-item
                      v-for="s in stages.filter(s => s.value !== p.status)"
                      :key="s.value"
                      clickable
                      @click="moveProspect(p, s.value)"
                    >
                      <q-item-section avatar>
                        <q-icon name="circle" :color="stageColor(s.value)" size="10px" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-body2">{{ s.label }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
              <q-btn flat dense round size="xs" icon="check_circle" color="positive" v-if="!['cerrado_ganado','cerrado_perdido'].includes(p.status)" @click.stop="convertDialog(p)">
                <q-tooltip>Convertir</q-tooltip>
              </q-btn>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- List View -->
    <q-table v-else-if="view === 'list'" flat :rows="filteredProspects" :columns="columns" row-key="id"
      no-data-label="Sin prospectos" rows-per-page-label="Por pagina:" class="mc-inner-table"
    >
      <template v-slot:body="props">
        <q-tr :props="props" class="cursor-pointer" @click="openActivities(props.row)">
          <q-td key="business_name" :props="props">
            <span class="text-weight-medium">{{ props.row.business_name || '-' }}</span>
            <div class="text-caption text-grey-6">{{ props.row.name }}</div>
          </q-td>
          <q-td key="phone" :props="props">
            <span class="text-caption">{{ props.row.phone || '-' }}</span>
          </q-td>
          <q-td key="email" :props="props">
            <span class="text-caption">{{ props.row.email || '-' }}</span>
          </q-td>
          <q-td key="deal_value" :props="props">
            <span v-if="props.row.deal_value > 0" class="text-teal text-weight-bold">${{ Number(props.row.deal_value).toLocaleString("es-MX") }}</span>
            <span v-else class="text-grey-5">-</span>
          </q-td>
          <q-td key="source" :props="props">
            <q-chip dense size="sm" :color="sourceColor(props.row.source)">{{ props.row.source }}</q-chip>
          </q-td>
          <q-td key="tags" :props="props">
            <q-chip v-for="tag in (props.row.tags || []).slice(0, 3)" :key="tag" dense size="xs" color="grey-3" text-color="grey-8">{{ tag }}</q-chip>
            <span v-if="!(props.row.tags || []).length" class="text-grey-5">-</span>
          </q-td>
          <q-td key="status" :props="props">
            <q-chip dense size="sm" :color="statusColor(props.row.status)" text-color="white">{{ statusLabel(props.row.status) }}</q-chip>
          </q-td>
          <q-td key="last_activity" :props="props">
            <template v-if="lastActivity(props.row)">
              <q-icon :name="activityIcon(lastActivity(props.row).type)" size="14px" :color="activityColor(lastActivity(props.row).type)" class="q-mr-xs" />
              <span class="text-caption">{{ timeAgo(lastActivity(props.row).created_at) }}</span>
            </template>
            <span v-else class="text-grey-5">-</span>
          </q-td>
          <q-td key="next_contact_at" :props="props">
            <span :class="isOverdue(props.row.next_contact_at) ? 'text-negative text-weight-bold' : ''">
              {{ props.row.next_contact_at ? formatDate(props.row.next_contact_at) : '-' }}
            </span>
          </q-td>
          <q-td key="actions" :props="props">
            <q-btn v-if="props.row.phone" flat size="sm" dense round icon="fab fa-whatsapp" color="green" @click.stop="openWhatsApp(props.row)">
              <q-tooltip>WhatsApp</q-tooltip>
            </q-btn>
            <q-btn v-if="props.row.email" flat size="sm" dense round icon="mail" color="teal" @click.stop="sendQuickEmail(props.row)">
              <q-tooltip>Email</q-tooltip>
            </q-btn>
            <q-btn flat size="sm" dense round icon="edit" color="grey-6" @click.stop="adminStore.editProspect(props.row)">
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
            <q-btn flat size="sm" dense round icon="history" color="primary" @click.stop="openActivities(props.row)">
              <q-tooltip>Actividades</q-tooltip>
            </q-btn>
            <q-btn flat size="sm" dense round icon="delete_outline" color="negative" @click.stop="deleteProspect(props.row)">
              <q-tooltip>Eliminar</q-tooltip>
            </q-btn>
          </q-td>
        </q-tr>
      </template>
    </q-table>

    <!-- Segments View -->
    <CrmSegments v-if="view === 'segments'"
      :search="search"
      @openActivities="openActivities"
      @openCampaign="openCampaign"
      @whatsapp="openWhatsApp"
      @sendEmail="sendQuickEmail"
      @scheduleCall="scheduleCall"
    />

    <!-- Campaign Dialog -->
    <CrmCampaignDialog v-model="showCampaign" :initial-segment="campaignSegment" />

    <!-- Convert Dialog -->
    <q-dialog v-model="showConvert">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Convertir a cliente</div>
          <div class="text-caption text-grey-6">{{ convertingProspect?.business_name || convertingProspect?.name }}</div>
        </q-card-section>
        <q-card-section>
          <q-select v-model="convertForm.package_id" :options="packageOptions" emit-value map-options filled dense label="Paquete" class="q-mb-md" />
          <q-select v-model="convertForm.type" :options="[{label:'Mensual',value:'monthly'},{label:'Anual',value:'yearly'}]" emit-value map-options filled dense label="Tipo de suscripcion" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancelar" v-close-popup />
          <q-btn unelevated no-caps color="positive" label="Convertir" icon="check" @click="doConvert" :loading="converting" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- Loss Reason Dialog -->
    <q-dialog v-model="showLossDialog">
      <q-card style="min-width: 360px; border-radius: 16px">
        <q-card-section>
          <div class="text-h6">Razon de perdida</div>
          <div class="text-caption text-grey-6">{{ losingProspect?.business_name || losingProspect?.name }}</div>
        </q-card-section>
        <q-card-section>
          <q-select
            v-model="lossReason"
            filled
            dense
            label="Selecciona una razon"
            :options="lossReasons"
            class="q-mb-md"
          />
          <q-input
            v-if="lossReason === 'Otra razon'"
            v-model="lossReasonCustom"
            filled
            dense
            label="Especifica la razon"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancelar" v-close-popup />
          <q-btn unelevated no-caps color="negative" label="Marcar como perdido" @click="confirmLoss" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-card>

  <FormDrawer />
  <ActivityDrawer />
</template>

<script setup>
defineOptions({ name: "CrmComponent" });
import { ref, computed, onMounted } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";
import { useConfirmDialog } from "src/composables/useConfirmDialog";
import FormDrawer from "./crm/FormDrawer.vue";
import ActivityDrawer from "./crm/ActivityDrawer.vue";
import CrmSegments from "./crm/CrmSegments.vue";
import CrmCampaignDialog from "./crm/CrmCampaignDialog.vue";
import CrmDashboard from "./crm/CrmDashboard.vue";
import CrmFunnel from "./crm/CrmFunnel.vue";

const adminStore = useAdminStore();
const { confirmDelete } = useConfirmDialog();

const view = ref("dashboard");
const search = ref("");
const filter = ref("");
const stats = ref({});
const showConvert = ref(false);
const convertingProspect = ref(null);
const converting = ref(false);
const convertForm = ref({ package_id: null, type: "monthly" });

const stages = [
  { label: "Nuevo", value: "nuevo" },
  { label: "Contactado", value: "contactado" },
  { label: "Demo", value: "demo" },
  { label: "Negociando", value: "negociando" },
  { label: "Ganado", value: "cerrado_ganado" },
  { label: "Perdido", value: "cerrado_perdido" },
];

const packageOptions = computed(() =>
  adminStore.packages.map((p) => ({ label: `${p.name} ($${p.monthly_price}/mes)`, value: p.id }))
);

const filteredProspects = computed(() => {
  if (!search.value) return adminStore.prospects;
  const q = search.value.toLowerCase();
  return adminStore.prospects.filter((p) =>
    (p.name || "").toLowerCase().includes(q) ||
    (p.business_name || "").toLowerCase().includes(q) ||
    (p.phone || "").includes(q) ||
    (p.email || "").toLowerCase().includes(q)
  );
});

const prospectsByStatus = (status) => filteredProspects.value.filter((p) => p.status === status);

const statusColor = (s) => ({ nuevo: "blue", contactado: "cyan", demo: "purple", negociando: "orange", cerrado_ganado: "positive", cerrado_perdido: "grey" })[s] || "grey";
const stageColor = (s) => statusColor(s);
const statusLabel = (s) => ({ nuevo: "Nuevo", contactado: "Contactado", demo: "Demo", negociando: "Negociando", cerrado_ganado: "Ganado", cerrado_perdido: "Perdido" })[s] || s;
const sourceColor = (s) => ({ referido: "teal-3", redes: "blue-3", llamada: "orange-3", web: "purple-3", otro: "grey-4" })[s] || "grey-4";
const formatDate = (d) => d ? new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "short" }) : "";
const isOverdue = (d) => d && new Date(d) < new Date();

const lastActivity = (p) => p.activities?.length ? p.activities[0] : null;
const activityIcon = (type) => ({ llamada: "phone", email: "mail", whatsapp: "chat", nota: "note", demo: "slideshow", visita: "storefront" })[type] || "note";
const activityColor = (type) => ({ llamada: "blue", email: "teal", whatsapp: "green", nota: "grey", demo: "purple", visita: "orange" })[type] || "grey";
const timeAgo = (d) => {
  if (!d) return "";
  const mins = Math.floor((Date.now() - new Date(d)) / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `Hace ${days}d`;
  return new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
};

const openActivities = (p) => {
  adminStore.activeProspect = p;
  adminStore.activityDrawer = true;
};

const deleteProspect = (p) => confirmDelete("prospecto", () => adminStore.deleteProspect(p));

// Loss reason dialog
const showLossDialog = ref(false);
const losingProspect = ref(null);
const lossReason = ref("");
const lossReasonCustom = ref("");
const lossReasons = [
  "Muy caro",
  "Eligio la competencia",
  "No le intereso",
  "No contesto",
  "No tiene presupuesto",
  "Mala experiencia",
  "Otra razon",
];

const buildProspectPayload = (p, overrides = {}) => ({
  name: p.name || p.business_name || "Sin nombre",
  business_name: p.business_name || null,
  phone: p.phone || null,
  email: p.email || null,
  source: p.source || "otro",
  status: p.status,
  notes: p.notes || null,
  next_contact_at: p.next_contact_at || null,
  deal_value: p.deal_value != null ? Number(p.deal_value) : null,
  loss_reason: p.loss_reason || null,
  tags: Array.isArray(p.tags) ? p.tags : [],
  ...overrides,
});

const extractError = (e, fallback) => {
  const data = e.response?.data;
  if (data?.errors) {
    const first = Object.values(data.errors)[0];
    if (Array.isArray(first) && first.length) return first[0];
  }
  return data?.message || fallback;
};

const moveProspect = async (p, newStatus) => {
  // If closing as lost, ask for reason first
  if (newStatus === "cerrado_perdido") {
    losingProspect.value = p;
    lossReason.value = "";
    lossReasonCustom.value = "";
    showLossDialog.value = true;
    return;
  }

  try {
    const { data } = await api.put(
      `/admin/prospects/${p.id}`,
      buildProspectPayload(p, { status: newStatus })
    );
    adminStore.prospects = adminStore.prospects.map((pr) => pr.id === data.prospect.id ? data.prospect : pr);
    adminStore.messageStore.success(`Movido a ${statusLabel(newStatus)}`);
  } catch (e) {
    adminStore.messageStore.error(extractError(e, "Error al mover prospecto"));
  }
};

const confirmLoss = async () => {
  const reason = lossReason.value === "Otra razon" ? lossReasonCustom.value : lossReason.value;
  if (!reason) return adminStore.messageStore.error("Selecciona una razon");

  const p = losingProspect.value;
  try {
    const { data } = await api.put(
      `/admin/prospects/${p.id}`,
      buildProspectPayload(p, { status: "cerrado_perdido", loss_reason: reason })
    );
    adminStore.prospects = adminStore.prospects.map((pr) => pr.id === data.prospect.id ? data.prospect : pr);
    adminStore.messageStore.success("Prospecto marcado como perdido");
    showLossDialog.value = false;
  } catch (e) {
    adminStore.messageStore.error(extractError(e, "Error al actualizar"));
  }
};

// Campaign
const showCampaign = ref(false);
const campaignSegment = ref("");
const openCampaign = (segment) => { campaignSegment.value = segment; showCampaign.value = true; };

// Quick actions
const siteUrl = (slug) => slug ? `https://comeleya.com/${slug}` : "https://comeleya.com";

const buildWaMsg = (lines) => lines.join("\n");
const loginUrl = "https://comeleya.com/admin/iniciar-sesion";

const whatsappMessages = {
  pedidos_sin_pago: (n, email, url) => buildWaMsg([
    `Hola ${n}, ya tienes tu menu digital en ComeleYa! Tu usuario actual es: ${email}`,
    "",
    "Vimos que ya recibes pedidos, nos gustaria ayudarte a hacer crecer tu negocio.",
    `Inicia Sesion con tu cuenta en ${loginUrl}`,
    "",
    `Si deseas ver tu cuenta actual en linea visita: ${url}`,
  ]),
  menu_sin_pedidos: (n, email, url) => buildWaMsg([
    `Hola ${n}, ya tienes tu menu digital en ComeleYa! Tu usuario actual es: ${email}`,
    "",
    "Necesitas ayuda para empezar a recibir pedidos?",
    `Inicia Sesion con tu cuenta en ${loginUrl}`,
    "",
    `Si deseas ver tu cuenta actual en linea visita: ${url}`,
  ]),
  sin_configurar: (n, email, url) => buildWaMsg([
    `Hola ${n}, creaste tu cuenta en ComeleYa! Tu usuario actual es: ${email}`,
    "",
    "Aun no has configurado tu menu, te podemos ayudar a configurarlo en menos de 15 minutos.",
    `Inicia Sesion con tu cuenta en ${loginUrl}`,
    "",
    `Si deseas ver tu cuenta actual en linea visita: ${url}`,
  ]),
  inactivo: (n, email, url) => buildWaMsg([
    `Hola ${n}, hace tiempo que no te vemos en ComeleYa! Tu usuario actual es: ${email}`,
    "",
    "Te gustaria retomar? Tenemos una oferta especial para ti.",
    `Inicia Sesion con tu cuenta en ${loginUrl}`,
    "",
    `Si deseas ver tu cuenta actual en linea visita: ${url}`,
  ]),
};

const normalizePhone = (phone) => {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? "52" + digits : digits;
};

let waOpening = false;
const openWhatsApp = async (p) => {
  if (waOpening) return;
  waOpening = true;
  const phone = normalizePhone(p.phone);
  const name = p.name || p.business_name || "";
  const email = p.email || "";
  const url = siteUrl(p.establishment?.slug);
  const msg = (whatsappMessages[p.segment] || whatsappMessages.sin_configurar)(name, email, url);
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");

  // Log WhatsApp activity
  try {
    const { data } = await api.post(`/admin/prospects/${p.id}/activity`, {
      type: "whatsapp",
      description: `WhatsApp enviado a ${phone}`,
    });
    // Update prospect in list (may have auto-transitioned stage)
    if (data.prospect) {
      adminStore.prospects = adminStore.prospects.map((pr) => pr.id === data.prospect.id ? data.prospect : pr);
    }
  } catch (e) {
    console.warn("No se pudo registrar actividad de WhatsApp", e);
  }

  setTimeout(() => { waOpening = false; }, 1500);
};

const templateForSegment = (seg) => {
  const map = { pedidos_sin_pago: "orders_growing", menu_sin_pedidos: "menu_help", sin_configurar: "welcome_back", inactivo: "reactivation" };
  return map[seg] || "welcome_back";
};

const sendQuickEmail = async (p) => {
  if (!p.email) return adminStore.messageStore.error("Sin email");
  try {
    const { data } = await api.post(`/admin/prospects/${p.id}/send-email`, { template_key: templateForSegment(p.segment) });
    adminStore.messageStore.success("Email enviado a " + p.name);
    // Update prospect in list (may have auto-transitioned stage via activity)
    if (data.prospect) {
      adminStore.prospects = adminStore.prospects.map((pr) => pr.id === data.prospect.id ? data.prospect : pr);
    }
  } catch (e) {
    adminStore.messageStore.error(e.response?.data?.message || "Error al enviar");
  }
};

const scheduleCall = (p) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  adminStore.activeProspect = p;
  adminStore.activityDrawer = true;
};

const convertDialog = (p) => {
  convertingProspect.value = p;
  convertForm.value = { package_id: null, type: "monthly" };
  showConvert.value = true;
};

const doConvert = async () => {
  if (!convertForm.value.package_id) return adminStore.messageStore.error("Selecciona un paquete");
  converting.value = true;
  try {
    const { data } = await api.post(`/admin/prospects/${convertingProspect.value.id}/convert`, convertForm.value);
    adminStore.prospects = adminStore.prospects.map((p) => p.id === data.prospect.id ? data.prospect : p);
    adminStore.messageStore.success("Prospecto convertido a cliente");
    showConvert.value = false;
  } catch (e) {
    adminStore.messageStore.error(e.response?.data?.message || "Error al convertir");
  } finally {
    converting.value = false;
  }
};

const loadStats = async () => {
  try {
    const { data } = await api.get("/admin/prospects/stats");
    stats.value = data.stats;
  } catch (e) {
    console.warn("Error cargando stats", e);
  }
};

onMounted(() => {
  adminStore.getProspects();
  adminStore.getPackages();
  loadStats();
});

const columns = [
  { name: "business_name", label: "Negocio", align: "left", field: "business_name", sortable: true },
  { name: "phone", label: "Telefono", align: "left", field: "phone" },
  { name: "email", label: "Email", align: "left", field: "email" },
  { name: "deal_value", label: "Valor", align: "right", field: "deal_value", sortable: true },
  { name: "source", label: "Fuente", align: "center", field: "source", sortable: true },
  { name: "tags", label: "Tags", align: "left", field: "tags" },
  { name: "status", label: "Etapa", align: "center", field: "status", sortable: true },
  { name: "last_activity", label: "Ultima actividad", align: "center", field: (r) => r.activities?.[0]?.created_at, sortable: true },
  { name: "next_contact_at", label: "Prox. contacto", align: "center", field: "next_contact_at", sortable: true },
  { name: "actions", label: "Acciones", align: "right" },
];
</script>

<style lang="scss" scoped>
.mc-crm-stats { display: flex; flex-wrap: wrap; gap: 4px; }

.mc-pipeline {
  display: flex;
  gap: 14px;
  padding: 0 16px 16px;
  overflow-x: auto;
  min-height: 400px;
}

.mc-pipeline-col {
  flex: 1;
  min-width: 240px;
  max-width: 300px;
}

.mc-pipeline-header {
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 10px 14px;
  border-bottom: 3px solid;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--color-text-secondary);
}

.mc-pipeline-cards {
  max-height: 520px;
  overflow-y: auto;
  padding-right: 2px;
}

// --- Prospect Card ---
.mc-prospect-card {
  background: white;
  border: 1px solid var(--color-border, #e8e8e8);
  border-radius: 10px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    border-color: var(--color-border-hover, #d0d0d0);
    transform: translateY(-1px);
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px 8px;
  }

  &__avatar {
    font-size: 13px;
    font-weight: 700;
    flex-shrink: 0;
  }

  &__title {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-weight: 700;
    font-size: 13px;
    color: var(--color-text-primary, #1a1a1a);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__contact {
    font-size: 11px;
    color: var(--color-text-secondary, #888);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__source {
    flex-shrink: 0;
    font-size: 10px !important;
  }

  &__body {
    padding: 0 14px 8px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--color-text-secondary, #888);

    span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &--overdue {
      color: var(--q-negative, #c10015);
      font-weight: 600;
    }

    &--activity {
      padding-top: 2px;
      border-top: 1px dashed var(--color-border-subtle, #f0f0f0);
      margin-top: 2px;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    padding: 2px 6px 6px;
    gap: 2px;
    border-top: 1px solid var(--color-border-subtle, #f5f5f5);

    .q-btn {
      opacity: 0.6;
      transition: opacity 0.15s;
    }
  }

  &:hover &__actions .q-btn {
    opacity: 1;
  }
}

.mc-inner-table { box-shadow: none; background: transparent; :deep(.q-table__top) { display: none; } }
</style>
