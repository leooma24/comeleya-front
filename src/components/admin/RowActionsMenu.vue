<template>
  <!-- Escritorio: iconos en línea -->
  <template v-if="$q.screen.gt.sm">
    <q-btn
      v-for="a in actions"
      :key="a.key || a.label"
      flat size="sm" dense round
      :icon="a.icon"
      :color="a.color || 'grey-7'"
      @click="a.handler"
    >
      <q-tooltip>{{ a.label }}</q-tooltip>
    </q-btn>
  </template>

  <!-- Móvil / tablet: un solo botón con menú desplegable -->
  <q-btn
    v-else
    flat dense round
    icon="more_vert"
    color="grey-8"
    @click.stop
  >
    <q-menu anchor="bottom right" self="top right" auto-close>
      <q-list style="min-width: 190px">
        <q-item
          v-for="a in actions"
          :key="a.key || a.label"
          clickable
          @click="a.handler"
        >
          <q-item-section avatar>
            <q-icon :name="a.icon" :color="a.color || 'grey-7'" />
          </q-item-section>
          <q-item-section>{{ a.label }}</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup>
defineOptions({ name: "RowActionsMenu" });

import { useQuasar } from "quasar";

const $q = useQuasar();

// actions: [{ key?, icon, color?, label, handler }]
defineProps({
  actions: { type: Array, required: true },
});
</script>
