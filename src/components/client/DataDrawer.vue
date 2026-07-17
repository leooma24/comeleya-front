<template>
  <q-drawer
    v-model="mainStore.dataDrawer"
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
      @click="mainStore.dataDrawer = false"
    />

    <div ref="formRef" class="q-pa-md q-pt-xl">
      <checkout-steps :current="2" @back="mainStore.dataDrawer = false" />
      <h5 class="mc-drawer-title q-mb-md">Completa los datos</h5>

      <!-- Personal Data -->
      <div
        :class="[
          'mc-form-section',
          personalDataError ? 'mc-form-section--error' : ''
        ]"
      >
        <h6 class="mc-section-title">Datos Personales</h6>
        <q-input
          filled
          dense
          rounded
          v-model="mainStore.data.name"
          label="Nombre"
          class="q-mb-sm"
          :error="errors.name"
          error-message="Escribe tu nombre"
          @update:model-value="errors.name = false"
        />
        <q-input
          dense
          filled
          rounded
          v-model="mainStore.data.phone"
          label="Teléfono"
          mask="(###) ###-####"
          fill-mask
          :error="errors.phone"
          error-message="Escribe un teléfono de 10 dígitos"
          @update:model-value="errors.phone = false"
        >
          <template v-slot:prepend>
            <q-icon name="phone" />
          </template>
        </q-input>
      </div>

      <!-- Delivery Type -->
      <div
        :class="[
          'mc-form-section',
          deliveryDataError ? 'mc-form-section--error' : ''
        ]"
      >
        <h6 class="mc-section-title">Tipo de Entrega</h6>
        <div class="mc-delivery-options">
          <div
            v-if="mainStore.hasService(1)"
            :class="[
              'mc-delivery-option',
              mainStore.data.delivery === 'Envio' ? 'mc-delivery-option--active' : ''
            ]"
            @click="mainStore.data.delivery = 'Envio'"
          >
            <q-icon name="delivery_dining" size="24px" />
            <span>A Domicilio</span>
          </div>
          <div
            :class="[
              'mc-delivery-option',
              mainStore.data.delivery === 'Recoger' ? 'mc-delivery-option--active' : ''
            ]"
            @click="mainStore.data.delivery = 'Recoger'"
          >
            <q-icon name="store" size="24px" />
            <span>Recoger</span>
          </div>
          <div
            v-if="mainStore.hasService(10)"
            :class="[
              'mc-delivery-option',
              mainStore.data.delivery === 'Reservar' ? 'mc-delivery-option--active' : ''
            ]"
            @click="mainStore.data.delivery = 'Reservar'"
          >
            <q-icon name="restaurant" size="24px" />
            <span>En Mesa</span>
          </div>
        </div>
      </div>

      <!-- Address (delivery) -->
      <div
        :class="[
          'mc-form-section',
          addressError ? 'mc-form-section--error' : ''
        ]"
        v-if="mainStore.data.delivery === 'Envio'"
      >
        <h6 class="mc-section-title">Dirección de Entrega</h6>
        <p class="mc-delivery-charge">
          <q-icon name="local_shipping" size="16px" class="q-mr-xs" />
          Costo de envío: <strong>${{ mainStore.deliveryCharge }}</strong>
        </p>

        <q-input
          filled
          dense
          rounded
          v-model="mainStore.data.zip"
          label="Código Postal"
          class="q-mb-sm"
          :loading="loadingTowns"
          @blur="loadTowns"
        />
        <q-select
          filled
          dense
          rounded
          v-model="mainStore.data.town"
          label="Colonia"
          :options="mainStore.data.towns"
          class="q-mb-sm"
          :error="errors.town"
          error-message="Elige tu colonia"
          @update:model-value="errors.town = false"
        />
        <q-input
          filled
          dense
          rounded
          v-model="mainStore.data.street"
          label="Calle"
          class="q-mb-sm"
          :error="errors.street"
          error-message="Escribe la calle"
          @update:model-value="errors.street = false"
        />
        <div class="row q-gutter-sm">
          <div class="col">
            <q-input
              filled
              dense
              rounded
              v-model="mainStore.data.ext_number"
              label="Núm. Exterior"
              :error="errors.ext"
              error-message="Falta el número"
              @update:model-value="errors.ext = false"
            />
          </div>
          <div class="col">
            <q-input
              filled
              dense
              rounded
              v-model="mainStore.data.int_number"
              label="Núm. Interior"
            />
          </div>
        </div>
        <q-input
          filled
          dense
          rounded
          v-model="mainStore.data.references"
          label="Referencias"
          type="textarea"
          class="q-mt-sm"
        />
      </div>

      <!-- Pickup -->
      <div
        class="mc-form-section"
        v-if="mainStore.data.delivery === 'Recoger'"
      >
        <h6 class="mc-section-title">Dirección del Comercio</h6>
        <p class="mc-text-secondary">{{ mainStore.businessAddress }}</p>
        <q-btn
          color="primary"
          label="Ver en Mapa"
          dense
          flat
          no-caps
          icon="location_on"
          @click="getMapDirection"
        />
      </div>

      <!-- Dine-in -->
      <div
        :class="[
          'mc-form-section',
          personsError ? 'mc-form-section--error' : ''
        ]"
        v-if="mainStore.data.delivery === 'Reservar'"
      >
        <h6 class="mc-section-title">Reservar Mesa</h6>
        <q-input
          filled
          dense
          rounded
          color="primary"
          v-model="mainStore.data.table"
          label="Número de Mesa"
          :error="errors.table"
          error-message="Escribe el número de mesa"
          @update:model-value="errors.table = false"
        />
      </div>
    </div>

    <!-- Bottom Bar -->
    <div
      class="mc-cart-bar mc-mb-fix absolute-bottom"
      @click="validateData"
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
  name: "DataDrawer",
});
import { ref, nextTick } from "vue";
import { useMainStore } from "src/stores/main-store";
import CheckoutSteps from "./CheckoutSteps.vue";

