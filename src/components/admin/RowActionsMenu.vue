<template>
  <!-- Escritorio: iconos en línea. Con mas de cuatro, solo los principales; el resto
       va en "⋯" con su nombre escrito. Siete iconos sueltos por renglon (estrella,
       etiqueta, carrito, lapiz, mas, copiar, bote) solo se distinguian pasando el
       cursor por cada uno. -->
  <div v-if="!modoApp" class="mc-acciones-fila">
    <q-btn
      v-for="a in enLinea"
      :key="a.key || a.label"
      flat size="sm" dense round
      :icon="a.icon"
      :color="a.color || 'grey-7'"
      :aria-label="a.label"
      @click="a.handler"
    >
      <q-tooltip>{{ a.label }}</q-tooltip>
    </q-btn>
    <q-btn
      v-if="enMenu.length"
      flat size="sm" dense round
      icon="more_horiz"
      color="grey-7"
      aria-label="Más acciones"
    >
      <q-menu anchor="bottom right" self="top right" class="mc-acciones-menu">
        <q-list dense style="min-width: 190px">
          <q-item
            v-for="a in enMenu.filter((x) => !esDestructiva(x))"
            :key="a.key || a.label"
            clickable
            v-close-popup
            @click="a.handler"
          >
            <q-item-section avatar>
              <q-icon :name="a.icon" :color="a.color || 'grey-7'" size="20px" />
            </q-item-section>
            <q-item-section>{{ a.label }}</q-item-section>
          </q-item>
          <template v-if="enMenu.some(esDestructiva)">
            <q-separator class="q-my-xs" />
            <q-item
              v-for="a in enMenu.filter(esDestructiva)"
              :key="a.key || a.label"
              clickable
              v-close-popup
              class="text-negative"
              @click="a.handler"
            >
              <q-item-section avatar>
                <q-icon :name="a.icon" color="negative" size="20px" />
              </q-item-section>
              <q-item-section>{{ a.label }}</q-item-section>
            </q-item>
          </template>
        </q-list>
      </q-menu>
    </q-btn>
  </div>

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

// actions: [{ key?, icon, color?, label, handler, principal?, destructiva? }]
// principal: se queda a la vista en escritorio cuando hay mas de cuatro acciones.
const props = defineProps({
  actions: { type: Array, required: true },
  // Sobre qué se va a actuar. Sin esto, la hoja abre con siete verbos y ninguna pista
  // de a cuál de las cincuenta filas pertenecen.
  titulo: { type: String, default: "" },
});

const { modoApp } = useModoApp();
const abierta = ref(false);

/**
 * Lo que no se puede deshacer.
 *
 * Antes contaba cualquier accion en rojo, y el rojo tambien marca ESTADO: un platillo
 * agotado pinta su "Marcar disponible" en rojo, y en celular esa accion se iba al grupo
 * de Eliminar. Ahora cuenta lo que se declara destructivo o dice que borra.
 */
const esDestructiva = (a) => a.destructiva === true || /elimin|borrar/i.test(a.label || "");

// Hasta cuatro caben y se leen; con mas, los principales (o los tres primeros) quedan.
const MAX_EN_LINEA = 4;
const enLinea = computed(() => {
  if (props.actions.length <= MAX_EN_LINEA) return props.actions;
  const principales = props.actions.filter((a) => a.principal);
  return principales.length
    ? principales
    : props.actions.filter((a) => !esDestructiva(a)).slice(0, 3);
});
const enMenu = computed(() =>
  props.actions.filter((a) => !enLinea.value.includes(a))
);

const normales = computed(() => props.actions.filter((a) => !esDestructiva(a)));
const destructivas = computed(() => props.actions.filter(esDestructiva));

const elegir = (a) => {
  abierta.value = false;
  a.handler();
};
</script>

<style lang="scss" scoped>
.mc-acciones-fila {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
</style>
