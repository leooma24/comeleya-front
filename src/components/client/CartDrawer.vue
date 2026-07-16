<template>
  <q-drawer
    v-model="mainStore.cartDrawer"
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
      @click="mainStore.cartDrawer = false"
    />

    <q-scroll-area style="height: calc(100vh - 100px)">
      <div class="q-pa-md">
        <!-- Header -->
        <div class="mc-drawer-header q-mb-md">
          <h5 class="mc-drawer-title">Tu Pedido</h5>
          <span class="mc-drawer-count">
            {{ unitCount }} {{ unitCount === 1 ? 'artículo' : 'artículos' }}
          </span>
        </div>

        <!-- Empty State -->
        <div v-if="!mainStore.cart.length" class="mc-empty-cart">
          <q-icon name="shopping_bag" size="48px" color="grey-4" />
          <p class="mc-empty-cart__text">Tu carrito está vacío</p>
        </div>

        <!-- Cart Items -->
        <div class="mc-cart-list">
          <div
            class="mc-cart-item"
            v-for="(product, index) in mainStore.cart"
            :key="index"
          >
            <div class="mc-cart-item__main">
              <div class="mc-cart-item__info">
                <span class="mc-cart-item__name">{{ product.name }}</span>
              </div>

              <div class="mc-cart-item__actions">
                <q-btn
                  flat
                  round
                  dense
                  icon="edit"
                  size="xs"
                  color="grey-7"
                  class="mc-cart-item__action-btn"
                  @click="mainStore.editProduct(index)"
                >
                  <q-tooltip>Editar</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  dense
                  icon="delete_outline"
                  size="xs"
                  color="negative"
                  class="mc-cart-item__action-btn"
                  @click="mainStore.removeProduct(index)"
                >
                  <q-tooltip>Eliminar</q-tooltip>
                </q-btn>
              </div>
            </div>

            <!-- Extras -->
            <ul class="mc-cart-item__extras" v-if="product.extras.length">
              <div v-for="extra in product.extras" :key="extra.id">
                <li
                  v-for="option in extra.options"
                  :key="option.id"
                  v-show="option.qty || extra.value === option.id"
                >
                  <div class="row justify-between">
                    <span>
                      <span v-if="option.price">{{ option.qty * product.qty }} x </span>
                      {{ option.name }}
                    </span>
                    <strong v-if="option.price" class="mc-cart-item__extra-price">${{ option.price * product.qty * option.qty }}</strong>
                  </div>
                </li>
              </div>
            </ul>

            <!-- Cantidad + total de la línea -->
            <div class="mc-cart-item__footer">
              <div class="mc-qty-stepper">
                <q-btn
                  flat
                  dense
                  round
                  color="primary"
                  icon="remove"
                  size="sm"
                  :disable="product.qty <= 1"
                  @click="mainStore.cartStore.decrementLine(index)"
                />
                <span class="mc-qty-value">{{ product.qty }}</span>
                <q-btn
                  flat
                  dense
                  round
                  color="primary"
                  icon="add"
                  size="sm"
                  @click="mainStore.cartStore.incrementLine(index)"
                />
              </div>
              <div class="mc-cart-item__price">
                ${{ (product.totalPrice * product.qty).toFixed(2) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Subtotal -->
        <div v-if="mainStore.cart.length" class="mc-cart-subtotal">
          <span>Subtotal</span>
          <span class="mc-cart-subtotal__value">${{ Number(mainStore.total).toFixed(2) }}</span>
        </div>
      </div>
    </q-scroll-area>

    <!-- Bottom Bar -->
    <div
      class="mc-cart-bar mc-mb-fix absolute-bottom"
      @click="mainStore.dataDrawer = true"
    >
      <div class="row items-center justify-between full-width">
        <div class="mc-cart-bar-left">
          <q-icon name="shopping_cart" size="24px" />
          <q-badge color="white" text-color="primary" rounded>
            {{ unitCount }}
          </q-badge>
        </div>

        <div class="column items-center">
          <span class="mc-total-price">${{ mainStore.total }}</span>
        </div>

        <div class="mc-cart-bar-right">
          <span class="mc-cart-bar-label">Continuar</span>
          <q-icon name="arrow_forward" size="20px" />
        </div>
      </div>
    </div>
  </q-drawer>
</template>

<script setup>
defineOptions({
  name: "CartDrawer",
});
import { computed } from "vue";
import { useMainStore } from "src/stores/main-store";
const mainStore = useMainStore();

// Total de artículos por unidades (no por líneas)
const unitCount = computed(() =>
  mainStore.cart.reduce((acc, item) => acc + (item.qty || 0), 0)
);
</script>

<style lang="scss" scoped>
.mc-drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-top: var(--space-lg);
}

.mc-drawer-title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 700;
  margin: 0;
  color: var(--color-text-primary);
}

.mc-drawer-count {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  font-weight: 500;
}

.mc-empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl) 0;
  gap: var(--space-md);

  &__text {
    color: var(--color-text-tertiary);
    font-size: var(--text-base);
    margin: 0;
  }
}

.mc-cart-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.mc-cart-item {
  background: var(--color-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  transition: border-color var(--transition-fast);

  &:hover {
    border-color: var(--color-border);
  }

  &__main {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  &__info {
    flex: 1;
  }

  &__name {
    font-weight: 600;
    font-size: var(--text-base);
    color: var(--color-text-primary);
  }

  &__qty {
    color: var(--color-text-tertiary);
    font-weight: 500;
    margin-left: var(--space-xs);
    font-variant-numeric: tabular-nums;
  }

  &__extras {
    margin: var(--space-sm) 0 0;
    padding-left: var(--space-md);
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    list-style: none;

    li::before {
      content: "+";
      margin-right: var(--space-xs);
      color: var(--color-text-tertiary);
    }
  }

  &__extra-price {
    font-variant-numeric: tabular-nums;
    color: var(--color-text-primary);
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: var(--space-sm);
    padding-top: var(--space-sm);
    border-top: 1px dashed var(--color-border);
  }

  &__price {
    text-align: right;
    font-weight: 700;
    font-size: var(--text-base);
    color: var(--q-primary);
    font-variant-numeric: tabular-nums;
  }

  &__actions {
    display: flex;
    gap: var(--space-xs);
    flex-shrink: 0;
  }

  &__action-btn {
    transition: var(--transition-fast);
    opacity: 0.7;

    &:hover {
      opacity: 1;
    }
  }
}

.mc-cart-subtotal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-md);
  padding: var(--space-md);
  background: var(--color-surface-variant);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text-secondary);

  &__value {
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-text-primary);
    font-variant-numeric: tabular-nums;
  }
}

.mc-cart-bar-left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.mc-cart-bar-right {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.mc-cart-bar-label {
  font-weight: 600;
  font-size: var(--text-base);
}
</style>
