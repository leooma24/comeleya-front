<template>
  <BaseFormDrawer
    v-model="adminStore.productFormDrawer"
    :form-data="adminStore.productForm"
    :uploading="adminStore.uploadingImage"
    :title="(adminStore.productForm.id ? 'Editar' : 'Nuevo') + ' Producto'"
    save-label="Guardar Producto"
    :loading="adminStore.loading || adminStore.uploadingImage"
    @save="adminStore.saveProduct"
  >
    <!-- Product image -->
    <div class="mc-image-upload" v-if="displayedPhoto">
      <q-img
        :src="displayedPhoto"
        :ratio="16 / 9"
        class="mc-image-upload__preview"
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
      <q-btn
        v-if="adminStore.productForm.id && displayedPhoto"
        round
        :color="imgBtnColor"
        icon="auto_fix_high"
        size="sm"
        class="mc-image-upload__refresh"
        :loading="adminStore.loading"
        :disable="imgFeatureEnabled && imgUsage.remaining <= 0"
        @click.stop="triggerImproveImage"
      >
        <!-- Candado cuando el plan no incluye la función -->
        <q-badge v-if="!imgFeatureEnabled" floating color="amber-8" rounded class="mc-image-upload__lock">
          <q-icon name="lock" size="11px" color="white" />
        </q-badge>
        <q-tooltip>
          {{ imgTooltip }}
        </q-tooltip>
      </q-btn>
    </div>

    <q-btn
      outline
      color="primary"
      icon="camera_alt"
      no-caps
      :label="displayedPhoto ? 'Cambiar imagen' : 'Agregar imagen'"
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

    <!-- Guía para subir la foto -->
    <div class="mc-photo-guide" @click="showGuide = true">
      <q-img src="/guia.png" :ratio="16 / 9" class="mc-photo-guide__thumb" />
      <div class="mc-photo-guide__text">
        <q-icon name="help_outline" size="18px" color="primary" />
        <span>¿Cómo subir una buena foto? <strong>Ver guía</strong></span>
      </div>
    </div>

    <!-- Diálogo con la guía ampliada -->
    <q-dialog v-model="showGuide">
      <q-card class="mc-photo-guide-dialog">
        <q-img src="/guia.png" fit="contain" />
        <q-card-actions align="right">
          <q-btn flat no-caps color="primary" label="Entendido" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-input
      v-model="adminStore.productForm.name"
      label="Nombre del producto"
      filled
      dense
      class="q-mb-md"
    />

    <q-select
      v-model="adminStore.productForm.dish_category"
      label="Categoría"
      filled
      dense
      option-value="id"
      option-label="name"
      :options="adminStore.categories"
      class="q-mb-md"
    />

    <q-input
      v-model="adminStore.productForm.price"
      label="Precio"
      filled
      dense
      type="number"
      prefix="$"
      class="q-mb-md"
    />

    <q-input
      v-model="adminStore.productForm.description"
      type="textarea"
      label="Descripción"
      filled
      dense
      autogrow
      class="q-mb-md"
    />

    <q-select
      v-model="adminStore.productForm.status"
      label="Estado"
      filled
      dense
      class="q-mb-md"
      :options="['Activo', 'Inactivo']"
    />

    <!-- Disponibilidad por día y horario (ej. desayunos entre semana 07:00–12:00).
         Los días extienden esta tarjeta en vez de estrenar una: su pie ya dice
         "déjalo vacío para que esté disponible siempre", que es exactamente la
         regla de los días. No hay concepto nuevo que explicarle al dueño.

         Y son los que hacen posible la promo como producto: un "Ceviche 3x2"
         marcado solo en lunes aparece y desaparece solo. -->
    <div class="mc-availability">
      <div class="mc-availability__label">
        <q-icon name="schedule" size="18px" color="primary" />
        Disponible solo en
      </div>
      <div class="mc-days">
        <q-btn
          v-for="dia in DIAS_LUNES_PRIMERO"
          :key="dia.valor"
          :label="dia.corto"
          :color="availDays.includes(dia.valor) ? 'primary' : 'grey-4'"
          :text-color="availDays.includes(dia.valor) ? 'white' : 'grey-8'"
          unelevated
          dense
          no-caps
          class="mc-days__btn"
          @click="toggleAvailDay(dia.valor)"
        >
          <q-tooltip>{{ dia.nombre }}</q-tooltip>
        </q-btn>
      </div>
      <div class="row q-col-gutter-sm">
        <q-input class="col-6" v-model="availFrom" type="time" filled dense label="Desde" />
        <q-input class="col-6" v-model="availUntil" type="time" filled dense label="Hasta" />
      </div>
      <p class="mc-availability__hint">Déjalo vacío para que esté disponible siempre.</p>
    </div>
  </BaseFormDrawer>
</template>

<script setup>
defineOptions({
  name: "ProductFormDrawer",
});
import { ref, reactive, watch, computed } from "vue";
import { useQuasar } from "quasar";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";
import BaseFormDrawer from "../BaseFormDrawer.vue";
import { DIAS_LUNES_PRIMERO, diasValidos } from "src/utils/weekDays";
const adminStore = useAdminStore();
const $q = useQuasar();

const fileInput = ref(null);
const imgUsage = reactive({ used: 0, limit: 0, remaining: 0 });
const localPreview = ref("");
const showGuide = ref(false);

// Imagen a mostrar: preview local mientras sube, o la URL ya guardada
const displayedPhoto = computed(() => localPreview.value || adminStore.productForm.photo);

