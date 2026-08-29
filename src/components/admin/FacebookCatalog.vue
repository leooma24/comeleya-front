<template>
  <q-card flat class="mc-admin-card">
    <div class="mc-admin-card__header">
      <div class="mc-admin-card__title">
        <q-icon name="fab fa-facebook" size="24px" color="primary" class="q-mr-sm" />
        Meta
      </div>
      <q-btn
        outline no-caps color="primary" icon="menu_book"
        label="Guía paso a paso" size="sm"
        type="a" href="/guia-facebook" target="_blank"
      />
    </div>

    <div class="mc-fb-sections">
      <!-- Configuración (Píxel / Messenger) — PREMIUM -->
      <div class="mc-fb-section">
        <h4 class="mc-section-title">
          Configuración
          <q-badge color="amber-8" class="q-ml-sm" rounded>Premium</q-badge>
        </h4>

        <!-- Sin plan: aviso de upgrade en vez de los campos -->
        <div v-if="!hasFacebook" class="mc-fb-locked">
          <q-icon name="lock" size="22px" color="amber-8" />
          <div>
            <strong>El Píxel de Meta y el chat de Messenger son una función premium.</strong>
            <p>
              Mide y potencia tus anuncios con el Píxel, y activa el chat de Messenger en tu menú.
              Actualiza tu plan para desbloquearlo. El <strong>catálogo de abajo es gratis</strong> y ya puedes usarlo.
            </p>
          </div>
        </div>

        <!-- Con plan: los campos normales -->
        <template v-else>
          <p class="mc-fb-hint">
            Conecta el <strong>Píxel de Meta</strong> (para medir y potenciar tus anuncios) y tu
            <strong>página</strong> (para el chat de Messenger). Más abajo tienes la guía para obtener cada dato.
          </p>

          <q-toggle
            v-model="config.enabled"
            label="Activar integración con Meta"
            color="primary"
            class="q-mb-md"
          />

          <q-input
            filled dense rounded
            v-model="config.pixel_id"
            label="Pixel ID"
            hint="Solo el número (ej. 123456789012345)"
            class="q-mb-md"
            :disable="!config.enabled"
          >
            <template v-slot:prepend><q-icon name="track_changes" /></template>
          </q-input>

          <q-input
            filled dense rounded
            v-model="config.page_id"
            label="Page ID (para Messenger)"
            hint="ID de tu página de Facebook"
            class="q-mb-md"
            :disable="!config.enabled"
          >
            <template v-slot:prepend><q-icon name="chat" /></template>
          </q-input>

          <q-input
            filled dense rounded
            v-model="config.catalog_id"
            label="Catalog ID (opcional)"
            hint="Referencia de tu catálogo en el administrador de ventas"
            class="q-mb-md"
            :disable="!config.enabled"
          >
            <template v-slot:prepend><q-icon name="inventory_2" /></template>
          </q-input>

          <q-btn
            unelevated no-caps color="primary" icon="save"
            label="Guardar configuración"
            size="sm"
            :loading="saving"
            @click="saveConfig"
          />
        </template>
      </div>

      <!-- Catálogo (feed) -->
      <div class="mc-fb-section">
        <h4 class="mc-section-title">Tu menú en Meta (catálogo)</h4>
        <p class="mc-fb-hint">
          Esta liga se conecta una sola vez y de ahí sale tu menú para <strong>Facebook, Instagram y
          WhatsApp</strong>. Meta la vuelve a leer sola, así que tus precios y lo agotado se mantienen al día
          sin que hagas nada.
        </p>

        <q-input
          filled dense rounded readonly
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
          <q-btn unelevated no-caps color="primary" icon="download" label="Descargar CSV" size="sm" @click="downloadCsv" />
          <q-btn
            outline no-caps color="primary" icon="help_outline" label="Ayuda de Meta" size="sm"
            type="a" href="https://www.facebook.com/business/help/125074381480892" target="_blank"
          />
        </div>
      </div>

      <!-- Guía de configuración -->
      <div class="mc-fb-section">
        <h4 class="mc-section-title">Guía: cómo obtener tus datos</h4>

        <div class="mc-fb-guide">
          <div class="mc-fb-guide__item">
            <q-icon name="track_changes" size="18px" color="primary" />
            <div>
              <strong>Pixel ID</strong>
              <p>En <a href="https://business.facebook.com/events_manager2" target="_blank" rel="noopener">Meta Events Manager</a> → selecciona tu píxel → el número que aparece bajo el nombre (o en <em>Configuración del origen de datos</em>). Si no tienes uno, créalo con “Conectar orígenes de datos → Web”.</p>
            </div>
          </div>
          <div class="mc-fb-guide__item">
            <q-icon name="chat" size="18px" color="primary" />
            <div>
              <strong>Page ID (chat de Messenger)</strong>
              <p>
                Tu <strong>foto de perfil</strong> en Facebook → <em>Ver todos los perfiles</em> → elige tu página →
                clic en el <strong>nombre de la página</strong> debajo de la portada → <em>Transparencia y política de privacidad</em>.
                Si tu página abre como <em>facebook.com/profile.php?id=<strong>123456789</strong></em>, ese número ya es el Page ID.
                Además, para que el chat aparezca en tu menú, autoriza el dominio <strong>comeleya.com</strong> en el
                <strong>plugin de chat</strong>, dentro de la configuración de mensajes de tu página.
              </p>
            </div>
          </div>
          <div class="mc-fb-guide__item">
            <q-icon name="inventory_2" size="18px" color="primary" />
            <div>
              <strong>Catálogo</strong>
              <p>En el <a href="https://business.facebook.com/commerce" target="_blank" rel="noopener">administrador de ventas</a> —antes Commerce Manager— → <em>Orígenes de datos → Agregar artículos → Lista de datos → Lista programada</em>, y pega ahí el <strong>URL del catálogo</strong> de arriba. El Catalog ID (opcional) está en la configuración del catálogo.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Cómo conectar el catálogo -->
      <div class="mc-fb-section">
        <h4 class="mc-section-title">Pasos para conectar el catálogo</h4>
        <ol class="mc-fb-steps">
          <li>Entra al <a href="https://business.facebook.com/commerce" target="_blank" rel="noopener">administrador de ventas de Meta</a> y elige o crea un catálogo.</li>
          <li>Abre el catálogo y ve a <strong>Orígenes de datos → Agregar artículos</strong>. Si te pregunta cuántos, elige <em>Agregar varios artículos</em>.</li>
          <li>Elige <strong>Lista de datos → Siguiente</strong> y luego <strong>Lista programada</strong>.</li>
          <li>En <strong>Ingresar URL</strong> pega el enlace del catálogo de arriba.</li>
          <li>En <strong>Programar actualizaciones</strong> pon frecuencia diaria y deja prendido <em>Agregar actualizaciones automáticas</em>.</li>
          <li>Ponle nombre al origen de datos, elige la divisa <strong>MXN</strong> y dale <strong>Subir</strong>.</li>
          <li>Ya cargado, conéctalo con tu página de Facebook desde la configuración del catálogo.</li>
        </ol>

        <p class="mc-fb-hint q-mt-md">
          <strong>El mismo catálogo sirve para Instagram y WhatsApp.</strong> No se sube otra vez: desde el
          administrador de ventas lo conectas también a tu cuenta de Instagram —tiene que ser profesional y
          estar ligada a tu página— y a tu número de WhatsApp Business. Los pasos completos están en la
          <a href="/guia-facebook" target="_blank" rel="noopener">guía paso a paso</a>.
        </p>
      </div>

      <!-- Qué se incluye -->
      <div class="mc-fb-section">
        <h4 class="mc-section-title">Qué se incluye en el catálogo</h4>
        <ul class="mc-fb-includes">
          <li>Solo platillos <strong>activos</strong> y con foto.</li>
          <li>Precio regular y precio de oferta vigente por separado (para anuncios con precio tachado).</li>
          <li>Disponibilidad real: los platillos <strong>agotados</strong> se marcan “out of stock”.</li>
          <li>Nombre del restaurante como marca y la categoría del platillo.</li>
          <li>Los extras y modificadores <strong>no</strong> se incluyen (Facebook no los soporta).</li>
        </ul>
      </div>
    </div>
  </q-card>
