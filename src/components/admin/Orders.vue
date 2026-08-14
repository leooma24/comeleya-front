<template>
  <q-card flat class="mc-admin-card">
    <div class="mc-admin-card__header">
      <div class="mc-admin-card__title">
        <q-icon name="receipt_long" size="24px" color="primary" class="q-mr-sm" />
        Pedidos
      </div>

      <q-input
        filled
        dense
        rounded
        debounce="300"
        v-model="filter"
        placeholder="Buscar pedido..."
        class="mc-admin-search"
      >
        <template v-slot:prepend>
          <q-icon name="search" size="18px" color="grey-5" />
        </template>
      </q-input>

      <!-- Selector de tono de alerta de pedidos nuevos -->
      <q-btn-dropdown
        flat
        no-caps
        dense
        icon="notifications_active"
        label="Tono"
        color="primary"
        class="mc-tone-btn"
      >
        <q-list style="min-width: 220px">
          <q-item-label header>Tono de aviso de pedido</q-item-label>
          <q-item
            v-for="t in ALERT_TONES"
            :key="t.value"
            clickable
            @click="chooseTone(t.value)"
          >
            <q-item-section avatar>
              <q-icon
                :name="alertTone === t.value ? 'radio_button_checked' : 'radio_button_unchecked'"
                :color="alertTone === t.value ? 'primary' : 'grey-5'"
              />
            </q-item-section>
            <q-item-section>{{ t.label }}</q-item-section>
            <q-item-section side>
              <q-btn
                flat
                round
                dense
                icon="play_arrow"
                color="primary"
                @click.stop="previewTone(t.value)"
              >
                <q-tooltip>Probar</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
    </div>

    <!-- Order status tabs -->
    <div class="mc-order-tabs">
      <q-tabs
        v-model="adminStore.orderTab"
        no-caps
        active-color="primary"
        indicator-color="primary"
        dense
        class="mc-order-status-tabs"
      >
        <q-tab name="pedidos_pendientes">
          <span>Pendientes</span>
          <q-badge v-if="adminStore.getOrderCounts(1)" color="warning" text-color="dark" floating>
            {{ adminStore.getOrderCounts(1) }}
          </q-badge>
        </q-tab>
        <q-tab name="pedidos_en_preparacion">
          <span>En Preparación</span>
          <q-badge v-if="adminStore.getOrderCounts(2)" color="primary" text-color="white" floating>
            {{ adminStore.getOrderCounts(2) }}
          </q-badge>
        </q-tab>
        <q-tab name="pedidos_enviados">
          <span>Enviados</span>
          <q-badge v-if="adminStore.getOrderCounts(3)" color="positive" floating>
            {{ adminStore.getOrderCounts(3) }}
          </q-badge>
        </q-tab>
        <q-tab name="pedidos_entregados">
          <span>Entregados</span>
          <q-badge v-if="adminStore.getOrderCounts(4)" color="positive" floating>
            {{ adminStore.getOrderCounts(4) }}
          </q-badge>
        </q-tab>
        <q-tab name="pedidos_cancelados">
          <span>Cancelados</span>
          <q-badge v-if="adminStore.getOrderCounts(5)" color="negative" floating>
            {{ adminStore.getOrderCounts(5) }}
          </q-badge>
        </q-tab>
        <!-- Sin badge a proposito: el historial crece siempre y un contador ahi
             volveria justo al numero que nunca baja que veniamos a quitar. -->
        <q-tab name="pedidos_historial">
          <span>Historial</span>
        </q-tab>
      </q-tabs>
    </div>
    <!-- El Historial no es un estado mas: trae sus propios filtros y su propia
         paginacion contra el servidor. Las pestañas siguen viviendo aqui arriba. -->

    <template v-if="!esHistorial">

    <!-- Cerrar el día. Solo en Entregados y Cancelados: son los únicos estados donde
         un pedido ya termino su vida. Cerrar uno pendiente lo dejaria invisible SIN
         haberse entregado. -->
    <div class="mc-close-day" v-if="puedeCerrar && filteredOrders.length">
      <div class="mc-close-day__text">
        <strong>{{ filteredOrders.length }}</strong>
        {{ filteredOrders.length === 1 ? "pedido sin cerrar" : "pedidos sin cerrar" }}
      </div>
      <q-btn
        unelevated
        no-caps
        size="sm"
        color="primary"
        icon="inventory_2"
        label="Cerrar el día"
        :loading="cerrando"
        @click="confirmarCierre"
      />
    </div>

    <!-- Orders grid -->
    <div class="mc-orders-grid" v-if="filteredOrders.length">
      <div
        class="mc-order-card"
        :class="{ 'mc-order-card--overdue': isOverdue(order) }"
        v-for="order in paginatedOrders"
        :key="order.id"
      >
        <!-- Order header -->
        <div class="mc-order-card__header">
          <div>
            <span class="mc-order-code">#{{ order.order_code }}</span>
            <span class="mc-order-time">
              {{ helperStore.formatDate(order.created_at, "HH:mm") }}
            </span>
            <span
              class="mc-order-ago"
              :class="{ 'mc-order-ago--overdue': isOverdue(order) }"
            >
              · {{ agoText(order.created_at) }}
            </span>
          </div>
          <q-chip
            dense
            :color="isOverdue(order) ? 'negative' : getStatusColor(order.status.id)"
            text-color="white"
            size="sm"
          >
            {{ order.status.name }}
          </q-chip>
        </div>

        <!-- Pedido programado -->
        <div v-if="order.schedule_at" class="mc-order-scheduled">
          <q-icon name="schedule" size="16px" />
          Programado para {{ helperStore.formatDate(order.schedule_at, "YYYY-MM-DD HH:mm") }}
        </div>

        <!-- Order info -->
        <div class="mc-order-card__body">
          <div class="mc-order-info-row">
            <q-icon name="person" size="16px" color="grey-5" />
            <span>{{ order.customer_name }}</span>
          </div>
          <div class="mc-order-info-row">
            <q-icon :name="getDeliveryIcon(order)" size="16px" color="grey-5" />
            <span>{{ getTypeDelivery(order) }}</span>
            <!-- El envío se cobró sin poder ubicar la dirección: el dueño decide
                 si lo ajusta antes de mandarlo. -->
            <q-badge
              v-if="order.delivery_estimated"
              color="orange"
              text-color="white"
              class="q-ml-xs"
            >
              ENVÍO ESTIMADO
              <q-tooltip>
                No se pudo ubicar la dirección; se cobró la tarifa fija. Revisa la
                distancia y ajusta si hace falta.
              </q-tooltip>
            </q-badge>
          </div>
          <div class="mc-order-info-row">
            <q-icon name="calendar_today" size="16px" color="grey-5" />
            <span>{{ helperStore.formatDate(order.created_at, "YYYY-MM-DD") }}</span>
          </div>
        </div>

        <!-- Order items -->
        <div class="mc-order-items">
          <div class="mc-order-items__title">Productos</div>
          <div
            class="mc-order-item"
            v-for="(item, indexItem) in order.items"
            :key="'item_' + indexItem"
          >
            <div class="mc-order-item__main">
              <span class="mc-order-item__qty">{{ item.quantity }}x</span>
              <span class="mc-order-item__name">{{ item.dish?.name ?? 'Producto eliminado' }}</span>
            </div>

            <div
              class="mc-order-item__extra"
              v-for="(extra, extraIndex) in item.extras"
              :key="'extras_' + extraIndex"
            >
              <span class="mc-order-item__extra-name">{{ extra.extra?.name }}:</span>
              <span
                v-for="(option, optionIndex) in extra.options"
                :key="'option_' + optionIndex"
              >
                {{ option.name }}<span v-if="extra.extra?.qty > 1"> ({{ option.quantity * item.quantity }})</span><span v-if="optionIndex < extra.options.length - 1">, </span>
              </span>
            </div>

            <!-- Nota del comensal para ESTE platillo. Se resalta: es una instrucción
                 para la cocina, no un adorno. -->
            <div v-if="item.notes" class="mc-order-item__note">
              <q-icon name="chat_bubble" size="12px" />
              <span>{{ item.notes }}</span>
            </div>
          </div>
        </div>

        <!-- Comments -->
        <div class="mc-order-comments" v-if="order.comments">
          <q-icon name="chat_bubble_outline" size="14px" color="grey-5" />
          <span>{{ order.comments }}</span>
        </div>

        <!-- Driver assigned -->
        <div v-if="order.delivery_assignment?.driver" class="mc-order-driver">
          <q-icon name="delivery_dining" size="16px" color="primary" />
          <span class="text-caption text-weight-medium">{{ order.delivery_assignment.driver.name }}</span>
          <q-badge :color="order.delivery_assignment.status === 'picked_up' ? 'warning' : 'blue'" size="xs" :label="order.delivery_assignment.status === 'picked_up' ? 'Recogido' : 'Asignado'" />
          <q-btn flat dense round size="xs" icon="swap_horiz" color="grey-6" @click="handleReassignDriver(order)">
            <q-tooltip>Cambiar repartidor</q-tooltip>
          </q-btn>
        </div>

        <!-- Actions -->
        <div class="mc-order-card__footer">
          <q-btn
            v-if="order.status.id <= 3"
            flat
            no-caps
            dense
            color="negative"
            label="Cancelar"
            size="sm"
            :disable="isBusy(order.id)"
            @click="doCancel(order)"
          />
          <q-btn
            flat
            dense
            round
            color="primary"
            icon="print"
            size="sm"
            @click="printOrder(order)"
          >
            <q-tooltip>Imprimir pedido</q-tooltip>
          </q-btn>
          <q-space />
          <q-btn
            v-if="order.status.id == 1"
            unelevated
            color="primary"
            dense
            no-caps
            label="Preparar"
            icon="restaurant"
            size="sm"
            class="mc-order-action-btn"
            :loading="isBusy(order.id)"
            :disable="isBusy(order.id)"
            @click="doStart(order)"
          />
          <q-btn
            v-if="order.status.id == 2"
            unelevated
            color="primary"
            label="Enviar"
            icon="local_shipping"
            no-caps
            dense
            size="sm"
            class="mc-order-action-btn"
            :loading="isBusy(order.id)"
            :disable="isBusy(order.id)"
            @click="handleSendOrder(order)"
          />
          <q-btn
            v-if="order.status.id == 3 && hasDeliveryFeature && order.delivery === 'Envio' && !order.delivery_assignment"
            flat
            color="orange"
            label="Asignar repartidor"
            icon="delivery_dining"
            no-caps
            dense
            size="sm"
            @click="handleAssignDriver(order)"
          />
          <q-btn
            v-if="order.status.id == 3"
            unelevated
            color="positive"
            label="Entregar"
            icon="check_circle"
            no-caps
            dense
            size="sm"
            class="mc-order-action-btn"
            :loading="isBusy(order.id)"
            :disable="isBusy(order.id)"
            @click="doDeliver(order)"
          />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="mc-empty-state">
      <q-icon name="receipt_long" size="56px" color="grey-4" />
      <p>No se encontraron pedidos</p>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mc-pagination">
      <span class="mc-pagination__info">
        {{ (currentPage - 1) * rowsPerPage + 1 }}-{{ Math.min(currentPage * rowsPerPage, filteredOrders.length) }}
        de {{ filteredOrders.length }}
      </span>
      <q-pagination
        v-model="currentPage"
        :max="totalPages"
        :max-pages="5"
        direction-links
        boundary-links
        color="primary"
        active-design="unelevated"
        size="sm"
      />
      <q-select
        v-model="rowsPerPage"
        :options="rowsPerPageOptions"
        dense
        borderless
        class="mc-pagination__select"
        @update:model-value="currentPage = 1"
      />
    </div>


    <orders-history v-else />

    </template>
    <!-- Driver selection dialog -->
    <q-dialog v-model="driverDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ reassigning ? 'Cambiar' : 'Asignar' }} repartidor</div>
          <div class="text-caption text-grey-6">Pedido #{{ sendingOrder?.order_code }}</div>
        </q-card-section>
        <q-card-section>
          <q-select
            v-model="selectedDriver"
            :options="availableDrivers"
            option-value="id"
            option-label="name"
            filled dense
            label="Selecciona repartidor"
            :loading="loadingDrivers"
          >
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section avatar>
                  <q-icon name="delivery_dining" :color="scope.opt.status === 'available' ? 'positive' : 'grey'" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ scope.opt.name }}</q-item-label>
                  <q-item-label caption>{{ scope.opt.vehicle_type }} {{ scope.opt.vehicle_plate ? '- ' + scope.opt.vehicle_plate : '' }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge :color="scope.opt.status === 'available' ? 'positive' : 'grey'" :label="scope.opt.status === 'available' ? 'Libre' : scope.opt.status === 'busy' ? 'Ocupado' : 'Offline'" />
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-if="!reassigning" flat no-caps label="Sin repartidor" color="grey" @click="confirmSendOrder(null)" />
          <q-btn flat no-caps label="Cancelar" color="grey" v-close-popup @click="reassigning = false" />
          <q-btn unelevated no-caps color="primary" :label="reassigning ? 'Cambiar' : 'Asignar y enviar'" :icon="reassigning ? 'swap_horiz' : 'local_shipping'" @click="confirmSendOrder(selectedDriver)" :disable="!selectedDriver" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script setup>
defineOptions({
  name: "OrdersComponent",
});
import { ref, computed, watch, onUnmounted } from "vue";

const props = defineProps({
  status: {
    type: Number,
    required: true,
  },
});

import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";
import { useHelperStore } from "src/stores/helper";
import { useCompanyStore } from "src/stores/company-store";
import { useConfirmDialog } from "src/composables/useConfirmDialog";
import { printOrderTicket } from "src/utils/orderTicket";
import OrdersHistory from "./OrdersHistory.vue";
import { ALERT_TONES, getAlertTone, setAlertTone, previewTone } from "src/composables/useOrderAlerts";

const helperStore = useHelperStore();
const adminStore = useAdminStore();
const companyStore = useCompanyStore();
const { confirm } = useConfirmDialog();

// Selector de tono de alerta (se guarda por dispositivo en localStorage).
const alertTone = ref(getAlertTone());
const chooseTone = (key) => {
  alertTone.value = key;
  setAlertTone(key);
  previewTone(key); // lo reproduce para que lo escuchen al elegir
};

// Bloqueo anti-doble-clic por pedido: mientras se procesa una acción de un
// pedido, sus botones quedan en loading/deshabilitados.
const busyOrders = ref(new Set());
const isBusy = (id) => busyOrders.value.has(id);
const runOrderAction = async (order, fn, errMsg) => {
  if (busyOrders.value.has(order.id)) return; // ya en proceso
  busyOrders.value = new Set(busyOrders.value).add(order.id);
  try {
    await fn();
  } catch (e) {
    adminStore.messageStore.error(
      e?.response?.data?.message ?? errMsg ?? "No se pudo actualizar el pedido"
    );
  } finally {
    const s = new Set(busyOrders.value);
    s.delete(order.id);
    busyOrders.value = s;
  }
};

const doStart = (order) => runOrderAction(order, () => adminStore.startOrder(order));
const doDeliver = (order) => runOrderAction(order, () => adminStore.deliverOrder(order));
const doCancel = (order) => {
  confirm(
    "Cancelar pedido",
    `¿Seguro que quieres cancelar el pedido #${order.order_code ?? order.id}? Esta acción no se puede deshacer.`,
    () => runOrderAction(order, () => adminStore.cancelOrder(order))
  );
};

// Cronómetro: "hace X min" + resaltado de pedidos atrasados (SLA)
const nowTs = ref(Date.now());
const nowTimer = setInterval(() => {
  nowTs.value = Date.now();
}, 30000);
const minutesSince = (created) => {
  if (!created) return 0;
  return Math.floor((nowTs.value - new Date(created).getTime()) / 60000);
};
const agoText = (created) => {
  const m = minutesSince(created);
  if (m < 1) return "recién";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  return `hace ${h} h`;
};
// Atrasado: pendiente (1) o en preparación (2) por 15+ minutos
const isOverdue = (order) =>
  (order.status?.id === 1 || order.status?.id === 2) &&
  minutesSince(order.created_at) >= 15;

// Driver assignment
const driverDialog = ref(false);
const sendingOrder = ref(null);
const selectedDriver = ref(null);
const availableDrivers = ref([]);
const loadingDrivers = ref(false);

const hasDeliveryFeature = computed(() => {
  const features = adminStore.companyConfiguration?.features ?? [];
  const feature = features.find((f) => f.name === "delivery" || f.name === "Servicio a Domicilio");
  return !!feature?.value;
});

const handleSendOrder = async (order) => {
  if (hasDeliveryFeature.value && order.delivery === "Envio") {
    sendingOrder.value = order;
    selectedDriver.value = null;
    loadingDrivers.value = true;
    driverDialog.value = true;
    try {
      const { data } = await api.get(`/admin/${adminStore.slug}/drivers`);
      availableDrivers.value = (data.drivers || []).filter((d) => d.status !== "offline");
    } catch (e) {
      availableDrivers.value = [];
    } finally {
      loadingDrivers.value = false;
    }
  } else {
    runOrderAction(order, () => adminStore.sendOrder(order));
  }
};

const confirmSendOrder = async (driver) => {
  driverDialog.value = false;
  const order = sendingOrder.value;

  // If reassigning, cancel old assignment first
  if (reassigning.value && order.delivery_assignment) {
    try {
      await api.put(`/admin/${adminStore.slug}/delivery/${order.delivery_assignment.id}/status`, { status: 'cancelled' });
    } catch (e) {}
  }

  // Only change status if not reassigning (reassigning keeps current status)
  if (!reassigning.value) {
    adminStore.sendOrder(order);
  }

  if (driver) {
    try {
      await api.post(`/admin/${adminStore.slug}/drivers/${driver.id}/assign`, { order_id: order.id });
      adminStore.messageStore.success(`Repartidor ${driver.name} asignado`);
      // Update order in UI
      order.delivery_assignment = { driver, status: 'assigned' };
    } catch (e) {
      adminStore.messageStore.error(e.response?.data?.message ?? "Error al asignar repartidor");
    }
  }

  reassigning.value = false;
  sendingOrder.value = null;
};

const reassigning = ref(false);

const handleReassignDriver = async (order) => {
  reassigning.value = true;
  sendingOrder.value = order;
  selectedDriver.value = null;
  loadingDrivers.value = true;
  driverDialog.value = true;
  try {
    const { data } = await api.get(`/admin/${adminStore.slug}/drivers`);
    availableDrivers.value = (data.drivers || []).filter((d) => d.status !== "offline");
  } catch (e) {
    availableDrivers.value = [];
  } finally {
    loadingDrivers.value = false;
  }
};

const handleAssignDriver = async (order) => {
  sendingOrder.value = order;
  selectedDriver.value = null;
  loadingDrivers.value = true;
  driverDialog.value = true;
  try {
    const { data } = await api.get(`/admin/${adminStore.slug}/drivers`);
    availableDrivers.value = (data.drivers || []).filter((d) => d.status !== "offline");
  } catch (e) {
    availableDrivers.value = [];
  } finally {
    loadingDrivers.value = false;
  }
};

// El ticket se dibuja en src/utils/orderTicket.js. Se saco de aqui porque el
// Historial tambien reimprime y no queria una copia mas: segun CLAUDE.md esta
// impresion ya vive duplicada en tres archivos.
const printOrder = (order) =>
  printOrderTicket(order, {
    company: companyStore.company || {},
    onError: (msg) => adminStore.messageStore.error(msg),
  });

const pollingActive = ref(true);
const filter = ref("");
const currentPage = ref(1);
const rowsPerPage = ref(12);
const rowsPerPageOptions = [6, 12, 24, 48];

const statusColors = {
  1: "warning",
  2: "info",
  3: "positive",
  4: "positive",
  5: "negative",
};

const getStatusColor = (id) => statusColors[id] || "grey";

const getDeliveryIcon = (order) => {
  if (order.delivery === "Recoger") return "store";
  if (order.delivery === "Envio") return "delivery_dining";
  return "table_restaurant";
};

const getTypeDelivery = (order) => {
  if (order.delivery === "Recoger") return "Recoger en local";
  if (order.delivery === "Envio") return "Envío a domicilio";
  return "Mesa: " + order.table;
};

const filteredOrders = computed(() => {
  if (!filter.value) return adminStore.orders;
  const needle = filter.value.toLowerCase();
  return adminStore.orders.filter(
    (o) =>
      o.order_code?.toLowerCase().includes(needle) ||
      o.customer_name?.toLowerCase().includes(needle)
  );
});

const totalPages = computed(() =>
  Math.ceil(filteredOrders.value.length / rowsPerPage.value)
);

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return filteredOrders.value.slice(start, start + rowsPerPage.value);
});

