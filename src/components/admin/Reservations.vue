<template>
  <q-card flat class="mc-admin-card">
    <div class="mc-admin-card__header">
      <div class="mc-admin-card__title">
        <q-icon name="event_seat" size="24px" color="primary" class="q-mr-sm" />
        Reservaciones
      </div>
      <q-btn-toggle
        v-model="filter"
        no-caps
        rounded
        unelevated
        toggle-color="primary"
        size="sm"
        :options="[
          { label: 'Próximas', value: 'upcoming' },
          { label: 'Todas', value: 'all' },
        ]"
        @update:model-value="loadReservations"
      />
    </div>

    <div v-if="loading" class="mc-loading">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <template v-else>
      <div v-if="reservations.length" class="mc-reservations-list">
        <div
          class="mc-reservation-card"
          v-for="reservation in reservations"
          :key="reservation.id"
        >
          <div class="mc-reservation-card__header">
            <div>
              <span class="mc-reservation-card__name">{{ reservation.customer_name }}</span>
              <span class="mc-reservation-card__phone">{{ reservation.phone }}</span>
            </div>
            <q-chip
              dense
              :color="statusColor(reservation.status)"
              text-color="white"
              size="sm"
            >
              {{ statusLabel(reservation.status) }}
            </q-chip>
          </div>

          <div class="mc-reservation-card__body">
            <div class="mc-reservation-card__detail">
              <q-icon name="event" size="16px" />
              {{ formatDate(reservation.date) }}
            </div>
            <div class="mc-reservation-card__detail">
              <q-icon name="schedule" size="16px" />
              {{ reservation.time }}
            </div>
            <div class="mc-reservation-card__detail">
              <q-icon name="people" size="16px" />
              {{ reservation.party_size }} personas
            </div>
            <div class="mc-reservation-card__detail" v-if="reservation.notes">
              <q-icon name="notes" size="16px" />
              {{ reservation.notes }}
            </div>
          </div>

          <div class="mc-reservation-card__actions" v-if="reservation.status === 'pending'">
            <q-btn flat dense no-caps size="sm" icon="check" label="Confirmar" color="positive" @click="updateStatus(reservation, 'confirmed')" />
            <q-btn flat dense no-caps size="sm" icon="close" label="Rechazar" color="negative" @click="updateStatus(reservation, 'cancelled')" />
          </div>
          <div class="mc-reservation-card__actions" v-else-if="reservation.status === 'confirmed'">
            <q-btn flat dense no-caps size="sm" icon="done_all" label="Completada" color="primary" @click="updateStatus(reservation, 'completed')" />
            <q-btn flat dense no-caps size="sm" icon="person_off" label="No show" color="warning" @click="updateStatus(reservation, 'no_show')" />
          </div>
        </div>
      </div>

      <div v-else class="mc-empty-state">
        <q-icon name="event_seat" size="56px" color="grey-4" />
        <p>No hay reservaciones</p>
      </div>
    </template>
  </q-card>
</template>

<script setup>
defineOptions({ name: "ReservationsComponent" });

import { ref, onMounted } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";

const adminStore = useAdminStore();
const reservations = ref([]);
const loading = ref(true);
const filter = ref("upcoming");

const statusColor = (status) => {
  const map = { pending: "warning", confirmed: "positive", cancelled: "negative", completed: "primary", no_show: "grey-6" };
  return map[status] || "grey";
};

const statusLabel = (status) => {
  const map = { pending: "Pendiente", confirmed: "Confirmada", cancelled: "Cancelada", completed: "Completada", no_show: "No asistió" };
  return map[status] || status;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });
};

const loadReservations = async () => {
  loading.value = true;
  try {
    const endpoint = filter.value === "upcoming"
      ? `/admin/${adminStore.slug}/reservations`
      : `/admin/${adminStore.slug}/reservations/all`;
    const { data } = await api.get(endpoint);
    reservations.value = data.reservations;
  } catch (e) {
    adminStore.messageStore.error("Error al cargar reservaciones");
  } finally {
    loading.value = false;
  }
};

const updateStatus = async (reservation, status) => {
  try {
    const { data } = await api.put(`/admin/${adminStore.slug}/reservations/${reservation.id}`, { status });
    reservations.value = reservations.value.map((r) =>
      r.id === data.reservation.id ? data.reservation : r
    );
    adminStore.messageStore.success("Reservación actualizada");
  } catch (e) {
    adminStore.messageStore.error("Error al actualizar reservación");
  }
};

onMounted(loadReservations);
</script>

<style lang="scss" scoped>
.mc-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.mc-reservations-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-md);
  padding: var(--space-lg);
}

.mc-reservation-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: box-shadow var(--transition-fast);

  &:hover { box-shadow: var(--shadow-md); }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md);
    background: var(--color-surface-variant);
    border-bottom: 1px solid var(--color-border-subtle);
  }

  &__name {
    font-weight: 600;
    font-size: var(--text-sm);
    color: var(--color-text-primary);
    display: block;
  }

  &__phone {
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
  }

  &__body {
    padding: var(--space-md);
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  &__detail {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    background: var(--color-surface-variant);
    padding: 4px 8px;
    border-radius: var(--radius-sm);
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-sm) var(--space-md);
    border-top: 1px solid var(--color-border-subtle);
  }
}

@media screen and (max-width: 600px) {
  .mc-reservations-list {
    grid-template-columns: 1fr;
    padding: var(--space-md);
  }
}
</style>
