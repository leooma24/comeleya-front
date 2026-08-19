<template>
  <!-- Escritorio: iconos en línea (como siempre) -->
  <template v-if="$q.screen.gt.sm">
    <q-btn
      v-for="a in actions"
      :key="a.key"
      flat size="sm" dense round
      :icon="a.icon"
      :color="a.color"
      @click="a.handler"
    >
      <q-tooltip>{{ a.label }}</q-tooltip>
    </q-btn>
  </template>

  <!-- Móvil / tablet: un solo botón que despliega el menú de acciones -->
  <q-btn
    v-else
    flat dense round
    icon="more_vert"
    color="grey-8"
    @click.stop
  >
    <q-menu anchor="bottom right" self="top right" auto-close>
      <q-list style="min-width: 200px">
        <q-item
          v-for="a in actions"
          :key="a.key"
          clickable
          @click="a.handler"
        >
          <q-item-section avatar>
            <q-icon :name="a.icon" :color="a.color" />
          </q-item-section>
          <q-item-section>{{ a.label }}</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup>
defineOptions({ name: "ProductActions" });

import { computed } from "vue";
import { useQuasar } from "quasar";

const $q = useQuasar();

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
