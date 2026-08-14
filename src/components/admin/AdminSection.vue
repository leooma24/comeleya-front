<template>
  <section class="mc-form-section">
    <header class="mc-form-section__header">
      <q-icon
        v-if="icon"
        :name="icon"
        size="18px"
        class="mc-form-section__icon"
      />
      <div class="mc-form-section__heading">
        <h4 class="mc-form-section__title">{{ title }}</h4>
        <p
          v-if="description || $slots.description"
          class="mc-form-section__desc"
        >
          <slot name="description">{{ description }}</slot>
        </p>
      </div>
    </header>

    <div class="mc-form-section__body">
      <slot />
    </div>
  </section>
</template>

<script setup>
/**
 * Un grupo de campos del panel: caja, titulo y una linea que explica que se logra ahi.
 *
 * El diseno no es nuevo, ya estaba en ConfigurationDrawer como `mc-config-section`.
 * El problema era que vivia en un <style scoped>, asi que cada pantalla lo reinvento a
 * su manera: la de Personalizar tema acabo con secciones que eran solo un espacio
 * vertical, sin fondo ni borde, y por eso el panel se veia plano y blanco.
 *
 * Es un componente y no nada mas una clase CSS a proposito. Lo que se lee como
 * profesional no es la caja sola: es caja + titulo + descripcion + espaciado parejo.
 * Una clase suelta deja que la siguiente pantalla vuelva a improvisar, que es
 * exactamente como se llego a tener tres convenciones distintas.
 *
 * La descripcion no es adorno. Es lo que hace que el dueno entienda el formulario sin
 * preguntar, y por eso debe decir que se logra en el grupo, NO repetir la etiqueta del
 * campo que tiene debajo. Si al escribirla no sale nada que no repita los campos, ese
 * grupo probablemente no deberia ser un grupo aparte.
 *
 * Los estilos viven en app.scss y no aqui, para que el marcado que se migre a mano
 * pueda usar `.mc-form-section` sin pasar por el componente.
 */
defineOptions({
  name: "AdminSection",
});

defineProps({
  title: {
    type: String,
    required: true,
  },
  // Texto plano. Para una descripcion con <strong> o enlaces, usar el slot del mismo
  // nombre: varias pantallas ya tenian hints con formato.
  description: {
    type: String,
    default: "",
  },
  // Icono de Material (Quasar ya los trae cargados). Opcional, pero es lo que mas
  // barato sube la sensacion de "sistema" y no de formulario suelto.
  icon: {
    type: String,
    default: "",
  },
});
</script>
