<template>
  <q-card flat class="mc-admin-card">
    <div class="mc-admin-card__header">
      <div class="mc-admin-card__title">
        <q-icon name="loyalty" size="24px" color="primary" class="q-mr-sm" />
        Programa de Lealtad
      </div>
    </div>

    <div v-if="loading" class="mc-loading">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <template v-else>
      <div class="mc-loyalty-sections">
      <!-- Config section -->
      <admin-section
        icon="stars"
        title="Configuración de puntos"
        description="Cuántos puntos gana tu cliente y desde cuántos te los puede cambiar por descuento. Aplica a los pedidos nuevos, no a los que ya pasaron."
      >
        <!-- Earn mode selector -->
        <div class="q-mb-md">
          <div class="text-caption text-grey-6 q-mb-xs">¿Cómo ganan puntos tus clientes?</div>
          <q-btn-toggle
            v-model="config.earn_mode"
            no-caps rounded unelevated
            toggle-color="primary"
            color="grey-3"
            text-color="grey-8"
            :options="[
              { label: 'Por monto gastado', value: 'per_amount' },
              { label: 'Por pedido', value: 'per_order' },
            ]"
          />
        </div>

        <!-- Per amount -->
        <div v-if="config.earn_mode === 'per_amount'" class="row items-center q-gutter-sm q-mb-md">
          <span class="text-body2">Gana</span>
          <q-input filled dense rounded v-model.number="config.points_per_amount" type="number" min="0" style="width: 90px" />
          <span class="text-body2">punto(s) por cada</span>
          <q-input filled dense rounded v-model.number="config.amount_step" type="number" min="1" prefix="$" style="width: 110px" />
          <span class="text-body2">gastados</span>
        </div>

        <!-- Per order -->
        <div v-else class="row items-center q-gutter-sm q-mb-md">
          <span class="text-body2">Gana</span>
          <q-input filled dense rounded v-model.number="config.points_per_order" type="number" min="0" style="width: 90px" />
          <span class="text-body2">punto(s) por cada pedido</span>
        </div>

        <!-- Redeem config (común a ambos modos) -->
        <div class="row q-gutter-md q-mb-md">
          <q-input
            filled dense rounded
            v-model.number="config.points_value"
            type="number" min="0"
            label="Valor por punto ($)"
            class="col"
            hint="Cuánto vale cada punto al canjear"
          />
          <q-input
            filled dense rounded
            v-model.number="config.min_points_redeem"
            type="number" min="1"
            label="Mínimo para canjear"
            class="col"
          />
        </div>

        <div>
          <q-btn unelevated no-caps color="primary" label="Guardar configuración" @click="saveConfig" :loading="savingConfig" size="sm" />
        </div>
      </admin-section>

      <!-- Lookup -->
      <admin-section
        icon="person_search"
        title="Buscar cliente"
        description="Cuando alguien te pida su descuento en caja, busca su teléfono aquí para ver cuántos puntos lleva y canjeárselos en el momento."
      >
        <div class="row q-gutter-sm items-center">
          <q-input
            filled dense rounded
            v-model="searchPhone"
            label="Teléfono del cliente"
            class="col"
            @keyup.enter="lookupCustomer"
          />
          <q-btn unelevated no-caps color="primary" icon="search" label="Buscar" @click="lookupCustomer" size="sm" :loading="searching" />
        </div>

        <div v-if="customerPoints" class="mc-customer-points q-mt-md">
          <div class="mc-points-card">
            <div class="mc-points-card__value">{{ customerPoints.points }}</div>
            <div class="mc-points-card__label">Puntos acumulados</div>
            <div class="mc-points-card__phone">{{ customerPoints.customer_phone }}</div>
          </div>

          <div v-if="customerPoints.points >= (config.min_points_redeem || 0)" class="mc-redeem-section q-mt-md">
            <div class="row q-gutter-sm items-center">
              <q-input
                filled dense rounded
                v-model.number="redeemAmount"
                type="number"
                label="Puntos a canjear"
                class="col"
                :max="customerPoints.points"
              />
              <q-btn unelevated no-caps color="positive" icon="redeem" label="Canjear" @click="redeemPoints" size="sm" :loading="redeeming" />
            </div>
            <p class="mc-redeem-value" v-if="redeemAmount > 0">
              Valor: ${{ (redeemAmount * (config.points_value || 0)).toFixed(2) }}
            </p>
          </div>
        </div>
      </admin-section>

      <!-- Recent transactions -->
      <admin-section
        icon="loyalty"
        title="Clientes con puntos"
        description="Quiénes vuelven. Los que más puntos traen son los que ya te compraron varias veces."
      >
        <div v-if="customers.length">
          <div
            class="mc-loyalty-row"
            v-for="customer in customers"
            :key="customer.id"
          >
            <div class="mc-loyalty-row__info">
              <span class="mc-loyalty-row__phone">{{ customer.customer_phone }}</span>
              <span class="mc-loyalty-row__name">{{ customer.customer_name }}</span>
            </div>
            <q-chip dense color="primary" text-color="white">
              {{ customer.points }} pts
            </q-chip>
          </div>
        </div>
        <div v-else class="mc-empty-state">
          <q-icon name="loyalty" size="48px" color="grey-4" />
          <p>Aún no hay clientes con puntos</p>
        </div>
      </admin-section>
      </div>
    </template>
  </q-card>
