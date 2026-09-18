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
import { useCompanyStore } from "src/stores/company-store";
import { tieneSucursales } from "src/utils/sucursales";

const companyStore = useCompanyStore();

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

/** Si falta en algun lado: en todo el negocio, o en alguna de sus cocinas. */
const faltaEnAlgunLado = (p) => !!p.is_sold_out || (p.locales_agotados?.length ?? 0) > 0;

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
    // Con sucursales la pregunta no es si se acabo sino donde: se abre el dialogo en
    // lugar de apagarlo en todos los locales de una.
    {
      key: "soldout",
      icon: faltaEnAlgunLado(p) ? "remove_shopping_cart" : "shopping_cart_checkout",
      color: faltaEnAlgunLado(p) ? "negative" : "grey-7",
      label: tieneSucursales(companyStore.company)
        ? "¿Dónde se acabó?"
        : p.is_sold_out
          ? "Marcar disponible"
          : "Marcar agotado",
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
