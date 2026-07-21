<template>
  <q-card flat class="mc-admin-card">
    <div class="mc-admin-card__header">
      <div class="mc-admin-card__title">
        <q-icon name="card_membership" size="24px" color="primary" class="q-mr-sm" />
        Mi Plan
      </div>
    </div>

    <!-- Current plan info -->
    <div class="q-pa-lg">
      <template v-if="subscription">
        <div class="mc-plan-info">
          <div class="mc-plan-info__header">
            <div>
              <div class="text-h6 text-weight-bold">{{ subscription.package?.name }}</div>
              <q-chip dense :color="subscription.status === 'active' ? 'positive' : 'grey-4'"
                :text-color="subscription.status === 'active' ? 'white' : 'grey-7'" size="sm">
                {{ subscription.status === 'active' ? 'Activo' : subscription.status }}
              </q-chip>
              <q-chip v-if="subscription.mp_preapproval_id" dense color="blue-1" text-color="blue-9" size="sm">
                Cobro automático
              </q-chip>
              <q-chip v-else dense color="orange-1" text-color="orange-9" size="sm">
                Plan temporal
              </q-chip>
            </div>
            <div class="text-right">
              <div class="text-h5 text-primary" style="font-weight: 800">
                {{ subscription.days_remaining }}
                <span class="text-caption text-grey-6">días restantes</span>
              </div>
              <div class="text-caption text-grey-6">
                Vence: {{ formatDate(subscription.end_date) }}
              </div>
            </div>
          </div>

          <q-separator class="q-my-md" />

          <div class="row q-gutter-md">
            <q-btn
              unelevated no-caps color="primary" icon="swap_horiz"
              label="Cambiar plan" @click="checkoutDialog = true"
            />
            <q-btn
              v-if="subscription.mp_preapproval_id"
              outline no-caps color="negative" icon="cancel"
              label="Cancelar suscripción" @click="confirmCancel"
            />
          </div>
        </div>
      </template>

      <template v-else>
        <div class="mc-no-plan text-center q-py-xl">
          <q-icon name="credit_card_off" size="64px" color="grey-4" />
          <h6 class="q-mt-md text-grey-7">No tienes un plan activo</h6>
          <p class="text-grey-6">Elige un plan para acceder a todas las funciones premium.</p>
          <q-btn unelevated no-caps color="primary" icon="rocket_launch"
            label="Elegir plan" @click="checkoutDialog = true" class="q-mt-sm" />
        </div>
      </template>

      <!-- Payment history -->
      <div v-if="payments.length" class="q-mt-xl">
        <h6 class="text-weight-bold q-mb-md">Historial de pagos</h6>
        <q-table flat :rows="payments" :columns="paymentColumns" row-key="id"
          no-data-label="Sin pagos registrados" rows-per-page-label="Por página:"
          :pagination="{ rowsPerPage: 5 }" class="mc-inner-table">
          <template v-slot:body-cell-mp_status="props">
            <q-td :props="props">
              <q-chip dense size="sm"
                :color="props.row.mp_status === 'approved' ? 'positive' : 'warning'"
                :text-color="props.row.mp_status === 'approved' ? 'white' : 'white'">
                {{ props.row.mp_status === 'approved' ? 'Aprobado' : props.row.mp_status }}
              </q-chip>
            </q-td>
          </template>
          <template v-slot:body-cell-amount="props">
            <q-td :props="props">
              <span class="text-weight-bold">${{ Number(props.row.amount).toFixed(2) }}</span>
            </q-td>
          </template>
        </q-table>
      </div>
    </div>

    <!-- Checkout dialog -->
    <subscription-checkout-dialog v-model="checkoutDialog" />
  </q-card>
</template>

<script setup>
defineOptions({ name: "MySubscriptionComponent" });

import { ref, onMounted } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";
import { useConfirmDialog } from "src/composables/useConfirmDialog";
import SubscriptionCheckoutDialog from "./SubscriptionCheckoutDialog.vue";

const adminStore = useAdminStore();
const { confirm } = useConfirmDialog();

const subscription = ref(null);
const payments = ref([]);
const checkoutDialog = ref(false);

const formatDate = (d) => d ? new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) : "";

const loadData = async () => {
  try {
    const [subRes, payRes] = await Promise.all([
      api.get(`/admin/${adminStore.slug}/subscription/current`),
      api.get(`/admin/${adminStore.slug}/subscription/payments`),
    ]);
    subscription.value = subRes.data.subscription;
    payments.value = payRes.data.payments || [];
  } catch (e) {
    adminStore.messageStore.error("No se pudo cargar la información de tu plan");
  }
};

const confirmCancel = () => {
  confirm(
    "Cancelar suscripción",
    "Se cancelará el cobro automático. Seguirás teniendo acceso hasta la fecha de vencimiento.",
    async () => {
      try {
        await api.post(`/admin/${adminStore.slug}/subscription/cancel`);
        adminStore.messageStore.success("Suscripción cancelada");
        loadData();
      } catch (e) {
        adminStore.messageStore.error(e.response?.data?.message || "Error al cancelar");
      }
    }
  );
};

onMounted(loadData);

const paymentColumns = [
  { name: "paid_at", label: "Fecha", align: "left", field: (r) => r.paid_at ? new Date(r.paid_at).toLocaleDateString("es-MX") : "-", sortable: true },
  { name: "amount", label: "Monto", align: "right", field: "amount", sortable: true },
  { name: "mp_status", label: "Estado", align: "center", field: "mp_status" },
  { name: "currency", label: "Moneda", align: "center", field: "currency" },
];
</script>

<style lang="scss" scoped>
.mc-plan-info {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: var(--space-md);
  }
}

.mc-inner-table {
  box-shadow: none;
  background: transparent;
}
</style>
