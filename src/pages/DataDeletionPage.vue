<template>
  <q-page class="mc-legal-page">
    <div class="mc-legal container">
      <h1 class="mc-legal__title">Eliminación de datos</h1>
      <p class="mc-legal__updated">Última actualización: 23 de julio de 2026</p>

      <p>
        En <strong>ComeleYa</strong> respetamos tu derecho a solicitar la eliminación de tus datos
        personales, incluidos los datos asociados a tu inicio de sesión con Facebook.
      </p>

      <h2>Cómo solicitar la eliminación de tus datos</h2>
      <p>Puedes pedir que eliminemos tus datos personales de cualquiera de estas formas:</p>
      <ol>
        <li>
          Envía un correo a <a href="mailto:info@comeleya.com">info@comeleya.com</a> desde la dirección
          asociada a tu cuenta, con el asunto <strong>"Eliminación de datos"</strong>.
        </li>
        <li>Indica tu nombre y, si aplica, el correo o teléfono con el que usaste la plataforma.</li>
      </ol>

      <h2>Qué hacemos con tu solicitud</h2>
      <ul>
        <li>Verificamos tu identidad para proteger tu información.</li>
        <li>
          Eliminamos o anonimizamos los datos personales asociados a tu cuenta y a tu inicio de sesión
          con Facebook, salvo aquellos que debamos conservar por obligaciones legales.
        </li>
        <li>Te confirmamos cuando el proceso se haya completado, normalmente dentro de 30 días.</li>
      </ul>

      <h2>Datos del inicio de sesión con Facebook</h2>
      <p>
        Si iniciaste sesión con Facebook, los únicos datos que recibimos son los básicos de tu perfil
        (nombre y correo) necesarios para autenticarte. Al solicitar la eliminación, borramos esa
        asociación de nuestros sistemas.
      </p>

      <h2>Contacto</h2>
      <p>
        Para cualquier duda sobre la eliminación de datos, escríbenos a
        <a href="mailto:info@comeleya.com">info@comeleya.com</a>. Consulta también nuestra
        <router-link to="/privacidad">Política de Privacidad</router-link>.
      </p>

      <div class="mc-legal__back">
        <q-btn flat no-caps color="primary" icon="arrow_back" label="Volver al inicio" to="/" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
defineOptions({ name: "DataDeletionPage" });
</script>

<style lang="scss" scoped>
.mc-legal-page {
  background: var(--color-surface, #fff);
  padding: 32px 0 64px;
}
.mc-legal {
  max-width: 820px;
  color: var(--color-text-primary, #1b1b1f);
  line-height: 1.7;
  &__title { font-size: 2rem; margin-bottom: 4px; }
  &__updated { color: var(--color-text-secondary, #6b7280); font-size: 0.9rem; margin-bottom: 24px; }
  h2 { font-size: 1.2rem; margin: 28px 0 8px; }
  p { margin: 8px 0; }
  ul, ol { padding-left: 22px; margin: 8px 0; li { margin-bottom: 6px; } }
  a { color: var(--q-primary); text-decoration: none; &:hover { text-decoration: underline; } }
  &__back { margin-top: 32px; }
}
</style>
