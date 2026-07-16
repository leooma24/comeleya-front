<template>
  <q-drawer
    v-model="mainStore.addCartDrawer"
    bordered
    overlay
    side="right"
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
      @click="mainStore.addCartDrawer = false"
    />

    <q-scroll-area class="fit" style="padding-bottom: 80px">
      <div class="q-pa-md">
        <div v-if="mainStore.product">
          <!-- Hero Image -->
          <div class="mc-hero-image">
            <q-img
              :src="mainStore.product.photo"
              class="mc-hero-img"
              fit="cover"
            >
              <template #loading>
                <q-skeleton class="full-width full-height" square />
              </template>
            </q-img>
          </div>

          <!-- Product Header -->
          <div class="q-mt-md">
            <h5 class="mc-product-name">{{ mainStore.product.name }}</h5>
            <p class="mc-product-desc">{{ mainStore.product.description }}</p>
          </div>

          <!-- Extras -->
          <div class="q-mt-md">
            <div
              v-for="extra in mainStore.product.extras"
              :key="extra.id"
              :class="[
                'mc-extra-group',
                extra.hasError ? 'mc-extra-group--error' : ''
              ]"
            >
              <div class="mc-extra-header">
                <span class="mc-extra-name">{{ extra.name }}</span>
                <q-badge
                  v-if="extra.is_required"
                  color="negative"
                  text-color="white"
                  label="Requerido"
                  rounded
                  class="q-ml-sm"
                />
              </div>
              <q-list dense class="mc-extra-list">
                <q-item
                  tag="label"
                  v-ripple
                  v-for="(option, indexOption) in extra.options"
                  :key="'EOptions' + indexOption"
                  class="mc-extra-item"
                >
                  <q-item-section>
                    <q-item-label>{{ option.name }}</q-item-label>
                  </q-item-section>
                  <q-item-section class="col-2">
                    <q-item-label class="mc-extra-price">{{ checkOptionType(extra, option) }}</q-item-label>
                  </q-item-section>
                  <q-item-section avatar>
                    <!-- Selección única (elige 1): radio -->
                    <q-radio
                      v-if="extra.qty === 1"
                      v-model="option.qty"
                      :val="1"
                      color="primary"
                      @update:model-value="updateHasPricesValue(extra, option)"
                    />
                    <!-- Selección múltiple con precio: stepper de cantidad -->
                    <div v-else-if="extra.qty > 1 && hasPrices(extra)" class="mc-qty-stepper">
                      <q-btn
                        flat
                        dense
                        round
                        color="primary"
                        icon="remove"
                        size="sm"
                        @click="decrementValue(option)"
                        :disabled="option.qty === 0"
                      />
                      <span class="mc-qty-value">{{ option.qty }}</span>
                      <q-btn
                        flat
                        dense
                        round
                        color="primary"
                        icon="add"
                        size="sm"
                        @click="incrementValue(option)"
                        :disabled="mainStore.isDisabled(extra)"
                      />
                    </div>
                    <!-- Selección múltiple sin precio: checkbox -->
                    <q-checkbox
                      v-else
                      v-model="option.qty"
                      :val="option.id"
                      :true-value="1"
                      :false-value="0"
                      color="primary"
                      @update:model-value="mainStore.updatePrice"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <!-- Quantity -->
            <div class="mc-extra-group">
              <div class="row items-center justify-between">
                <span class="mc-extra-name">Cantidad</span>
                <div class="mc-qty-stepper">
                  <q-btn
                    flat
                    dense
                    round
                    color="primary"
                    icon="remove"
                    size="sm"
                    @click="mainStore.decrementProduct"
                    :disabled="mainStore.product.qty === 1"
                  />
                  <span class="mc-qty-value">{{ mainStore.product.qty }}</span>
                  <q-btn
                    flat
                    dense
                    round
                    color="primary"
                    icon="add"
                    size="sm"
                    @click="mainStore.incrementProduct"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </q-scroll-area>

    <!-- Add to Cart Button -->
    <div class="mc-add-to-cart-bar" v-if="mainStore.product">
      <q-btn
        color="primary"
        unelevated
        no-caps
        class="full-width mc-add-btn"
        size="lg"
        @click="mainStore.addToCart"
      >
        <div class="row items-center justify-between full-width q-px-sm">
          <span>{{ mainStore.btnType }} {{ mainStore.product?.qty }}</span>
          <span class="mc-add-btn-price">${{ mainStore.totalPrice }}</span>
        </div>
      </q-btn>
    </div>
  </q-drawer>
</template>

<script setup>
defineOptions({
  name: "AddCartDrawer",
});
import { useMainStore } from "src/stores/main-store";
const mainStore = useMainStore();

const decrementValue = (option) => {
  option.qty = option.qty ?? 0;
  option.qty--;
  mainStore.updatePrice();
};
const incrementValue = (option) => {
  option.qty = option.qty ?? 0;
  option.qty++;
  mainStore.updatePrice();
};

const hasPrices = (extra) => {
  return extra.options.every((o) => o.price > 0);
};

const updateHasPricesValue = (extra, option) => {
  extra.options.forEach((o) => {
    if (o.id !== option.id) o.qty = 0;
  });
  mainStore.updatePrice();
};

const checkOptionType = (extra, option) => {
  const hasPrice = extra.options.every((o) => o.price > 0);
  if (extra.qty === 1 && hasPrice) return `$${option.price}`;
  if (extra.qty > 1 && hasPrice) return `+ $${option.price}`;
  if (option.price > 0) return `+ $${option.price}`;
  return "";
};
</script>

<style lang="scss" scoped>
.mc-hero-image {
  border-radius: var(--radius-lg);
  overflow: hidden;
  max-height: 280px;
}

.mc-hero-img {
  border-radius: var(--radius-lg);
  max-height: 280px;
}

.mc-product-name {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 700;
  margin: 0 0 var(--space-sm);
  color: var(--color-text-primary);
}

.mc-product-desc {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
}

.mc-extra-group {
  background: var(--color-surface-variant);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
  border: 1px solid var(--color-border-subtle);
  transition: border-color var(--transition-fast);

  &--error {
    border-color: var(--q-negative);
    background: var(--color-error-bg);
    animation: shake 0.4s ease;
  }
}

.mc-extra-header {
  display: flex;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.mc-extra-name {
  font-weight: 600;
  font-size: var(--text-base);
  color: var(--color-text-primary);
}

.mc-extra-list {
  margin: 0 calc(var(--space-md) * -1);
}

.mc-extra-item {
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);

  &:hover {
    background: rgba(0, 0, 0, 0.03);
  }
}

.mc-extra-price {
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-secondary);
}

.mc-add-btn {
  border-radius: var(--radius-md);
  font-weight: 600;
}

.mc-add-btn-price {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.mc-add-to-cart-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--space-md);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}
</style>
