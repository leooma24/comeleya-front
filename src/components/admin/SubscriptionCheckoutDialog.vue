<template>
  <q-dialog v-model="show" backdrop-filter="blur(8px)" maximized>
    <q-card style="max-width: 700px; margin: auto; border-radius: 16px">
      <q-card-section class="row items-center">
        <q-icon name="rocket_launch" size="24px" color="primary" class="q-mr-sm" />
        <span style="font-size: 18px; font-weight: 700">Elegir plan</span>
        <q-space />
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-card-section>
        <!-- Billing toggle -->
        <div class="flex justify-center q-mb-lg">
          <q-btn-toggle
            v-model="billingType"
            no-caps rounded unelevated toggle-color="primary"
            :options="[
              { label: 'Mensual', value: 'monthly' },
              { label: 'Anual', value: 'yearly' },
            ]"
          />
        </div>

        <!-- Package cards -->
        <div class="row q-col-gutter-md">
          <div v-for="pkg in packages" :key="pkg.id" class="col-12 col-sm-6">
            <q-card flat bordered
              :class="['mc-pkg-card cursor-pointer', selectedPkg?.id === pkg.id ? 'mc-pkg-card--selected' : '']"
              @click="selectedPkg = pkg"
            >
              <q-card-section class="text-center">
                <div class="text-weight-bold text-body1">{{ pkg.name }}</div>
                <div class="text-h5 text-primary q-my-sm" style="font-weight: 800">
                  ${{ billingType === 'monthly' ? pkg.monthly_price : pkg.yearly_price }}
                  <span class="text-caption text-grey-6">/{{ billingType === 'monthly' ? 'mes' : 'año' }}</span>
                </div>
                <div class="text-caption text-grey-6">{{ pkg.description }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <div v-if="!packages.length" class="text-center q-py-lg">
          <q-spinner-dots color="primary" size="32px" />
        </div>
      </q-card-section>

      <q-card-actions class="q-px-lg q-pb-lg">
        <q-btn flat no-caps label="Cancelar" v-close-popup />
        <q-space />
        <q-btn
          unelevated no-caps color="primary"
          icon="credit_card" label="Suscribirme"
          :loading="loading"
          :disable="!selectedPkg"
          @click="checkout"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
defineOptions({ name: "SubscriptionCheckoutDialog" });

import { ref, computed, watch } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";

const props = defineProps({ modelValue: Boolean });
const emit = defineEmits(["update:modelValue"]);
const adminStore = useAdminStore();

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const billingType = ref("monthly");
const selectedPkg = ref(null);
const loading = ref(false);
const packages = ref([]);

watch(show, async (val) => {
  if (val && !packages.value.length) {
    try {
      const { data } = await api.get("/packages");
      packages.value = data.packages || [];
    } catch (e) {}
  }
});

const checkout = async () => {
  if (!selectedPkg.value) return;
  loading.value = true;
  try {
    const { data } = await api.post(`/admin/${adminStore.slug}/subscription/checkout`, {
      package_id: selectedPkg.value.id,
      billing_type: billingType.value,
    });
    const url = data.init_point;
    if (url) {
      window.location.href = url;
    } else {
      adminStore.messageStore.error("Error al generar el link de pago");
    }
  } catch (e) {
    adminStore.messageStore.error(e.response?.data?.message || "Error al procesar");
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.mc-pkg-card {
  transition: all 0.2s;
  border: 2px solid var(--color-border);

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  &--selected {
    border-color: var(--q-primary);
    box-shadow: 0 4px 16px rgba(229, 57, 53, 0.2);
  }
}
</style>