</template>

<script setup>
defineOptions({ name: "LoyaltyComponent" });

import { ref, onMounted } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";
import AdminSection from "./AdminSection.vue";

const adminStore = useAdminStore();
const loading = ref(true);
const customers = ref([]);
const config = ref({
  earn_mode: "per_amount",
  points_per_amount: 1,
  amount_step: 10,
  points_per_order: 10,
  points_value: 1,
  min_points_redeem: 50,
});
const savingConfig = ref(false);
const searchPhone = ref("");
const searching = ref(false);
const customerPoints = ref(null);
const redeemAmount = ref(0);
const redeeming = ref(false);

const saveConfig = async () => {
  savingConfig.value = true;
  try {
    await api.put(`/admin/${adminStore.slug}/loyalty/config`, config.value);
    adminStore.messageStore.success("Configuración guardada");
  } catch (e) {
    adminStore.messageStore.error("Error al guardar configuración");
  } finally {
    savingConfig.value = false;
  }
};

const lookupCustomer = async () => {
  if (!searchPhone.value) return;
  searching.value = true;
  try {
    const { data } = await api.get(`/admin/${adminStore.slug}/loyalty/lookup`, { params: { phone: searchPhone.value } });
    customerPoints.value = data.loyalty;
    redeemAmount.value = 0;
    if (!data.loyalty) {
      adminStore.messageStore.success("Ese cliente aún no tiene puntos");
    }
  } catch (e) {
    customerPoints.value = null;
    adminStore.messageStore.error("Error al buscar cliente");
  } finally {
    searching.value = false;
  }
};

const redeemPoints = async () => {
  if (!redeemAmount.value || !customerPoints.value) return;
  redeeming.value = true;
  try {
    const { data } = await api.post(`/admin/${adminStore.slug}/loyalty/redeem`, {
      phone: customerPoints.value.customer_phone,
      points: redeemAmount.value,
    });
    customerPoints.value = data.loyalty;
    redeemAmount.value = 0;
    adminStore.messageStore.success("Puntos canjeados exitosamente");
    loadCustomers();
  } catch (e) {
    adminStore.messageStore.error(e.response?.data?.message || "Error al canjear puntos");
  } finally {
    redeeming.value = false;
  }
};

const loadCustomers = async () => {
  try {
    const { data } = await api.get(`/admin/${adminStore.slug}/loyalty`);
    customers.value = data.customers;
  } catch (e) {
    adminStore.messageStore.error("Error al cargar programa de lealtad");
  }
};

onMounted(async () => {
  try {
    const [customersRes, configRes] = await Promise.all([
      api.get(`/admin/${adminStore.slug}/loyalty`),
      api.get(`/establishment/${adminStore.slug}/loyalty/config`),
    ]);
    customers.value = customersRes.data.customers || [];
    if (configRes.data.config) {
      Object.assign(config.value, configRes.data.config);
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
.mc-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

// Los tres bloques iban sueltos, con su propio padding y separados por <q-separator>.
// Ahora cada uno es una caja de AdminSection, asi que el padding y la separacion los
// pone el contenedor y las lineas divisorias sobran: el borde de cada caja ya divide.
.mc-loyalty-sections {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.mc-points-card {
  background: linear-gradient(135deg, var(--q-primary), color-mix(in srgb, var(--q-primary) 70%, black));
  color: white;
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  text-align: center;

  &__value {
    font-size: var(--text-3xl);
    font-weight: 800;
    line-height: 1.2;
  }

  &__label {
    font-size: var(--text-sm);
    opacity: 0.85;
    margin-top: var(--space-xs);
  }

  &__phone {
    font-size: var(--text-xs);
    opacity: 0.7;
    margin-top: var(--space-sm);
  }
}

.mc-redeem-value {
  font-size: var(--text-sm);
  color: var(--q-positive);
  font-weight: 600;
  margin-top: var(--space-xs);
}

.mc-loyalty-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);

  &:hover { background: var(--color-surface-variant); }

  &__info {
    display: flex;
    flex-direction: column;
  }

  &__phone {
    font-weight: 600;
    font-size: var(--text-sm);
    color: var(--color-text-primary);
  }

  &__name {
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
  }
}

@media screen and (max-width: 600px) {
  .mc-loyalty-sections {
    padding: var(--space-md);
  }
}
</style>
