<template>
  <q-dialog v-model="show" backdrop-filter="blur(8px)">
    <q-card style="border-radius: 16px; min-width: 360px; max-width: 440px">
      <q-card-section>
        <div class="row items-center q-gutter-sm q-mb-md">
          <q-icon name="credit_card" size="24px" color="primary" />
          <span style="font-size: 18px; font-weight: 700">Suscribirme</span>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </div>

        <div class="mc-plan-summary q-mb-lg">
          <div class="text-weight-bold">{{ packageName }}</div>
          <div class="text-h5 text-primary" style="font-weight: 800">
            ${{ price }}
            <span class="text-caption text-grey-6">/{{ billingType === 'monthly' ? 'mes' : 'ano' }}</span>
          </div>
        </div>

        <q-input
          v-model="email"
          filled
          dense
          rounded
          type="email"
          label="Tu correo electronico"
          :error="!!emailError"
          :error-message="emailError"
          class="q-mb-md"
        >
          <template v-slot:prepend>
            <q-icon name="mail" size="18px" />
          </template>
        </q-input>

        <p class="text-caption text-grey-6 q-mb-none">
          Seras redirigido a Mercado Pago para completar tu pago de forma segura.
          El cobro se realizara automaticamente cada {{ billingType === 'monthly' ? 'mes' : 'ano' }}.
        </p>
      </q-card-section>

      <q-card-actions class="q-px-lg q-pb-lg">
        <q-btn
          unelevated
          no-caps
          color="primary"
          label="Continuar al pago"
          icon="lock"
          class="full-width"
          style="border-radius: 12px; font-weight: 600"
          :loading="loading"
          @click="proceed"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from "vue";
import { api } from "boot/axios";
import { useMessageStore } from "stores/message-store";

const props = defineProps({
  modelValue: Boolean,
  packageData: Object,
  billingType: { type: String, default: "monthly" },
});

const emit = defineEmits(["update:modelValue"]);
const messageStore = useMessageStore();

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const email = ref("");
const emailError = ref("");
const loading = ref(false);

const packageName = computed(() => props.packageData?.name || "Plan");
const price = computed(() => {
  if (!props.packageData) return "0";
  return props.billingType === "monthly"
    ? props.packageData.monthly_price
    : props.packageData.yearly_price;
});

const proceed = async () => {
  emailError.value = "";
  if (!email.value || !email.value.includes("@")) {
    emailError.value = "Ingresa un correo valido";
    return;
  }

  loading.value = true;
  try {
    const { data } = await api.post("/subscription/checkout", {
      package_id: props.packageData.id,
      billing_type: props.billingType,
      payer_email: email.value,
    });

    // Redirect to MercadoPago checkout
    const url = data.init_point;
    if (url) {
      // If email was changed for MP compatibility, notify user
      if (data.payer_email && data.payer_email !== email.value) {
        email.value = data.payer_email;
        messageStore.success(`Usa el email ${data.payer_email} en MercadoPago`);
        setTimeout(() => { window.location.href = url; }, 2000);
      } else {
        window.location.href = url;
      }
    } else {
      messageStore.error("Error al generar el link de pago");
    }
  } catch (e) {
    messageStore.error(
      e.response?.data?.message || "Error al procesar. Intenta de nuevo."
    );
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.mc-plan-summary {
  background: #f5f5f5;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}
</style>
