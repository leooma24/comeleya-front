<template>
  <div class="mc-steps">
    <!-- Tambien en el paso 1. Los cajones son `persistent no-swipe-open`: Quasar no
         cierra ni con ESC ni tocando fuera, asi que sin esto la unica salida del
         carrito era la X de la esquina. -->
    <q-btn
      v-if="$attrs.onBack || current > 1"
      flat
      round
      dense
      icon="arrow_back"
      color="grey-8"
      class="mc-steps__back"
      aria-label="Atrás"
      @click="$emit('back')"
    />

    <div class="mc-steps__track">
      <template v-for="(label, i) in labels" :key="label">
        <div
          class="mc-steps__step"
          :class="{
            'is-active': current === i + 1,
            'is-done': current > i + 1,
          }"
        >
          <span class="mc-steps__dot">
            <q-icon v-if="current > i + 1" name="check" size="14px" />
            <template v-else>{{ i + 1 }}</template>
          </span>
          <span class="mc-steps__label">{{ label }}</span>
        </div>
        <span
          v-if="i < labels.length - 1"
          class="mc-steps__sep"
          :class="{ 'is-done': current > i + 1 }"
        ></span>
      </template>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: "CheckoutSteps" });

defineProps({
  current: { type: Number, default: 1 },
});
defineEmits(["back"]);

const labels = ["Carrito", "Datos", "Pago"];
</script>

<style lang="scss" scoped>
.mc-steps {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) 0 var(--space-md);
}

.mc-steps__back {
  flex-shrink: 0;
}

.mc-steps__track {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.mc-steps__step {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-tertiary);

  &.is-active {
    color: var(--q-primary);
  }
  &.is-done {
    color: var(--q-primary);
  }
}

.mc-steps__dot {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
  font-weight: 700;
  border: 2px solid currentColor;

  .is-active & {
    background: var(--q-primary);
    color: #fff;
    border-color: var(--q-primary);
  }
  .is-done & {
    background: var(--q-primary);
    color: #fff;
    border-color: var(--q-primary);
  }
}

.mc-steps__label {
  font-size: var(--text-xs);
  font-weight: 600;
  white-space: nowrap;

  @media (max-width: 359px) {
    display: none;
  }
}

.mc-steps__sep {
  flex: 1;
  height: 2px;
  min-width: 12px;
  margin: 0 6px;
  background: var(--color-border);
  border-radius: var(--radius-full);

  &.is-done {
    background: var(--q-primary);
  }
}
</style>
