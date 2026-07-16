<template>
  <q-drawer v-model="adminStore.activityDrawer" side="right" :width="420" bordered overlay>
    <div class="q-pa-md">
      <div class="row items-center justify-between q-mb-md">
        <div class="text-h6">Actividades — {{ adminStore.activeProspect?.name }}</div>
        <q-btn flat round dense icon="close" @click="adminStore.activityDrawer = false" />
      </div>

      <!-- Establishment context -->
      <q-card v-if="adminStore.activeProspect?.establishment" flat bordered class="q-mb-md bg-blue-1">
        <q-card-section class="q-py-sm">
          <div class="row items-center q-gutter-sm">
            <q-icon name="storefront" color="blue" size="18px" />
            <span class="text-weight-medium text-body2">{{ adminStore.activeProspect.establishment.name }}</span>
          </div>
          <div class="row q-gutter-md q-mt-xs">
            <q-badge v-if="adminStore.activeProspect.segment" :color="segColor(adminStore.activeProspect.segment)" :label="segLabel(adminStore.activeProspect.segment)" />
            <q-badge :color="scoreColor(adminStore.activeProspect.engagement_score)" :label="'Score: ' + (adminStore.activeProspect.engagement_score || 0)" />
          </div>
          <div class="text-caption text-grey-7 q-mt-xs">{{ adminStore.activeProspect.notes }}</div>
        </q-card-section>
      </q-card>

      <!-- Add Activity -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section class="q-pb-none">
          <div class="text-subtitle2">Nueva actividad</div>
        </q-card-section>
        <q-card-section>
          <q-select v-model="form.type" :options="typeOptions" emit-value map-options filled dense label="Tipo" class="q-mb-sm" />
          <q-input v-model="form.description" filled dense autogrow type="textarea" label="Descripcion" class="q-mb-sm" />
          <q-input v-model="form.scheduled_at" filled dense type="datetime-local" label="Agendar para (opcional)" class="q-mb-sm" />
          <div class="row q-gutter-sm">
            <q-btn unelevated no-caps color="primary" label="Agregar" icon="add" size="sm" @click="addActivity" :loading="saving" />
            <q-btn v-if="adminStore.activeProspect?.email && !['cerrado_ganado','cerrado_perdido'].includes(adminStore.activeProspect?.status)" outline no-caps color="teal" label="Iniciar secuencia" icon="auto_fix_high" size="sm" @click="startSequence">
              <q-menu auto-close>
                <q-list dense style="min-width: 180px">
                  <q-item clickable @click="launchSequence('welcome')">
                    <q-item-section>Bienvenida (2 emails)</q-item-section>
                  </q-item>
                  <q-item clickable @click="launchSequence('nurture')">
                    <q-item-section>Nutricion (2 emails)</q-item-section>
                  </q-item>
                  <q-item clickable @click="launchSequence('reactivation')">
                    <q-item-section>Reactivacion (3 emails)</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </q-card-section>
      </q-card>

      <!-- Timeline -->
      <q-timeline color="primary">
        <q-timeline-entry
          v-for="act in adminStore.activeProspect?.activities"
          :key="act.id"
          :subtitle="formatDate(act.created_at)"
          :icon="iconFor(act.type)"
          :color="colorFor(act.type)"
        >
          <template v-slot:title>
            <span class="text-caption text-weight-bold text-uppercase">{{ act.type }}</span>
          </template>
          {{ act.description }}
          <div v-if="act.scheduled_at" class="text-caption text-grey-6 q-mt-xs">
            Agendado: {{ formatDate(act.scheduled_at) }}
          </div>
        </q-timeline-entry>
      </q-timeline>

      <div v-if="!adminStore.activeProspect?.activities?.length" class="text-center text-grey-5 q-pa-lg">
        Sin actividades registradas
      </div>
    </div>
  </q-drawer>
</template>

<script setup>
defineOptions({ name: "ActivityDrawer" });
import { ref } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";
const adminStore = useAdminStore();

const saving = ref(false);
const form = ref({ type: "nota", description: "", scheduled_at: "" });

const typeOptions = [
  { label: "Llamada", value: "llamada" },
  { label: "Email", value: "email" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Nota", value: "nota" },
  { label: "Demo", value: "demo" },
  { label: "Visita", value: "visita" },
];

const segColor = (s) => ({ pedidos_sin_pago: "red", menu_sin_pedidos: "orange", sin_configurar: "blue", inactivo: "grey" })[s] || "grey";
const segLabel = (s) => ({ pedidos_sin_pago: "Pedidos sin pago", menu_sin_pedidos: "Menu sin pedidos", sin_configurar: "Sin configurar", inactivo: "Inactivo" })[s] || s;
const scoreColor = (score) => score >= 60 ? "positive" : score >= 30 ? "warning" : "negative";

const iconFor = (type) => {
  const map = { llamada: "phone", email: "mail", whatsapp: "chat", nota: "note", demo: "slideshow", visita: "storefront" };
  return map[type] || "note";
};

const colorFor = (type) => {
  const map = { llamada: "blue", email: "teal", whatsapp: "green", nota: "grey", demo: "purple", visita: "orange" };
  return map[type] || "primary";
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

const startSequence = () => {}; // menu trigger only

const launchSequence = async (type) => {
  try {
    const { data } = await api.post(`/admin/prospects/${adminStore.activeProspect.id}/sequence`, {
      sequence_type: type,
    });
    adminStore.activeProspect = data.sequence ? { ...adminStore.activeProspect } : adminStore.activeProspect;
    adminStore.messageStore.success(`Secuencia "${type}" iniciada — primer email enviado`);
    // Refresh prospect
    const { data: fresh } = await api.get("/admin/prospects");
    adminStore.prospects = fresh.prospects || [];
  } catch (e) {
    adminStore.messageStore.error(e.response?.data?.message || "Error al iniciar secuencia");
  }
};

const addActivity = async () => {
  if (!form.value.description) return adminStore.messageStore.error("La descripcion es requerida");
  saving.value = true;
  try {
    const { data } = await api.post(`/admin/prospects/${adminStore.activeProspect.id}/activity`, form.value);
    adminStore.activeProspect = data.prospect;
    // Also update in list
    adminStore.prospects = adminStore.prospects.map((p) => p.id === data.prospect.id ? data.prospect : p);
    form.value = { type: "nota", description: "", scheduled_at: "" };
    adminStore.messageStore.success("Actividad registrada");
  } catch (e) {
    adminStore.messageStore.error("Error al registrar actividad");
  } finally {
    saving.value = false;
  }
};
</script>
