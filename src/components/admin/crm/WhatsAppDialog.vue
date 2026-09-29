<template>
  <!-- Elegir que mandarle por WhatsApp. Antes el boton verde abria siempre el mismo
       mensaje; ahora se escoge (o se edita) y queda anotado cual se mando. -->
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card class="mc-wa-dialog">
      <q-card-section class="mc-wa-dialog__head">
        <div>
          <div class="mc-wa-dialog__titulo">Mensaje de WhatsApp</div>
          <div class="mc-wa-dialog__quien">{{ prospecto?.business_name || prospecto?.name }} · {{ prospecto?.phone }}</div>
        </div>
        <q-btn flat round dense icon="close" v-close-popup aria-label="Cerrar" />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="mc-wa-dialog__opciones">
          <button
            v-for="t in plantillas"
            :key="t.clave"
            type="button"
            :class="['mc-wa-op', { 'mc-wa-op--on': elegida === t.clave }]"
            @click="elegir(t)"
          >
            <span>{{ t.titulo }}</span>
            <q-badge v-if="t.sugerida" color="positive" label="Sugerida" />
          </button>
        </div>

        <q-input
          v-model="texto"
          type="textarea"
          filled
          autogrow
          label="Puedes editarlo antes de mandarlo"
          class="q-mt-md mc-wa-dialog__texto"
        />
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat no-caps label="Cancelar" v-close-popup />
        <q-btn
          unelevated
          no-caps
          color="positive"
          icon="fab fa-whatsapp"
          label="Abrir WhatsApp"
          :disable="!texto.trim()"
          @click="enviar"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
defineOptions({ name: "WhatsAppDialog" });

import { ref, computed, watch } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";
import { plantillasPara } from "src/utils/plantillasWhatsApp";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  prospecto: { type: Object, default: null },
});
const emit = defineEmits(["update:modelValue", "enviado"]);

const adminStore = useAdminStore();
const plantillas = computed(() =>
  props.prospecto ? plantillasPara(props.prospecto, adminStore.user?.name || "") : []
);
const elegida = ref("");
const texto = ref("");

const elegir = (t) => {
  elegida.value = t.clave;
  texto.value = t.texto;
};

// Cada vez que se abre, arranca con la sugerida.
watch(
  () => [props.modelValue, props.prospecto?.id],
  ([abierto]) => {
    if (abierto && plantillas.value.length) elegir(plantillas.value[0]);
  },
  { immediate: true }
);

const telefono = (p) => {
  const d = (p?.phone || "").replace(/\D/g, "");
  return d.length === 10 ? "52" + d : d;
};

const enviar = async () => {
  const p = props.prospecto;
  const tel = telefono(p);
  // El window.open va primero y sin await: fuera del clic el navegador lo bloquea.
  window.open(`https://wa.me/${tel}?text=${encodeURIComponent(texto.value)}`, "_blank");
  emit("update:modelValue", false);

  const titulo = plantillas.value.find((t) => t.clave === elegida.value)?.titulo || "Mensaje";
  const extracto = texto.value.replace(/\s+/g, " ").slice(0, 140);
  try {
    const { data } = await api.post(`/admin/prospects/${p.id}/activity`, {
      type: "whatsapp",
      description: `WhatsApp «${titulo}»: ${extracto}${texto.value.length > 140 ? "…" : ""}`,
    });
    emit("enviado", data.prospect);
  } catch (e) {
    adminStore.messageStore.error("Se abrió WhatsApp, pero no se pudo anotar en el historial");
  }
};
</script>

<style lang="scss" scoped>
.mc-wa-dialog {
  width: 560px;
  max-width: 94vw;
  border-radius: var(--radius-lg);

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-sm);
  }

  &__titulo {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: 700;
  }

  &__quien {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  &__opciones {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
}

.mc-wa-op {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  text-align: left;
  cursor: pointer;
  transition: border-color var(--transition-fast), background var(--transition-fast);

  &:hover {
    border-color: var(--q-positive);
  }

  &--on {
    border-color: var(--q-positive);
    background: color-mix(in srgb, var(--q-positive) 8%, var(--color-surface));
    font-weight: 600;
  }
}
</style>
