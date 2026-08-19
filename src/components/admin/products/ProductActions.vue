<template>
  <!-- Este componente ya solo arma la lista de acciones del platillo; dibujarlas es
       trabajo de RowActionsMenu, que es el mismo que usan Categorias y Extras. Antes
       tenia su propia copia del menu, y por eso en celular se veia distinto al de las
       otras dos pantallas. -->
  <row-actions-menu :actions="actions" :titulo="product.name" />
</template>

<script setup>
defineOptions({ name: "ProductActions" });

import { computed } from "vue";
import RowActionsMenu from "../RowActionsMenu.vue";

const props = defineProps({
  product: { type: Object, required: true },
});

const emit = defineEmits([
  "featured",
  "offer",
  "soldout",
  "edit",
  "extras",
  "clone",
  "delete",
]);

// Misma lista para escritorio (iconos) y móvil (menú), sin duplicar markup.
const actions = computed(() => {
  const p = props.product;
  return [
    {
      key: "featured",
      icon: p.is_featured ? "star" : "star_border",
      color: p.is_featured ? "amber-8" : "grey-7",
      label: p.is_featured ? "Quitar destacado" : "Destacar",
      handler: () => emit("featured"),
    },
    {
      key: "offer",
      icon: "local_offer",
      color: p.special_price ? "red-6" : "grey-7",
      label: p.special_price ? "Editar oferta" : "Crear oferta",
      handler: () => emit("offer"),
    },
    {
      key: "soldout",
      icon: p.is_sold_out ? "remove_shopping_cart" : "shopping_cart_checkout",
      color: p.is_sold_out ? "negative" : "grey-7",
      label: p.is_sold_out ? "Marcar disponible" : "Marcar agotado",
      handler: () => emit("soldout"),
    },
    {
      key: "edit",
      icon: "edit",
      color: "grey-7",
      label: "Editar",
      handler: () => emit("edit"),
    },
    {
      key: "extras",
      icon: "add_circle_outline",
      color: "grey-7",
      label: "Agregar Extras",
      handler: () => emit("extras"),
    },
    {
      key: "clone",
      icon: "content_copy",
      color: "grey-7",
      label: "Clonar",
      handler: () => emit("clone"),
    },
    {
      key: "delete",
      icon: "delete_outline",
      color: "negative",
      label: "Eliminar",
      handler: () => emit("delete"),
    },
  ];
});
</script>
