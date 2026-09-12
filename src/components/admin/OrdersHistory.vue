<template>
  <div class="mc-history">
    <admin-section
      icon="filter_alt"
      title="Buscar"
      description="El historial trae todos los pedidos, cerrados o no. Acota por fecha o busca por el código del ticket, el teléfono o el nombre del cliente."
    >
      <!-- `col` solo funciona dentro de un `row`, y este div no lo era: los cuatro
           campos se apilaban uno por renglon, tambien en escritorio. Ya como row, en
           celular las dos fechas comparten renglon -son cortas- y quedan tres
           renglones en vez de cuatro antes de ver un pedido. -->
      <div class="mc-history__filtros row q-col-gutter-sm">
        <q-input filled dense v-model="filtros.desde" type="date" label="Desde" class="col-6 col-md" />
        <q-input filled dense v-model="filtros.hasta" type="date" label="Hasta" class="col-6 col-md" />
        <q-select
          filled dense
          v-model="filtros.status"
          :options="opcionesEstado"
          label="Estado"
          emit-value
          map-options
          clearable
          class="col-12 col-md"
        />
        <q-input
          filled dense
          v-model="filtros.q"
          label="Código, teléfono o nombre"
          class="col-12 col-md-grow"
          clearable
          @keyup.enter="buscar"
        >
          <template v-slot:append><q-icon name="search" /></template>
        </q-input>
      </div>

      <div class="mc-history__acciones">
        <q-btn unelevated no-caps color="primary" icon="search" label="Buscar" :loading="cargando" @click="buscar" />
        <q-btn flat no-caps color="grey-8" icon="restart_alt" label="Limpiar" @click="limpiar" />
        <q-space />
        <q-btn
          flat no-caps
          color="primary"
          icon="download"
          label="Exportar CSV"
          :disable="!total"
          @click="exportar"
        />
      </div>
    </admin-section>

    <div class="mc-history__resultado">
      <!-- La lista de celular. Siete columnas no caben en 390 px, y de un pedido
           cerrado lo que se busca es de quien fue, de cuanto y si se cancelo. El
           total va a la derecha; ver el detalle y reimprimir el ticket, en la hoja
           de acciones. -->
      <div class="mc-lista" v-if="modoApp">
        <div v-for="pd in pedidos" :key="pd.id" class="mc-lista__fila" @click="verDetalle(pd)">
          <span class="mc-lista__ini">
            {{ (pd.customer_name || '?').trim().slice(0, 2).toUpperCase() }}
          </span>
          <div class="mc-lista__txt">
            <div class="mc-lista__nom">{{ pd.customer_name || "Sin nombre" }}</div>
            <div class="mc-lista__chips">
              <q-badge :color="pd.current_status_id === 5 ? 'negative' : 'positive'">
                {{ pd.status?.name || "-" }}
              </q-badge>
            </div>
            <div class="mc-lista__meta">
              {{ pd.order_code }} · {{ fechaCorta(pd.created_at) }}<template v-if="origenDelPedido(pd, companyStore.company)"> · {{ origenDelPedido(pd, companyStore.company) }}</template>
            </div>
          </div>
          <span class="mc-lista__monto">${{ Number(pd.total || 0).toFixed(2) }}</span>
          <div class="mc-lista__der" @click.stop>
            <row-actions-menu
              :titulo="pd.order_code"
              :actions="[
                { key: 'ver', icon: 'visibility', color: 'primary', label: 'Ver detalle', handler: () => verDetalle(pd) },
                { key: 'print', icon: 'print', color: 'grey-8', label: 'Reimprimir ticket', handler: () => imprimir(pd) },
              ]"
            />
          </div>
        </div>

        <div v-if="!pedidos.length && !cargando" class="mc-lista__vacio">
          No hay pedidos con esos filtros.
        </div>
      </div>

      <q-table
        v-if="!modoApp"
        flat
        :rows="pedidos"
        :columns="columnas"
        row-key="id"
        :loading="cargando"
        v-model:pagination="paginacion"
        :rows-per-page-options="[20, 50, 100]"
        no-data-label="No hay pedidos con esos filtros"
        loading-label="Buscando..."
        @request="onRequest"
      >
        <template v-slot:body-cell-estado="props">
          <q-td :props="props">
            <q-badge :color="props.row.current_status_id === 5 ? 'negative' : 'positive'">
              {{ props.row.status?.name || "-" }}
            </q-badge>
          </q-td>
        </template>
        <template v-slot:body-cell-acciones="props">
          <q-td :props="props" class="text-right">
            <q-btn flat dense round icon="visibility" color="primary" @click="verDetalle(props.row)">
              <q-tooltip>Ver detalle</q-tooltip>
            </q-btn>
            <q-btn flat dense round icon="print" color="grey-8" @click="imprimir(props.row)">
              <q-tooltip>Reimprimir ticket</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- Detalle -->
    <q-dialog v-model="detalleAbierto">
      <q-card class="mc-history__detalle">
        <q-card-section class="row items-center">
          <div>
            <div class="text-h6">Pedido {{ detalle?.order_code }}</div>
            <div class="text-caption text-grey-7">
              {{ fechaLarga(detalle?.created_at) }} · {{ detalle?.customer_name }}<template v-if="origenDelPedido(detalle, companyStore.company)"> · Sucursal {{ origenDelPedido(detalle, companyStore.company) }}</template>
            </div>
          </div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div v-for="item in detalle?.items || []" :key="item.id" class="mc-history__item">
            <div class="row justify-between">
              <span><strong>{{ item.quantity }}x</strong> {{ item.dish?.name }}</span>
              <span>${{ Number(item.price || 0).toFixed(2) }}</span>
            </div>
            <div v-for="extra in item.extras || []" :key="extra.id" class="mc-history__extra">
              <div v-for="op in extra.options || []" :key="op.id">
                ↳ {{ op.quantity > 1 ? op.quantity + "x " : "" }}{{ op.name }}
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="mc-history__totales">
          <div class="row justify-between"><span>Descuento</span><span>${{ Number(detalle?.discount || 0).toFixed(2) }}</span></div>
          <div class="row justify-between"><span>Propina</span><span>${{ Number(detalle?.tip || 0).toFixed(2) }}</span></div>
          <div class="row justify-between"><span>Envío</span><span>${{ Number(detalle?.delivery_charge || 0).toFixed(2) }}</span></div>
          <div class="row justify-between text-weight-bold"><span>Total</span><span>${{ Number(detalle?.total || 0).toFixed(2) }}</span></div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn unelevated no-caps color="primary" icon="print" label="Reimprimir ticket" @click="imprimir(detalle)" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import RowActionsMenu from "./RowActionsMenu.vue";
