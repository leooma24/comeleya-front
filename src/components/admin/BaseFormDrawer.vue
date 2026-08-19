<template>
  <q-drawer
    :model-value="modelValue"
    bordered
    overlay
    side="right"
    :width="drawerWidth"
    class="mc-form-drawer"
    @update:model-value="onDrawerModel"
  >
    <div class="mc-form-drawer__header">
      <h6>{{ title }}</h6>
      <q-btn
        flat
        round
        dense
        icon="close"
        color="grey-6"
        @click="requestClose"
      />
    </div>

    <q-scroll-area style="height: calc(100% - 130px)">
      <div class="mc-form-drawer__body">
        <slot />
      </div>
    </q-scroll-area>

    <div class="mc-form-drawer__save">
      <q-btn
        :loading="loading"
        unelevated
        color="primary"
        icon="save"
        no-caps
        :label="saveLabel"
        @click="$emit('save')"
      />
    </div>
  </q-drawer>
</template>

<script setup>
import { computed, watch } from "vue";
import { useQuasar } from "quasar";

defineOptions({
  name: "BaseFormDrawer",
});

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  saveLabel: {
    type: String,
    default: "Guardar",
  },
  loading: {
    type: Boolean,
    default: false,
  },
  // Objeto reactivo del formulario a vigilar. Si se pasa, al cerrar con cambios
  // sin guardar se pregunta si desean guardar. Si NO se pasa, cierra directo.
  formData: {
    type: [Object, null],
    default: null,
  },
  // Fuerza "cambios pendientes" (p. ej. una imagen subiéndose).
  uploading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "save"]);

const $q = useQuasar();
const drawerWidth = computed(() =>
  $q.screen.width <= 440 ? $q.screen.width : 440
);

// "Foto" del formulario al abrir, para detectar cambios al cerrar.
let snapshot = null;
watch(
  () => props.modelValue,
  (open) => {
    if (open) snapshot = props.formData ? JSON.stringify(props.formData) : null;
  }
);

const isDirty = () => {
  if (props.uploading) return true;
  if (!props.formData) return false;
  return snapshot !== null && snapshot !== JSON.stringify(props.formData);
};

const doClose = () => emit("update:modelValue", false);

const requestClose = () => {
  if (!isDirty()) {
    doClose();
    return;
  }
  $q.dialog({
    title: "Cambios sin guardar",
    message: "Hiciste cambios y aún no los guardas. ¿Qué deseas hacer?",
    ok: { label: "Guardar", unelevated: true, noCaps: true, color: "primary" },
    cancel: { label: "Descartar", flat: true, noCaps: true, color: "negative" },
    persistent: true,
  })
    .onOk(() => emit("save"))
    .onCancel(() => doClose());
};

// El q-drawer emite update:model-value(false) al hacer clic fuera o ESC.
const onDrawerModel = (val) => {
  if (val) {
    emit("update:modelValue", true);
    return;
  }
  requestClose();
};
</script>
