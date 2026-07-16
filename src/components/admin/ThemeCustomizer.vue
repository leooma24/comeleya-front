<template>
  <q-card flat class="mc-admin-card">
    <div class="mc-admin-card__header">
      <div class="mc-admin-card__title">
        <q-icon name="palette" size="24px" color="primary" class="q-mr-sm" />
        Personalización de Tema
      </div>
      <q-btn unelevated no-caps color="primary" label="Guardar" icon="save" size="sm" @click="saveTheme" :loading="saving" />
    </div>

    <div v-if="loading" class="mc-loading">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <template v-else>
      <div class="mc-theme-sections">
        <!-- Colors -->
        <div class="mc-theme-section">
          <h4 class="mc-section-title">Colores</h4>
          <div class="mc-color-grid">
            <div class="mc-color-field" v-for="(label, key) in colorLabels" :key="key">
              <label>{{ label }}</label>
              <div class="mc-color-picker">
                <input type="color" v-model="theme[key]" />
                <q-input filled dense rounded v-model="theme[key]" class="mc-color-input" />
              </div>
            </div>
          </div>
        </div>

        <!-- Typography -->
        <div class="mc-theme-section">
          <h4 class="mc-section-title">Tipografía</h4>
          <q-select
            filled dense rounded
            v-model="theme.font_family"
            :options="fontOptions"
            label="Fuente principal"
            emit-value
            map-options
          />
        </div>

        <!-- Layout -->
        <div class="mc-theme-section">
          <h4 class="mc-section-title">Diseño</h4>
          <div class="row q-gutter-md">
            <q-select
              filled dense rounded
              v-model="theme.border_radius"
              :options="radiusOptions"
              label="Bordes redondeados"
              emit-value
              map-options
              class="col"
            />
            <q-select
              filled dense rounded
              v-model="theme.card_style"
              :options="cardOptions"
              label="Estilo de tarjetas"
              emit-value
              map-options
              class="col"
            />
          </div>
        </div>

        <!-- Banner -->
        <div class="mc-theme-section">
          <h4 class="mc-section-title">Banner</h4>
          <q-toggle v-model="theme.show_banner" label="Mostrar banner en menú" />
          <q-input
            v-if="theme.show_banner"
            filled dense rounded
            v-model="theme.banner_text"
            label="Texto del banner"
            class="q-mt-sm"
          />
        </div>

        <!-- Preview -->
        <div class="mc-theme-section">
          <h4 class="mc-section-title">Vista previa</h4>
          <div class="mc-theme-preview" :style="previewStyles">
            <div class="mc-preview-header" :style="{ background: theme.primary_color, color: '#fff' }">
              {{ adminStore.company.name || 'Mi Restaurante' }}
            </div>
            <div class="mc-preview-body">
              <div class="mc-preview-card" :style="{ borderRadius: theme.border_radius || '12px' }">
                <div class="mc-preview-card__name">Platillo ejemplo</div>
                <div class="mc-preview-card__price" :style="{ color: theme.primary_color }">$99.00</div>
              </div>
              <div class="mc-preview-btn" :style="{ background: theme.primary_color, borderRadius: theme.border_radius || '12px' }">
                Agregar al carrito
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </q-card>
</template>

<script setup>
defineOptions({ name: "ThemeCustomizerComponent" });

import { ref, computed, onMounted } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";

const adminStore = useAdminStore();
const loading = ref(true);
const saving = ref(false);

const defaultTheme = () => ({
  primary_color: "#1976D2",
  secondary_color: "#26A69A",
  accent_color: "#9C27B0",
  background_color: "#FFFFFF",
  text_color: "#333333",
  font_family: "Inter",
  border_radius: "12px",
  card_style: "elevated",
  show_banner: false,
  banner_text: "",
});

const theme = ref(defaultTheme());

const colorLabels = {
  primary_color: "Color primario",
  secondary_color: "Color secundario",
  accent_color: "Color de acento",
  background_color: "Fondo",
  text_color: "Texto",
};

const fontOptions = [
  { label: "Inter", value: "Inter" },
  { label: "Roboto", value: "Roboto" },
  { label: "Open Sans", value: "Open Sans" },
  { label: "Poppins", value: "Poppins" },
  { label: "Montserrat", value: "Montserrat" },
  { label: "Nunito", value: "Nunito" },
];

const radiusOptions = [
  { label: "Sin redondeo", value: "0px" },
  { label: "Sutil", value: "4px" },
  { label: "Moderado", value: "8px" },
  { label: "Redondeado", value: "12px" },
  { label: "Muy redondeado", value: "20px" },
];

const cardOptions = [
  { label: "Elevado", value: "elevated" },
  { label: "Plano", value: "flat" },
  { label: "Con borde", value: "bordered" },
];

const previewStyles = computed(() => ({
  fontFamily: theme.value.font_family,
  background: theme.value.background_color,
  color: theme.value.text_color,
}));

const saveTheme = async () => {
  saving.value = true;
  try {
    await api.put(`/admin/${adminStore.slug}/theme`, { theme_config: theme.value });
    adminStore.messageStore.success("Tema guardado");
  } catch (e) {
    adminStore.messageStore.error("Error al guardar tema");
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  const existing = adminStore.company?.theme_config;
  if (existing && typeof existing === "object") {
    Object.assign(theme.value, existing);
  }
  loading.value = false;
});
</script>

<style lang="scss" scoped>
.mc-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.mc-theme-sections {
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

.mc-color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-md);
}

.mc-color-field {
  label {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-text-secondary);
    margin-bottom: var(--space-xs);
    display: block;
  }
}

.mc-color-picker {
  display: flex;
  align-items: center;
  gap: var(--space-sm);

  input[type="color"] {
    width: 40px;
    height: 40px;
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    padding: 2px;

    &::-webkit-color-swatch-wrapper { padding: 0; }
    &::-webkit-color-swatch { border-radius: var(--radius-sm); border: none; }
  }
}

.mc-color-input {
  flex: 1;
  max-width: 140px;
}

.mc-theme-preview {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  max-width: 360px;
}

.mc-preview-header {
  padding: var(--space-md) var(--space-lg);
  font-weight: 700;
  font-size: var(--text-lg);
}

.mc-preview-body {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.mc-preview-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-subtle);
  padding: var(--space-md);

  &__name {
    font-weight: 600;
    font-size: var(--text-sm);
  }

  &__price {
    font-weight: 700;
    font-size: var(--text-lg);
    margin-top: var(--space-xs);
  }
}

.mc-preview-btn {
  padding: var(--space-sm) var(--space-md);
  color: white;
  text-align: center;
  font-weight: 600;
  font-size: var(--text-sm);
}

@media screen and (max-width: 600px) {
  .mc-theme-sections {
    padding: var(--space-md);
  }
  .mc-color-grid {
    grid-template-columns: 1fr;
  }
}
</style>
