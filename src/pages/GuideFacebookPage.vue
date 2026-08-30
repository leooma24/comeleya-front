<template>
  <q-page class="mc-guide-page">
    <div class="mc-guide container">
      <header class="mc-guide__head">
        <q-icon name="fab fa-facebook" size="34px" color="primary" />
        <div>
          <h1 class="mc-guide__title">Cómo conectar tu restaurante con Facebook, Instagram y WhatsApp</h1>
          <p class="mc-guide__sub">
            Guía paso a paso para dejar funcionando el Píxel, el catálogo, el chat de Messenger y el mismo catálogo en Instagram y WhatsApp.
          </p>
        </div>
      </header>

      <guia-meta />

      <div class="mc-guide__back">
        <q-btn flat no-caps color="primary" icon="arrow_back" label="Cerrar guía" @click="goBack" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
// La guia en si vive en el componente: la pintan esta pagina publica -la que se
// comparte por WhatsApp- y el tab "Guia" dentro de Crecimiento - Meta. Una sola
// copia, porque tenerla en dos ya nos costo un cliente atorado.
import GuiaMeta from "src/components/GuiaMeta.vue";

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

  // La salida cuando la ruta de Facebook no coincide con lo que el negocio ve en
  // pantalla. Va mas apagada que __paste: es el plan B, no el paso.
  &__tip {
    margin-top: 10px; padding: 10px 12px; border-radius: 10px;
    background: var(--color-surface-variant, #f4f1ec);
    border-left: 3px solid var(--color-text-tertiary, #9aa0a6);
    font-size: 0.85rem;
    color: var(--color-text-secondary, #5f6368);

    ul { margin: 6px 0 0; padding-left: 18px; }
    li { margin-bottom: 4px; }
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
