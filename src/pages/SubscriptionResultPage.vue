<template>
  <q-page class="flex flex-center" style="min-height: 80vh">
    <div class="mc-result-card text-center">
      <!-- Loading -->
      <template v-if="loading">
        <q-spinner-dots size="48px" color="primary" />
        <p class="q-mt-md text-grey-7">Verificando tu pago...</p>
      </template>

      <!-- Success -->
      <template v-else-if="status === 'authorized' || status === 'approved'">
        <q-icon name="check_circle" size="64px" color="positive" />
        <h5 class="q-mt-md q-mb-sm" style="font-weight: 700">Pago exitoso</h5>
        <p class="text-grey-7">Tu suscripcion ha sido procesada correctamente.</p>

        <q-btn
          v-if="isAuthenticated"
          unelevated
          no-caps
          color="primary"
          label="Ir a mi panel"
          icon="dashboard"
          class="q-mt-md"
          @click="goToAdmin"
        />

        <template v-else>
          <p class="text-grey-6 q-mt-md">Completa tu registro para activar tu plan.</p>
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Completar registro"
            icon="person_add"
            class="q-mt-sm"
            @click="goToRegister"
          />
        </template>
      </template>

      <!-- Pending -->
      <template v-else-if="status === 'pending'">
        <q-icon name="hourglass_top" size="64px" color="warning" />
        <h5 class="q-mt-md q-mb-sm" style="font-weight: 700">Pago pendiente</h5>
        <p class="text-grey-7">Tu pago esta siendo procesado. Te notificaremos cuando se confirme.</p>

        <q-btn
          v-if="!isAuthenticated"
          unelevated
          no-caps
          color="primary"
          label="Registrarme mientras tanto"
          icon="person_add"
          class="q-mt-md"
          @click="goToRegister"
        />
      </template>

      <!-- Failed -->
      <template v-else>
        <q-icon name="cancel" size="64px" color="negative" />
        <h5 class="q-mt-md q-mb-sm" style="font-weight: 700">Pago no completado</h5>
        <p class="text-grey-7">El pago no pudo ser procesado. Puedes intentar de nuevo.</p>

        <q-btn
          unelevated
          no-caps
          color="primary"
          label="Volver a intentar"
          icon="refresh"
          class="q-mt-md"
          @click="$router.push('/')"
        />
      </template>
    </div>
  </q-page>
</template>

<script setup>
defineOptions({ name: "SubscriptionResultPage" });

import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "stores/user-store";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const loading = ref(true);
const status = ref("");

const isAuthenticated = userStore.isAuthenticated;

const preapprovalId = route.query.preapproval_id || "";
const externalReference = route.query.external_reference || "";
const packageId = route.query.package_id || "";
const billingType = route.query.billing_type || "";

onMounted(() => {
  status.value = route.query.status || route.query.collection_status || "unknown";

  // Parse package info from external_reference if not in query
  if (externalReference && !packageId) {
    const parts = externalReference.split("-");
    if (parts.length >= 3) {
      route.query.package_id = parts[1];
      route.query.billing_type = parts[2];
    }
  }

  loading.value = false;
});

const goToRegister = () => {
  const params = new URLSearchParams({
    preapproval_id: preapprovalId || externalReference,
    package_id: packageId || externalReference.split("-")[1] || "",
    billing_type: billingType || externalReference.split("-")[2] || "",
  });
  router.push(`/nuevo-establecimiento?${params.toString()}`);
};

const goToAdmin = () => {
  const slug = userStore.user?.establishments?.[0]?.slug;
  if (slug) {
    router.push(`/${slug}/admin`);
  } else {
    router.push("/admin");
  }
};
</script>

<style scoped>
.mc-result-card {
  max-width: 440px;
  padding: 48px 32px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}
</style>
