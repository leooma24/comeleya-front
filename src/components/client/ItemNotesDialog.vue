<template>
  <q-dialog v-model="showDialog" backdrop-filter="blur(8px)" @show="onShow">
    <q-card style="border-radius: 16px; min-width: 320px; max-width: 420px">
      <q-card-section class="mc-notes-header">
        <q-icon name="chat_bubble_outline" size="22px" color="primary" class="q-mr-sm" />
        <span class="mc-notes-header__title">Comentario</span>
        <q-space />
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <p class="mc-notes-dish">{{ dishName }}</p>
        <p class="mc-notes-caption">
          Le llega a la cocina junto con tu platillo.
        </p>

        <q-input
          ref="inputRef"
          filled
          dense
          rounded
          v-model="text"
          type="textarea"
          autogrow
          maxlength="255"
          counter
          placeholder="Ej: sin cebolla, término medio, salsa aparte…"
          @keydown.ctrl.enter="save"
        />
      </q-card-section>

      <q-card-actions class="q-px-lg q-pb-lg">
        <!-- Solo si ya había algo guardado: no tiene sentido "eliminar" lo que
             nunca existió. -->
        <q-btn
          v-if="modelValueText"
          flat
          no-caps
          color="negative"
          label="Eliminar"
          @click="remove"
        />
        <q-space />
        <q-btn flat no-caps color="grey-7" label="Cancelar" v-close-popup />
        <q-btn
          unelevated
          no-caps
          color="primary"
          label="Guardar"
          :disable="!hasChanges"
          @click="save"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
defineOptions({
  name: "ItemNotesDialog",
});

import { ref, computed, nextTick } from "vue";

const showDialog = defineModel({ default: false });

const props = defineProps({
  dishName: { type: String, default: "" },
  // La nota ya guardada. Puede llegar undefined: los carritos que el comensal
  // tenía guardados antes de esta función no traen el campo.
  modelValueText: { type: String, default: "" },
});

const emit = defineEmits(["save", "remove"]);

const text = ref("");
const inputRef = ref(null);

// Se copia al abrir, no al montar: el diálogo vive en el renglón del carrito y se
// reutiliza, así que sin esto arrastraría la nota del platillo anterior.
const onShow = async () => {
  text.value = props.modelValueText || "";
  await nextTick();
  inputRef.value?.focus();
};

const limpio = computed(() => text.value.trim());
const hasChanges = computed(() => limpio.value !== (props.modelValueText || "").trim());

const save = () => {
  // Guardar con el campo vacío equivale a borrar.
  if (!limpio.value) {
    emit("remove");
  } else {
    emit("save", limpio.value);
  }
  showDialog.value = false;
};

const remove = () => {
  emit("remove");
  showDialog.value = false;
};
</script>

<style lang="scss" scoped>
.mc-notes-header {
  display: flex;
  align-items: center;

  &__title {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: var(--text-lg);
    color: var(--color-text-primary);
  }
}

.mc-notes-dish {
  font-weight: 600;
  font-size: var(--text-base);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-xs);
}

.mc-notes-caption {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin: 0 0 var(--space-md);
}
</style>
