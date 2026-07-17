<template>
  <q-drawer
    v-model="mainStore.paymentDrawer"
    bordered
    overlay
    side="right"
    persistent
    no-swipe-open
    :width="$q.screen.lt.sm ? $q.screen.width : 440"
    class="mc-pb-lg"
  >
    <q-btn
      flat
      round
      icon="close"
      color="grey-8"
      size="md"
      class="mc-drawer-close"
      @click="mainStore.paymentDrawer = false"
    />

    <div class="q-pa-md q-pt-xl">
      <checkout-steps :current="3" @back="mainStore.paymentDrawer = false" />
      <h5 class="mc-drawer-title q-mb-md">Datos de Pago</h5>

      <!-- Tip Section -->
      <div class="mc-form-section">
        <h6 class="mc-section-title">Propina</h6>
        <p class="mc-section-caption">
          Opcional — va completa para el equipo del restaurante 🙌
        </p>
        <div class="mc-tip-grid">
          <q-btn
            v-for="amount in [0, 10, 20, 30, 40]"
            :key="amount"
            :outline="!(mainStore.tip.type === 'price' && mainStore.tip.value === amount)"
            :unelevated="mainStore.tip.type === 'price' && mainStore.tip.value === amount"
            :color="mainStore.tip.type === 'price' && mainStore.tip.value === amount ? 'primary' : 'grey-4'"
            :text-color="mainStore.tip.type === 'price' && mainStore.tip.value === amount ? 'white' : 'grey-8'"
            :label="amount === 0 ? 'Sin propina' : `$${amount}`"
            no-caps
            dense
            class="mc-tip-btn"
            @click="mainStore.setTip(amount)"
          />
          <q-btn
            :outline="mainStore.tip.type !== 'otro'"
            :unelevated="mainStore.tip.type === 'otro'"
            :color="mainStore.tip.type === 'otro' ? 'primary' : 'grey-4'"
            :text-color="mainStore.tip.type === 'otro' ? 'white' : 'grey-8'"
            label="Otro"
            no-caps
            dense
            class="mc-tip-btn"
            @click="mainStore.setTip('otro')"
          />
        </div>
        <q-input
          filled
          dense
          rounded
          type="number"
          v-model.number="mainStore.tip.value"
          label="Monto personalizado"
          class="q-mt-sm"
          v-if="mainStore.tip.type === 'otro'"
          min="0"
          :rules="[val => val >= 0 || 'La propina no puede ser negativa']"
        >
          <template v-slot:prepend>
            <q-icon name="paid" />
          </template>
        </q-input>
      </div>

      <!-- Coupon -->
      <div class="mc-form-section">
        <h6 class="mc-section-title">Cupón de descuento</h6>
        <div v-if="!mainStore.coupon.applied" class="row q-gutter-sm items-center">
          <q-input
            filled
            dense
            rounded
            v-model="couponCode"
            label="Código de cupón"
            class="col"
            @keyup.enter="applyCoupon"
          />
          <q-btn
            color="primary"
            label="Aplicar"
            unelevated
            no-caps
            dense
            class="mc-coupon-btn"
            :loading="applyingCoupon"
            :disable="!couponCode"
            @click="applyCoupon"
          />
        </div>
        <div v-else class="mc-coupon-applied">
          <div class="mc-coupon-applied__info">
            <q-icon name="check_circle" color="positive" size="20px" />
            <span class="mc-coupon-applied__code">{{ mainStore.coupon.code }}</span>
            <span class="mc-coupon-applied__discount">-${{ mainStore.coupon.discount.toFixed(2) }}</span>
          </div>
          <q-btn flat dense round icon="close" size="sm" color="grey-6" @click="mainStore.removeCoupon()" />
        </div>
      </div>

      <!-- Order Summary -->
      <div class="mc-order-summary">
        <div class="mc-summary-row">
          <span>Total del pedido</span>
          <span class="mc-summary-value">${{ Number(mainStore.total).toFixed(2) }}</span>
        </div>
        <div class="mc-summary-row">
          <span>Costo del envío</span>
          <span class="mc-summary-value">+ ${{ Number(mainStore.deliveryCharge).toFixed(2) }}</span>
        </div>
        <div class="mc-summary-row">
          <span>Propina</span>
          <span class="mc-summary-value">+ ${{ Number(mainStore.getTip).toFixed(2) }}</span>
        </div>
        <div class="mc-summary-row mc-summary-row--discount" v-if="mainStore.coupon.applied">
          <span>Descuento</span>
          <span class="mc-summary-value">- ${{ mainStore.coupon.discount.toFixed(2) }}</span>
        </div>
        <div class="mc-summary-row mc-summary-row--total">
          <span>Total a pagar</span>
          <span>${{ Number(mainStore.totalToPay).toFixed(2) }}</span>
        </div>
      </div>

      <!-- Payment Method -->
      <div
        :class="[
          'mc-form-section',
          mainStore.hasError.payment ? 'mc-form-section--error' : ''
        ]"
      >
        <h6 class="mc-section-title">Método de pago</h6>

        <!-- Cash -->
        <div
          :class="[
            'mc-payment-option',
            mainStore.payment.type === 'Efectivo' ? 'mc-payment-option--active' : ''
          ]"
          @click="mainStore.payment.type = 'Efectivo'"
        >
          <q-icon name="payments" size="24px" />
          <span class="mc-payment-option__label">Efectivo</span>
          <q-space />
          <q-icon
            :name="mainStore.payment.type === 'Efectivo' ? 'check_circle' : 'radio_button_unchecked'"
            :color="mainStore.payment.type === 'Efectivo' ? 'primary' : 'grey-5'"
            size="22px"
          />
        </div>
        <q-input
          filled
          dense
          rounded
          v-model.number="mainStore.payment.value"
          type="number"
          label="¿Con cuánto pagarás?"
          class="q-mb-md"
          v-if="mainStore.payment.type === 'Efectivo'"
          min="0"
          :error="mainStore.hasError.payment"
          error-message="El monto debe ser mayor o igual al total"
          :rules="[val => val >= 0 || 'El monto no puede ser negativo']"
        >
          <template v-slot:prepend>
            <q-icon name="paid" />
          </template>
        </q-input>

        <!-- Card -->
        <div
          v-if="mainStore.hasService(6)"
          :class="[
            'mc-payment-option',
            mainStore.payment.type === 'Tarjeta' ? 'mc-payment-option--active' : ''
          ]"
          @click="mainStore.payment.type = 'Tarjeta'"
        >
          <q-icon name="credit_card" size="24px" />
          <span class="mc-payment-option__label">Tarjeta (Terminal)</span>
          <q-space />
          <q-icon
            :name="mainStore.payment.type === 'Tarjeta' ? 'check_circle' : 'radio_button_unchecked'"
            :color="mainStore.payment.type === 'Tarjeta' ? 'primary' : 'grey-5'"
            size="22px"
          />
        </div>

        <!-- Transfer -->
        <div
          v-if="mainStore.hasService(9)"
          :class="[
            'mc-payment-option',
            mainStore.payment.type === 'Transferencia' ? 'mc-payment-option--active' : ''
          ]"
          @click="mainStore.payment.type = 'Transferencia'"
        >
          <q-icon name="account_balance" size="24px" />
          <span class="mc-payment-option__label">Transferencia</span>
          <q-space />
          <q-icon
            :name="mainStore.payment.type === 'Transferencia' ? 'check_circle' : 'radio_button_unchecked'"
            :color="mainStore.payment.type === 'Transferencia' ? 'primary' : 'grey-5'"
            size="22px"
          />
        </div>

        <!-- MercadoPago Online -->
        <div
          v-if="mainStore.hasService(10)"
          :class="[
            'mc-payment-option',
            mainStore.payment.type === 'MercadoPago' ? 'mc-payment-option--active' : ''
          ]"
          @click="mainStore.payment.type = 'MercadoPago'"
        >
          <q-icon name="credit_score" size="24px" />
          <span class="mc-payment-option__label">Pago en línea (MercadoPago)</span>
          <q-space />
          <q-icon
            :name="mainStore.payment.type === 'MercadoPago' ? 'check_circle' : 'radio_button_unchecked'"
            :color="mainStore.payment.type === 'MercadoPago' ? 'primary' : 'grey-5'"
            size="22px"
          />
        </div>
        <div class="mc-mercadopago-info" v-if="mainStore.payment.type === 'MercadoPago'">
          <q-icon name="info" size="16px" color="info" />
          <span>Serás redirigido a MercadoPago para completar el pago de forma segura después de enviar tu pedido.</span>
        </div>
        <div
          class="mc-bank-info"
          v-if="mainStore.payment.type === 'Transferencia'"
        >
          <div><strong>Nombre:</strong> {{ mainStore.company.bank.account_name }}</div>
          <div><strong>Banco:</strong> {{ mainStore.company.bank.bank_name }}</div>
          <div><strong>CLABE:</strong> {{ mainStore.company.bank.clabe }}</div>
        </div>
      </div>

      <!-- Comments -->
      <div class="mc-form-section">
        <h6 class="mc-section-title">Instrucciones para el restaurante</h6>
        <p class="mc-section-caption">
          Opcional — alergias, sin cebolla, tocar el timbre, etc.
        </p>
        <q-input
          filled
          dense
          rounded
          color="primary"
          v-model="mainStore.data.comments"
          type="textarea"
          autogrow
          placeholder="Ej: Sin cebolla, alergia al maní, dejar en recepción…"
        />
      </div>
    </div>

    <!-- Submit Button -->
    <div class="mc-submit-bar">
      <q-btn
        color="primary"
        unelevated
        no-caps
        size="lg"
        class="full-width mc-submit-btn"
        :loading="sendingOrder"
        :disable="sendingOrder"
        @click="submitOrder"
      >
        <q-icon name="check_circle" size="20px" class="q-mr-sm" />
        Enviar Pedido &mdash; ${{ Number(mainStore.totalToPay).toFixed(2) }}
      </q-btn>
    </div>
  </q-drawer>
