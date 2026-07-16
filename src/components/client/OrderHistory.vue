<template>
  <div v-if="mainStore.orderHistory.length" class="mc-order-history">
    <div class="mc-order-history__header" @click="expanded = !expanded">
      <div class="mc-order-history__title">
        <q-icon name="history" size="18px" color="grey-7" class="q-mr-xs" />
        Pedidos anteriores
      </div>
      <q-icon
        :name="expanded ? 'expand_less' : 'expand_more'"
        size="20px"
        color="grey-6"
      />
    </div>

    <div v-show="expanded" class="mc-order-history__list">
      <div
        v-for="(order, index) in mainStore.orderHistory"
        :key="index"
        class="mc-order-history__item"
      >
        <div class="mc-order-history__info">
          <span class="mc-order-history__code">#{{ order.order_code }}</span>
          <span class="mc-order-history__date">{{ formatDate(order.savedAt) }}</span>
        </div>
        <div class="mc-order-history__details">
          <span class="mc-order-history__products">
            {{ order.cart.length }} producto{{ order.cart.length > 1 ? 's' : '' }}
          </span>
          <span class="mc-order-history__total">${{ order.total }}</span>
        </div>
        <div class="mc-order-history__actions">
          <q-btn
            flat
            dense
            no-caps
            size="sm"
            color="primary"
            icon="replay"
            label="Repetir"
            @click="mainStore.reorder(order)"
          />
          <q-btn
            flat
            dense
            round
            size="sm"
            color="grey-5"
            icon="close"
            @click="mainStore.orderStore.removeFromHistory(index)"
          >
            <q-tooltip>Eliminar</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: "OrderHistory",
});

import { ref } from "vue";
import { useMainStore } from "src/stores/main-store";

const mainStore = useMainStore();
const expanded = ref(false);

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
.mc-order-history {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  margin: var(--space-sm);
  border: 1px solid var(--color-border-subtle);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-sm) var(--space-md);
    cursor: pointer;
    transition: background var(--transition-fast);

    &:hover {
      background: var(--color-surface-variant);
    }
  }

  &__title {
    display: flex;
    align-items: center;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  &__list {
    border-top: 1px solid var(--color-border-subtle);
  }

  &__item {
    padding: var(--space-sm) var(--space-md);
    border-bottom: 1px solid var(--color-border-subtle);

    &:last-child {
      border-bottom: none;
    }
  }

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
    margin-bottom: var(--space-xs);
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
</style>
