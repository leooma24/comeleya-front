<template>
  <svg
    class="mc-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <!-- Los trazos se dibujan aquí y no en un sprite aparte para que el icono viaje
         con el componente: un <use href="#..."> depende de que el sprite ya esté en
         el documento, y en vistas cargadas de forma diferida eso no está garantizado. -->
    <g v-html="trazo" />
  </svg>
</template>

<script setup>
defineOptions({ name: "McIcon" });
import { computed } from "vue";

/**
 * Iconos del panel móvil.
 *
 * Dibujados para ESTE panel, no tomados de una librería: el de la moto es el
 * repartidor, el de la caja es el corte, el del ticket es el pedido. Trazo de 1.6 en
 * rejilla de 24, puntas redondeadas.
 *
 * El color sale de `currentColor`, así que el icono se pinta con el color del texto
 * que lo rodea y no hay que pasarle nada.
 */
const TRAZOS = {
  ticket:
    '<path d="M5 3h14v18l-2.5-1.6L14 21l-2-1.5L10 21l-2.5-1.6L5 21z"/><path d="M9 8h6M9 12h6"/>',
  panel: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 10h18M9 20V10"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  mas: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
  campana:
    '<path d="M18 15V10a6 6 0 1 0-12 0v5l-1.6 2.4h15.2z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  buscar: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
  sonido: '<path d="M5 9v6h3.5L13 19V5L8.5 9z"/><path d="M16.5 9.5a4 4 0 0 1 0 5"/>',
  moto:
    '<circle cx="6.5" cy="17" r="2.8"/><circle cx="17.5" cy="17" r="2.8"/><path d="M6.5 17l4-8h5l2 8M13 6h3"/>',
  silla: '<path d="M6 4v8h12V4M5 12h14M8 12v7M16 12v7"/>',
  cupon:
    '<path d="M3 8.5A2 2 0 0 0 5 6.5h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 3.5v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-3.5z"/><path d="M14 9.5l-4 5"/>',
  estrella: '<path d="M12 4l2.4 5 5.6.8-4 3.9 1 5.5-5-2.6-5 2.6 1-5.5-4-3.9 5.6-.8z"/>',
  gente:
    '<circle cx="9" cy="9" r="3.2"/><path d="M3.5 19c0-3 2.5-4.6 5.5-4.6s5.5 1.6 5.5 4.6"/><path d="M16 10.2A3 3 0 0 0 17 5m1.5 13.4c0-2.2-.8-3.5-2.2-4.3"/>',
  grafica: '<path d="M4 19V6M4 19h16"/><path d="M8 16v-4M12.5 16V9M17 16v-6"/>',
  paleta:
    '<path d="M12 4a8 8 0 1 0 0 16c1.4 0 1.6-1 1-1.7-.7-.9-.2-2 1-2h1.7A4.3 4.3 0 0 0 20 12c0-4.4-3.6-8-8-8z"/><circle cx="8.5" cy="10.5" r="1"/><circle cx="12" cy="8" r="1"/><circle cx="15.5" cy="10.5" r="1"/>',
  mundo:
    '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4a13 13 0 0 1 0 16 13 13 0 0 1 0-16z"/>',
  impresora:
    '<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="7" rx="2"/><path d="M7 14h10v6H7z"/>',
  chat: '<path d="M20 12a7.5 7.5 0 0 1-11 6.6L4.5 20l1.4-4A7.5 7.5 0 1 1 20 12z"/>',
  pin: '<path d="M12 21s6.5-6 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 15 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.3"/>',
  efectivo: '<rect x="3" y="7" width="18" height="10" rx="2"/><circle cx="12" cy="12" r="2.4"/>',
  tarjeta: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M3 10h18M6.5 14.5h3"/>',
  banco: '<path d="M4 10h16M12 4l8 4H4zM6.5 10v7M12 10v7M17.5 10v7M4 20h16"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  equis: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  flecha: '<path d="M9.5 5l7 7-7 7"/>',
  reloj: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
  sube: '<path d="M5 15l7-7 7 7"/>',
  baja: '<path d="M5 9l7 7 7-7"/>',
  mapa: '<path d="M9 4L3.5 6.5v13L9 17l6 2.5 5.5-2.5v-13L15 6.5z"/><path d="M9 4v13M15 6.5v13"/>',
  alerta: '<path d="M12 4.5L3 19.5h18z"/><path d="M12 10v4M12 16.8v.2"/>',
  nota: '<path d="M4 6h11l5 5v9H4z"/><path d="M8 12h7M8 16h5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  caja:
    '<rect x="3.5" y="8" width="17" height="12" rx="2"/><path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M9.5 14h5"/>',
  salir: '<path d="M14 5H6v14h8M17 12H10M14.5 9l3 3-3 3"/>',
  engrane:
    '<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M18 6l-1.4 1.4M7.4 16.6 6 18M18 18l-1.4-1.4M7.4 7.4 6 6"/>',
};

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 20 },
});

const trazo = computed(() => TRAZOS[props.name] || "");
</script>

<style lang="scss" scoped>
// El estilo va aquí y no en una clase suelta: usar solo la clase del tamaño dejaba el
// icono sin trazo y con el relleno negro por defecto, o sea una mancha.
.mc-icon {
  display: block;
  flex: 0 0 auto;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
