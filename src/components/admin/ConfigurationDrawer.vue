<template>
  <q-drawer
    :model-value="adminStore.configurationDrawer"
    @update:model-value="onDrawerModel"
    bordered
    overlay
    side="right"
    :width="$q.screen.width <= 440 ? $q.screen.width : 440"
    class="mc-form-drawer"
  >
    <div class="mc-form-drawer__header">
      <h6>Configuración</h6>
      <q-btn
        flat
        round
        dense
        icon="close"
        color="grey-6"
        @click="requestClose"
      />
    </div>

    <q-scroll-area style="height: calc(100% - 130px)">
      <div class="mc-form-drawer__body">
        <!-- Services section -->
        <div class="mc-config-section">
          <div class="mc-config-section__header">
            <q-icon name="tune" size="xs" color="primary" />
            <span class="mc-config-section__title">Servicios</span>
          </div>

          <div
            v-for="item in adminStore.companyConfiguration.features"
            :key="item.id"
            class="mc-config-toggle"
          >
            <q-toggle
              v-model="item.value"
              checked-icon="check"
              :label="item.name"
              color="primary"
              unchecked-icon="clear"
              dense
            />
          </div>
        </div>

        <!-- Orders section: mínimo + pausar -->
        <div class="mc-config-section q-mt-md">
          <div class="mc-config-section__header">
            <q-icon name="receipt_long" size="xs" color="primary" />
            <span class="mc-config-section__title">Pedidos</span>
          </div>

          <q-input
            v-model.number="adminStore.companyConfiguration.min_order"
            label="Pedido mínimo"
            type="number"
            filled
            dense
            prefix="$"
            hint="0 = sin mínimo"
            class="q-mb-md"
          />

          <div class="mc-config-toggle">
            <q-toggle
              v-model="adminStore.companyConfiguration.orders_paused"
              checked-icon="pause"
              unchecked-icon="check"
              label="Pausar pedidos (cierre temporal)"
              color="negative"
              dense
            />
          </div>
          <q-input
            v-if="adminStore.companyConfiguration.orders_paused"
            v-model="adminStore.companyConfiguration.paused_message"
            label="Mensaje para los clientes (opcional)"
            placeholder="Ej. Volvemos en 1 hora"
            filled
            dense
            class="q-mt-sm"
          />
          <p v-if="adminStore.companyConfiguration.orders_paused" class="mc-config-hint">
            Mientras esté activo, los clientes verán un aviso y no podrán completar pedidos.
          </p>
        </div>

        <!-- Envío a domicilio -->
        <div class="mc-config-section q-mt-md">
          <div class="mc-config-section__header">
            <q-icon name="local_shipping" size="xs" color="primary" />
            <span class="mc-config-section__title">Envío a domicilio</span>
          </div>

          <q-btn-toggle
            v-model="adminStore.companyConfiguration.delivery_mode"
            spread no-caps unelevated
            toggle-color="primary" color="grey-3" text-color="grey-8"
            :options="[
              { label: 'Tarifa fija', value: 'flat' },
              { label: 'Por distancia', value: 'distance' },
            ]"
            class="q-mb-md"
          />

          <q-input
            v-if="adminStore.companyConfiguration.delivery_mode !== 'distance'"
            v-model.number="adminStore.companyConfiguration.delivery_charge"
            type="number" prefix="$" label="Costo de envío" filled dense
          />

          <div v-else class="row q-col-gutter-sm">
            <q-input class="col-6" v-model.number="adminStore.companyConfiguration.delivery_base_fee" type="number" prefix="$" label="Tarifa base" filled dense />
            <q-input class="col-6" v-model.number="adminStore.companyConfiguration.delivery_base_km" type="number" suffix="km" label="Km incluidos" filled dense />
            <q-input class="col-6" v-model.number="adminStore.companyConfiguration.delivery_per_km" type="number" prefix="$" label="Por km extra" filled dense />
            <q-input class="col-6" v-model.number="adminStore.companyConfiguration.delivery_max_km" type="number" suffix="km" label="Radio máx" hint="0 = sin límite" filled dense />
            <q-input class="col-12 q-mt-xs" v-model.number="adminStore.companyConfiguration.delivery_free_from" type="number" prefix="$" label="Envío gratis desde" hint="0 = desactivado" filled dense />
          </div>
          <p v-if="adminStore.companyConfiguration.delivery_mode === 'distance'" class="mc-config-hint">
            Usa la ubicación del cliente y las coordenadas de tu negocio para calcular la distancia.
          </p>

          <!-- Ubicación del negocio (coordenadas) -->
          <div class="mc-location q-mt-md">
            <div class="mc-location__label">
              Ubicación del negocio
              <span
                v-if="adminStore.companyConfiguration.delivery_mode === 'distance'"
                class="text-negative"
              >
                (necesaria para "Por distancia")
              </span>
            </div>

            <q-btn
              unelevated
              no-caps
              color="primary"
              icon="my_location"
              label="Usar mi ubicación actual"
              size="sm"
              :loading="locating"
              class="q-mb-sm full-width"
              @click="useMyLocation"
            />

            <q-input
              v-model="adminStore.companyConfiguration.coordinates"
              label="Coordenadas (lat, lng)"
              placeholder="19.432608, -99.133209"
              filled
              dense
              hint="Párate en tu negocio y toca el botón, o pégalas desde Google Maps."
            />

            <div v-if="mapSrc" class="mc-location__map q-mt-sm">
              <iframe
                :src="mapSrc"
                title="Mapa del negocio"
                loading="lazy"
                referrerpolicy="no-referrer"
              ></iframe>
            </div>
            <a
              v-if="googleMapsLink"
              :href="googleMapsLink"
              target="_blank"
              rel="noopener"
              class="mc-location__link"
            >
              Ver en Google Maps
            </a>
          </div>
        </div>

        <!-- Bank transfer section -->
        <div class="mc-config-section q-mt-md">
          <div class="mc-config-section__header">
            <q-icon name="account_balance" size="xs" color="primary" />
            <span class="mc-config-section__title">Transferencias</span>
          </div>

          <q-input
            v-model="adminStore.companyConfiguration.clabe"
            label="CLABE Interbancaria"
            filled
            dense
            class="q-mb-md"
            :disable="!adminStore.hasService(9)"
          />

          <q-input
            v-model="adminStore.companyConfiguration.bank_name"
            label="Nombre del Banco"
            filled
            dense
            class="q-mb-md"
            :disable="!adminStore.hasService(9)"
          />

          <q-input
            v-model="adminStore.companyConfiguration.account_name"
            label="Titular de la Cuenta"
            filled
            dense
            :disable="!adminStore.hasService(9)"
          />

          <p v-if="!adminStore.hasService(9)" class="mc-config-hint">
            Activa el servicio de transferencias para configurar estos datos.
          </p>
        </div>

        <!-- Ticket impreso -->
        <div class="mc-config-section q-mt-md">
          <div class="mc-config-section__header">
            <q-icon name="receipt" size="xs" color="primary" />
            <span class="mc-config-section__title">Ticket impreso</span>
          </div>

          <q-input
            v-model="adminStore.companyConfiguration.ticket_config.business_legal_name"
            label="Razón social"
            hint="Aparece bajo el nombre del negocio"
            filled
            dense
            class="q-mb-md"
          />

          <q-input
            v-model="adminStore.companyConfiguration.ticket_config.rfc"
            label="RFC"
            filled
            dense
            class="q-mb-md"
          />

          <q-input
            v-model="adminStore.companyConfiguration.ticket_config.suggestions_email"
            label="Email de sugerencias"
            type="email"
            filled
            dense
            class="q-mb-md"
          />

          <q-input
            v-model="adminStore.companyConfiguration.ticket_config.footer_text"
            label="Texto legal del pie"
            type="textarea"
            autogrow
            filled
            dense
            hint="Ej. Gracias por su preferencia. Este no es un comprobante fiscal."
            class="q-mb-md"
          />

          <div class="mc-config-toggle">
            <q-toggle
              v-model="adminStore.companyConfiguration.ticket_config.show_business_address"
              checked-icon="check"
              unchecked-icon="clear"
              label="Imprimir dirección del negocio"
              color="primary"
              dense
            />
          </div>
        </div>
      </div>
    </q-scroll-area>

    <div class="mc-form-drawer__save">
      <q-btn
        :loading="adminStore.loading"
        unelevated
        color="primary"
        icon="save"
        no-caps
        label="Guardar Configuración"
        @click="adminStore.saveConfiguration"
      />
    </div>
  </q-drawer>
