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
          class="q-mb-sm"
          :error="errors.phone"
          error-message="Escribe un teléfono de 10 dígitos"
          @update:model-value="errors.phone = false"
        >
          <template v-slot:prepend>
            <q-icon name="phone" />
          </template>
        </q-input>
        <q-input
          dense
          filled
          rounded
          v-model="mainStore.data.email"
          label="Correo (opcional)"
          type="email"
          hint="Para recibir la confirmación y el estado de tu pedido"
          :error="errors.email"
          error-message="Escribe un correo válido"
          @update:model-value="errors.email = false"
        >
          <template v-slot:prepend>
            <q-icon name="mail" />
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
        <p class="mc-delivery-charge" v-if="mainStore.deliveryCovered">
          <q-icon name="local_shipping" size="16px" class="q-mr-xs" />
          <template v-if="mainStore.deliveryEstimated">
            Envío estimado: <strong>${{ Number(mainStore.deliveryCharge).toFixed(2) }}</strong>
            <span class="mc-delivery-note">
              — el restaurante puede ajustarlo según la distancia
            </span>
          </template>
          <template v-else>
            Costo de envío: <strong>${{ Number(mainStore.deliveryCharge).toFixed(2) }}</strong>
          </template>
        </p>
        <p class="mc-delivery-outofrange" v-else>
          <q-icon name="wrong_location" size="16px" class="q-mr-xs" />
          Tu ubicación está <strong>fuera del área de entrega</strong> de este restaurante.
          Puedes elegir <strong>Recoger</strong> en su lugar.
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
          <img
            v-if="mainStore.establishment?.theme_config?.cart_image"
            :src="mainStore.establishment.theme_config.cart_image"
            class="mc-cart-bar-img"
            alt=""
          />
          <q-icon v-else name="shopping_cart" size="24px" />
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
import { ref, nextTick, watch } from "vue";
import { useMainStore } from "src/stores/main-store";
import CheckoutSteps from "./CheckoutSteps.vue";

const mainStore = useMainStore();
const formRef = ref(null);
const loadingTowns = ref(false);

// Errores por campo (mensajes inline en cada input)
const errors = ref({
  name: false,
  phone: false,
  email: false,
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

// Geocodifica la dirección cuando el cliente termina de escribirla, para poder
// cobrar el envío por distancia. El debounce evita una llamada por tecla; la
// limpieza previa impide cobrar con la coordenada de la dirección anterior
// mientras llega la nueva.
let geoTimer = null;
let geoPending = null;

watch(
  () => [
    mainStore.data.zip,
    mainStore.data.town,
    mainStore.data.street,
    mainStore.data.ext_number,
  ],
  () => {
    if (mainStore.data.delivery !== "Envio") return;
    mainStore.clearGeo();
    clearTimeout(geoTimer);
    const d = mainStore.data;
    if (!d.zip || !d.town || !d.street || !d.ext_number) return;
    geoTimer = setTimeout(() => {
      geoPending = mainStore.geocodeAddress();
    }, 600);
  }
);

// Resuelve el geocode pendiente (o lo fuerza si el debounce sigue corriendo).
// El cobro debe estar decidido antes de validar si la dirección queda dentro
// del área de entrega.
const settleGeocode = async () => {
  clearTimeout(geoTimer);
  const d = mainStore.data;
  if (!geoPending && !d.latitude && (d.zip || d.town)) {
    geoPending = mainStore.geocodeAddress();
  }
  if (geoPending) {
    await geoPending;
    geoPending = null;
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
  const email = (mainStore.data.email || "").trim();
  const e = {
    name: !mainStore.data.name,
    // Con fill-mask un teléfono incompleto conserva guiones bajos
    phone: !phone || phone.includes("_"),
    // Email es opcional: solo se valida el formato si el cliente escribió algo
    email: email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    town: false,
    street: false,
    ext: false,
    table: false,
  };

  if (mainStore.data.delivery === "Envio") {
    await settleGeocode();
    e.town = !mainStore.data.town;
    e.street = !mainStore.data.street;
    e.ext = !mainStore.data.ext_number;
    // Fuera del área de entrega: no dejar continuar a domicilio.
    if (!mainStore.deliveryCovered) {
      mainStore.messageStore.error(
        "Tu ubicación está fuera del área de entrega. Elige Recoger o cambia la dirección."
      );
      addressError.value = true;
      await nextTick();
      scrollToFirstError();
      return;
    }
  }
  if (mainStore.data.delivery === "Reservar") {
    e.table = !mainStore.data.table;
  }
  errors.value = e;

  // Resaltado de secciones
  personalDataError.value = e.name || e.phone || e.email;
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
  const coordinates = (mainStore.bussinessMap || "").replace(/\s/g, "");
  if (!coordinates) return; // Sin coordenadas configuradas: no abrir un mapa vacío
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinates)}`;
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
  // El aviso de "estimado" es largo: sin wrap se saldría del ancho del cajón.
  flex-wrap: wrap;

  strong {
    color: var(--q-primary);
  }
}

// Renglón propio debajo del monto, para no empujar nada fuera de vista.
.mc-delivery-note {
  flex-basis: 100%;
  color: var(--color-text-tertiary);
  font-size: var(--text-xs);
  line-height: 1.3;
  margin-top: 2px;
}

.mc-delivery-outofrange {
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-md);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--q-negative) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--q-negative) 35%, transparent);
  display: flex;
  align-items: flex-start;
  line-height: 1.4;

  .q-icon { color: var(--q-negative); margin-top: 2px; }
  strong { color: var(--q-negative); }
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
