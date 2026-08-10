<template>
  <q-page class="mc-legal-page">
    <div class="mc-legal container">
      <h1 class="mc-legal__title">Política de Privacidad</h1>
      <p class="mc-legal__updated">Última actualización: 23 de julio de 2026</p>

      <p>
        En <strong>ComeleYa</strong> ("nosotros", "la plataforma") valoramos tu privacidad. Esta
        Política de Privacidad explica qué datos personales recopilamos, cómo los usamos y qué
        derechos tienes. Al usar ComeleYa —ya sea el menú digital de un restaurante, el panel de
        administración o nuestro sitio— aceptas las prácticas aquí descritas.
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        ComeleYa es una plataforma de menús digitales y pedidos para restaurantes. Para cualquier
        asunto relacionado con tus datos personales puedes contactarnos en
        <a href="mailto:info@comeleya.com">info@comeleya.com</a>.
      </p>

      <h2>2. Datos que recopilamos</h2>
      <ul>
        <li>
          <strong>De comensales:</strong> nombre, teléfono y dirección de entrega cuando realizas un
          pedido; el detalle del pedido, método de pago seleccionado y notas que proporciones.
        </li>
        <li>
          <strong>De administradores de restaurantes:</strong> nombre, correo electrónico y datos de
          la cuenta para iniciar sesión y gestionar su establecimiento.
        </li>
        <li>
          <strong>Datos técnicos:</strong> información del dispositivo y navegador, así como datos de
          uso e interacción con el menú, recabados mediante cookies y tecnologías similares.
        </li>
      </ul>

      <h2>3. Cómo usamos tus datos</h2>
      <ul>
        <li>Procesar y coordinar tus pedidos con el restaurante.</li>
        <li>Permitir el inicio de sesión y la gestión del panel de administración.</li>
        <li>Mejorar la plataforma, la experiencia del menú y nuestro servicio.</li>
        <li>Cumplir con obligaciones legales y prevenir fraudes o abusos.</li>
      </ul>
      <p>
        Los pedidos se envían al restaurante correspondiente, generalmente a través de WhatsApp, para
        que puedan prepararlos y entregarlos. No vendemos tus datos personales.
      </p>

      <h2>4. Compartir con terceros</h2>
      <p>Podemos compartir datos con proveedores que nos ayudan a operar la plataforma, únicamente para los fines descritos:</p>
      <ul>
        <li><strong>WhatsApp / Meta:</strong> para enviar el pedido al restaurante y para funciones de mensajería.</li>
        <li>
          <strong>Meta (Facebook Píxel y Login):</strong> cuando un restaurante activa estas
          funciones, Meta puede recibir datos de interacción con el menú para medición de anuncios, y
          datos básicos de tu perfil si inicias sesión con Facebook.
        </li>
        <li><strong>Procesadores de pago:</strong> para gestionar pagos cuando aplique.</li>
        <li><strong>Proveedores de hospedaje e infraestructura:</strong> para almacenar y servir la plataforma de forma segura.</li>
      </ul>

      <h2>5. Cookies y tecnologías de seguimiento</h2>
      <p>
        Usamos cookies y tecnologías similares para el funcionamiento del sitio y, cuando el
        restaurante lo habilita, el <strong>Píxel de Meta</strong> para medir el rendimiento de sus
        anuncios. Puedes gestionar las cookies desde la configuración de tu navegador.
      </p>

      <h2>6. Conservación de los datos</h2>
      <p>
        Conservamos los datos personales el tiempo necesario para cumplir con los fines descritos y
        con las obligaciones legales aplicables. Cuando ya no son necesarios, se eliminan o anonimizan.
      </p>

      <h2>7. Seguridad</h2>
      <p>
        Aplicamos medidas técnicas y organizativas razonables para proteger tus datos contra acceso,
        alteración o divulgación no autorizados. Ningún sistema es 100% infalible, pero trabajamos para
        mantener tu información segura.
      </p>

      <h2>8. Tus derechos (ARCO)</h2>
      <p>
        De acuerdo con la legislación mexicana en materia de protección de datos personales, tienes
        derecho a <strong>Acceder, Rectificar, Cancelar u Oponerte</strong> (derechos ARCO) al
        tratamiento de tus datos, así como a revocar tu consentimiento. Para ejercerlos, escríbenos a
        <a href="mailto:info@comeleya.com">info@comeleya.com</a>.
      </p>

      <h2>9. Menores de edad</h2>
      <p>
        La plataforma no está dirigida a menores de edad. No recopilamos intencionalmente datos de
        menores sin el consentimiento de quien ejerza la patria potestad o tutela.
      </p>

      <h2>10. Eliminación de datos</h2>
      <p>
        Si deseas que eliminemos tus datos personales o los asociados a tu inicio de sesión con
        Facebook, envía tu solicitud a <a href="mailto:info@comeleya.com">info@comeleya.com</a> y la
        atenderemos conforme a la ley aplicable.
      </p>

      <h2>11. Cambios a esta política</h2>
      <p>
        Podemos actualizar esta Política de Privacidad ocasionalmente. Publicaremos la versión vigente
        en esta misma página con su fecha de actualización.
      </p>

      <h2>12. Contacto</h2>
      <p>
        Si tienes dudas sobre esta política o sobre el tratamiento de tus datos, contáctanos en
        <a href="mailto:info@comeleya.com">info@comeleya.com</a>.
      </p>

      <div class="mc-legal__back">
        <q-btn flat no-caps color="primary" icon="arrow_back" label="Volver al inicio" to="/" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
defineOptions({ name: "PrivacyPage" });
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

  &__title {
    font-size: 2rem;
    margin-bottom: 4px;
  }

  &__updated {
    color: var(--color-text-secondary, #6b7280);
    font-size: 0.9rem;
    margin-bottom: 24px;
  }

  h2 {
    font-size: 1.2rem;
    margin: 28px 0 8px;
  }

  p {
    margin: 8px 0;
  }

  ul {
    padding-left: 22px;
    margin: 8px 0;

    li {
      margin-bottom: 6px;
    }
  }

  a {
    color: var(--q-primary);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  &__back {
    margin-top: 32px;
  }
}
</style>
