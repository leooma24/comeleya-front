<template>
  <!-- Escritorio: iconos en línea -->
  <template v-if="!modoApp">
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

  <!-- Celular: hoja de acciones. El menú anclado al botón salía flotando encima de la
       lista, tapaba las filas de al lado y sus renglones eran del alto de un menú de
       escritorio. La hoja llega desde abajo, cerca del pulgar, dice sobre QUÉ se va a
       actuar y separa lo que borra del resto. -->
  <template v-else>
    <button type="button" class="mc-acciones__abrir" aria-label="Acciones" @click.stop="abierta = true">
      <mc-icon name="mas" :size="18" />
    </button>

    <q-dialog v-model="abierta" position="bottom" class="mc-acciones">
      <div class="mc-acciones__hoja">
        <div class="mc-acciones__grupo">
          <div class="mc-acciones__titulo" v-if="titulo">{{ titulo }}</div>
          <button
            v-for="a in normales"
            :key="a.key || a.label"
            type="button"
            class="mc-acciones__item"
            @click="elegir(a)"
          >
            <span>{{ a.label }}</span>
            <q-icon :name="a.icon" size="20px" />
          </button>
        </div>

        <!-- Lo que borra va en su propio grupo, separado por aire: en una lista
             corrida, "Eliminar" queda a un dedo de "Clonar". -->
        <div class="mc-acciones__grupo" v-if="destructivas.length">
          <button
            v-for="a in destructivas"
            :key="a.key || a.label"
            type="button"
            class="mc-acciones__item mc-acciones__item--rojo"
            @click="elegir(a)"
          >
            <span>{{ a.label }}</span>
            <q-icon :name="a.icon" size="20px" />
          </button>
        </div>

        <button type="button" class="mc-acciones__cancelar" @click="abierta = false">
          Cancelar
        </button>
      </div>
    </q-dialog>
  </template>
</template>

<script setup>
defineOptions({ name: "RowActionsMenu" });

import { ref, computed } from "vue";
import { useModoApp } from "src/composables/useModoApp";
import McIcon from "./movil/McIcon.vue";

// actions: [{ key?, icon, color?, label, handler }]
const props = defineProps({
  actions: { type: Array, required: true },
  // Sobre qué se va a actuar. Sin esto, la hoja abre con siete verbos y ninguna pista
  // de a cuál de las cincuenta filas pertenecen.
  titulo: { type: String, default: "" },
});

const { modoApp } = useModoApp();
const abierta = ref(false);

/** Lo que no se puede deshacer. El color negativo ya lo marcaba quien la declaró. */
const esDestructiva = (a) =>
  a.color === "negative" || /elimin|borrar/i.test(a.label || "");

const normales = computed(() => props.actions.filter((a) => !esDestructiva(a)));
const destructivas = computed(() => props.actions.filter(esDestructiva));

const elegir = (a) => {
  abierta.value = false;
  a.handler();
};
</script>
