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
          <span class="mc-drawer-count">{{ mainStore.cart.length }} productos</span>
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
                <span class="mc-cart-item__qty">x{{ product.qty }}</span>
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

            <!-- Item Price -->
            <div class="mc-cart-item__price" v-if="!product.extras.length">
              ${{ product.qty * product.price }}
            </div>
          </div>
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
            {{ mainStore.cart.length }}
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
import { useMainStore } from "src/stores/main-store";
const mainStore = useMainStore();
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

  &__price {
    text-align: right;
    font-weight: 700;
    font-size: var(--text-base);
    color: var(--q-primary);
    margin-top: var(--space-sm);
    padding-top: var(--space-sm);
    border-top: 1px dashed var(--color-border);
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
