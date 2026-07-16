<template>
  <q-dialog v-model="show" persistent>
    <q-card style="min-width: 450px; max-width: 600px;">
      <q-card-section>
        <div class="text-h6">Enviar campana de email</div>
      </q-card-section>

      <q-card-section>
        <q-select v-model="segment" filled dense label="Segmento" :options="segmentOptions" emit-value map-options class="q-mb-md" />
        <q-select v-model="templateKey" filled dense label="Plantilla" :options="templateOptions" emit-value map-options class="q-mb-md" />

        <q-card v-if="templateKey" flat bordered class="q-pa-md q-mb-md bg-grey-1">
          <div class="text-subtitle2 text-weight-bold">{{ templatePreview.subject }}</div>
          <div class="text-caption text-grey-7 q-mt-sm">{{ templatePreview.preview }}</div>
        </q-card>

        <div v-if="segment" class="text-caption text-grey-6">
          Se enviara a prospectos con email en el segmento seleccionado (excluyendo cerrados).
        </div>
      </q-card-section>

      <!-- Result -->
      <q-card-section v-if="result">
        <q-banner rounded class="bg-green-1 text-positive">
          Enviados: {{ result.sent }} | Fallidos: {{ result.failed }}
        </q-banner>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat no-caps label="Cerrar" v-close-popup />
        <q-btn unelevated no-caps color="primary" icon="send" label="Enviar campana" @click="send"
          :loading="sending" :disable="!segment || !templateKey" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
defineOptions({ name: "CrmCampaignDialog" });
import { ref, watch } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";

const props = defineProps({ modelValue: Boolean, initialSegment: String });
const emit = defineEmits(["update:modelValue"]);
const adminStore = useAdminStore();

const show = ref(props.modelValue);
watch(() => props.modelValue, (v) => { show.value = v; if (v && props.initialSegment) segment.value = props.initialSegment; });
watch(show, (v) => emit("update:modelValue", v));

const segment = ref(props.initialSegment || "");
const templateKey = ref("");
const sending = ref(false);
const result = ref(null);

const segmentOptions = [
  { label: "Pedidos sin pago (calientes)", value: "pedidos_sin_pago" },
  { label: "Menu sin pedidos", value: "menu_sin_pedidos" },
  { label: "Sin configurar", value: "sin_configurar" },
  { label: "Inactivo", value: "inactivo" },
];

const templateOptions = [
  { label: "Ya tienes tu menu, necesitas ayuda?", value: "menu_help" },
  { label: "Tus clientes estan ordenando, hora de crecer", value: "orders_growing" },
  { label: "Todavia interesado? 30 dias gratis", value: "reactivation" },
  { label: "Tu menu digital te espera", value: "welcome_back" },
];

const previews = {
  menu_help: { subject: "Ya tienes tu menu, necesitas ayuda?", preview: "Vimos que ya configuraste tu menu digital. El siguiente paso es compartirlo con tus clientes..." },
  orders_growing: { subject: "Tus clientes estan ordenando, hora de crecer!", preview: "Tus clientes ya usan tu menu y hacen pedidos. Es momento de activar pagos en linea, lealtad..." },
  reactivation: { subject: "Todavia interesado? Te ofrecemos 30 dias gratis", preview: "Hace un tiempo creaste tu cuenta. Te ofrecemos 30 dias gratis del plan Premium..." },
  welcome_back: { subject: "Tu menu digital te espera", preview: "Creaste tu cuenta pero no has configurado tu menu. En 15 minutos puedes tenerlo listo..." },
};

import { computed } from "vue";
const templatePreview = computed(() => previews[templateKey.value] || { subject: "", preview: "" });

const send = async () => {
  sending.value = true;
  result.value = null;
  try {
    const { data } = await api.post("/admin/prospects/bulk-email", { segment: segment.value, template_key: templateKey.value });
    result.value = data;
    adminStore.messageStore.success(`Enviados: ${data.sent}, Fallidos: ${data.failed}`);
  } catch (e) {
    adminStore.messageStore.error("Error al enviar campana");
  } finally { sending.value = false; }
};
</script>
