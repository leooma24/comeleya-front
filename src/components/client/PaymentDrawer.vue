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
            <span class="mc-coupon-applied__discount">-{{ dinero(mainStore.coupon.discount) }}</span>
          </div>
          <q-btn flat dense round icon="close" size="sm" color="grey-6" @click="mainStore.removeCoupon()" />
        </div>
      </div>

      <!-- Programar pedido para más tarde -->
      <div class="mc-form-section">
        <div class="mc-schedule-head">
          <h6 class="mc-section-title q-mb-none">Programar para más tarde</h6>
          <q-toggle v-model="mainStore.schedule.enabled" color="primary" dense />
        </div>
        <q-input
          v-if="mainStore.schedule.enabled"
          v-model="mainStore.schedule.at"
          type="datetime-local"
          filled dense rounded
          :min="minDateTime"
          class="q-mt-sm"
          hint="¿Para qué día y hora lo quieres?"
        />
      </div>

      <!-- Lealtad: canjear puntos -->
      <div v-if="mainStore.canRedeemLoyalty" class="mc-form-section">
        <h6 class="mc-section-title">Tus puntos de lealtad</h6>
        <div class="mc-loyalty-redeem">
          <q-toggle v-model="mainStore.loyalty.use" color="primary" dense />
          <div class="mc-loyalty-redeem__text">
            <span>Usar mis <strong>{{ mainStore.loyalty.points }}</strong> puntos</span>
            <span
              v-if="mainStore.loyalty.use && mainStore.loyaltyDiscount > 0"
              class="mc-loyalty-redeem__disc"
            >−{{ dinero(mainStore.loyaltyDiscount) }}</span>
          </div>
        </div>
      </div>

      <!-- De que sucursal sale.
           La sucursal YA se eligio en el paso de Datos; aqui no se vuelve a preguntar -eran
           las mismas opciones dos veces seguidas-. Solo se dice de cual sale, porque el
           costo del envio de abajo depende de ella, y se deja "Cambiar" que regresa a
           Datos. Solo aparece si el negocio tiene sucursales. -->
      <div class="mc-sucursal-resumen" v-if="mainStore.sucursales.length > 1 && mainStore.sucursalElegida">
        <q-icon name="storefront" size="18px" />
        <span class="mc-sucursal-resumen__txt">
          Tu pedido sale de <strong>{{ mainStore.sucursalElegida.name }}</strong>
        </span>
        <q-btn flat dense no-caps size="sm" color="primary" label="Cambiar" @click="cambiarSucursal" />
      </div>

      <!-- Lo que no hay en el local elegido.
           Es consecuencia de la sucursal: armó el pedido viendo el menú de un local y al
           cambiarse se entera aquí, no con un error al enviarlo. -->
      <div class="mc-falta" v-if="mainStore.faltanEnElLocal.length">
        <q-icon name="report_problem" size="20px" />
        <div>
          <strong>
            En {{ mainStore.sucursalElegida?.name }} no hay
            {{ mainStore.faltanEnElLocal.join(", ") }}.
          </strong>
          <span>Quítalo del pedido o </span>
          <a class="mc-falta__cambiar" href="#" @click.prevent="cambiarSucursal">elige otra sucursal</a>.
        </div>
      </div>

      <!-- Order Summary -->
      <div class="mc-order-summary">
        <div class="mc-summary-row">
          <span>Total del pedido</span>
          <span class="mc-summary-value">{{ dinero(mainStore.total) }}</span>
        </div>
        <!-- Solo a domicilio: para recoger o en mesa, "+ $0.00 de envio" es ruido. -->
        <div class="mc-summary-row" v-if="mainStore.data.delivery === 'Envio'">
          <span>
            Costo del envío
            <em class="mc-summary-desde" v-if="mainStore.sucursalElegida">
              desde {{ mainStore.sucursalElegida.name }}
            </em>
          </span>
          <span class="mc-summary-value">+ {{ dinero(mainStore.deliveryCharge) }}</span>
        </div>
        <div class="mc-summary-row" v-if="mainStore.getTip > 0">
          <span>Propina</span>
          <span class="mc-summary-value">+ {{ dinero(mainStore.getTip) }}</span>
        </div>
        <div class="mc-summary-row mc-summary-row--discount" v-if="mainStore.coupon.applied">
          <span>Descuento</span>
          <span class="mc-summary-value">- {{ dinero(mainStore.coupon.discount) }}</span>
        </div>
        <div class="mc-summary-row mc-summary-row--discount" v-if="mainStore.loyaltyDiscount > 0">
          <span>Puntos de lealtad</span>
          <span class="mc-summary-value">- {{ dinero(mainStore.loyaltyDiscount) }}</span>
        </div>
        <div class="mc-summary-row mc-summary-row--total">
          <span>Total a pagar</span>
          <span>{{ dinero(mainStore.totalToPay) }}</span>
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
            mainStore.payment.type === 'cash' ? 'mc-payment-option--active' : ''
          ]"
          @click="mainStore.payment.type = 'cash'"
        >
          <q-icon name="payments" size="24px" />
          <span class="mc-payment-option__label">Efectivo</span>
          <q-space />
          <q-icon
            :name="mainStore.payment.type === 'cash' ? 'check_circle' : 'radio_button_unchecked'"
            :color="mainStore.payment.type === 'cash' ? 'primary' : 'grey-5'"
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
          v-if="mainStore.payment.type === 'cash'"
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
            mainStore.payment.type === 'card' ? 'mc-payment-option--active' : ''
          ]"
          @click="mainStore.payment.type = 'card'"
        >
          <q-icon name="credit_card" size="24px" />
          <span class="mc-payment-option__label">Tarjeta (Terminal)</span>
          <q-space />
          <q-icon
            :name="mainStore.payment.type === 'card' ? 'check_circle' : 'radio_button_unchecked'"
            :color="mainStore.payment.type === 'card' ? 'primary' : 'grey-5'"
            size="22px"
          />
        </div>

        <!-- Transfer -->
        <div
          v-if="mainStore.hasService(9)"
          :class="[
            'mc-payment-option',
            mainStore.payment.type === 'transfer' ? 'mc-payment-option--active' : ''
          ]"
          @click="mainStore.payment.type = 'transfer'"
        >
          <q-icon name="account_balance" size="24px" />
          <span class="mc-payment-option__label">Transferencia</span>
          <q-space />
          <q-icon
            :name="mainStore.payment.type === 'transfer' ? 'check_circle' : 'radio_button_unchecked'"
            :color="mainStore.payment.type === 'transfer' ? 'primary' : 'grey-5'"
            size="22px"
          />
        </div>

        <!-- MercadoPago Online: lo prenden las llaves que el negocio guardó en su panel -->
        <div
          v-if="pagoEnLineaDisponible(mainStore.establishment, ligaDePruebas)"
          :class="[
            'mc-payment-option',
            mainStore.payment.type === 'MercadoPago' ? 'mc-payment-option--active' : ''
          ]"
          @click="mainStore.payment.type = 'MercadoPago'"
        >
          <q-icon name="credit_score" size="24px" />
          <span class="mc-payment-option__label">
            Pago en línea (MercadoPago)
            <q-badge v-if="mainStore.establishment?.mp_sandbox" color="warning" text-color="black" label="PRUEBA" class="q-ml-xs" />
          </span>
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
          v-if="mainStore.payment.type === 'transfer'"
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
        :disable="sendingOrder || mainStore.faltanEnElLocal.length > 0"
        @click="submitOrder"
      >
        <q-icon name="check_circle" size="20px" class="q-mr-sm" />
        Enviar Pedido &mdash; {{ dinero(mainStore.totalToPay) }}
      </q-btn>
    </div>
  </q-drawer>
