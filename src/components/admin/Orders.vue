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
      </q-tabs>
    </div>

    <!-- Orders grid -->
    <div class="mc-orders-grid" v-if="filteredOrders.length">
      <div
        class="mc-order-card"
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
          </div>
          <q-chip
            dense
            :color="getStatusColor(order.status.id)"
            text-color="white"
            size="sm"
          >
            {{ order.status.name }}
          </q-chip>
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
import { useConfirmDialog } from "src/composables/useConfirmDialog";

const helperStore = useHelperStore();
const adminStore = useAdminStore();
const { confirm } = useConfirmDialog();

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

const ticketStyles = `
  body { font-family: 'Courier New', monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 10px; }
  .sep { text-align: center; margin: 6px 0; letter-spacing: 2px; color: #333; }
  .item { display: flex; justify-content: space-between; padding: 2px 0; }
  .extra { padding-left: 14px; font-size: 11px; color: #555; }
  .row { display: flex; justify-content: space-between; padding: 2px 0; }
  .total { font-weight: bold; font-size: 14px; border-top: 1px solid #000; margin-top: 4px; padding-top: 4px; }
  .header { text-align: center; margin-bottom: 6px; }
  .header strong { font-size: 14px; display: block; margin-bottom: 2px; }
  .header span { display: block; font-size: 11px; color: #555; }
  .order { text-align: center; font-weight: bold; font-size: 13px; margin: 4px 0; }
  .section-title { font-weight: bold; font-size: 11px; text-transform: uppercase; margin-top: 4px; margin-bottom: 2px; }
  .info div { padding: 1px 0; font-size: 11px; }
  .footer { text-align: center; margin-top: 8px; font-size: 11px; }
  .footer span { display: block; }
`;
const SEP = '<div class="sep">- - - - - - - - - - - - - -</div>';

const printOrder = (order) => {
  const f = (n) => Number(n || 0).toFixed(2);
  const items = (order.items || [])
    .map((item) => {
      const name = item.dish?.name ?? "Producto";
      let html = `<div class="item"><span>${item.quantity}x ${name}</span></div>`;
      (item.extras || []).forEach((extra) => {
        (extra.options || []).forEach((o) => {
          let text = o.quantity > 1 ? `${o.quantity * item.quantity}x ${o.name}` : o.name;
          if (o.price > 0) text += ` $${f(o.price * o.quantity * item.quantity)}`;
          html += `<div class="extra">↳ ${text}</div>`;
        });
      });
      return html;
    })
    .join("");

  const date = order.created_at ? new Date(order.created_at).toLocaleString() : "";
  const discount = Number(order.discount || 0);
  const tip = Number(order.tip || 0);
  const paymentLabels = { cash: "Efectivo", card: "Tarjeta", transfer: "Transferencia", mercadopago: "MercadoPago" };
  const payment = paymentLabels[order.payment_method] || order.payment_method || "";

  let deliveryInfo = "";
  if (order.delivery === "Envio") {
    deliveryInfo = order.delivery_address ? `<div><strong>Dirección:</strong> ${order.delivery_address}</div>` : "";
    if (order.delivery_references) deliveryInfo += `<div><strong>Referencia:</strong> ${order.delivery_references}</div>`;
  } else if (order.delivery === "Recoger") {
    deliveryInfo = `<div><strong>Paso a recoger</strong></div>`;
  } else if (order.table) {
    deliveryInfo = `<div><strong>Mesa:</strong> ${order.table}</div>`;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(`
    <html><head><title>Pedido #${order.order_code}</title>
    <style>${ticketStyles}</style></head><body>
      <div class="header">
        <span>${date}</span>
      </div>
      <div class="order">Orden #${order.order_code}</div>
      ${SEP}
      <div class="section-title">Productos</div>
      ${items}
      ${SEP}
      ${discount > 0 ? `<div class="row"><span>Descuento:</span><span>-$${f(discount)}</span></div>` : ""}
      ${tip > 0 ? `<div class="row"><span>Propina:</span><span>$${f(tip)}</span></div>` : ""}
      <div class="row total"><span>TOTAL:</span><span>$${f(order.total)}</span></div>
      ${SEP}
      ${payment ? `<div class="section-title">Pago</div><div class="row"><span>${payment}</span></div>${SEP}` : ""}
      <div class="section-title">Cliente</div>
      <div class="info">
        <div><strong>Nombre:</strong> ${order.customer_name}</div>
        <div><strong>Tel:</strong> ${order.phone || ""}</div>
        ${deliveryInfo}
      </div>
      ${order.comments ? `${SEP}<div class="section-title">Comentarios</div><div class="info"><div>${order.comments}</div></div>` : ""}
      ${SEP}
      <div class="footer">
        <span>¡Gracias por su compra!</span>
      </div>
    </body></html>
  `);
  printWindow.document.close();
  printWindow.print();
  printWindow.close();
};

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

setTimeout(longPolling, 10000);

onUnmounted(() => {
  pollingActive.value = false;
});

adminStore.getOrders(props.status);
</script>

<style lang="scss" scoped>
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

.mc-order-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: box-shadow var(--transition-fast);

  &:hover {
    box-shadow: var(--shadow-md);
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

.mc-order-time {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin-left: var(--space-sm);
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
