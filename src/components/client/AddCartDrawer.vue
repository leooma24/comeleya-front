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

    <div class="mc-addcart-scroll">
      <div class="q-pa-md">
        <div v-if="mainStore.product">
          <!-- Hero Image -->
          <div class="mc-hero-image">
            <q-img
              v-if="mainStore.product.photo"
              :src="mainStore.product.photo"
              :ratio="4 / 3"
              class="mc-hero-img"
              fit="cover"
            >
              <template #loading>
                <q-skeleton class="full-width full-height" square />
              </template>
            </q-img>
            <div v-else class="mc-hero-placeholder">
              <q-icon name="restaurant_menu" size="48px" />
            </div>
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
                <q-space />
                <span class="mc-extra-rule">{{ selectionRule(extra) }}</span>
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
                    <!-- El control lo decide la configuración del extra, no sus precios -->
                    <q-radio
                      v-if="controlOf(extra) === 'radio'"
                      v-model="option.qty"
                      :val="1"
                      color="primary"
                      @update:model-value="selectOnly(extra, option)"
                    />
                    <!-- Cantidades: permite repetir la misma opción hasta el tope -->
                    <div v-else-if="controlOf(extra) === 'counter'" class="mc-qty-stepper">
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
                    <!-- Varias opciones distintas, sin repetir. Se deshabilitan las
                         no marcadas al llegar al tope: antes dejaba marcar de más. -->
                    <q-checkbox
                      v-else
                      v-model="option.qty"
                      :val="option.id"
                      :true-value="1"
                      :false-value="0"
                      color="primary"
                      :disable="!option.qty && isFull(extra)"
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

          <!-- Botón Agregar: en el flujo (se alcanza scrolleando), no tapado en móvil -->
          <div class="mc-add-to-cart-bar">
            <q-btn
              ref="addBtnRef"
              color="primary"
              unelevated
              no-caps
              class="full-width mc-add-btn"
              size="lg"
              @click="handleAdd"
            >
              <div class="row items-center justify-between full-width q-px-sm">
                <span>{{ mainStore.btnType }} {{ mainStore.product?.qty }}</span>
                <span class="mc-add-btn-price">${{ mainStore.totalPrice }}</span>
              </div>
            </q-btn>
          </div>
        </div>
      </div>
    </div>
  </q-drawer>
</template>

<script setup>
defineOptions({
  name: "AddCartDrawer",
});
import { ref, nextTick } from "vue";
import { useMainStore } from "src/stores/main-store";
import { controlOf, priceModeOf, isFull, selectionRuleOf } from "src/utils/extraConfig";
const mainStore = useMainStore();
const addBtnRef = ref(null);

// Anima un "punto" con la foto del producto desde el botón hacia la barra del carrito
const flyToCart = (fromRect, photo) => {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const bars = [...document.querySelectorAll(".mc-cart-bar")];
  const target = bars
    .map((b) => b.getBoundingClientRect())
    .find((r) => r.width > 0 && r.top >= 0 && r.top < window.innerHeight);
  if (!target) return;

  const dot = document.createElement("div");
  const size = 60;
  Object.assign(dot.style, {
    position: "fixed",
    left: `${fromRect.left + fromRect.width / 2 - size / 2}px`,
    top: `${fromRect.top + fromRect.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    zIndex: "9999",
    pointerEvents: "none",
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
    background: photo
      ? `center/cover no-repeat url(${photo})`
      : "var(--q-primary)",
  });
  document.body.appendChild(dot);

  const dx = target.left + target.width / 2 - (fromRect.left + fromRect.width / 2);
  const dy = target.top + target.height / 2 - (fromRect.top + fromRect.height / 2);

  const anim = dot.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 40}px) scale(0.9)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.15)`, opacity: 0.4 },
    ],
    { duration: 650, easing: "cubic-bezier(0.4, 0, 0.6, 1)" }
  );
  anim.onfinish = () => dot.remove();
};

const handleAdd = async () => {
  const el = addBtnRef.value?.$el;
  const fromRect = el?.getBoundingClientRect();
  const photo = mainStore.product?.photo;
  const wasEditing = mainStore.cartStore.isEditing;

  mainStore.addToCart();

  // Si se agregó (el drawer se cerró) y no era edición, lanza la animación
  if (!mainStore.addCartDrawer && !wasEditing && fromRect) {
    await nextTick();
    flyToCart(fromRect, photo);
  }
};

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

// El radio es excluyente: al elegir uno se limpian los demás.
const selectOnly = (extra, option) => {
  extra.options.forEach((o) => {
    if (o.id !== option.id) o.qty = 0;
  });
  mainStore.updatePrice();
};

// "$425" cuando la opción ES el precio del platillo, "+ $50" cuando se le suma.
const checkOptionType = (extra, option) => {
  if (!(option.price > 0)) return "";
  return priceModeOf(extra) === "replace" ? `$${option.price}` : `+ $${option.price}`;
};

const selectionRule = (extra) => selectionRuleOf(extra);
</script>

<style lang="scss" scoped>
.mc-hero-image {
  border-radius: var(--radius-lg);
  overflow: hidden;
  max-height: 340px;
}

.mc-hero-img {
  border-radius: var(--radius-lg);
  max-height: 340px;
}

.mc-hero-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 16 / 9;
  background: var(--color-surface-variant);
  color: var(--color-text-tertiary);
  border-radius: var(--radius-lg);
}

.mc-extra-rule {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  font-weight: 500;
  white-space: nowrap;
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

.mc-addcart-scroll {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.mc-add-to-cart-bar {
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  padding-bottom: calc(var(--space-sm) + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--color-border);
}
</style>
