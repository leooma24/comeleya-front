<template>
  <q-card flat class="mc-admin-card">
    <div class="mc-admin-card__header">
      <div class="mc-admin-card__title">
        <q-icon name="fab fa-facebook" size="24px" color="primary" class="q-mr-sm" />
        Catálogo de Facebook
      </div>
    </div>

    <div class="mc-fb-sections">
      <div class="mc-fb-section">
        <h4 class="mc-section-title">Tu menú en Facebook</h4>
        <p class="mc-fb-hint">
          Conecta tu menú a la fan page de Facebook usando Meta Commerce Manager.
          Facebook consultará este URL automáticamente y mantendrá tu catálogo actualizado.
        </p>

        <q-input
          filled
          dense
          rounded
          readonly
          v-model="feedUrl"
          label="URL del catálogo"
          class="q-mb-md"
        >
          <template v-slot:append>
            <q-btn flat dense round icon="content_copy" @click="copyUrl">
              <q-tooltip>Copiar URL</q-tooltip>
            </q-btn>
            <q-btn flat dense round icon="open_in_new" @click="openUrl">
              <q-tooltip>Abrir en pestaña nueva</q-tooltip>
            </q-btn>
          </template>
        </q-input>

        <div class="mc-fb-actions">
          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="download"
            label="Descargar CSV"
            size="sm"
            @click="downloadCsv"
          />
          <q-btn
            outline
            no-caps
            color="primary"
            icon="help_outline"
            label="Guía de Facebook"
            size="sm"
            type="a"
            href="https://www.facebook.com/business/help/125074381480892"
            target="_blank"
          />
        </div>
      </div>

      <div class="mc-fb-section">
        <h4 class="mc-section-title">Cómo conectarlo</h4>
        <ol class="mc-fb-steps">
          <li>Entra a <a href="https://business.facebook.com/commerce" target="_blank" rel="noopener">Meta Commerce Manager</a> y selecciona tu catálogo (o crea uno nuevo para restaurantes).</li>
          <li>Ve a <strong>Catálogo → Fuentes de datos → Agregar elementos → Usar feeds de datos</strong>.</li>
          <li>Elige <strong>URL programada</strong> y pega el enlace de arriba.</li>
          <li>Selecciona la frecuencia de actualización (diaria recomendada).</li>
          <li>Conecta el catálogo a tu fan page desde <strong>Configuración → Páginas conectadas</strong>.</li>
        </ol>
      </div>

      <div class="mc-fb-section">
        <h4 class="mc-section-title">Qué se incluye</h4>
        <ul class="mc-fb-includes">
          <li>Solo platillos <strong>activos</strong> y con foto.</li>
          <li>Precio especial vigente si aplica (respeta la fecha de vencimiento).</li>
          <li>Nombre del restaurante como marca y la categoría del platillo.</li>
          <li>Los extras y modificadores <strong>no</strong> se incluyen (Facebook no los soporta).</li>
        </ul>
      </div>
    </div>
  </q-card>
</template>

<script setup>
defineOptions({ name: "FacebookCatalog" });

import { computed } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";

const adminStore = useAdminStore();

const feedUrl = computed(() => {
  const base = (api.defaults.baseURL || "").replace(/\/$/, "");
  return `${base}/establishment/${adminStore.slug}/facebook-feed.csv`;
});

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(feedUrl.value);
    adminStore.messageStore.success("URL copiado al portapapeles");
  } catch {
    adminStore.messageStore.error("No se pudo copiar el URL");
  }
};

const openUrl = () => {
  window.open(feedUrl.value, "_blank");
};

const downloadCsv = () => {
  window.open(`${feedUrl.value}?download=1`, "_blank");
};
</script>

<style lang="scss" scoped>
.mc-fb-sections {
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

.mc-fb-hint {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-md);
  line-height: 1.5;
}

.mc-fb-actions {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.mc-fb-steps,
.mc-fb-includes {
  padding-left: var(--space-lg);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: 1.7;

  li {
    margin-bottom: var(--space-xs);
  }

  a {
    color: var(--q-primary);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