</template>

<script setup>
defineOptions({
  name: "PaymentDrawer",
});
import { ref, watch, computed } from "vue";
import { useMainStore } from "src/stores/main-store";
import CheckoutSteps from "./CheckoutSteps.vue";
import { dinero } from "src/utils/dinero";
import { pagoEnLineaDisponible, esLigaDePruebas } from "src/utils/metodosPago";
const mainStore = useMainStore();

// El dueño abre el menú con ?pruebas=mp para probar el pago en línea mientras el modo de
// pruebas lo esconde de los clientes.
const ligaDePruebas = esLigaDePruebas();

/** La sucursal se elige en el paso de Datos, que queda abierto debajo: se regresa a el. */
const cambiarSucursal = () => {
  mainStore.paymentDrawer = false;
};

// Mínimo para programar: 15 min en el futuro, en formato datetime-local.
const minDateTime = computed(() => {
  const pad = (n) => String(n).padStart(2, "0");
  const d = new Date(Date.now() + 15 * 60000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
});
const couponCode = ref("");
const sendingOrder = ref(false);
const applyingCoupon = ref(false);

// Al abrir el pago, consulta los puntos del cliente (por el teléfono ya capturado).
watch(
  () => mainStore.paymentDrawer,
  (open) => {
    if (open) mainStore.checkLoyalty();
  }
);

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

/* ===== Lo que no hay en el local elegido ===== */
.mc-falta {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin: 0 0 14px;
  padding: 12px 14px;
  border: 1px solid #f0c36d;
  border-radius: 12px;
  background: #fff8e6;
  color: #7a5200;
  font-size: 13px;
  line-height: 1.4;

  strong { display: block; font-weight: 600; }
  span { opacity: 0.85; }
}

/* ===== De que sucursal sale (ya elegida en Datos) ===== */
.mc-sucursal-resumen {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: var(--space-md);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  background: var(--color-surface-variant);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);

  .q-icon { flex-shrink: 0; color: var(--q-primary); }
  strong { color: var(--color-text-primary); }
}

.mc-sucursal-resumen__txt {
  flex: 1;
  min-width: 0;
}

.mc-falta__cambiar {
  color: inherit;
  font-weight: 600;
  text-decoration: underline;
}

/* Que el cobro salga de una sucursal y no de "el restaurante" tiene que estar dicho
   donde esta el cobro, si no parece que el precio cambio solo. */
.mc-summary-desde {
  font-style: normal;
  font-size: 10.5px;
  color: var(--color-text-tertiary);
  display: block;
}

.mc-section-caption {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin: 0 0 var(--space-sm);
  line-height: 1.4;
}

.mc-schedule-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
}

.mc-loyalty-redeem {
  display: flex;
  align-items: center;
  gap: var(--space-sm);

  &__text {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex: 1;
    font-size: var(--text-sm);
    color: var(--color-text-primary);
  }

  &__disc {
    font-weight: 700;
    color: var(--q-primary);
  }
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