watch(filter, () => {
  currentPage.value = 1;
});

watch(() => adminStore.orderTab, () => {
  currentPage.value = 1;
});

// status 0 = pestaña Historial (ver getStatus en AdminPage): no es un estado de
// pedido, asi que ni se consulta ni se sondea.
const esHistorial = computed(() => Number(props.status) === 0);

const longPolling = async () => {
  if (!pollingActive.value) return;
  try {
    // Mantiene actualizada la lista visible del tab. La alerta sonora/notificación
    // de pedidos nuevos es global (useOrderAlerts en AdminPage), no depende del tab.
    await adminStore.getMoreOrders(props.status);
    setTimeout(longPolling, 10000);
  } catch (e) {
    setTimeout(longPolling, 10000);
  }
};

// --- Cerrar el día ---
//
// Entregado (4) y Cancelado (5) son los unicos estados donde el pedido ya termino: son
// los que se acumulaban para siempre en la pestaña. El backend valida lo mismo, porque
// esconder aqui el boton no impide que alguien llame la ruta.
const ESTADOS_CERRABLES = [4, 5];
const puedeCerrar = computed(() => ESTADOS_CERRABLES.includes(Number(props.status)));
const cerrando = ref(false);

const confirmarCierre = () => {
  const cuantos = filteredOrders.value.length;
  confirm(
    "Cerrar el día",
    `Se cerrarán ${cuantos} ${cuantos === 1 ? "pedido" : "pedidos"} y esta lista quedará vacía. ` +
      "No se borra nada: los vas a seguir viendo completos en la pestaña Historial.",
    cerrarPedidos
  );
};

