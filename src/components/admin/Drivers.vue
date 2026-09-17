<template>
  <q-card flat class="mc-admin-card">
    <div class="mc-admin-card__header">
      <div class="mc-admin-card__title">
        <q-icon name="delivery_dining" size="24px" color="primary" class="q-mr-sm" />
        Repartidores
      </div>
      <q-btn
        unelevated
        color="primary"
        icon="add"
        label="Nuevo repartidor"
        no-caps
        size="sm"
        class="mc-add-btn"
        @click="openForm()"
      />
    </div>

    <div v-if="loading" class="mc-loading">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <template v-else>
      <div v-if="drivers.length" class="mc-drivers-list">
        <div
          class="mc-driver-card"
          v-for="driver in drivers"
          :key="driver.id"
          :class="{ 'mc-driver-card--inactive': driver.status === 'offline' }"
        >
          <div class="mc-driver-card__header">
            <q-avatar size="40px" color="primary" text-color="white">
              {{ driver.name?.charAt(0)?.toUpperCase() }}
            </q-avatar>
            <div class="mc-driver-card__info">
              <span class="mc-driver-card__name">{{ driver.name }}</span>
              <span class="mc-driver-card__phone">{{ driver.phone }}</span>
              <span class="mc-driver-card__phone" v-if="mostrarLocal">
                <q-icon name="storefront" size="12px" /> {{ nombreLocal(driver.local) }}
              </span>
            </div>
            <q-chip
              dense
              :color="driver.status === 'available' ? 'positive' : driver.status === 'busy' ? 'warning' : 'grey-5'"
              text-color="white"
              size="sm"
            >
              {{ driver.status === 'available' ? 'Disponible' : driver.status === 'busy' ? 'Ocupado' : 'Offline' }}
            </q-chip>
          </div>

          <div class="mc-driver-card__stats" v-if="driver.active_delivery">
            <q-icon name="local_shipping" size="16px" color="warning" />
            <span>En entrega - Orden #{{ driver.active_delivery.order?.order_code }}</span>
          </div>

          <div class="mc-driver-card__actions">
            <q-btn flat dense no-caps size="sm" icon="edit" label="Editar" color="primary" @click="openForm(driver)" />
            <q-btn flat dense no-caps size="sm" :icon="driver.status === 'available' ? 'pause' : 'play_arrow'" :label="driver.status === 'available' ? 'Desactivar' : 'Activar'" :color="driver.status === 'available' ? 'warning' : 'positive'" @click="toggleActive(driver)" />
            <q-btn flat dense round size="sm" icon="delete" color="negative" aria-label="Eliminar repartidor" @click="askDeleteDriver(driver)">
              <q-tooltip>Eliminar repartidor</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>

      <div v-else class="mc-empty-state">
        <q-icon name="delivery_dining" size="56px" color="grey-4" />
        <p>No hay repartidores registrados</p>
      </div>
    </template>

    <!-- Form Dialog -->
    <q-dialog v-model="showForm" backdrop-filter="blur(8px)">
      <q-card class="mc-form-dialog">
        <q-card-section class="mc-form-header">
          <span>{{ editingDriver ? 'Editar repartidor' : 'Nuevo repartidor' }}</span>
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-input filled dense rounded v-model="form.name" label="Nombre" class="q-mb-md" />
          <q-input filled dense rounded v-model="form.phone" label="Teléfono" class="q-mb-md" />
          <q-input filled dense rounded v-model="form.email" label="Email (opcional)" class="q-mb-md" />
          <!-- De que local reparte. Compartido le sirve a todos; uno de Centro solo le sale
               a la cajera de Centro (y al dueño). -->
          <q-select
            v-if="mostrarLocal"
            filled
            dense
            rounded
            v-model="form.local"
            :options="opcionesLocal"
            emit-value
            map-options
            label="Local"
            class="q-mb-md"
          />
          <!-- De una lista y no escrito a mano: libre, "Moto", "moto" y "Motocicleta"
               salian como tres vehiculos distintos al asignar repartidor. -->
          <q-select
            filled
            dense
            rounded
            v-model="form.vehicle_type"
            :options="opcionesDeVehiculo(form.vehicle_type)"
            label="Tipo de vehículo"
            clearable
            class="q-mb-md"
          />
          <q-input
            v-if="llevaPlacas(form.vehicle_type)"
            filled
            dense
            rounded
            v-model="form.vehicle_plate"
            label="Placas (opcional)"
          />
        </q-card-section>

        <q-card-actions class="q-px-lg q-pb-lg">
          <q-btn flat no-caps label="Cancelar" color="grey-7" v-close-popup />
          <q-space />
          <q-btn unelevated no-caps color="primary" :label="editingDriver ? 'Actualizar' : 'Crear'" @click="saveDriver" :loading="saving" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script setup>
