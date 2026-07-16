<template>
  <q-drawer
    :model-value="modelValue"
    bordered
    overlay
    side="right"
    :width="drawerWidth"
    class="mc-form-drawer"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="mc-form-drawer__header">
      <h6>{{ title }}</h6>
      <q-btn
        flat
        round
        dense
        icon="close"
        color="grey-6"
        @click="$emit('update:modelValue', false)"
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
import { computed } from "vue";
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
});

defineEmits(["update:modelValue", "save"]);

const $q = useQuasar();
const drawerWidth = computed(() =>
  $q.screen.width <= 440 ? $q.screen.width : 440
);
</script>
