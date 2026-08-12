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

    <!-- Básico esconde los topes dependientes, que hoy usa un negocio de cada
         catorce. Es un modo del CAJÓN, no del platillo: no se guarda en la base ni
         viaja al servidor, se recuerda en el navegador de quien administra, igual
         que el tono de alerta y la vista del menú. -->
    <div class="mc-modo">
      <q-btn-toggle
        v-model="modo"
        spread
        no-caps
        unelevated
        dense
        toggle-color="primary"
        color="grey-3"
        text-color="grey-8"
        class="mc-control-toggle"
        :options="[
          { label: 'Básico', value: 'basico', icon: 'tune' },
          { label: 'Experto', value: 'experto', icon: 'settings' },
        ]"
      />
    </div>

    <!-- 186px = encabezado + esta fila + el botón de guardar. Si crece alguno, el
         último extra se esconde debajo del botón. -->
    <q-scroll-area style="height: calc(100% - 186px)">
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

                <!-- La relación se declara DESDE el grupo que manda, que es donde
                     además se capturan los números: estás editando "36 Piezas" y
                     ahí mismo dices que incluye 3 rollos. -->
                <q-select
                  v-if="experto && gruposConMaximo(index).length"
                  :model-value="dependienteDe(extra)"
                  @update:model-value="setDependiente(extra, $event)"
                  :options="gruposConMaximo(index)"
                  option-value="id"
                  option-label="name"
                  emit-value
                  map-options
                  clearable
                  filled
                  dense
                  label="Este grupo define el máximo de"
                  class="q-mb-md"
                >
                  <template v-slot:hint>
                    Cada opción de abajo dirá cuántas piezas incluye
                  </template>
                </q-select>

                <!-- Este aviso se queda TAMBIÉN en Básico. No es configuración: es
                     lo que explica por qué en este grupo no aparece el campo de
                     máximo. Sin él, el campo simplemente falta. -->
                <div v-if="extra.qty_from_extra_id" class="mc-depende-de q-mb-md">
                  <q-icon name="link" size="14px" />
                  <span>
                    El máximo lo define
                    <strong>{{ nombreDelGrupo(extra.qty_from_extra_id) }}</strong>
                  </span>
                </div>

                <div class="row q-col-gutter-sm q-mb-md">
                  <!-- Con dependencia el máximo fijo ya no manda, así que se oculta. -->
                  <div class="col-6" v-if="controlOf(extra) !== 'radio' && !extra.qty_from_extra_id">
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
                  <div :class="controlOf(extra) === 'radio' || extra.qty_from_extra_id ? 'col-12' : 'col-6'">
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

                <!-- Se queda en Básico aunque sea el campo más confuso del cajón:
                     es el que hacía que el navegador y el servidor calcularan
                     distinto, y escondido alguien capturaría "Grande $120" en modo
                     suma y la torta de $50 saldría en $170. Lo que sí cambia es
                     cómo se explica: con la opción y el precio recién tecleados,
                     no en abstracto. Solo aparece si alguna opción cuesta. -->
                <div v-if="ejemploPrecio(extra)" class="q-mb-md">
                  <div class="mc-field-label">El precio que escribiste en las opciones…</div>
                  <q-option-group
                    :model-value="priceModeOf(extra)"
                    @update:model-value="extra.price_mode = $event"
                    :options="[
                      { label: 'se SUMA al precio del platillo', value: 'add' },
                      { label: 'ES el precio final del platillo', value: 'replace' },
                    ]"
                    color="primary"
                    dense
                  >
                    <template v-slot:label="opt">
                      <div class="mc-precio-opcion">
                        <span>{{ opt.label }}</span>
                        <span class="mc-precio-opcion__ejemplo">
                          {{ opt.value === "add"
                            ? ejemploPrecio(extra)?.suma
                            : ejemploPrecio(extra)?.reemplazo }}
                        </span>
                      </div>
                    </template>
                  </q-option-group>
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

                <!-- En Básico los topes no se dibujan. Un grupo que YA los trae
                     configurados tiene que decirlo, o alguien entra, no ve nada
                     raro, y no entiende por qué el menú se comporta distinto. Un
                     grupo sin nada avanzado no muestra absolutamente nada. -->
                <div
                  v-if="!experto && resumenAvanzado(extra).length"
                  class="mc-modo-resumen"
                >
                  <q-icon name="tune" size="14px" />
                  <span class="mc-modo-resumen__texto">
                    {{ resumenAvanzado(extra).join(" · ") }}
                  </span>
                  <a class="mc-modo-resumen__link" @click="modo = 'experto'">
                    Ver configuración avanzada
                  </a>
                </div>

                <!-- Ya escondidos detrás del modo, plegarlos otra vez sería
                     esconderlos dos veces: en Experto se ven abiertos. El título
                     explica qué significan los números, cosa que un encabezado de
                     columna como "Incluye" no alcanza a hacer. -->
                <div
                  v-if="experto && esGrupoFuente(extra) && extra.options?.length"
                  class="mc-limits-section"
                >
                  <div class="mc-limits-title">
                    Cuántos {{ nombreDelGrupo(dependienteDe(extra)).toLowerCase() }} incluye cada
                    opción
                  </div>
                  <div
                    v-for="(option, io) in extra.options"
                    :key="'lim_' + index + '_' + io"
                    class="mc-limits-row"
                  >
                    <span class="mc-limits-row__name">{{ option.name || "Sin nombre" }}</span>
                    <q-input
                      v-model="option.grants_qty"
                      type="number"
                      min="1"
                      filled
                      dense
                      class="mc-limits-row__num"
                    />
                    <q-toggle
                      v-model="option.lifts_caps"
                      dense
                      size="sm"
                      color="primary"
                      label="Permite repetir sin límite"
                      class="mc-limits-row__toggle"
                    >
                      <q-tooltip>
                        Con esta opción el comensal puede llevarse varios iguales
                      </q-tooltip>
                    </q-toggle>
                  </div>
                </div>

                <!-- Techo por opción: solo en grupos de cantidades, donde repetir
                     es posible. En casillas cada opción es sí o no. -->
                <div
                  v-if="experto && controlOf(extra) === 'counter' && extra.options?.length"
                  class="mc-limits-section"
                >
                  <div class="mc-limits-title">Máximo de cada opción</div>

                  <!-- Un solo interruptor en vez de un número por cada combinación
                       de tamaño y opción: con 36 (3 rollos) deja 2 iguales, con 48
                       deja 3, y sigue solo si mañana agregan un tamaño nuevo. -->
                  <div class="mc-variedad">
                    <q-toggle
                      v-model="extra.require_variety"
                      dense
                      size="sm"
                      color="primary"
                      label="Al menos dos variedades"
                    />
                    <div class="mc-variedad__hint">{{ textoVariedad(extra) }}</div>
                  </div>

                  <div
                    v-for="(option, io) in extra.options"
                    :key="'cap_' + index + '_' + io"
                    class="mc-limits-row"
                  >
                    <span class="mc-limits-row__name">{{ option.name || "Sin nombre" }}</span>
                    <q-input
                      v-model="option.max_qty"
                      type="number"
                      min="1"
                      filled
                      dense
                      :placeholder="extra.require_variety ? 'Total − 1' : 'Sin tope'"
                      class="mc-limits-row__num"
                    />
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
import { computed, reactive, ref, watch } from "vue";
import { VueDraggableNext } from "vue-draggable-next";
import { useAdminStore } from "src/stores/admin-store";
import { useConfirmDialog } from "src/composables/useConfirmDialog";
import { useUnsavedChanges } from "src/composables/useUnsavedChanges";
import {
  advancedSummary,
  controlOf,
  priceExampleOf,
  priceModeOf,
} from "src/utils/extraConfig";
const adminStore = useAdminStore();
const { confirmDelete } = useConfirmDialog();