defineOptions({ name: "DriversComponent" });

import { ref, computed, onMounted } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";
import { useCompanyStore } from "src/stores/company-store";
import { opcionesDeLocal, nombreDelLocal, tieneSucursales } from "src/utils/sucursales";
import { useConfirmDialog } from "src/composables/useConfirmDialog";
import { normalizarVehiculo, opcionesDeVehiculo, llevaPlacas } from "src/utils/vehiculos";

const adminStore = useAdminStore();
const { confirmDelete } = useConfirmDialog();
const drivers = ref([]);
const loading = ref(true);
const showForm = ref(false);
const saving = ref(false);
const editingDriver = ref(null);

// "compartido" y no null: el select de Quasar lee null como "sin elegir". Al servidor se
// le manda null.
const COMPARTIDO = "compartido";
const defaultForm = () => ({
  name: "",
  phone: "",
  email: "",
  vehicle_type: "",
  vehicle_plate: "",
  local: COMPARTIDO,
  localAntes: COMPARTIDO,
});
const form = ref(defaultForm());

// --- Local ---------------------------------------------------------------------
const companyStore = useCompanyStore();

/** Se pregunta si el negocio tiene sucursales, o si alguien ya tiene local: asi se le puede quitar. */
const mostrarLocal = computed(
  () => tieneSucursales(companyStore.company) || drivers.value.some((d) => d.local)
);

const nombreLocal = (local) => {
  if (!local) return "Compartido";
  return nombreDelLocal(local, companyStore.company) ?? "Sucursal apagada";
};

const opcionesLocal = computed(() => {
  const opciones = [
    { value: COMPARTIDO, label: "Compartido (todos los locales)" },
    ...opcionesDeLocal(companyStore.company).filter((o) => o.value !== null),
  ];
  // Uno que ya estaba en una sucursal apagada: que se vea como tal y no como un numero.
  const actual = form.value.local;
  if (actual !== COMPARTIDO && !opciones.some((o) => o.value === actual)) {
    opciones.push({ value: actual, label: nombreLocal(actual) });
  }
  return opciones;
});

const openForm = (driver = null) => {
  if (driver) {
    editingDriver.value = driver;
    form.value = {
      name: driver.name,
      phone: driver.phone,
      email: driver.email || "",
      // Lo que se escribio a mano antes de la lista se acomoda a su opcion ("moto" es
      // "Moto"); si no corresponde a ninguna, se queda como estaba.
      vehicle_type: normalizarVehiculo(driver.vehicle_type),
      vehicle_plate: driver.vehicle_plate || "",
      local: driver.local ?? COMPARTIDO,
      localAntes: driver.local ?? COMPARTIDO,
    };
  } else {
    editingDriver.value = null;
    form.value = defaultForm();
  }
  showForm.value = true;
};

