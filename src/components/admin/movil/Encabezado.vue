<template>
  <header class="mc-head">
    <div class="mc-head__fila">
      <div class="mc-head__id">
        <div class="mc-head__tit">{{ titulo }}</div>
        <div class="mc-head__sub">
          <span class="mc-head__vivo" v-if="vivo"></span>
          {{ subtitulo }}
        </div>
      </div>
      <div class="mc-head__acc"><slot name="acciones" /></div>
    </div>

    <div class="mc-head__cifras" v-if="cifras.length">
      <template v-for="(c, i) in cifras" :key="c.l">
        <span class="mc-head__div" v-if="i"></span>
        <div>
          <div class="v">{{ c.v }}</div>
          <div class="l">{{ c.l }}</div>
        </div>
      </template>
    </div>

    <slot name="pie" />
  </header>
</template>

<script setup>
defineOptions({ name: "McEncabezado" });

/**
 * La banda de arriba de cada pantalla del panel en celular.
 *
 * Antes cada pantalla se presentaba a su manera: Pedidos con una banda oscura,
 * Hoy con una barra blanca, Menú con otra distinta y Más con una tercera. Al
 * moverse entre pestañas no se sentía la misma aplicación, sino cuatro pantallas
 * que alguien juntó.
 *
 * Ahora las cuatro usan esta: mismo fondo oscuro, mismo tamaño de título, mismo
 * lugar para los botones. Lo que cambia es el contenido, que es lo que debe
 * cambiar. Es lo que hacen las aplicaciones de este tipo -Square, Toast, el
 * panel de Shopify-: una franja de color propio arriba que se mantiene igual en
 * todo el producto, y debajo el contenido en claro.
 *
 * Las cifras son opcionales: la pantalla que no tiene tres números que valga la
 * pena mirar de reojo simplemente no los pasa, y la banda queda más baja.
 */
defineProps({
  titulo: { type: String, required: true },
  subtitulo: { type: String, default: "" },
  // El punto verde de "esto se está actualizando solo".
  vivo: { type: Boolean, default: false },
  // [{ v: "25", l: "Activos" }, ...]. Se reparten el ancho en partes iguales.
  cifras: { type: Array, default: () => [] },
});
</script>