</template>

<script setup>
defineOptions({ name: "FacebookCatalog" });

import { ref, computed, onMounted } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";

const adminStore = useAdminStore();

// Píxel/Messenger es premium (has_facebook). El catálogo/feed sigue gratis.
const hasFacebook = computed(() => {
  const features = adminStore.companyConfiguration?.features ?? [];
  const f = features.find((x) => x.name === "facebook" || x.slug === "facebook");
  if (f?.value) return true;
  return !!adminStore.company?.active_subscription?.package?.has_facebook;
});

const config = ref({
  enabled: false,
  pixel_id: "",
  page_id: "",
  catalog_id: "",
});
const saving = ref(false);

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

const openUrl = () => window.open(feedUrl.value, "_blank");
const downloadCsv = () => window.open(`${feedUrl.value}?download=1`, "_blank");

const saveConfig = async () => {
  saving.value = true;
  try {
    const { data } = await api.put(`/admin/${adminStore.slug}/facebook/config`, config.value);
    if (data.config) Object.assign(config.value, data.config);
    adminStore.messageStore.success("Configuración guardada");
  } catch (e) {
    adminStore.messageStore.error(e.response?.data?.message || "Error al guardar la configuración");
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  try {
    const { data } = await api.get(`/admin/${adminStore.slug}/facebook/config`);
    if (data.config) Object.assign(config.value, data.config);
  } catch {
    // sin config aún: se queda con los defaults
  }
});
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

.mc-fb-locked {
  display: flex;
  gap: var(--space-sm);
  align-items: flex-start;
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, #ff9800 8%, transparent);

  strong {
    font-size: var(--text-sm);
    color: var(--color-text-primary);
  }

  p {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: 1.55;
    margin: 4px 0 0;
  }
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
}

.mc-fb-guide {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);

  &__item {
    display: flex;
    gap: var(--space-sm);
    align-items: flex-start;

    strong {
      font-size: var(--text-sm);
      color: var(--color-text-primary);
    }

    p {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      line-height: 1.55;
      margin: 2px 0 0;
    }
  }
}

a {
  color: var(--q-primary);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}
</style>