const saveDriver = async () => {
  if (!form.value.name || !form.value.phone) {
    adminStore.messageStore.error("Nombre y teléfono son obligatorios");
    return;
  }
  const { local, localAntes, ...datos } = form.value;
  const cuerpo = {
    ...datos,
    // Si ya no se mueve en algo con placas, no se guardan las que tuviera de antes.
    vehicle_plate: llevaPlacas(form.value.vehicle_type) ? form.value.vehicle_plate : null,
  };
  // El local solo viaja si cambio: sin la llave, el servidor deja el que tenia.
  if (mostrarLocal.value && local !== localAntes) {
    cuerpo.local = local === COMPARTIDO ? null : local;
  }
  saving.value = true;
  try {
    if (editingDriver.value) {
      const { data } = await api.put(`/admin/${adminStore.slug}/drivers/${editingDriver.value.id}`, cuerpo);
      drivers.value = drivers.value.map((d) => d.id === data.driver.id ? data.driver : d);
      adminStore.messageStore.success("Repartidor actualizado");
    } else {
      const { data } = await api.post(`/admin/${adminStore.slug}/drivers`, cuerpo);
      drivers.value.push(data.driver);
      adminStore.messageStore.success("Repartidor creado");
    }
    showForm.value = false;
  } catch (e) {
    adminStore.messageStore.error(e.response?.data?.message || "Error al guardar repartidor");
  } finally {
    saving.value = false;
  }
};

const toggleActive = async (driver) => {
  const newStatus = driver.status === 'available' ? 'offline' : 'available';
  try {
    // Sin el local: activar no es cambiarlo de local, y asi el servidor no lo vuelve a validar.
    const { local, active_delivery, ...datos } = driver;
    const { data } = await api.put(`/admin/${adminStore.slug}/drivers/${driver.id}`, { ...datos, status: newStatus });
    drivers.value = drivers.value.map((d) => d.id === data.driver.id ? data.driver : d);
    adminStore.messageStore.success(data.driver.status === 'available' ? "Repartidor activado" : "Repartidor desactivado");
  } catch (e) {
    adminStore.messageStore.error("Error al actualizar repartidor");
  }
};

const deleteDriver = async (driver) => {
  try {
    await api.delete(`/admin/${adminStore.slug}/drivers/${driver.id}`);
    drivers.value = drivers.value.filter((d) => d.id !== driver.id);
    adminStore.messageStore.success("Repartidor eliminado");
  } catch (e) {
    adminStore.messageStore.error("Error al eliminar repartidor");
  }
};

// No permitir borrar a un repartidor con entrega en curso; confirmar siempre
const askDeleteDriver = (driver) => {
  if (driver.active_delivery) {
    adminStore.messageStore.error(
      "No puedes eliminar un repartidor con una entrega en curso."
    );
    return;
  }
  confirmDelete(`al repartidor ${driver.name}`, () => deleteDriver(driver));
};

onMounted(async () => {
  try {
    const { data } = await api.get(`/admin/${adminStore.slug}/drivers`);
    drivers.value = data.drivers;
  } catch (e) {
    adminStore.messageStore.error("Error al cargar repartidores");
  } finally {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
.mc-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.mc-add-btn {
  border-radius: var(--radius-md);
  font-weight: 600;
}

.mc-drivers-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-md);
  padding: var(--space-lg);
}

.mc-driver-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: box-shadow var(--transition-fast);

  &:hover { box-shadow: var(--shadow-md); }
  &--inactive { opacity: 0.6; }

  &__header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-md);
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__name {
    font-weight: 600;
    font-size: var(--text-sm);
    color: var(--color-text-primary);
  }

  &__phone {
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
  }

  &__stats {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-sm) var(--space-md);
    background: color-mix(in srgb, var(--q-warning) 8%, transparent);
    font-size: var(--text-xs);
    color: var(--q-warning);
    font-weight: 500;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-sm) var(--space-md);
    border-top: 1px solid var(--color-border-subtle);
  }
}

.mc-form-dialog {
  border-radius: var(--radius-xl);
  min-width: 380px;
  max-width: 480px;
}

.mc-form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--text-xl);
  font-weight: 700;
}

@media screen and (max-width: 600px) {
  .mc-drivers-list {
    grid-template-columns: 1fr;
    padding: var(--space-md);
  }
  .mc-form-dialog {
    min-width: 300px;
    max-width: calc(100vw - 32px);
  }
}
</style>
