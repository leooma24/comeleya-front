<template>
  <q-dialog v-model="show" backdrop-filter="blur(8px)">
    <q-card class="mc-reservation-dialog">
      <q-card-section class="mc-dialog-header">
        <div>
          <span class="mc-dialog-title">Reservar mesa</span>
          <span class="mc-dialog-subtitle">{{ companyStore.name }}</span>
        </div>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-card-section v-if="!submitted">
        <q-input
          filled dense rounded
          v-model="form.customer_name"
          label="Tu nombre"
          class="q-mb-md"
        >
          <template v-slot:prepend><q-icon name="person" /></template>
        </q-input>

        <q-input
          filled dense rounded
          v-model="form.phone"
          label="Teléfono"
          class="q-mb-md"
        >
          <template v-slot:prepend><q-icon name="phone" /></template>
        </q-input>

        <div class="row q-gutter-sm q-mb-md">
          <q-input
            filled dense rounded
            v-model="form.date"
            type="date"
            label="Fecha"
            class="col"
            :min="today"
          />
          <q-input
            filled dense rounded
            v-model="form.time"
            type="time"
            label="Hora"
            class="col"
          />
        </div>

        <q-input
          filled dense rounded
          v-model.number="form.party_size"
          type="number"
          label="Número de personas"
          class="q-mb-md"
          min="1"
          max="50"
        >
          <template v-slot:prepend><q-icon name="people" /></template>
        </q-input>

        <q-input
          filled dense rounded
          v-model="form.notes"
          type="textarea"
          label="Notas adicionales (opcional)"
          autogrow
        />
      </q-card-section>

      <q-card-section v-else class="mc-success-section">
        <q-icon name="check_circle" size="64px" color="positive" />
        <h5 class="mc-success-title">Reservación enviada</h5>
        <p class="mc-success-text">
          Tu reservación para <strong>{{ form.party_size }} persona{{ form.party_size > 1 ? 's' : '' }}</strong>
          el <strong>{{ formatDate(form.date) }}</strong> a las <strong>{{ form.time }}</strong>
          ha sido recibida. Te confirmaremos pronto.
        </p>
      </q-card-section>

      <q-card-actions class="q-px-lg q-pb-lg" v-if="!submitted">
        <q-btn flat no-caps label="Cancelar" color="grey-7" v-close-popup />
        <q-space />
        <q-btn unelevated no-caps color="primary" label="Reservar" icon="event_seat" @click="submitReservation" :loading="saving" />
      </q-card-actions>

      <q-card-actions class="q-px-lg q-pb-lg" v-else>
        <q-space />
        <q-btn unelevated no-caps color="primary" label="Cerrar" v-close-popup @click="reset" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
defineOptions({ name: "ReservationDialog" });

import { ref, computed } from "vue";
import { api } from "boot/axios";
import { useCompanyStore } from "src/stores/company-store";
import { useMessageStore } from "src/stores/message-store";

const companyStore = useCompanyStore();
const messageStore = useMessageStore();

const show = defineModel({ type: Boolean, default: false });

const saving = ref(false);
const submitted = ref(false);
const today = computed(() => new Date().toISOString().slice(0, 10));

const defaultForm = () => ({
  customer_name: "",
  phone: "",
  date: today.value,
  time: "19:00",
  party_size: 2,
  notes: "",
});

const form = ref(defaultForm());

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date + "T00:00:00").toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

const submitReservation = async () => {
  if (!form.value.customer_name || !form.value.phone || !form.value.date || !form.value.time) {
    messageStore.error("Completa todos los campos obligatorios");
    return;
  }
  saving.value = true;
  try {
    await api.post(`/${companyStore.slug}/reservations`, form.value);
    submitted.value = true;
  } catch (e) {
    messageStore.error(e.response?.data?.message || "Error al crear reservación");
  } finally {
    saving.value = false;
  }
};

const reset = () => {
  form.value = defaultForm();
  submitted.value = false;
};
</script>

<style lang="scss" scoped>
.mc-reservation-dialog {
  border-radius: var(--radius-xl);
  min-width: 380px;
  max-width: 480px;
}

.mc-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.mc-dialog-title {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text-primary);
  display: block;
}

.mc-dialog-subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}

.mc-success-section {
  text-align: center;
  padding: var(--space-xl);
}

.mc-success-title {
  font-size: var(--text-xl);
  font-weight: 700;
  margin: var(--space-md) 0 var(--space-sm);
}

.mc-success-text {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

@media screen and (max-width: 600px) {
  .mc-reservation-dialog {
    min-width: 300px;
    max-width: calc(100vw - 32px);
  }
}
</style>