const cerrarPedidos = async () => {
  cerrando.value = true;
  try {
    const { data } = await api.post(`/admin/${adminStore.slug}/orders/close`, {
      status: props.status,
    });
    const n = data.cerrados ?? 0;
    adminStore.messageStore.success(
      `${n} ${n === 1 ? "pedido cerrado" : "pedidos cerrados"}. Están en Historial.`
    );
    // El contador de la pestaña sale de otra consulta, asi que se recarga: si no, el
    // badge seguiria enseñando los que acaba de cerrar.
    adminStore.orderStore.counts[props.status] = 0;
    await adminStore.getOrders(props.status);
  } catch (error) {
    adminStore.messageStore.error(
      error.response?.data?.message || "No se pudieron cerrar los pedidos."
    );
  } finally {
    cerrando.value = false;
  }
};

if (!esHistorial.value) setTimeout(longPolling, 10000);

onUnmounted(() => {
  pollingActive.value = false;
  clearInterval(nowTimer);
});

if (!esHistorial.value) adminStore.getOrders(props.status);
</script>

<style lang="scss" scoped>
.mc-close-day {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  margin: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-surface-variant);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);

  &__text {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }
}

.mc-order-tabs {
  border-bottom: 1px solid var(--color-border);
  padding: 0 var(--space-md);
  background: var(--color-surface);

  .q-tab {
    text-transform: none;
    font-weight: 500;
    font-size: var(--text-sm);
    letter-spacing: 0;
    min-height: 40px;
  }
}