</template>

<script setup>
defineOptions({
  name: "PaymentDrawer",
});
import { ref } from "vue";
import { useMainStore } from "src/stores/main-store";
import CheckoutSteps from "./CheckoutSteps.vue";
const mainStore = useMainStore();
const couponCode = ref("");
const sendingOrder = ref(false);
const applyingCoupon = ref(false);

const applyCoupon = async () => {
  if (!couponCode.value || applyingCoupon.value) return;
  applyingCoupon.value = true;
  try {
    await mainStore.applyCoupon(couponCode.value);
  } finally {
    applyingCoupon.value = false;
  }
};

const submitOrder = async () => {
  sendingOrder.value = true;
  try {
    await mainStore.creatingOrder();
  } finally {
    sendingOrder.value = false;
  }
};
</script>

<style lang="scss" scoped>
.mc-section-caption {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin: 0 0 var(--space-sm);
  line-height: 1.4;
}

.mc-drawer-title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 700;
  margin: 0;
  color: var(--color-text-primary);
}

.mc-tip-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm);
}

.mc-tip-btn {
  border-radius: var(--radius-sm) !important;
  font-weight: 500;
  min-height: 40px;
  transition: all var(--transition-fast) !important;
}

.mc-coupon-btn {
  border-radius: var(--radius-sm);
  font-weight: 600;
}

