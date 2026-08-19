<template>
  <q-page class="mc-guide-page">
    <div class="mc-guide container">
      <header class="mc-guide__head">
        <q-icon name="fab fa-facebook" size="34px" color="primary" />
        <div>
          <h1 class="mc-guide__title">Cómo conectar tu restaurante con Facebook</h1>
          <p class="mc-guide__sub">
            Guía paso a paso para dejar funcionando el Píxel, el catálogo y el chat de Messenger.
          </p>
        </div>
      </header>

      <div class="mc-guide__note">
        <q-icon name="info" size="20px" color="primary" />
        <div>
          <strong>El Píxel y el Messenger son función premium.</strong>
          Los campos de configuración aparecen en tu panel en
          <em>Crecimiento → Facebook</em> si tu plan los incluye. El <strong>catálogo es gratis</strong>
          para todos.
        </div>
      </div>

      <!-- Píxel -->
      <section class="mc-guide__card">
        <div class="mc-guide__cardhead">
          <span class="mc-badge">Premium</span>
          <h2>1. Píxel de Meta</h2>
        </div>
        <p class="mc-guide__desc">Mide las visitas a tu menú y tus pedidos para potenciar tus anuncios.</p>
        <p class="mc-guide__step-label">Cómo obtener tu Pixel ID</p>
        <ol class="mc-guide__steps">
          <li>Entra a <a href="https://business.facebook.com/events_manager2" target="_blank" rel="noopener">Meta Events Manager</a>.</li>
          <li>Si no tienes uno, créalo con <strong>Conectar orígenes de datos → Web</strong>.</li>
          <li>Selecciona el píxel: el <strong>número</strong> bajo el nombre es tu Pixel ID (solo dígitos).</li>
        </ol>
        <div class="mc-guide__paste">
          <strong>En tu panel:</strong> Facebook → sección <em>Configuración</em> → campo <strong>Pixel ID</strong> → activa el toggle y <strong>Guarda</strong>.
        </div>
      </section>

      <!-- Catálogo -->
      <section class="mc-guide__card">
        <div class="mc-guide__cardhead">
          <span class="mc-badge mc-badge--free">Gratis</span>
          <h2>2. Catálogo (tu menú en Facebook)</h2>
        </div>
        <p class="mc-guide__desc">Publica tu menú como catálogo en tu fan page. Facebook lo consulta y lo mantiene actualizado solo.</p>
        <p class="mc-guide__step-label">Conectar el feed en Commerce Manager</p>
        <ol class="mc-guide__steps">
          <li>En tu panel, en el tab Facebook, copia la <strong>URL del catálogo</strong>.</li>
          <li>Entra a <a href="https://business.facebook.com/commerce" target="_blank" rel="noopener">Meta Commerce Manager</a> y elige o crea un catálogo para restaurantes.</li>
          <li>Ve a <em>Catálogo → Fuentes de datos → Usar feeds de datos</em>.</li>
          <li>Elige <strong>URL programada</strong>, pega la URL y define frecuencia <strong>diaria</strong>.</li>
          <li>Conecta el catálogo a tu fan page en <em>Configuración → Páginas conectadas</em>.</li>
        </ol>
      </section>

      <!-- Messenger -->
      <section class="mc-guide__card">
        <div class="mc-guide__cardhead">
          <span class="mc-badge">Premium</span>
          <h2>3. Chat de Messenger</h2>
        </div>
        <p class="mc-guide__desc">Agrega un botón de chat flotante en tu menú, conectado a tu página de Facebook.</p>
        <p class="mc-guide__step-label">Obtener el Page ID y autorizar el dominio</p>
        <ol class="mc-guide__steps">
          <li>En tu página de Facebook: <em>Configuración → Información de la página</em> → copia la <strong>Identificación de la página</strong> (Page ID).</li>
          <li>Autoriza el dominio: <em>Configuración → Mensajes → Plugin de chat</em> → agrega <strong>comeleya.com</strong> a los dominios permitidos. <strong>Sin esto el chat no aparece.</strong></li>
        </ol>
        <div class="mc-guide__paste">
          <strong>En tu panel:</strong> Facebook → campo <strong>Page ID</strong> → <strong>Guarda</strong>. El chat aparece en tu menú público.
        </div>
      </section>

      <!-- Checklist -->
      <section class="mc-guide__checklist">
        <h2>Checklist</h2>
        <ul>
          <li><q-icon name="check_circle" color="positive" size="20px" /> Plan con Facebook activo (si usarás Píxel o Messenger).</li>
          <li><q-icon name="check_circle" color="positive" size="20px" /> Pixel ID capturado y guardado, con el toggle activado.</li>
          <li><q-icon name="check_circle" color="positive" size="20px" /> Feed del catálogo conectado en Commerce Manager.</li>
          <li><q-icon name="check_circle" color="positive" size="20px" /> Page ID capturado y dominio comeleya.com autorizado en el plugin de chat.</li>
        </ul>
      </section>

      <div class="mc-guide__back">
        <q-btn flat no-caps color="primary" icon="arrow_back" label="Cerrar guía" @click="goBack" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