import { useModoApp } from "src/composables/useModoApp";

const { modoApp } = useModoApp();
/**
 * El historial de pedidos.
 *
 * Las pestañas de Entregados y Cancelados acumulaban desde el primer dia y el dueño
 * veia un numero que nunca bajaba. Ahora se cierran al final del dia, y todo lo cerrado
 * -y lo que no- se consulta aqui.
 *
 * Pagina contra el SERVIDOR. La pestaña de pedidos pagina en el navegador, o sea que se
 * descarga todo y luego corta; en un listado que por definicion crece sin limite eso no
 * se puede repetir.
 */
defineOptions({
  name: "OrdersHistory",
});

import { ref, computed } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";
import { useCompanyStore } from "src/stores/company-store";
import { printOrderTicket } from "src/utils/orderTicket";
import { origenDelPedido, tieneSucursales } from "src/utils/sucursales";
import AdminSection from "./AdminSection.vue";

const adminStore = useAdminStore();
const companyStore = useCompanyStore();

const opcionesEstado = [
  { label: "Entregados", value: 4 },
  { label: "Cancelados", value: 5 },
];

const filtros = ref({ desde: "", hasta: "", status: null, q: "" });
const pedidos = ref([]);
const total = ref(0);
const cargando = ref(false);
const paginacion = ref({ page: 1, rowsPerPage: 20, rowsNumber: 0 });