.mc-coupon-applied {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  background: color-mix(in srgb, var(--q-positive) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--q-positive) 25%, transparent);
  border-radius: var(--radius-md);

  &__info {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  &__code {
    font-family: monospace;
    font-weight: 700;
    font-size: var(--text-sm);
    letter-spacing: 0.05em;
  }

  &__discount {
    font-weight: 600;
    color: var(--q-positive);
    font-size: var(--text-sm);
  }
}

.mc-order-summary {
  background: var(--color-surface-variant);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
  border: 1px solid var(--color-border-subtle);

  .mc-summary-row {
    display: flex;
    justify-content: space-between;
    padding: var(--space-xs) 0;
    font-size: var(--text-sm);
    color: var(--color-text-secondary);

    &--discount {
      color: var(--q-positive);
      font-weight: 500;
    }

    &--total {
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--color-text-primary);
      padding-top: var(--space-md);
      margin-top: var(--space-sm);
      border-top: 2px solid var(--color-border);
    }
  }

  .mc-summary-value {
    font-variant-numeric: tabular-nums;
    font-weight: 500;
  }
}

.mc-payment-option {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-bottom: var(--space-sm);
  user-select: none;

  &:hover {
    border-color: var(--color-text-tertiary);
    background: var(--color-surface-variant);
  }

  &--active {
    border-color: var(--q-primary);
    background: var(--color-primary-soft);

    &:hover {
      background: var(--color-primary-soft);
    }
  }

  &__label {
    font-weight: 500;
    font-size: var(--text-base);
  }
}

.mc-mercadopago-info {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  background: color-mix(in srgb, var(--q-info) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--q-info) 20%, transparent);
  border-radius: var(--radius-sm);
  padding: var(--space-sm) var(--space-md);
  margin-bottom: var(--space-sm);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

.mc-bank-info {
  background: var(--color-surface-variant);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
  margin-bottom: var(--space-sm);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-subtle);

  div + div {
    margin-top: var(--space-xs);
  }

  strong {
    color: var(--color-text-primary);
  }
}

.mc-submit-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--space-md);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.mc-submit-btn {
  border-radius: var(--radius-md);
  font-weight: 700;
  letter-spacing: 0.02em;
}
</style>