// Modo del cajón. No es del platillo ni del negocio: es de quien administra, así
// que vive en el navegador y no viaja al servidor. Mismo lugar que el tono de
// alerta ("mc-alert-tone") y la vista del menú ("mc-view").
const MODO_GUARDADO = "mc-extras-modo";
const modo = ref(
  (typeof localStorage !== "undefined" && localStorage.getItem(MODO_GUARDADO)) || "basico"
);
watch(modo, (v) => {
  if (typeof localStorage !== "undefined") localStorage.setItem(MODO_GUARDADO, v);
});
const experto = computed(() => modo.value === "experto");

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

// Los grupos a los que ESTE puede definirles el máximo. Solo los de "cantidades" o
// "varios" (los de "uno solo" no tienen máximo que definir), y solo los ya
// guardados: uno recién creado todavía no tiene id al que apuntar.
const gruposConMaximo = (index) =>
  (adminStore.extras || [])
    .filter((e, i) => i !== index && e.id && e.name && controlOf(e) !== "radio")
    .map((e) => ({ id: e.id, name: e.name }));

// Qué grupo depende de este. La relación se guarda en el dependiente
// (`qty_from_extra_id`), pero se declara desde acá.
//
// UNO SOLO a propósito: el número que captura cada opción ("36 Piezas incluye 3")
// solo tiene sentido apuntando a un grupo. Si mandara sobre dos, ese 3 daría a la
// vez 3 rollos y 3 salsas, que no es lo que nadie quiere decir.
const dependienteDe = (extra) =>
  (adminStore.extras || []).find((e) => e.qty_from_extra_id && e.qty_from_extra_id === extra.id)
    ?.id ?? null;