.mc-orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-md);
  padding: var(--space-lg);
}

@keyframes mcOverduePulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(211, 47, 47, 0); }
  50% { box-shadow: 0 0 0 3px rgba(211, 47, 47, 0.18); }
}

.mc-order-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: box-shadow var(--transition-fast);

  &:hover {
    box-shadow: var(--shadow-md);
  }

  // Pedido atrasado (SLA): borde rojo + latido sutil para que salte a la vista
  &--overdue {
    border-color: var(--q-negative, #d32f2f);
    animation: mcOverduePulse 2s ease-in-out infinite;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }

    .mc-order-card__header {
      background: color-mix(in srgb, var(--q-negative, #d32f2f) 8%, transparent);
    }
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md);
    background: var(--color-surface-variant);
    border-bottom: 1px solid var(--color-border-subtle);
  }

  &__body {
    padding: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__footer {
    display: flex;
    align-items: center;
    padding: var(--space-sm) var(--space-md);
    border-top: 1px solid var(--color-border-subtle);
    background: var(--color-surface-variant);
  }
}

.mc-order-code {
  font-weight: 700;
  font-size: var(--text-base);
  color: var(--q-primary);
  font-variant-numeric: tabular-nums;
}

.mc-order-scheduled {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 0 0;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: var(--text-sm);
  font-weight: 600;
  color: #8a5a00;
  background: color-mix(in srgb, #ff9800 15%, transparent);
  border: 1px solid color-mix(in srgb, #ff9800 35%, transparent);
}

.mc-order-time {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin-left: var(--space-sm);
}

.mc-order-ago {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin-left: 4px;

  &--overdue {
    color: var(--q-negative, #d32f2f);
    font-weight: 700;
  }
}

.mc-order-info-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.mc-order-items {
  padding: 0 var(--space-md) var(--space-md);

  &__title {
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-tertiary);
    margin-bottom: var(--space-sm);
  }
}

.mc-order-item {
  padding: var(--space-xs) 0;
  border-bottom: 1px solid var(--color-border-subtle);

  &:last-child {
    border-bottom: none;
  }

  &__main {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  &__qty {
    font-weight: 700;
    font-size: var(--text-sm);
    color: var(--q-primary);
    min-width: 24px;
  }

  &__name {
    font-weight: 500;
    font-size: var(--text-sm);
  }

  // Instrucción de cocina: tiene que saltar a la vista entre los extras.
  &__note {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: var(--space-xs) 0 0 32px;
    padding: 3px 8px;
    border-radius: var(--radius-sm);
    background: var(--color-warning-bg, rgba(255, 193, 7, 0.14));
    color: var(--color-text-primary);
    font-size: var(--text-xs);
    font-weight: 600;
    width: fit-content;
    max-width: 100%;
  }

  &__extra {
    margin-left: 32px;
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  &__extra-name {
    font-weight: 500;
  }
}

.mc-order-driver {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 var(--space-md) var(--space-sm);
  padding: var(--space-xs) var(--space-md);
  background: color-mix(in srgb, var(--q-primary) 8%, transparent);
  border-radius: var(--radius-sm);
}

.mc-order-comments {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  margin: 0 var(--space-md) var(--space-md);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-surface-variant);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  font-style: italic;
}

.mc-order-action-btn {
  border-radius: var(--radius-md);
  font-weight: 600;
  padding: 2px var(--space-md);
}

.mc-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  border-top: 1px solid var(--color-border-subtle);

  &__info {
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
    white-space: nowrap;
  }

  &__select {
    width: 70px;
    font-size: var(--text-xs);
  }
}

@media screen and (max-width: 600px) {
  .mc-orders-grid {
    grid-template-columns: 1fr;
    padding: var(--space-md);
  }

  .mc-order-status-tabs {
    :deep(.q-tab) {
      padding: 0 var(--space-sm);
      font-size: var(--text-xs);
    }
  }

  .mc-pagination {
    flex-wrap: wrap;
    justify-content: center;
    padding: var(--space-sm) var(--space-md);
  }
}
</style>