const mainStore = useMainStore();
const formRef = ref(null);
const loadingTowns = ref(false);

// Errores por campo (mensajes inline en cada input)
const errors = ref({
  name: false,
  phone: false,
  town: false,
  street: false,
  ext: false,
  table: false,
});

// Errores por sección (resaltado del bloque completo)
const personalDataError = ref(false);
const deliveryDataError = ref(false);
const addressError = ref(false);
const personsError = ref(false);

const loadTowns = async () => {
  if (!mainStore.data.zip) return;
  loadingTowns.value = true;
  try {
    await mainStore.getTowns();
  } finally {
    loadingTowns.value = false;
  }
};

const scrollToFirstError = () => {
  const el = formRef.value?.querySelector(
    ".q-field--error, .mc-form-section--error"
  );
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
};

const validateData = async () => {
  const phone = mainStore.data.phone || "";
  const e = {
    name: !mainStore.data.name,
    // Con fill-mask un teléfono incompleto conserva guiones bajos
    phone: !phone || phone.includes("_"),
    town: false,
    street: false,
    ext: false,
    table: false,
  };

  if (mainStore.data.delivery === "Envio") {
    e.town = !mainStore.data.town;
    e.street = !mainStore.data.street;
    e.ext = !mainStore.data.ext_number;
  }
  if (mainStore.data.delivery === "Reservar") {
    e.table = !mainStore.data.table;
  }
  errors.value = e;

  // Resaltado de secciones
  personalDataError.value = e.name || e.phone;
  deliveryDataError.value = !mainStore.data.delivery;
  addressError.value = e.town || e.street || e.ext;
  personsError.value = e.table;

  const hasError =
    Object.values(e).some(Boolean) || deliveryDataError.value;

  if (hasError) {
    await nextTick();
    scrollToFirstError();
    return;
  }

  mainStore.paymentDrawer = true;
};

const getMapDirection = () => {
  const coordinates = mainStore.bussinessMap.replace(/\s/g, "");
  const url = `https://www.google.com/maps/search/?api=1&query=${coordinates}`;
  window.open(url, "_blank");
};
</script>

<style lang="scss" scoped>
.mc-drawer-title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 700;
  margin: 0;
  color: var(--color-text-primary);
}

.mc-delivery-charge {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-md);
  display: flex;
  align-items: center;

  strong {
    color: var(--q-primary);
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
