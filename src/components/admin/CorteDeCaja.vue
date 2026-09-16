<template>
  <q-dialog :model-value="modelValue" @update:model-value="(v) => emit('update:modelValue', v)">
    <q-card class="mc-corte">
      <q-card-section class="row items-center justify-between">
        <div class="row items-center q-gutter-sm">
          <q-icon name="point_of_sale" size="24px" color="primary" />
          <span class="mc-corte__titulo">Corte de caja</span>
          <!-- De que local, cuando no son todos: el servidor dice cual aplico. -->
          <q-chip v-if="corte?.local?.nombre" dense square icon="storefront">
            {{ corte.local.nombre }}
          </q-chip>
        </div>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input v-model="fecha" type="date" filled dense label="Fecha" @update:model-value="cargar" />
      </q-card-section>

      <q-card-section v-if="cargando" class="text-center">
        <q-spinner-dots color="primary" size="32px" />
      </q-card-section>

      <q-card-section v-else-if="corte" class="q-pt-none">
        <div class="mc-corte__resumen">
          <div class="mc-corte__fila"><span>Pedidos</span><strong>{{ corte.orders }}</strong></div>
          <div class="mc-corte__fila"><span>Ventas</span><strong>${{ numero(corte.revenue) }}</strong></div>
          <div class="mc-corte__fila"><span>Propinas</span><strong>${{ numero(corte.tips) }}</strong></div>
          <div class="mc-corte__fila"><span>Descuentos</span><strong>-${{ numero(corte.discounts) }}</strong></div>
          <div class="mc-corte__fila"><span>Ticket promedio</span><strong>${{ numero(corte.avg_ticket) }}</strong></div>
        </div>

        <div class="mc-corte__metodos">
          <div class="mc-corte__subtitulo">Por método de pago</div>
          <div v-for="m in corte.by_method" :key="m.method" class="mc-corte__fila">
            <span>{{ metodo(m.method) }} ({{ m.count }})</span>
            <strong>${{ numero(m.total) }}</strong>
          </div>
          <div v-if="!corte.by_method.length" class="text-caption text-grey-6 q-mt-sm">
            Sin pedidos en esta fecha.
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat no-caps color="grey-7" icon="print" label="Imprimir" @click="imprimir" />
        <q-btn unelevated no-caps color="primary" label="Cerrar" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
/**
 * El corte de caja del dia: totales por metodo de pago, propinas y descuentos.
 *
 * Vivia dentro del Dashboard. Se saco para que tambien se abra desde Pedidos, que es
 * donde esta la cajera al cerrar su turno y la unica seccion que ella ve.
 */
defineOptions({ name: "CorteDeCaja" });

import { ref, watch } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";
import { etiquetaPago } from "src/utils/metodosPago.js";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue"]);

const adminStore = useAdminStore();

// La fecha LOCAL. Antes salia de toISOString(), que es la de Greenwich: en Sinaloa,
// despues de las 5 de la tarde el corte ya abria en el dia de mañana y salia en ceros.
const hoy = () => {
  const d = new Date();
  const dos = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
};

const fecha = ref(hoy());
const corte = ref(null);
const cargando = ref(false);

const numero = (n) =>
  Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

// El servidor agrupa por el codigo ('cash'); a la persona se le enseña "Efectivo".
const metodo = (codigo) => etiquetaPago(codigo) || codigo;

const cargar = async () => {
  cargando.value = true;
  try {
    // Del local que se esta viendo en Pedidos: la caja de Centro se cuadra con lo de Centro.
    const { data } = await api.get(`/admin/${adminStore.slug}/cash-cut`, {
      params: { ...adminStore.paramsDeLocal, date: fecha.value },
    });
    corte.value = data;
  } catch (e) {
    adminStore.messageStore.error("No se pudo cargar el corte de caja");
  } finally {
    cargando.value = false;
  }
};

// Cada vez que se abre, en el dia de hoy: quien lo abre casi siempre esta cerrando.
watch(
  () => props.modelValue,
  (abierto) => {
    if (!abierto) return;
    fecha.value = hoy();
    cargar();
  },
  { immediate: true }
);

const imprimir = () => {
  if (!corte.value) return;
  const c = corte.value;
  const nombre = adminStore.company?.name || "Restaurante";
  const local = c.local?.nombre ? `<div class="date">${c.local.nombre}</div>` : "";
  const dinero = (n) =>
    "$" + Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const metodos = c.by_method
    .map((m) => `<div class="row"><span>${metodo(m.method)} (${m.count})</span><b>${dinero(m.total)}</b></div>`)
    .join("");
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`
    <html><head><title>Corte ${c.date}</title><style>
      body{font-family:'Consolas','DejaVu Sans Mono','Liberation Mono',Menlo,'Courier New',monospace;font-weight:700;line-height:1.35;max-width:320px;margin:0 auto;padding:12px;color:#000}
      h2{text-align:center;margin:4px 0}.date{text-align:center;margin-bottom:10px}
      .row{display:flex;justify-content:space-between;padding:3px 0}
      .sep{border-top:1px dashed #000;margin:8px 0}.title{font-weight:bold;margin-top:8px}
    </style></head><body>
      <h2>${nombre}</h2>
      ${local}
      <div class="date">Corte de caja — ${c.date}</div>
      <div class="sep"></div>
      <div class="row"><span>Pedidos</span><b>${c.orders}</b></div>
      <div class="row"><span>Ventas</span><b>${dinero(c.revenue)}</b></div>
      <div class="row"><span>Propinas</span><b>${dinero(c.tips)}</b></div>
      <div class="row"><span>Descuentos</span><b>-${dinero(c.discounts)}</b></div>
      <div class="row"><span>Ticket promedio</span><b>${dinero(c.avg_ticket)}</b></div>
      <div class="sep"></div>
      <div class="title">Por método de pago</div>
      ${metodos || "<div>Sin pedidos</div>"}
      <div class="sep"></div>
      <div class="date">${new Date().toLocaleString("es-MX")}</div>
    </body></html>`);
  w.document.close();
  w.focus();
  w.print();
  w.close();
};
</script>

<style lang="scss" scoped>
.mc-corte {
  min-width: 340px;
  max-width: 420px;
  border-radius: 16px;
}

.mc-corte__titulo {
  font-size: 18px;
  font-weight: 700;
}

.mc-corte__resumen {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mc-corte__fila {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  font-size: 14px;
  color: var(--color-text-primary);

  strong {
    font-variant-numeric: tabular-nums;
  }
}

.mc-corte__metodos {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--color-border);
}

.mc-corte__subtitulo {
  font-weight: 700;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}
</style>
