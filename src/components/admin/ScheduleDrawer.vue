<template>
  <q-drawer
    :model-value="adminStore.scheduleDrawer"
    @update:model-value="onDrawerModel"
    bordered
    overlay
    side="right"
    :width="$q.screen.width <= 440 ? $q.screen.width : 440"
    class="mc-form-drawer"
  >
    <div class="mc-form-drawer__header">
      <h6>Horarios</h6>
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
        <!-- De que local es este horario. Solo con sucursales; en los demas negocios
             -que son casi todos- la pantalla se ve igual que siempre. -->
        <div class="mc-schedule-local" v-if="locales.length > 1">
          <q-select
            filled
            dense
            rounded
            :model-value="adminStore.localDelHorario"
            :options="locales"
            emit-value
            map-options
            label="Horario de"
            @update:model-value="adminStore.elegirLocalDelHorario"
          />

          <!-- Una sucursal sin horario propio usa el del negocio. Se le enseña ese
               horario como punto de partida: guardar es lo que la separa. -->
          <div class="mc-schedule-local__aviso" v-if="adminStore.horarioHeredado">
            <q-icon name="info" size="18px" />
            <span>
              Usa el horario del negocio. Si lo cambias y guardas, esta sucursal
              tendrá el suyo.
            </span>
          </div>
          <div class="mc-schedule-local__aviso mc-schedule-local__aviso--propio" v-else-if="adminStore.localDelHorario">
            <q-icon name="schedule" size="18px" />
            <span>Tiene horario propio.</span>
            <q-btn
              flat
              dense
              no-caps
              size="sm"
              color="primary"
              label="Usar el del negocio"
              :loading="adminStore.loading"
              @click="adminStore.heredarHorarioDelNegocio"
            />
          </div>
        </div>

        <div class="mc-schedule-section">
          <p class="mc-schedule-hint">
            Establece los horarios de atención. Haz click en el día para marcar como descanso.
          </p>

          <div
            v-for="(row, index) in adminStore.companyStore.scheduleForm"
            :key="index"
            class="mc-schedule-row"
            :class="{ 'mc-schedule-row--closed': row.is_closed }"
          >
            <div
              class="mc-schedule-row__day"
              @click="row.is_closed = !row.is_closed"
            >
              <q-icon
                :name="row.is_closed ? 'event_busy' : 'event_available'"
                :color="row.is_closed ? 'negative' : 'positive'"
                size="xs"
              />
              <strong>{{ row.day_of_week }}</strong>
            </div>

            <template v-if="!row.is_closed">
              <div class="mc-schedule-row__time">
                <q-input
                  filled
                  dense
                  v-model="row.open_time"
                  mask="time"
                  label="Abre"
                  :rules="['time']"
                  hide-bottom-space
                >
                  <template v-slot:append>
                    <q-icon name="schedule" class="cursor-pointer" size="xs">
                      <q-popup-proxy
                        cover
                        transition-show="scale"
                        transition-hide="scale"
                      >
                        <q-time v-model="row.open_time" format24h>
                          <div class="row items-center justify-end">
                            <q-btn
                              v-close-popup
                              label="OK"
                              color="primary"
                              flat
                              no-caps
                            />
                          </div>
                        </q-time>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
              <div class="mc-schedule-row__time">
                <q-input
                  filled
                  dense
                  v-model="row.close_time"
                  mask="time"
                  label="Cierra"
                  :rules="['time']"
                  hide-bottom-space
                >
                  <template v-slot:append>
                    <q-icon name="schedule" class="cursor-pointer" size="xs">
                      <q-popup-proxy
                        cover
                        transition-show="scale"
                        transition-hide="scale"
                      >
                        <q-time v-model="row.close_time" format24h>
                          <div class="row items-center justify-end">
                            <q-btn
                              v-close-popup
                              label="OK"
                              color="primary"
                              flat
                              no-caps
                            />
                          </div>
                        </q-time>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
            </template>

            <div v-else class="mc-schedule-row__closed">
              <q-chip
                dense
                color="red-1"
                text-color="red-8"
                icon="event_busy"
                label="Descanso"
                size="sm"
              />
            </div>
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
        label="Guardar Horarios"
        @click="adminStore.saveSchedule"
      />
    </div>
  </q-drawer>
</template>

<script setup>
defineOptions({
  name: "ScheduleDrawer",
});

import { computed, watch } from "vue";
import { useQuasar } from "quasar";
import { useAdminStore } from "src/stores/admin-store";
import { useUnsavedChanges } from "src/composables/useUnsavedChanges";
import { tieneSucursales } from "src/utils/sucursales";
const adminStore = useAdminStore();

/**
 * Los locales que se pueden editar.
 *
 * La Matriz no aparece como opcion aparte: su horario ES el del negocio, y ofrecer las
 * dos cosas por separado seria pedirle al dueño que distinga entre dos nombres para lo
 * mismo. Vacio -un solo local- deja la pantalla como estaba.
 */
const locales = computed(() => {
  const negocio = adminStore.companyStore.company;
  if (!tieneSucursales(negocio)) return [];

  return [
    { value: null, label: "Todo el negocio" },
    ...negocio.active_branches.map((s) => ({ value: String(s.id), label: s.name })),
  ];
});

// Aviso de cambios sin guardar al cerrar.
const { snap, isDirty, confirmClose } = useUnsavedChanges();
watch(() => adminStore.scheduleDrawer, (v) => {
  if (!v) return;
  // Cada vez que se abre, en el del negocio: es el que edita todo el mundo.
  adminStore.elegirLocalDelHorario(null);
  snap(adminStore.companyStore.scheduleForm);
});

// Cambiar de local recarga el formulario, asi que el "sin guardar" se mide contra el
// nuevo punto de partida y no contra el local anterior.
watch(() => adminStore.localDelHorario, () => snap(adminStore.companyStore.scheduleForm));
const onDrawerModel = (v) => {
  if (v) { adminStore.scheduleDrawer = true; return; }
  requestClose();
};
const requestClose = () =>
  confirmClose(
    isDirty(adminStore.companyStore.scheduleForm),
    () => { adminStore.saveSchedule(); adminStore.scheduleDrawer = false; },
    () => { adminStore.scheduleDrawer = false; }
  );
const $q = useQuasar();
</script>

<style lang="scss" scoped>
.mc-schedule-local {
  margin-bottom: 14px;

  &__aviso {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    padding: 8px 10px;
    border-radius: 10px;
    background: #eef4ff;
    color: #2b4a80;
    font-size: 12.5px;
    line-height: 1.35;

    &--propio {
      background: #f0f7ef;
      color: #2d5a2a;
    }
  }
}

.mc-schedule-section {
  background: var(--color-surface-variant);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  border: 1px solid var(--color-border-subtle);
}

.mc-schedule-hint {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-md);
}

.mc-schedule-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--color-border-subtle);

  &:last-child {
    border-bottom: none;
  }

  &--closed {
    opacity: 0.7;
  }

  &__day {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    min-width: 100px;
    cursor: pointer;
    user-select: none;
    text-transform: capitalize;
    font-size: var(--text-sm);
    transition: opacity var(--transition-fast);

    &:hover {
      opacity: 0.7;
    }
  }

  &__time {
    flex: 1;
  }

  &__closed {
    flex: 1;
    display: flex;
    justify-content: center;
  }
}
</style>
