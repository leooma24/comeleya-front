<template>
  <BaseFormDrawer
    v-model="adminStore.prospectDrawer"
    :form-data="adminStore.prospectForm"
    :title="(adminStore.prospectForm.id ? 'Editar' : 'Nuevo') + ' Prospecto'"
    save-label="Guardar"
    :loading="adminStore.loading"
    @save="adminStore.saveProspect"
  >
    <q-input v-model="adminStore.prospectForm.name" label="Nombre del contacto" filled dense class="q-mb-md" />
    <q-input v-model="adminStore.prospectForm.business_name" label="Nombre del negocio" filled dense class="q-mb-md" />

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-6">
        <q-input v-model="adminStore.prospectForm.phone" label="Teléfono" filled dense />
      </div>
      <div class="col-6">
        <q-input v-model="adminStore.prospectForm.email" label="Email" filled dense />
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-6">
        <q-select
          v-model="adminStore.prospectForm.source"
          label="Fuente"
          filled dense
          :options="sourceOptions"
          emit-value map-options
          use-input hide-selected fill-input input-debounce="0"
          hint="Escribe y presiona Enter para agregar otra"
          @filter="filtrarFuentes"
          @new-value="agregarFuente"
        />
      </div>
      <div class="col-6">
        <q-select
          v-if="adminStore.prospectForm.id"
          v-model="adminStore.prospectForm.status"
          label="Etapa"
          filled dense
          :options="statusOptions"
          emit-value map-options
        />
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-6">
        <q-input v-model="adminStore.prospectForm.next_contact_at" label="Próximo contacto" filled dense type="datetime-local" />
      </div>
      <div class="col-6">
        <q-input v-model.number="adminStore.prospectForm.deal_value" label="Valor mensual ($)" filled dense type="number" prefix="$" />
      </div>
    </div>

    <q-select
      v-model="adminStore.prospectForm.tags"
      label="Tags"
      filled dense
      multiple
      use-chips
      use-input
      new-value-mode="add-unique"
      :options="tagSuggestions"
      class="q-mb-md"
      hint="Escribe y presiona Enter para agregar"
    />

    <q-input
      v-if="adminStore.prospectForm.status === 'cerrado_perdido'"
      v-model="adminStore.prospectForm.loss_reason"
      label="Razón de pérdida"
      filled dense
      class="q-mb-md"
    />

    <q-input v-model="adminStore.prospectForm.notes" label="Notas" filled dense autogrow type="textarea" />
  </BaseFormDrawer>
</template>

<script setup>
defineOptions({ name: "ProspectFormDrawer" });
import { computed, ref } from "vue";
import { useAdminStore } from "src/stores/admin-store";
import BaseFormDrawer from "../BaseFormDrawer.vue";
const adminStore = useAdminStore();

const baseSources = [
  { label: "Referido", value: "referido" },
  { label: "Redes sociales", value: "redes" },
  { label: "Llamada", value: "llamada" },
  { label: "Web", value: "web" },
  { label: "Otro", value: "otro" },
];

// Las fuentes que agregas a mano se guardan en el prospecto; las que ya se usaron en
// otros prospectos vuelven a salir en la lista, y las recien escritas entran por "nuevas".
const nuevas = ref([]);
const filtro = ref("");

const todas = computed(() => {
  const conocidas = new Set(baseSources.map((s) => s.value));
  const propias = [...adminStore.prospects.map((p) => p.source), ...nuevas.value]
    .filter((s) => s && !conocidas.has(s));
  return [...baseSources, ...[...new Set(propias)].map((s) => ({ label: s, value: s }))];
});

const sourceOptions = computed(() => {
  const q = filtro.value.trim().toLowerCase();
  return q ? todas.value.filter((o) => o.label.toLowerCase().includes(q)) : todas.value;
});

function filtrarFuentes(val, update) {
  update(() => { filtro.value = val; });
}

function agregarFuente(val, done) {
  const nueva = val.trim().slice(0, 50);
  if (!nueva) return done();
  // Si ya existe con otras mayusculas, se usa esa en vez de duplicarla.
  const existente = todas.value.find((o) => o.label.toLowerCase() === nueva.toLowerCase());
  if (existente) return done(existente.value, "add-unique");
  nuevas.value.push(nueva);
  done(nueva, "add-unique");
}

const tagSuggestions = [
  "restaurante", "cafeteria", "bar", "sushi", "pizzeria",
  "tacos", "mariscos", "cadena", "premium", "urgente",
  "CDMX", "Monterrey", "Guadalajara", "Culiacan", "Los Mochis",
];

const statusOptions = [
  { label: "Nuevo", value: "nuevo" },
  { label: "Contactado", value: "contactado" },
  { label: "Demo", value: "demo" },
  { label: "Negociando", value: "negociando" },
  { label: "Cerrado (ganado)", value: "cerrado_ganado" },
  { label: "Cerrado (perdido)", value: "cerrado_perdido" },
];
</script>
