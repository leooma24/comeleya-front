<template>
  <q-card flat class="mc-admin-card">
    <div class="mc-admin-card__header">
      <div class="mc-admin-card__title">
        <q-icon name="confirmation_number" size="24px" color="primary" class="q-mr-sm" />
        Cupones
      </div>
      <q-btn
        unelevated
        color="primary"
        icon="add"
        label="Nuevo cupón"
        no-caps
        size="sm"
        class="mc-add-btn"
        @click="openForm()"
      />
    </div>

    <!-- Coupons list -->
    <div v-if="coupons.length" class="mc-coupons-list">
      <div
        class="mc-coupon-card"
        v-for="coupon in coupons"
        :key="coupon.id"
        :class="{ 'mc-coupon-card--inactive': !coupon.is_active }"
      >
        <div class="mc-coupon-card__header">
          <span class="mc-coupon-card__code">{{ coupon.code }}</span>
          <q-chip
            dense
            :color="coupon.is_active ? 'positive' : 'grey-5'"
            text-color="white"
            size="sm"
          >
            {{ coupon.is_active ? 'Activo' : 'Inactivo' }}
          </q-chip>
        </div>

        <div class="mc-coupon-card__body">
          <div class="mc-coupon-card__value">
            {{ coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}` }}
            <span class="mc-coupon-card__type">
              {{ coupon.type === 'percentage' ? 'de descuento' : 'de descuento fijo' }}
            </span>
          </div>

          <div class="mc-coupon-card__meta">
            <span v-if="coupon.min_order > 0">
              <q-icon name="shopping_cart" size="14px" /> Min: ${{ coupon.min_order }}
            </span>
            <span v-if="coupon.max_uses">
              <q-icon name="people" size="14px" /> {{ coupon.used_count }}/{{ coupon.max_uses }} usos
            </span>
            <span v-if="coupon.expires_at">
              <q-icon name="schedule" size="14px" /> {{ formatExpiry(coupon.expires_at) }}
            </span>
          </div>
        </div>

        <div class="mc-coupon-card__actions">
          <q-btn flat dense no-caps size="sm" icon="edit" label="Editar" color="primary" @click="openForm(coupon)" />
          <q-btn flat dense no-caps size="sm" :icon="coupon.is_active ? 'pause' : 'play_arrow'" :label="coupon.is_active ? 'Desactivar' : 'Activar'" :color="coupon.is_active ? 'warning' : 'positive'" @click="toggleActive(coupon)" />
          <q-btn flat dense round size="sm" icon="delete" color="negative" aria-label="Eliminar cupón" @click="askDeleteCoupon(coupon)">
            <q-tooltip>Eliminar cupón</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>

    <div v-else class="mc-empty-state">
      <q-icon name="confirmation_number" size="56px" color="grey-4" />
      <p>No hay cupones creados</p>
    </div>

    <!-- Form Dialog -->
    <q-dialog v-model="showForm" backdrop-filter="blur(8px)">
      <q-card class="mc-coupon-form">
        <q-card-section class="mc-form-header">
          <span>{{ editingCoupon ? 'Editar cupón' : 'Nuevo cupón' }}</span>
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-input filled dense rounded v-model="form.code" label="Código del cupón" class="q-mb-md" hint="Se convertirá a mayúsculas" />

          <div class="row q-gutter-sm q-mb-md">
            <q-select filled dense rounded v-model="form.type" :options="typeOptions" emit-value map-options label="Tipo" class="col" />
            <q-input filled dense rounded v-model="form.value" type="number" :label="form.type === 'percentage' ? 'Porcentaje (%)' : 'Monto ($)'" class="col" />
          </div>

          <q-input filled dense rounded v-model="form.min_order" type="number" label="Pedido mínimo ($)" class="q-mb-md" hint="0 = sin mínimo" />

          <q-input filled dense rounded v-model="form.max_uses" type="number" label="Máximo de usos" class="q-mb-md" hint="Vacío = ilimitado" />

          <q-input filled dense rounded v-model="form.expires_at" type="datetime-local" label="Fecha de expiración" class="q-mb-md" hint="Vacío = sin expiración" />
        </q-card-section>

        <q-card-actions class="q-px-lg q-pb-lg">
          <q-btn flat no-caps label="Cancelar" color="grey-7" v-close-popup />
          <q-space />
          <q-btn unelevated no-caps color="primary" :label="editingCoupon ? 'Actualizar' : 'Crear'" @click="saveCoupon" :loading="saving" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script setup>
defineOptions({
  name: "CouponsComponent",
});

import { ref, onMounted } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";
import { useConfirmDialog } from "src/composables/useConfirmDialog";

const adminStore = useAdminStore();
const { confirmDelete } = useConfirmDialog();
const coupons = ref([]);
const showForm = ref(false);
const saving = ref(false);
const editingCoupon = ref(null);

const typeOptions = [
  { label: "Porcentaje (%)", value: "percentage" },
  { label: "Monto fijo ($)", value: "fixed" },
];

const defaultForm = () => ({
  code: "",
  type: "percentage",
  value: "",
  min_order: 0,
  max_uses: "",
  expires_at: "",
});

const form = ref(defaultForm());

const formatExpiry = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const openForm = (coupon = null) => {
  if (coupon) {
    editingCoupon.value = coupon;
    form.value = {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      min_order: coupon.min_order,
      max_uses: coupon.max_uses || "",
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : "",
    };
  } else {
    editingCoupon.value = null;
    form.value = defaultForm();
  }
  showForm.value = true;
};

const saveCoupon = async () => {
  if (!form.value.code || !form.value.value) {
    adminStore.messageStore.error("Código y valor son obligatorios");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      ...form.value,
      max_uses: form.value.max_uses || null,
      expires_at: form.value.expires_at || null,
    };

    if (editingCoupon.value) {
      const { data } = await api.put(
        `/admin/${adminStore.slug}/coupons/${editingCoupon.value.id}`,
        payload
      );
      coupons.value = coupons.value.map((c) =>
        c.id === data.coupon.id ? data.coupon : c
      );
      adminStore.messageStore.success("Cupón actualizado");
    } else {
      const { data } = await api.post(
        `/admin/${adminStore.slug}/coupons`,
        payload
      );
      coupons.value.unshift(data.coupon);
      adminStore.messageStore.success("Cupón creado");
    }
    showForm.value = false;
  } catch (error) {
    adminStore.messageStore.error(
      error.response?.data?.message || "Error al guardar cupón"
    );
  } finally {
    saving.value = false;
  }
};

const toggleActive = async (coupon) => {
  try {
    const { data } = await api.put(
      `/admin/${adminStore.slug}/coupons/${coupon.id}/toggle`
    );
    coupons.value = coupons.value.map((c) =>
      c.id === data.coupon.id ? data.coupon : c
    );
    adminStore.messageStore.success(
      data.coupon.is_active ? "Cupón activado" : "Cupón desactivado"
    );
  } catch (error) {
    adminStore.messageStore.error("Error al actualizar cupón");
  }
};

const deleteCoupon = async (coupon) => {
  try {
    await api.delete(`/admin/${adminStore.slug}/coupons/${coupon.id}`);
    coupons.value = coupons.value.filter((c) => c.id !== coupon.id);
    adminStore.messageStore.success("Cupón eliminado");
  } catch (error) {
    adminStore.messageStore.error("Error al eliminar cupón");
  }
};

const askDeleteCoupon = (coupon) => {
  confirmDelete(`el cupón ${coupon.code}`, () => deleteCoupon(coupon));
};

onMounted(async () => {
  try {
    const { data } = await api.get(`/admin/${adminStore.slug}/coupons`);
    coupons.value = data.coupons;
  } catch (e) {
    adminStore.messageStore.error("Error al cargar cupones");
  }
});
</script>

<style lang="scss" scoped>
.mc-add-btn {
  border-radius: var(--radius-md);
  font-weight: 600;
}

.mc-coupons-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-md);
  padding: var(--space-lg);
}

.mc-coupon-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: box-shadow var(--transition-fast);

  &:hover {
    box-shadow: var(--shadow-md);
  }

  &--inactive {
    opacity: 0.6;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md);
    background: var(--color-surface-variant);
    border-bottom: 1px dashed var(--color-border);
  }

  &__code {
    font-family: monospace;
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--q-primary);
    letter-spacing: 0.1em;
  }

  &__body {
    padding: var(--space-md);
  }

  &__value {
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: var(--space-sm);
  }

  &__type {
    font-size: var(--text-sm);
    font-weight: 400;
    color: var(--color-text-secondary);
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-md);
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);

    span {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    padding: var(--space-sm) var(--space-md);
    border-top: 1px solid var(--color-border-subtle);
    background: var(--color-surface-variant);
  }
}

.mc-coupon-form {
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
  .mc-coupons-list {
    grid-template-columns: 1fr;
    padding: var(--space-md);
  }

  .mc-coupon-form {
    min-width: 300px;
    max-width: calc(100vw - 32px);
  }
}
</style>