</template>

<script setup>
defineOptions({
  name: "ConfigurationDrawer",
});

import { ref, computed, watch } from "vue";
import { useQuasar } from "quasar";
import { useAdminStore } from "src/stores/admin-store";
import { useUnsavedChanges } from "src/composables/useUnsavedChanges";
const adminStore = useAdminStore();
const $q = useQuasar();

// Aviso de cambios sin guardar al cerrar.
const { snap, isDirty, confirmClose } = useUnsavedChanges();
watch(() => adminStore.configurationDrawer, (v) => { if (v) snap(adminStore.companyConfiguration); });
const onDrawerModel = (v) => {
  if (v) { adminStore.configurationDrawer = true; return; }
  requestClose();
};
const requestClose = () =>
  confirmClose(
    isDirty(adminStore.companyConfiguration),
    () => { adminStore.saveConfiguration(); adminStore.configurationDrawer = false; },
    () => { adminStore.configurationDrawer = false; }
  );

const locating = ref(false);

const useMyLocation = () => {
  if (!navigator.geolocation) {
    $q.notify({ type: "negative", message: "Tu navegador no permite obtener la ubicación." });
    return;
  }
  locating.value = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude.toFixed(6);
      const lng = pos.coords.longitude.toFixed(6);
      adminStore.companyConfiguration.coordinates = `${lat},${lng}`;
      locating.value = false;
      $q.notify({ type: "positive", message: "Ubicación capturada. No olvides Guardar." });
    },
    () => {
      locating.value = false;
      $q.notify({
        type: "negative",
        message: "No se pudo obtener la ubicación. Da permiso al navegador o pégala manualmente.",
      });
    },
    { enableHighAccuracy: true, timeout: 12000 }
  );
};

