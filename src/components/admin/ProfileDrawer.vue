<template>
  <q-drawer
    :model-value="adminStore.profileDrawer"
    @update:model-value="onDrawerModel"
    bordered
    overlay
    side="right"
    :width="$q.screen.width <= 440 ? $q.screen.width : 440"
    class="mc-form-drawer"
  >
    <div class="mc-form-drawer__header">
      <h6>Mi Perfil</h6>
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
        <!-- General data section -->
        <div class="mc-profile-section">
          <div class="mc-profile-section__header">
            <q-icon name="person" size="xs" color="primary" />
            <span class="mc-profile-section__title">Datos Generales</span>
          </div>

          <q-input
            v-model="adminStore.userForm.name"
            label="Nombre"
            filled
            dense
            class="q-mb-md"
          />

          <q-input
            v-model="adminStore.userForm.email"
            label="Correo Electrónico"
            filled
            dense
            type="email"
            class="q-mb-md"
          />

          <q-input
            v-model="adminStore.userForm.phone"
            label="Teléfono"
            filled
            dense
            class="q-mb-md"
          />

          <q-input
            v-model="adminStore.userForm.cellphone"
            label="Celular"
            filled
            dense
            class="q-mb-md"
          />

          <q-input
            v-if="!adminStore.userForm.id"
            v-model="adminStore.userForm.password"
            label="Contraseña"
            filled
            dense
            type="password"
            class="q-mb-md"
          />

          <q-select
            v-if="adminStore.userStore.isSuperAdmin"
            v-model="adminStore.userForm.role"
            label="Rol"
            filled
            dense
            :options="['Usuario', 'Propietario', 'super_admin']"
            class="q-mb-md"
          />

          <q-select
            v-if="!adminStore.userForm.id"
            v-model="adminStore.userForm.status"
            label="Estado"
            filled
            dense
            :options="['Activo', 'Inactivo']"
          />
        </div>

        <!-- Password change section -->
        <div v-if="adminStore.userForm.id" class="mc-profile-section q-mt-md">
          <div class="mc-profile-section__header">
            <q-icon name="lock" size="xs" color="primary" />
            <span class="mc-profile-section__title">Cambiar Contraseña</span>
          </div>

          <q-input
            v-model="adminStore.userForm.current_password"
            label="Contraseña Actual"
            filled
            dense
            type="password"
            class="q-mb-md"
          />

          <q-input
            v-model="adminStore.userForm.new_password"
            label="Nueva Contraseña"
            filled
            dense
            type="password"
            class="q-mb-md"
          />

          <q-input
            v-model="adminStore.userForm.password_confirmation"
            label="Repetir Contraseña"
            filled
            dense
            type="password"
            class="q-mb-md"
          />

          <p class="mc-hint-text">
            Dejar en blanco si no quieres cambiar la contraseña
          </p>
        </div>

        <!-- QR section -->
        <div class="mc-profile-section q-mt-md">
          <div class="mc-profile-section__header">
            <q-icon name="qr_code" size="xs" color="primary" />
            <span class="mc-profile-section__title">Código QR</span>
          </div>

          <div class="mc-qr-section">
            <img
              v-if="adminStore.qr"
              :src="adminStore.qr"
              alt="QR"
              class="mc-qr-section__image"
            />
            <q-btn
              outline
              color="primary"
              icon="download"
              no-caps
              label="Descargar QR (imagen)"
              class="full-width q-mb-sm"
              @click="adminStore.downloadQr"
            />
            <q-btn
              unelevated
              color="primary"
              icon="picture_as_pdf"
              no-caps
              label="Descargar QR para imprimir (PDF)"
              class="full-width"
              @click="downloadQrPdf"
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
        label="Guardar Perfil"
        @click="adminStore.saveProfile"
      />
    </div>
  </q-drawer>
</template>

<script setup>
defineOptions({
  name: "ProfileDrawer",
});

import { watch } from "vue";
import { useQuasar } from "quasar";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";
import { useUnsavedChanges } from "src/composables/useUnsavedChanges";
const adminStore = useAdminStore();

// Aviso de cambios sin guardar al cerrar.
const { snap, isDirty, confirmClose } = useUnsavedChanges();
watch(() => adminStore.profileDrawer, (v) => { if (v) snap(adminStore.userForm); });
const onDrawerModel = (v) => {
  if (v) { adminStore.profileDrawer = true; return; }
  requestClose();
};
const requestClose = () =>
  confirmClose(
    isDirty(adminStore.userForm),
    () => { adminStore.saveProfile(); adminStore.profileDrawer = false; },
    () => { adminStore.profileDrawer = false; }
  );
const $q = useQuasar();

const downloadQrPdf = async () => {
  try {
    const response = await api.get(`/admin/${adminStore.slug}/qr-pdf`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${adminStore.slug}-qr.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (e) {
    adminStore.messageStore.error("Error al generar el PDF");
  }
};
</script>

<style lang="scss" scoped>
.mc-profile-section {
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

.mc-hint-text {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin: 0;
}

.mc-qr-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);

  &__image {
    max-width: 200px;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border-subtle);
  }
}
</style>