// Horario de disponibilidad: el input type=time usa HH:MM; la BD puede traer HH:MM:SS.
const availFrom = computed({
  get: () => (adminStore.productForm.available_from || "").slice(0, 5),
  set: (v) => { adminStore.productForm.available_from = v || null; },
});
const availUntil = computed({
  get: () => (adminStore.productForm.available_until || "").slice(0, 5),
  set: (v) => { adminStore.productForm.available_until = v || null; },
});

// Días en que se vende el platillo. Se guarda NULL cuando no queda ninguno, no un
// arreglo vacío: así la columna dice "sin restricción" de una sola forma.
const availDays = computed(() => diasValidos(adminStore.productForm.available_days));

const toggleAvailDay = (valor) => {
  const actuales = availDays.value;
  const nuevos = actuales.includes(valor)
    ? actuales.filter((d) => d !== valor)
    : [...actuales, valor].sort((a, b) => a - b);
  adminStore.productForm.available_days = nuevos.length ? nuevos : null;
};

// ¿El plan del restaurante incluye mejoras de imagen con IA?
const imgFeatureEnabled = computed(() => imgUsage.limit > 0);

const imgBtnColor = computed(() => {
  if (!imgFeatureEnabled.value) return "amber-8"; // premium/candado
  return imgUsage.remaining > 0 ? "primary" : "grey-5"; // disponible / agotado
});

const imgTooltip = computed(() => {
  if (!imgFeatureEnabled.value) return "Mejorar imagen con IA ✨ — disponible al mejorar tu plan";
  if (imgUsage.remaining > 0)
    return `Mejorar imagen con IA (${imgUsage.used}/${imgUsage.limit} usadas)`;
  return `Límite alcanzado este mes (${imgUsage.limit}/${imgUsage.limit})`;
});

// Cuando la subida termina y guarda la URL real, descartar el preview base64
watch(() => adminStore.productForm.photo, (photo) => {
  if (photo && /^https?:\/\//i.test(photo)) localPreview.value = "";
});

// Load usage when drawer opens
watch(() => adminStore.productFormDrawer, async (open) => {
  localPreview.value = "";
  if (open && adminStore.slug) {
    try {
      const { data } = await api.get(`/admin/${adminStore.slug}/image-improvements/usage`);
      Object.assign(imgUsage, data);
    } catch (e) {
      Object.assign(imgUsage, { used: 0, limit: 0, remaining: 0 });
    }
  }
});

const triggerFileInput = () => {
  fileInput.value.click();
};

const triggerImproveImage = async () => {
  // Plan sin la función: no se llama a la IA, se invita a mejorar el plan.
  if (!imgFeatureEnabled.value) {
    $q.notify({
      message: "Mejorar imágenes con IA es una función premium. Actualiza tu plan para activarla.",
      color: "amber-9",
      icon: "auto_fix_high",
      position: "top",
      timeout: 3500,
    });
    return;
  }
  const ok = await adminStore.improveImage();
  // Solo descontar el cupo si la mejora tuvo éxito
  if (ok) {
    imgUsage.used++;
    imgUsage.remaining = Math.max(0, imgUsage.limit - imgUsage.used);
  }
};

const onFileSelected = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      // Preview inmediato (base64). NO se guarda en productForm.photo:
      // uploadDishImage pondrá ahí la URL real cuando termine la subida.
      localPreview.value = e.target.result;
      adminStore.uploadDishImage(file);
      event.target.value = null;
    };
    reader.readAsDataURL(file);
  }
};
</script>

<style lang="scss" scoped>
.mc-image-upload {
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

  &__refresh {
    position: absolute;
    bottom: var(--space-sm);
    right: var(--space-sm);
    box-shadow: var(--shadow-md);
  }

  &__lock {
    padding: 2px;
    min-height: 0;
  }
}

.mc-upload-btn {
  border-radius: var(--radius-md);
  border-style: dashed;
  font-weight: 500;
}

.mc-availability {
  margin-top: var(--space-md);
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);

  &__label {
    display: flex; align-items: center; gap: 6px;
    font-weight: 600; font-size: var(--text-sm);
    color: var(--color-text-primary); margin-bottom: var(--space-sm);
  }
  &__hint {
    font-size: var(--text-xs); color: var(--color-text-tertiary);
    margin: var(--space-xs) 0 0;
  }
}

// Siete botones y no un desplegable: se ven todos de un vistazo y "fin de semana"
// son dos toques. Se reparten el ancho para que quepan en el cajón del panel.
.mc-days {
  display: flex;
  gap: 4px;
  margin-bottom: var(--space-sm);

  &__btn {
    flex: 1 1 0;
    min-width: 0;
    padding: 4px 0;
    font-weight: 700;
  }
}

.mc-photo-guide {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: calc(-1 * var(--space-md));
  margin-bottom: var(--space-lg);
  padding: var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-variant);
  cursor: pointer;
  transition: border-color var(--transition-fast), background var(--transition-fast);

  &:hover {
    border-color: var(--q-primary);
    background: var(--color-primary-soft);
  }

  &__thumb {
    width: 88px;
    flex-shrink: 0;
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  &__text {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: 1.3;

    strong {
      color: var(--q-primary);
    }
  }
}

.mc-photo-guide-dialog {
  max-width: 900px;
  width: 95vw;
  border-radius: var(--radius-lg);
  overflow: hidden;
}
</style>