const parsedCoords = computed(() => {
  const parts = String(adminStore.companyConfiguration.coordinates || "").split(",");
  if (parts.length < 2) return null;
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
});

const mapSrc = computed(() => {
  const c = parsedCoords.value;
  if (!c) return "";
  const d = 0.008;
  const bbox = `${c.lng - d},${c.lat - d},${c.lng + d},${c.lat + d}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${c.lat},${c.lng}`;
});

const googleMapsLink = computed(() => {
  const c = parsedCoords.value;
  return c ? `https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}` : "";
});
</script>

<style lang="scss" scoped>
.mc-config-section {
  background: var(--color-surface-variant);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  border: 1px solid var(--color-border-subtle);

  &__header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    margin-bottom: var(--space-md);
  }

  &__title {
    font-weight: 600;
    font-size: var(--text-sm);
    color: var(--color-text-primary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.mc-config-toggle {
  padding: var(--space-xs) 0;
  border-bottom: 1px solid var(--color-border-subtle);

  &:last-child {
    border-bottom: none;
  }
}

.mc-config-hint {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin: var(--space-sm) 0 0;
  font-style: italic;
}

.mc-location {
  &__label {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: var(--space-sm);
  }

  &__map {
    border-radius: var(--radius-md);
    overflow: hidden;
    border: 1px solid var(--color-border);

    iframe {
      display: block;
      width: 100%;
      height: 200px;
      border: 0;
    }
  }

  &__link {
    display: inline-block;
    margin-top: var(--space-sm);
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-primary);
    text-decoration: none;
  }
}
</style>