// La columna de Sucursal solo existe en un negocio con varios locales: en los demas
// seria una columna vacia en cada renglon.
const columnas = computed(() => [
  { name: "order_code", label: "Código", field: "order_code", align: "left" },
  { name: "fecha", label: "Fecha", field: (r) => fechaCorta(r.created_at), align: "left" },
  { name: "customer_name", label: "Cliente", field: "customer_name", align: "left" },
  ...(tieneSucursales(companyStore.company)
    ? [{ name: "sucursal", label: "Sucursal", field: (r) => origenDelPedido(r, companyStore.company) ?? "", align: "left" }]
    : []),
  { name: "phone", label: "Teléfono", field: "phone", align: "left" },
  { name: "estado", label: "Estado", field: "current_status_id", align: "left" },
  { name: "total", label: "Total", field: (r) => "$" + Number(r.total || 0).toFixed(2), align: "right" },
  { name: "acciones", label: "", field: "id", align: "right" },
]);

const fechaCorta = (v) => (v ? new Date(v).toLocaleDateString("es-MX") : "");
const fechaLarga = (v) => (v ? new Date(v).toLocaleString("es-MX") : "");

// Los mismos filtros para el listado y para el CSV: si se armaran por separado, el
// archivo podria traer un conjunto distinto al que el dueño esta viendo en pantalla.
const params = computed(() => {
  const p = {};
  if (filtros.value.desde) p.desde = filtros.value.desde;
  if (filtros.value.hasta) p.hasta = filtros.value.hasta;
  if (filtros.value.status) p.status = filtros.value.status;
  if (filtros.value.q) p.q = filtros.value.q;
  return p;
});

const cargar = async (page = 1, perPage = paginacion.value.rowsPerPage) => {
  cargando.value = true;
  try {
    const { data } = await api.get(`/admin/${adminStore.slug}/orders/history`, {
      params: { ...params.value, page, per_page: perPage },
    });
    pedidos.value = data.orders || [];
    total.value = data.total || 0;
    paginacion.value = { page, rowsPerPage: perPage, rowsNumber: data.total || 0 };
  } catch {
    adminStore.messageStore.error("No pudimos cargar el historial.");
  } finally {
    cargando.value = false;
  }
};

const onRequest = ({ pagination }) => cargar(pagination.page, pagination.rowsPerPage);
const buscar = () => cargar(1);

const limpiar = () => {
  filtros.value = { desde: "", hasta: "", status: null, q: "" };
  cargar(1);
};

const exportar = () => {
  const query = new URLSearchParams(params.value).toString();
  const base = api.defaults.baseURL.replace(/\/$/, "");
  // Se abre en una pestaña en vez de pedirlo por axios: asi el navegador lo baja como
  // archivo y no hay que armar un blob para algo que ya viene con su nombre puesto.
  window.open(`${base}/admin/${adminStore.slug}/orders/history/export?${query}`, "_blank");
};

const detalle = ref(null);
const detalleAbierto = ref(false);
const verDetalle = (order) => {
  detalle.value = order;
  detalleAbierto.value = true;
};

// El MISMO ticket que imprime la pestaña de Pedidos, no una copia.
const imprimir = (order) =>
  printOrderTicket(order, {
    company: companyStore.company || {},
    onError: (msg) => adminStore.messageStore.error(msg),
  });

cargar(1);
</script>

<style lang="scss" scoped>
.mc-history {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);

  &__filtros {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  &__acciones {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex-wrap: wrap;
  }

  &__resultado {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  &__detalle {
    min-width: 340px;
    max-width: 520px;
  }

  &__item {
    padding: var(--space-xs) 0;
    border-bottom: 1px solid var(--color-border-subtle);
    font-size: var(--text-sm);

    &:last-child {
      border-bottom: none;
    }
  }

  &__extra {
    padding-left: var(--space-md);
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
  }

  &__totales {
    font-size: var(--text-sm);
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }
}

@media screen and (max-width: 600px) {
  .mc-history {
    padding: var(--space-md);
  }
}
</style>
