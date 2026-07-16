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

    <div class="q-pa-md q-pt-xl">
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
          :rules="[val => !!val || 'Campo requerido']"
          lazy-rules
          hide-bottom-space
        />
        <q-input
          dense
          filled
          rounded
          v-model="mainStore.data.phone"
          label="Teléfono"
          mask="(###) ###-####"
          fill-mask
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
          @blur="mainStore.getTowns"
        />
        <q-select
          filled
          dense
          rounded
          v-model="mainStore.data.town"
          label="Colonia"
          :options="mainStore.data.towns"
          class="q-mb-sm"
        />
        <q-input
          filled
          dense
          rounded
          v-model="mainStore.data.street"
          label="Calle"
          class="q-mb-sm"
        />
        <div class="row q-gutter-sm">
          <div class="col">
            <q-input
              filled
              dense
              rounded
              v-model="mainStore.data.ext_number"
              label="Núm. Exterior"
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
import { ref } from "vue";
import { useMainStore } from "src/stores/main-store";

const mainStore = useMainStore();
const personalDataError = ref(false);
const deliveryDataError = ref(false);
const addressError = ref(false);
const personsError = ref(false);

const validateData = () => {
  personalDataError.value = false;
  deliveryDataError.value = false;
  addressError.value = false;
  personsError.value = false;

  if (!mainStore.data.name || mainStore.data.phone === "(___) ___-____" || !mainStore.data.phone) {
    personalDataError.value = true;
  }
  if (!mainStore.data.delivery) {
    deliveryDataError.value = true;
  }
  if (mainStore.data.delivery === "Envio") {
    if (
      !mainStore.data.town ||
      !mainStore.data.street ||
      !mainStore.data.ext_number
    ) {
      addressError.value = true;
    }
  }
  if (mainStore.data.delivery === "Reservar") {
    if (!mainStore.data.table) {
      personsError.value = true;
    }
  }
  if (
    personalDataError.value ||
    deliveryDataError.value ||
    addressError.value ||
    personsError.value
  )
    return;

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