defineOptions({ name: "GuideFacebookPage" });

const goBack = () => {
  if (window.history.length > 1) window.history.back();
  else window.close();
};
</script>

<style lang="scss" scoped>
.mc-guide-page {
  background: var(--color-surface-variant, #f4f1ec);
  padding: 28px 0 64px;
}
.mc-guide {
  max-width: 780px;
  color: var(--color-text-primary, #1b1b1f);
  line-height: 1.65;

  &__head {
    display: flex; gap: 14px; align-items: flex-start; margin-bottom: 20px;
  }
  &__title { font-size: 1.7rem; letter-spacing: -0.02em; margin: 0 0 4px; }
  &__sub { color: var(--color-text-secondary, #6b7280); margin: 0; }

  &__note {
    display: flex; gap: 10px; align-items: flex-start;
    background: color-mix(in srgb, var(--q-primary) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--q-primary) 22%, var(--color-border));
    border-radius: 12px; padding: 14px 16px; margin-bottom: 24px; font-size: 0.92rem;
    strong { color: var(--color-text-primary); }
  }

  &__card {
    background: var(--color-surface, #fff);
    border: 1px solid var(--color-border, #e7e2da);
    border-radius: 14px; padding: 20px 22px; margin-bottom: 18px;
  }
  &__cardhead {
    display: flex; align-items: center; gap: 10px; margin-bottom: 6px; flex-wrap: wrap;
    h2 { font-size: 1.2rem; margin: 0; letter-spacing: -0.01em; }
  }
  &__desc { color: var(--color-text-secondary, #6b7280); margin: 4px 0 14px; }
  &__step-label {
    font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em;
    color: var(--color-text-secondary, #6b7280); font-weight: 700; margin: 12px 0 8px;
  }
  &__steps {
    margin: 0; padding-left: 22px;
    li { margin-bottom: 6px; }
  }
  &__paste {
    margin-top: 14px; padding: 12px 14px; border-radius: 10px;
    background: var(--color-surface-variant, #f4f1ec);
    border: 1px dashed color-mix(in srgb, var(--q-primary) 40%, var(--color-border));
    font-size: 0.9rem;
    strong { color: var(--q-primary); }
  }

  &__checklist {
    background: var(--color-surface, #fff);
    border: 1px solid var(--color-border, #e7e2da);
    border-radius: 14px; padding: 20px 22px; margin-bottom: 18px;
    h2 { font-size: 1.15rem; margin: 0 0 12px; }
    ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
    li { display: flex; gap: 10px; align-items: flex-start; font-size: 0.94rem; }
  }

  .mc-badge {
    font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--q-primary); background: color-mix(in srgb, var(--q-primary) 12%, transparent);
    padding: 3px 8px; border-radius: 6px;
    &--free { color: #1f9d63; background: color-mix(in srgb, #1f9d63 12%, transparent); }
  }

  a { color: var(--q-primary); text-decoration: none; &:hover { text-decoration: underline; } }

  &__back { margin-top: 20px; }
}
</style>
