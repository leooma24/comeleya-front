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
        <admin-section
          icon="tune"
          title="Servicios"
          description="Prende y apaga lo que ofreces. Lo que apagues aquí deja de aparecerle al cliente en el menú."
        >

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
        </admin-section>

        <!-- Orders section: mínimo + pausar -->
        <admin-section
          class="q-mt-md"
          icon="receipt_long"
          title="Pedidos"
          description="El mínimo de compra y el botón para dejar de recibir pedidos cuando ya no te da la cocina."
        >

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
        </admin-section>

        <!-- Zona horaria -->
        <admin-section
          class="q-mt-md"
          icon="schedule"
          title="Zona horaria"
          description="Con qué hora se decide si estás abierto. Solo hace falta si algún cliente ve mal tu horario: normalmente usamos la hora de su propio teléfono."
        >
          <q-select
            v-model="adminStore.companyConfiguration.timezone"
            :options="timezoneOptions"
            label="Zona del negocio"
            emit-value
            map-options
            clearable
            filled
            dense
          />
        </admin-section>

        <!-- Ubicacion del negocio.

             Vivia DENTRO de "Envio a domicilio", y ahi no la veia quien solo da para
             recoger: en produccion 19 de 107 negocios no tienen ubicacion puesta, y a
             esos el boton "Ver en Mapa" del comensal no los podia llevar a ningun lado.
             Sacarla a su propia seccion es lo que hace que la vean.

             Y se pone a mano a proposito: sacarla de la direccion escrita da 1.15 km de
             error en la mediana y 2.69 km en el peor caso -medido contra 10 negocios que
             si la tienen puesta, ninguno cayo a menos de 200 m-. Parado en el negocio,
             el boton de abajo acierta a unos metros. -->
        <admin-section
          class="q-mt-md"
          icon="place"
          title="Ubicación del negocio"
          description="El punto exacto en el mapa. Es lo que se le abre al comensal que va a recoger, y lo que se usa para cobrar el envío por distancia."
        >
          <q-banner
            v-if="!adminStore.companyConfiguration.coordinates"
            dense
            class="bg-orange-1 text-orange-9 q-mb-sm"
            rounded
          >
            <template #avatar><q-icon name="warning" class="mc-ic-sm" /></template>
            Todavía no la pones. Párate en tu negocio y toca el botón de abajo.
            <template v-if="adminStore.companyConfiguration.delivery_mode === 'distance'">
              Sin ella no se puede calcular el envío por distancia.
            </template>
          </q-banner>

        <div class="mc-location">
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
        </admin-section>

        <!-- Envío a domicilio -->
        <admin-section
          class="q-mt-md"
          icon="local_shipping"
          title="Envío a domicilio"
          description="Cuánto cobras por llevar el pedido: una tarifa igual para todos, o calculada por la distancia desde tu negocio."
        >

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

        </admin-section>

        <!-- Bank transfer section -->
        <admin-section
          class="q-mt-md"
          icon="account_balance"
          title="Transferencias"
          description="Los datos de tu cuenta. Se los enseñamos al cliente que elija pagar por transferencia, para que sepa a dónde depositar."
        >

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
        </admin-section>

        <!-- Ticket impreso -->
        <admin-section
          class="q-mt-md"
          icon="receipt"
          title="Ticket impreso"
          description="Los datos de tu negocio que salen impresos en el ticket que le entregas al cliente."
        >

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
        </admin-section>
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
import AdminSection from "./AdminSection.vue";

// Las zonas de Mexico, con la ciudad que el dueño reconoce. Es una lista corta a
// proposito: enseñarle las 400 de la base de datos de zonas no le ayuda a elegir.
const timezoneOptions = [
  { label: "Tijuana / Baja California", value: "America/Tijuana" },
  { label: "Hermosillo / Sonora", value: "America/Hermosillo" },
  { label: "Mazatlán / Sinaloa, Nayarit", value: "America/Mazatlan" },
  { label: "Chihuahua", value: "America/Chihuahua" },
  { label: "Ciudad de México / centro y sur", value: "America/Mexico_City" },
  { label: "Cancún / Quintana Roo", value: "America/Cancun" },
];
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
// De aqui salio `.mc-form-section`, que ahora vive en app.scss y la usa AdminSection.
// Estaba encerrada en este <style scoped>, y por eso las demas pantallas del panel la
// reinventaron cada una a su manera hasta quedarse sin fondo ni borde. Se borra para
// que quede UNA definicion: si esta se hubiera quedado, las dos se separan con el
// tiempo y volvemos al mismo lugar.

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
