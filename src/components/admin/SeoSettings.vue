<template>
  <q-card flat class="mc-admin-card">
    <div class="mc-admin-card__header">
      <div class="mc-admin-card__title">
        <q-icon
          name="travel_explore"
          size="24px"
          color="primary"
          class="q-mr-sm"
        />
        SEO y Metadatos
      </div>
      <q-btn
        unelevated
        no-caps
        color="primary"
        label="Guardar"
        icon="save"
        size="sm"
        @click="saveSeo"
        :loading="saving"
      />
    </div>

    <div v-if="loading" class="mc-loading">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <template v-else>
      <div class="mc-seo-sections">
        <!-- Basic SEO -->
        <div class="mc-seo-section">
          <h4 class="mc-section-title">Información básica</h4>
          <q-input
            filled
            dense
            rounded
            v-model="seo.meta_title"
            label="Título SEO"
            class="q-mb-md"
            hint="Aparece en la pestaña del navegador y resultados de Google"
            counter
            maxlength="60"
          />
          <q-input
            filled
            dense
            rounded
            v-model="seo.meta_description"
            label="Descripción SEO"
            type="textarea"
            autogrow
            class="q-mb-md"
            hint="Descripción que aparece en resultados de búsqueda"
            counter
            maxlength="160"
          />
          <q-input
            filled
            dense
            rounded
            v-model="seo.meta_keywords"
            label="Palabras clave"
            class="q-mb-md"
            hint="Separadas por coma: restaurante, comida, delivery"
          />
        </div>

        <!-- Open Graph -->
        <div class="mc-seo-section">
          <h4 class="mc-section-title">Redes Sociales (Open Graph)</h4>
          <q-input
            filled
            dense
            rounded
            v-model="seo.og_title"
            label="Título para redes sociales"
            class="q-mb-md"
            hint="Si está vacío, se usa el título SEO"
          />
          <q-input
            filled
            dense
            rounded
            v-model="seo.og_description"
            label="Descripción para redes sociales"
            type="textarea"
            autogrow
            class="q-mb-md"
          />
          <q-input
            filled
            dense
            rounded
            v-model="seo.og_image"
            label="URL de imagen para compartir"
            class="q-mb-md"
            hint="Imagen que se muestra al compartir en redes (1200x630px recomendado)"
          />
        </div>

        <!-- Schema.org Preview -->
        <div class="mc-seo-section">
          <h4 class="mc-section-title">Schema.org (Datos estructurados)</h4>
          <p class="mc-seo-hint">
            Los datos estructurados se generan automáticamente basados en la
            información de tu establecimiento. Estos ayudan a Google a entender
            mejor tu negocio.
          </p>
          <div class="mc-schema-preview" v-if="seo.schema_org">
            <pre>{{ JSON.stringify(seo.schema_org, null, 2) }}</pre>
          </div>
          <div v-else class="mc-schema-empty">
            <q-icon name="code" size="32px" color="grey-4" />
            <span>Se generará al guardar</span>
          </div>
        </div>

        <!-- Google Preview -->
        <div class="mc-seo-section">
          <h4 class="mc-section-title">Vista previa en Google</h4>
          <div class="mc-google-preview">
            <div class="mc-google-preview__url">
              {{ previewUrl }}
            </div>
            <div class="mc-google-preview__title">
              {{
                seo.meta_title || adminStore.company.name || "Tu restaurante"
              }}
            </div>
            <div class="mc-google-preview__desc">
              {{
                seo.meta_description ||
                "Agrega una descripción para tu restaurante..."
              }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </q-card>
</template>

<script setup>
defineOptions({ name: "SeoSettingsComponent" });

import { ref, computed, onMounted } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";

const adminStore = useAdminStore();
const loading = ref(true);
const saving = ref(false);

const seo = ref({
  meta_title: "",
  meta_description: "",
  meta_keywords: "",
  og_title: "",
  og_description: "",
  og_image: "",
  schema_org: null,
});

const previewUrl = computed(() => {
  return `${window.location.origin}/${adminStore.slug}`;
});

const saveSeo = async () => {
  saving.value = true;
  try {
    const { data } = await api.put(`/admin/${adminStore.slug}/seo`, seo.value);
    seo.value = data.seo;
    adminStore.messageStore.success("SEO guardado correctamente");
  } catch (e) {
    adminStore.messageStore.error("Error al guardar SEO");
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  try {
    const { data } = await api.get(`/establishment/${adminStore.slug}/seo`);
    if (data.seo) {
      Object.assign(seo.value, data.seo);
    }
  } catch (e) {
    console.error(e);
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

.mc-seo-sections {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.mc-section-title {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--space-md) 0;
}

.mc-seo-hint {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-md);
}

.mc-schema-preview {
  background: var(--color-surface-variant);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  overflow-x: auto;

  pre {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

.mc-schema-empty {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-lg);
  background: var(--color-surface-variant);
  border-radius: var(--radius-md);
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}

.mc-google-preview {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  max-width: 600px;

  &__url {
    font-size: var(--text-xs);
    color: #202124;
    margin-bottom: 4px;
  }

  &__title {
    font-size: 20px;
    color: #1a0dab;
    font-weight: 400;
    line-height: 1.3;
    margin-bottom: 4px;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }

  &__desc {
    font-size: 14px;
    color: #4d5156;
    line-height: 1.58;
    max-height: 48px;
    overflow: hidden;
  }
}

@media screen and (max-width: 600px) {
  .mc-seo-sections {
    padding: var(--space-md);
  }
}
</style>
