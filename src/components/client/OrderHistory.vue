<template>
  <q-drawer
    v-model="showDrawer"
    side="right"
    bordered
    overlay
    persistent
    no-swipe-open
    :width="$q.screen.lt.sm ? $q.screen.width : 440"
  >
    <q-btn
      flat
      round
      icon="close"
      color="grey-8"
      size="md"
      class="mc-drawer-close"
      @click="showDrawer = false"
    />

    <q-scroll-area style="height: calc(100vh - 32px)">
      <div class="q-pa-md">
        <!-- Header -->
        <div class="mc-drawer-header q-mb-md">
          <h5 class="mc-drawer-title">Pedidos anteriores</h5>
        </div>

        <!-- Lista -->
        <div v-if="mainStore.orderHistory.length" class="mc-history-list">
          <div
            v-for="(order, index) in mainStore.orderHistory"
            :key="index"
            class="mc-history-item"
          >
            <div class="mc-history-item__info">
              <span class="mc-history-item__code">#{{ order.order_code }}</span>
              <span class="mc-history-item__date">{{ formatDate(order.savedAt) }}</span>
            </div>
            <div class="mc-history-item__details">
              <span class="mc-history-item__products">
                {{ order.cart.length }} producto{{ order.cart.length > 1 ? 's' : '' }}
              </span>
              <span class="mc-history-item__total">${{ order.total }}</span>
            </div>
            <div class="mc-history-item__actions">
              <q-btn
                v-if="order.establishment && order.order_code"
                outline
                dense
                no-caps
                size="sm"
                color="primary"
                icon="local_shipping"
                label="Ver estado"
                :to="`/${order.establishment}/pedido/${order.order_code}`"
              />
              <q-btn
                unelevated
                dense
                no-caps
                size="sm"
                color="primary"
                icon="replay"
                label="Repetir"
                @click="onReorder(order)"
              />
              <q-btn
                flat
                dense
                round
                size="sm"
                color="grey-6"
                icon="delete_outline"
                @click="mainStore.orderStore.removeFromHistory(index)"
              >
                <q-tooltip>Eliminar</q-tooltip>
              </q-btn>
            </div>
          </div>
        </div>

        <!-- Vacío -->
        <div v-else class="mc-empty-state">
          <q-icon name="history" size="48px" color="grey-4" />
          <p>Aún no tienes pedidos anteriores.</p>
        </div>
      </div>
    </q-scroll-area>
  </q-drawer>
</template>

<script setup>
defineOptions({
  name: "OrderHistory",
});

import { useMainStore } from "src/stores/main-store";

const mainStore = useMainStore();
const showDrawer = defineModel({ default: false });

const onReorder = (order) => {
  mainStore.reorder(order);
  showDrawer.value = false;
};

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;

  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}
</script>

<style lang="scss" scoped>
.mc-drawer-header {
  padding-top: var(--space-lg);
}

.mc-drawer-title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 700;
  margin: 0;
  color: var(--color-text-primary);
}

.mc-history-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.mc-history-item {
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-md);

  &__info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2px;
  }

  &__code {
    font-weight: 700;
    font-size: var(--text-sm);
    color: var(--q-primary);
  }

  &__date {
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
  }

  &__details {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-sm);
  }

  &__products {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  &__total {
    font-weight: 700;
    font-size: var(--text-sm);
    color: var(--color-text-primary);
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

.mc-empty-state {
  text-align: center;
  padding: var(--space-xl) var(--space-md);
  color: var(--color-text-tertiary);

  p {
    margin: var(--space-sm) 0 0;
    font-size: var(--text-sm);
  }
}
</style>
