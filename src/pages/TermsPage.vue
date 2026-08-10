<template>
  <q-page class="mc-legal-page">
    <div class="mc-legal container">
      <h1 class="mc-legal__title">Términos y Condiciones</h1>
      <p class="mc-legal__updated">Última actualización: 23 de julio de 2026</p>

      <p>
        Bienvenido a <strong>ComeleYa</strong>. Estos Términos y Condiciones ("Términos") regulan el
        uso de nuestra plataforma de menús digitales y pedidos para restaurantes, tanto para
        comensales como para restaurantes que la contratan. Al usar ComeleYa aceptas estos Términos.
      </p>

      <h2>1. Descripción del servicio</h2>
      <p>
        ComeleYa ofrece a los restaurantes menús digitales, gestión de productos, recepción de
        pedidos y herramientas de crecimiento. Los pedidos se coordinan entre el comensal y el
        restaurante; ComeleYa es la plataforma tecnológica, no el vendedor de los alimentos.
      </p>

      <h2>2. Cuentas</h2>
      <p>
        Los restaurantes requieren una cuenta para administrar su establecimiento. Eres responsable de
        mantener la confidencialidad de tus credenciales y de la actividad realizada desde tu cuenta.
      </p>

      <h2>3. Uso aceptable</h2>
      <ul>
        <li>No usar la plataforma para fines ilícitos, fraudulentos o que infrinjan derechos de terceros.</li>
        <li>No publicar contenido falso, ofensivo o que engañe a los comensales.</li>
        <li>No intentar vulnerar la seguridad ni el funcionamiento de la plataforma.</li>
      </ul>

      <h2>4. Pedidos, precios y pagos</h2>
      <p>
        Los precios, la disponibilidad y las condiciones de entrega los define cada restaurante. Los
        pagos pueden realizarse según los métodos que cada restaurante habilite (efectivo,
        transferencia u otros). ComeleYa no garantiza la disponibilidad de los productos publicados.
      </p>

      <h2>5. Suscripciones de restaurantes</h2>
      <p>
        El acceso a ciertas funciones depende del plan contratado. Las condiciones, vigencia y
        renovación de cada plan se muestran al momento de la contratación. La falta de pago puede
        suspender el acceso a funciones de pago.
      </p>

      <h2>6. Propiedad intelectual</h2>
      <p>
        La plataforma, su software, marca y diseño son propiedad de ComeleYa. El contenido que sube
        cada restaurante (fotos, textos, menús) es de su propiedad, y nos otorga permiso para mostrarlo
        dentro de la plataforma con el fin de operar el servicio.
      </p>

      <h2>7. Servicios de terceros</h2>
      <p>
        La plataforma puede integrarse con servicios de terceros como WhatsApp, Meta (Facebook/
        Instagram) y procesadores de pago. El uso de esos servicios se rige también por sus propios
        términos y políticas.
      </p>

      <h2>8. Limitación de responsabilidad</h2>
      <p>
        ComeleYa se ofrece "tal cual". No somos responsables por la calidad, preparación o entrega de
        los alimentos, que son responsabilidad de cada restaurante. En la medida permitida por la ley,
        ComeleYa no será responsable por daños indirectos derivados del uso de la plataforma.
      </p>

      <h2>9. Terminación</h2>
      <p>
        Podemos suspender o cancelar el acceso a la plataforma en caso de incumplimiento de estos
        Términos o de uso indebido del servicio.
      </p>

      <h2>10. Cambios a los Términos</h2>
      <p>
        Podemos actualizar estos Términos ocasionalmente. La versión vigente estará siempre publicada
        en esta página con su fecha de actualización.
      </p>

      <h2>11. Ley aplicable</h2>
      <p>
        Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier controversia
        se resolverá ante los tribunales competentes de México.
      </p>

      <h2>12. Contacto</h2>
      <p>
        Para cualquier duda sobre estos Términos, escríbenos a
        <a href="mailto:info@comeleya.com">info@comeleya.com</a>.
      </p>

      <div class="mc-legal__back">
        <q-btn flat no-caps color="primary" icon="arrow_back" label="Volver al inicio" to="/" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
defineOptions({ name: "TermsPage" });
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
  ul { padding-left: 22px; margin: 8px 0; li { margin-bottom: 6px; } }
  a { color: var(--q-primary); text-decoration: none; &:hover { text-decoration: underline; } }
  &__back { margin-top: 32px; }
}
</style>
