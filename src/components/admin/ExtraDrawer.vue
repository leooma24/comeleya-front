<template>
  <q-drawer
    :model-value="adminStore.extraDrawer"
    @update:model-value="onDrawerModel"
    bordered
    overlay
    side="right"
    :width="$q.screen.width <= 440 ? $q.screen.width : 440"
    class="mc-form-drawer"
  >
    <div class="mc-form-drawer__header">
      <h6>Extras del Producto</h6>
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
        <!-- Extras list -->
        <div class="mc-extras-section">
          <div class="mc-extras-section__header">
            <span class="mc-extras-section__title">Extras personalizados</span>
            <q-btn
              flat
              dense
              round
              color="primary"
              icon="add"
              size="sm"
              @click="adminStore.addExtra"
            >
              <q-tooltip>Agregar extra</q-tooltip>
            </q-btn>
          </div>

          <VueDraggableNext
            :list="adminStore.extras"
            @end="onDragEnd"
            handle=".handle"
          >
            <div
              v-for="(extra, index) in adminStore.extras"
              :key="extra.id"
              class="mc-extra-card"
            >
              <div class="mc-extra-card__header">
                <q-icon name="drag_indicator" class="handle" color="grey-5" />
                <span class="mc-extra-card__name">{{ extra.name || 'Sin nombre' }}</span>
                <div class="mc-extra-card__actions">
                  <q-chip
                    v-if="extra.is_required"
                    dense
                    color="orange-1"
                    text-color="orange-9"
                    size="sm"
                    label="Requerido"
                  />
                  <q-btn
                    flat
                    round
                    dense
                    icon="expand_more"
                    size="sm"
                    color="grey-6"
                    :class="{ 'rotate-180': expandedExtras[index] }"
                    @click="toggleExtra(index)"
                  />
                  <q-btn
                    flat
                    round
                    dense
                    icon="delete_outline"
                    size="sm"
                    color="negative"
                    @click="removeExtra(index)"
                  >
                    <q-tooltip>Eliminar extra</q-tooltip>
                  </q-btn>
                </div>
              </div>

              <div v-show="expandedExtras[index]" class="mc-extra-card__body">
                <q-input
                  v-model="extra.name"
                  label="Nombre del extra"
                  filled
                  dense
                  class="q-mb-md"
                />

                <!-- Cómo elige el cliente. Antes se deducía del precio de las
                     opciones, lo que hacía imposible un extra gratis y repetible. -->
                <div class="mc-field-label">¿Cómo elige el cliente?</div>
                <q-btn-toggle
                  :model-value="controlOf(extra)"
                  @update:model-value="setControl(extra, $event)"
                  spread
                  no-caps
                  unelevated
                  toggle-color="primary"
                  color="grey-3"
                  text-color="grey-8"
                  class="q-mb-md mc-control-toggle"
                  :options="[
                    { label: 'Uno solo', value: 'radio', icon: 'radio_button_checked' },
                    { label: 'Cantidades', value: 'counter', icon: 'exposure' },
                    { label: 'Varios', value: 'checkbox', icon: 'check_box' },
                  ]"
                />

                <div class="row q-col-gutter-sm q-mb-md">
                  <div class="col-6" v-if="controlOf(extra) !== 'radio'">
                    <q-input
                      v-model="extra.qty"
                      :label="controlOf(extra) === 'counter' ? 'Máx. piezas' : 'Máx. opciones'"
                      type="number"
                      min="1"
                      filled
                      dense
                    >
                      <template v-slot:append>
                        <q-icon name="info_outline" color="grey-5" size="xs">
                          <q-tooltip>
                            {{ controlOf(extra) === "counter"
                              ? "Piezas en total. El cliente puede repetir la misma opción."
                              : "Opciones distintas que puede marcar, sin repetir." }}
                          </q-tooltip>
                        </q-icon>
                      </template>
                    </q-input>
                  </div>
                  <div :class="controlOf(extra) === 'radio' ? 'col-12' : 'col-6'">
                    <q-toggle
                      v-model="extra.is_required"
                      :true-value="1"
                      :false-value="0"
                      checked-icon="check"
                      color="primary"
                      label="Requerido"
                      unchecked-icon="clear"
                      dense
                    />
                  </div>
                </div>

                <!-- Solo tiene sentido si alguna opción cuesta. Es el campo que hacía
                     que el navegador y el servidor calcularan distinto. -->
                <div v-if="tieneOpcionConPrecio(extra)" class="q-mb-md">
                  <div class="mc-field-label">El precio de la opción</div>
                  <q-option-group
                    :model-value="priceModeOf(extra)"
                    @update:model-value="extra.price_mode = $event"
                    :options="[
                      { label: 'Se suma al precio del platillo', value: 'add' },
                      { label: 'Reemplaza el precio del platillo', value: 'replace' },
                    ]"
                    color="primary"
                    dense
                  />
                </div>

                <!-- Options -->
                <div class="mc-options-section">
                  <div class="mc-options-section__header">
                    <span class="mc-options-section__title">Opciones</span>
                    <q-btn
                      flat
                      dense
                      round
                      color="primary"
                      icon="add"
                      size="xs"
                      @click="adminStore.addOption(extra)"
                    >
                      <q-tooltip>Agregar opción</q-tooltip>
                    </q-btn>
                  </div>

                  <div
                    v-for="(option, indexOption) in extra.options"
                    :key="'extra_' + index + 'option_' + indexOption"
                    class="mc-option-row"
                  >
                    <q-input
                      v-model="option.name"
                      label="Nombre"
                      filled
                      dense
                      class="mc-option-row__name"
                    />
                    <q-input
                      v-model="option.price"
                      type="number"
                      label="Precio"
                      filled
                      dense
                      prefix="$"
                      class="mc-option-row__price"
                    />
                    <q-btn
                      flat
                      round
                      dense
                      icon="delete_outline"
                      color="negative"
                      size="sm"
                      @click="removeOption(extra, indexOption)"
                    />
                  </div>

                  <div v-if="!extra.options?.length" class="mc-options-empty">
                    Agrega opciones para este extra
                  </div>
                </div>
              </div>
            </div>
          </VueDraggableNext>

          <div v-if="!adminStore.extras?.length" class="mc-options-empty">
            No hay extras. Agrega uno con el botón +
          </div>
        </div>

        <!-- Presets section -->
        <div class="mc-extras-section q-mt-lg">
          <div class="mc-extras-section__header">
            <span class="mc-extras-section__title">Cargar preestablecidos</span>
          </div>

          <q-list separator class="mc-preset-list">
            <q-item
              clickable
              v-ripple
              v-for="group in adminStore.groups"
              :key="group.id"
              @click="adminStore.addGroupToProduct(group)"
              class="mc-preset-item"
            >
              <q-item-section avatar>
                <q-icon name="add_circle_outline" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ group.name }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <div v-if="!adminStore.groups?.length" class="mc-options-empty">
            No hay grupos preestablecidos
          </div>
        </div>
      </div>
    </q-scroll-area>

    <div class="mc-form-drawer__save">
      <q-btn
        :loading="adminStore.loading"
        unelevated
        color="primary"
        icon="save"
        no-caps
        label="Guardar Extras"
        @click="adminStore.saveExtras"
      />
    </div>
  </q-drawer>