const setDependiente = (extra, id) => {
  (adminStore.extras || []).forEach((e) => {
    if (e.id === extra.id) return;
    if (e.id === id) {
      e.qty_from_extra_id = extra.id;
    } else if (e.qty_from_extra_id === extra.id) {
      // Se desligó (o se cambió a otro): vuelve a su máximo fijo.
      e.qty_from_extra_id = null;
    }
  });
};

const nombreDelGrupo = (id) =>
  (adminStore.extras || []).find((e) => e.id === id)?.name || "otro grupo";

// ¿Algún otro grupo toma su tope de este? Entonces sus opciones necesitan declarar
// cuántas unidades otorgan.
const esGrupoFuente = (extra) => dependienteDe(extra) !== null;

// Qué significa el interruptor EN ESTE grupo, con sus números.
//
// Cuando el máximo lo manda otro grupo no hay un número que enseñar —cambia con el
// tamaño que elija el comensal—, y ahí está la gracia: es justo el caso que se
// resolvía capturando una casilla por cada combinación de tamaño y opción.
const textoVariedad = (extra) => {
  if (extra.qty_from_extra_id) {
    return "El máximo de cualquier opción baja al total menos uno, sea cual sea el tamaño que elija el cliente: con 3 puede llevar 2 iguales, con 4 puede llevar 3.";
  }
  const total = Math.max(1, Number(extra.qty) || 1);
  return total > 1
    ? `Nadie puede llevarse las ${total} de una sola opción: el máximo de cualquiera baja a ${total - 1}.`
    : "Con un máximo de 1 no aplica: no hay nada que repetir.";
};

// Lo que este grupo trae configurado y que el modo Básico no dibuja.
const resumenAvanzado = (extra) => advancedSummary(extra, adminStore.extras);

// El ejemplo del campo de precio, con el platillo que se está editando. Null
// cuando ninguna opción cuesta, y entonces el campo tampoco se dibuja.
const ejemploPrecio = (extra) => priceExampleOf(extra, adminStore.product?.price);

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

// Aviso de que el máximo de este grupo lo manda otro. Informativo, no editable:
// la relación se declara desde el grupo que manda, no desde aquí.
.mc-depende-de {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-variant);
  border: 1px solid var(--color-border-subtle);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

// El interruptor del cajón: pegado al encabezado, no flotando sobre el contenido.
.mc-modo {
  padding: var(--space-sm) var(--space-lg);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

// Mismo look que .mc-depende-de: los dos son avisos informativos, no controles.
.mc-modo-resumen {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: var(--space-sm);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-variant);
  border: 1px solid var(--color-border-subtle);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);

  &__texto {
    flex: 1 1 140px;
    min-width: 0;
  }

  &__link {
    color: var(--color-primary);
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }
}

// El ejemplo va debajo de la etiqueta, no a un lado: en un cajón de 440px una
// segunda columna dejaría el monto cortado, que es justo lo que ya pasó una vez.
.mc-precio-opcion {
  display: flex;
  flex-direction: column;
  line-height: 1.3;

  &__ejemplo {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    font-variant-numeric: tabular-nums;
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
    min-width: 0;
  }

  &__price {
    flex: 1;
    // Nunca se comprime al punto de esconder el monto, que es lo que pasaba al
    // meter los campos de tope en esta misma fila.
    min-width: 90px;
  }
}

// Configuración avanzada de topes: aparte de la lista de opciones y plegada por
// default, para que capturar nombre y precio siga siendo lo de siempre.
.mc-limits-section {
  margin-top: var(--space-sm);
  border-top: 1px solid var(--color-border-subtle);
}

.mc-limits-title {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-secondary);
  padding: var(--space-sm) 0 var(--space-xs);
}

// La regla que aplica a TODO el grupo va arriba y separada de los topes de cada
// opción, para que se lea como lo que es: una condición general, no una fila más.
.mc-variedad {
  padding: 4px 0 var(--space-sm);
  margin-bottom: var(--space-xs);
  border-bottom: 1px solid var(--color-border-subtle);

  &__hint {
    margin-top: 2px;
    font-size: var(--text-xs);
    line-height: 1.4;
    color: var(--color-text-secondary);
  }
}

.mc-limits-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 4px 0;
  // "Permite repetir sin límite" es una etiqueta larga: si no cabe, que baje de
  // línea en vez de aplastar el nombre de la opción.
  flex-wrap: wrap;

  &__name {
    flex: 1 1 110px;
    min-width: 0;
    font-size: var(--text-sm);
    color: var(--color-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__num {
    flex: 0 0 76px;
  }

  &__toggle {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    white-space: nowrap;
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
