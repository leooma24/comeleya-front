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
        <admin-section
          icon="search"
          title="Información básica"
          description="Lo que Google enseña cuando alguien busca tu restaurante: el título azul y el texto gris de abajo."
        >
          <q-input
            filled
            dense
            rounded
            v-model="seo.meta_title"
            label="Título SEO"
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
            hint="Separadas por coma: restaurante, comida, delivery"
          />
        </admin-section>

        <!-- Open Graph -->
        <admin-section
          icon="share"
          title="Redes sociales"
          description="Lo que aparece cuando alguien pega el link de tu menú en WhatsApp o Facebook. Si lo dejas vacío se usa lo de arriba."
        >
          <q-input
            filled
            dense
            rounded
            v-model="seo.og_title"
            label="Título para redes sociales"
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
          />
          <q-input
            filled
            dense
            rounded
            v-model="seo.og_image"
            label="URL de imagen para compartir"
            hint="Imagen que se muestra al compartir en redes (1200x630px recomendado)"
          />
        </admin-section>

        <!-- Schema.org Preview -->
        <admin-section
          icon="code"
          title="Datos estructurados"
          description="Se generan solos con los datos de tu establecimiento y le ayudan a Google a entender que eres un restaurante y no cualquier página. Aquí no hay nada que capturar."
        >
          <div class="mc-schema-preview" v-if="seo.schema_org">
            <pre>{{ JSON.stringify(seo.schema_org, null, 2) }}</pre>
          </div>
          <div v-else class="mc-schema-empty">
            <q-icon name="code" size="32px" color="grey-4" />
            <span>Se generará al guardar</span>
          </div>
        </admin-section>

        <!-- Google Preview -->
        <admin-section
          icon="visibility"
          title="Vista previa en Google"
          description="Así te verías hoy en los resultados de búsqueda, con lo que llevas capturado arriba."
        >
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
        </admin-section>
      </div>
    </template>
  </q-card>
</template>

<script setup>
defineOptions({ name: "SeoSettingsComponent" });

import { ref, computed, onMounted } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";
import AdminSection from "./AdminSection.vue";

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
  // Menos aire: cada grupo ya trae su caja y su borde para separarse.
  gap: var(--space-lg);
}

// Aqui vivian .mc-section-title y .mc-seo-hint: el titulo y la descripcion de cada
// grupo ahora los dibuja AdminSection.

.mc-schema-preview {
  // El fondo de la caja de seccion es este mismo, asi que el bloque de codigo se
  // perdia adentro. Va sobre la superficie normal para que se despegue.
  background: var(--color-surface);
  border: 1px solid var(--color-border-subtle);
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