</template>

<script setup>
defineOptions({
  name: "ExtraDrawer",
});
import { reactive, watch } from "vue";
import { VueDraggableNext } from "vue-draggable-next";
import { useAdminStore } from "src/stores/admin-store";
import { useConfirmDialog } from "src/composables/useConfirmDialog";
import { useUnsavedChanges } from "src/composables/useUnsavedChanges";
import { controlOf, priceModeOf } from "src/utils/extraConfig";
const adminStore = useAdminStore();
const { confirmDelete } = useConfirmDialog();

// Aviso de cambios sin guardar al cerrar.
const { snap, isDirty, confirmClose } = useUnsavedChanges();
watch(() => adminStore.extraDrawer, (v) => { if (v) snap(adminStore.extras); });
const onDrawerModel = (v) => {
  if (v) { adminStore.extraDrawer = true; return; }
  requestClose();
};
const requestClose = () =>
  confirmClose(
    isDirty(adminStore.extras),
    () => { adminStore.saveExtras(); adminStore.extraDrawer = false; },
    () => { adminStore.extraDrawer = false; }
  );

const expandedExtras = reactive({});

const toggleExtra = (index) => {
  expandedExtras[index] = !expandedExtras[index];
};

const tieneOpcionConPrecio = (extra) =>
  (extra.options || []).some((o) => Number(o.price) > 0);

// Al cambiar el control se fija también el máximo coherente: el radio siempre es 1,
// y pasar a varios/cantidades sin tope quedaría en 1, que no sirve de nada.
const setControl = (extra, control) => {
  extra.selection_type = control;
  if (control === "radio") {
    extra.qty = 1;
  } else if (Number(extra.qty) <= 1) {
    extra.qty = 2;
  }
};

const onDragEnd = () => {
  adminStore.saveExtras();
};

const removeExtra = (index) => {
  confirmDelete("extra", () => adminStore.removeExtra(index));
};

const removeOption = (extra, optionIndex) => {
  confirmDelete("opción", () => adminStore.removeExtraOption(extra, optionIndex));
};
</script>

<style lang="scss" scoped>
.mc-extras-section {
  background: var(--color-surface-variant);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  border: 1px solid var(--color-border-subtle);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-md);
  }

  &__title {
    font-weight: 600;
    font-size: var(--text-sm);
    color: var(--color-text-primary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.mc-extra-card {
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-subtle);
  margin-bottom: var(--space-sm);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    background: var(--color-surface);
  }

  &__name {
    flex: 1;
    font-weight: 500;
    font-size: var(--text-sm);
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  &__body {
    padding: var(--space-md);
    border-top: 1px solid var(--color-border-subtle);
  }
}

.mc-field-label {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xs);
}

.mc-control-toggle {
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.mc-options-section {
  background: var(--color-surface-variant);
  border-radius: var(--radius-sm);
  padding: var(--space-sm);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-sm);
  }

  &__title {
    font-weight: 600;
    font-size: 11px;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.mc-option-row {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-bottom: var(--space-xs);

  &__name {
    flex: 2;
  }

  &__price {
    flex: 1;
  }
}

.mc-options-empty {
  text-align: center;
  padding: var(--space-md);
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}

.mc-preset-list {
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.mc-preset-item {
  border-radius: var(--radius-sm);
}

.handle {
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.rotate-180 {
  transition: transform var(--transition-fast);
  transform: rotate(180deg);
}
</style>
