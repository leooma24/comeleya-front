<template>
  <q-drawer
    v-model="adminStore.establishmentDrawer"
    bordered
    overlay
    side="right"
    :width="$q.screen.width <= 440 ? $q.screen.width : 440"
    class="mc-form-drawer"
  >
    <div class="mc-form-drawer__header">
      <h6>Establecimiento</h6>
      <q-btn
        flat
        round
        dense
        icon="close"
        color="grey-6"
        @click="adminStore.establishmentDrawer = false"
      />
    </div>

    <q-scroll-area style="height: calc(100% - 130px)">
      <div class="mc-form-drawer__body">
        <!-- Logo section -->
        <div class="mc-logo-upload" v-if="adminStore.companyStore.companyForm.id">
          <q-img
            :src="displayedLogo"
            :ratio="16 / 9"
            class="mc-logo-upload__preview"
            @click="triggerFileInput"
          >
            <div
              v-if="adminStore.uploadingImage"
              class="absolute-full flex flex-center"
              style="background: rgba(0,0,0,0.45)"
            >
              <q-spinner color="white" size="32px" />
            </div>
          </q-img>
        </div>

        <q-btn
          outline
          color="primary"
          icon="camera_alt"
          no-caps
          :label="displayedLogo ? 'Cambiar Logo' : 'Agregar Logo'"
          class="full-width q-mb-lg mc-upload-btn"
          @click="triggerFileInput"
        />
        <input
          type="file"
          ref="fileInput"
          @change="onFileSelected"
          style="display: none"
          accept="image/*"
        />

        <!-- General info -->
        <q-input
          v-model="adminStore.companyStore.companyForm.name"
          label="Nombre del establecimiento"
          filled
          dense
          class="q-mb-md"
        />

        <q-input
          v-if="adminStore.companyStore.companyForm.id"
          v-model="adminStore.companyStore.companyForm.slug"
          label="URL / Ruta"
          filled
          dense
          class="q-mb-md"
        />

        <div class="row q-col-gutter-sm q-mb-md">
          <div class="col-6">
            <q-input
              v-model="adminStore.companyStore.companyForm.phone"
              label="Teléfono"
              filled
              dense
            />
          </div>
          <div class="col-6">
            <q-input
              v-model="adminStore.companyStore.companyForm.whatsapp"
              label="WhatsApp"
              filled
              dense
            />
          </div>
        </div>

        <q-input
          v-model="adminStore.companyStore.companyForm.delivery_charge"
          label="Costo de envío"
          prefix="$"
          filled
          dense
          type="number"
          class="q-mb-md"
        />

        <div class="row q-col-gutter-sm q-mb-md">
          <div class="col-6">
            <q-select
              v-model="adminStore.companyStore.companyForm.category"
              label="Categoría"
              filled
              dense
              option-value="id"
              option-label="name"
              :options="adminStore.companyStore.categories"
            />
          </div>
          <div class="col-6">
            <q-select
              v-model="adminStore.companyStore.companyForm.type"
              label="Tipo"
              filled
              dense
              option-value="id"
              option-label="name"
              :options="adminStore.companyStore.types"
            />
          </div>
        </div>

        <q-input
          v-model="adminStore.companyStore.companyForm.description"
          type="textarea"
          label="Descripción"
          filled
          dense
          autogrow
          class="q-mb-md"
        />

        <!-- Color and status -->
        <div class="mc-color-section">
          <div class="mc-color-section__header">
            <q-icon name="palette" size="xs" color="primary" />
            <span class="mc-color-section__title">Apariencia</span>
          </div>

          <q-input
            filled
            dense
            label="Color del tema"
            v-model="adminStore.companyStore.companyForm.color"
            class="q-mb-md"
          >
            <template v-slot:append>
              <div
                class="mc-color-swatch"
                :style="{ background: adminStore.companyStore.companyForm.color }"
              />
              <q-icon name="colorize" class="cursor-pointer">
                <q-popup-proxy
                  cover
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <q-color v-model="adminStore.companyStore.companyForm.color" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <q-select
            v-if="!adminStore.isEstablishment"
            v-model="adminStore.companyStore.companyForm.status"
            label="Estado"
            filled
            dense
            :options="['Activo', 'Inactivo']"
          />
        </div>
      </div>
    </q-scroll-area>

    <div class="mc-form-drawer__save">
      <q-btn
        :loading="adminStore.loading || adminStore.uploadingImage"
        unelevated
        color="primary"
        icon="save"
        no-caps
        label="Guardar Establecimiento"
        @click="adminStore.saveEstablishment"
      />
    </div>
  </q-drawer>
</template>

<script setup>
defineOptions({
  name: "EstablishmentDrawer",
});
import { ref, computed, watch } from "vue";
import { useQuasar } from "quasar";
import { useAdminStore } from "src/stores/admin-store";
const adminStore = useAdminStore();
const $q = useQuasar();

const fileInput = ref(null);
const localPreview = ref("");

// Logo a mostrar: preview local mientras sube, o la URL ya guardada
const displayedLogo = computed(
  () => localPreview.value || adminStore.companyStore.companyForm.logo
);

// Cuando la subida termina y guarda la URL real, descartar el preview base64
watch(
  () => adminStore.companyStore.companyForm.logo,
  (logo) => {
    if (logo && /^https?:\/\//i.test(logo)) localPreview.value = "";
  }
);

watch(() => adminStore.establishmentDrawer, () => {
  localPreview.value = "";
});

const triggerFileInput = () => {
  fileInput.value.click();
};

const onFileSelected = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      // Preview inmediato (base64). NO se guarda en companyForm.logo:
      // uploadEstablishmentImage pondrá ahí la URL real al terminar.
      localPreview.value = e.target.result;
      adminStore.uploadEstablishmentImage(file);
      event.target.value = null;
    };
    reader.readAsDataURL(file);
  }
};
</script>

<style lang="scss" scoped>
.mc-logo-upload {
  position: relative;
  margin-bottom: var(--space-md);
  border-radius: var(--radius-lg);
  overflow: hidden;

  &__preview {
    cursor: pointer;
    border-radius: var(--radius-lg);
    transition: opacity var(--transition-fast);

    &:hover {
      opacity: 0.85;
    }
  }
}

.mc-upload-btn {
  border-radius: var(--radius-md);
  border-style: dashed;
  font-weight: 500;
}

.mc-color-section {
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

.mc-color-swatch {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-subtle);
  margin-right: var(--space-xs);
}
</style>
