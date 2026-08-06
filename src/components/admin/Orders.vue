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
      </q-tabs>
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
import { useCompanyStore } from "src/stores/company-store";
import { useConfirmDialog } from "src/composables/useConfirmDialog";
import { amountToWords } from "src/utils/numberToWords";
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

const ticketStyles = `
  body { font-family: 'Consolas', 'DejaVu Sans Mono', 'Liberation Mono', Menlo, 'Courier New', monospace; font-size: 12px; font-weight: 700; width: 280px; margin: 0 auto; padding: 10px; color: #000; line-height: 1.35; }
  .item, .row, .cols, .addr, .info div, .letras, .thead, .section-title, .biz span { font-weight: 700; }
  .c-desc, .price, .total, .biz strong { font-weight: 800; }
  .sep { text-align: center; margin: 5px 0; letter-spacing: 1px; }
  .biz { text-align: center; margin-bottom: 4px; }
  .biz strong { font-size: 14px; display: block; }
  .biz span { display: block; font-size: 11px; }
  .cols { display: flex; justify-content: space-between; gap: 8px; }
  .cols .col { font-size: 11px; }
  .cols .col.r { text-align: right; }
  .cols .col div { padding: 1px 0; }
  .addr { font-size: 11px; margin-top: 4px; }
  .addr .lbl { font-weight: bold; }
  .thead, .item { display: flex; font-size: 11px; }
  .thead { font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 2px; }
  .item { padding: 2px 0; }
  .c-cant { width: 28px; flex: 0 0 28px; }
  .c-desc { flex: 1 1 auto; padding: 0 4px; word-break: break-word; }
  .c-imp { width: 60px; flex: 0 0 60px; text-align: right; }
  .extra { font-size: 10px; padding-left: 32px; }
  .row { display: flex; justify-content: space-between; padding: 1px 0; font-size: 12px; }
  .total { font-weight: bold; font-size: 16px; border-top: 1px solid #000; margin-top: 3px; padding-top: 3px; }
  .letras { font-size: 10px; text-align: center; margin: 4px 0; text-transform: uppercase; }
  .section-title { font-weight: bold; font-size: 11px; text-transform: uppercase; margin-top: 4px; margin-bottom: 2px; }
  .info div { padding: 1px 0; font-size: 11px; }
  .footer { text-align: center; margin-top: 6px; font-size: 9px; line-height: 1.3; }
`;
const SEP = '<div class="sep">- - - - - - - - - - - - - -</div>';

// Escapa datos provistos por el cliente para no romper el ticket ni inyectar HTML
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));

const printOrder = (order) => {
  const f = (n) => Number(n || 0).toFixed(2);

  // ---- Datos del negocio (encabezado) ----
  const company = companyStore.company || {};
  const tc = company.ticket_config || {};
  const bizName = esc(company.name || "");
  const legalName = esc(tc.business_legal_name || "");
  const rfc = esc(tc.rfc || "");
  const bizPhone = esc(company.whatsapp || company.phone || "");
  const addr = company.address || {};
  const showBizAddr = tc.show_business_address !== false;
  const bizAddrLine = [
    [addr.street, addr.exterior_number].filter(Boolean).join(" "),
    addr.town,
    addr.postal_code ? `CP ${addr.postal_code}` : "",
    [addr.city, addr.state].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .map(esc)
    .join(" · ");

  // ---- Artículos (CANT. | DESCRIPCION | IMPORTE) ----
  let subtotal = 0;
  const items = (order.items || [])
    .map((item) => {
      const name = esc(item.dish?.name ?? "Producto");
      const lineImport = Number(item.total || 0);
      subtotal += lineImport;
      let html = `<div class="item"><span class="c-cant">${item.quantity}</span><span class="c-desc">${name}</span><span class="c-imp">$${f(lineImport)}</span></div>`;
      (item.extras || []).forEach((extra) => {
        (extra.options || []).forEach((o) => {
          const optName = esc(o.name);
          let text = o.quantity > 1 ? `${o.quantity * item.quantity}x ${optName}` : optName;
          if (o.price > 0) text += ` (+$${f(o.price * o.quantity * item.quantity)})`;
          html += `<div class="extra">↳ ${text}</div>`;
        });
      });
      return html;
    })
    .join("");

  const deliveryCharge = Number(order.delivery_charge || 0);
  const discount = Number(order.discount || 0);
  const tip = Number(order.tip || 0);
  const total = Number(order.total || 0);

  const d = order.created_at ? new Date(order.created_at) : new Date();
  const fecha = d.toLocaleDateString("es-MX");
  const hora = d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const paymentLabels = { cash: "Efectivo", card: "Tarjeta", transfer: "Transferencia", mercadopago: "MercadoPago" };
  const payment = paymentLabels[order.payment_method] || order.payment_method || "";
  const driverName = order.delivery_assignment?.driver?.name || "";

  // ---- Bloque de entrega ----
  let deliveryBlock = "";
  if (order.delivery === "Envio") {
    let a = order.delivery_address ? `<div><span class="lbl">Dir.:</span> ${esc(order.delivery_address)}</div>` : "";
    if (order.delivery_references) a += `<div><span class="lbl">Entre/Ref.:</span> ${esc(order.delivery_references)}</div>`;
    if (driverName) a += `<div><span class="lbl">REPARTIDOR:</span> ${esc(driverName)}</div>`;
    deliveryBlock = a ? `<div class="addr">${a}</div>` : "";
  } else if (order.delivery === "Recoger") {
    deliveryBlock = `<div class="addr"><strong>PASO A RECOGER</strong></div>`;
  } else if (order.table) {
    deliveryBlock = `<div class="addr"><span class="lbl">Mesa:</span> ${esc(order.table)}</div>`;
  }

  // ---- Encabezado del negocio ----
  const bizHeader = `
    <div class="biz">
      ${bizName ? `<strong>${bizName}</strong>` : ""}
      ${legalName ? `<span>${legalName}</span>` : ""}
      ${rfc ? `<span>RFC: ${rfc}</span>` : ""}
      ${showBizAddr && bizAddrLine ? `<span>${bizAddrLine}</span>` : ""}
      ${bizPhone ? `<span>Tel. ${bizPhone}</span>` : ""}
    </div>`;

  // ---- Pie legal configurable ----
  const footerText = esc(tc.footer_text || "");
  const suggestionsEmail = esc(tc.suggestions_email || "");
  const footer =
    footerText || suggestionsEmail
      ? `${SEP}<div class="footer">${footerText}${
          suggestionsEmail ? `${footerText ? "<br>" : ""}Sugerencias: ${suggestionsEmail}` : ""
        }</div>`
      : "";

  const html = `
    <html><head><title>Pedido #${esc(order.order_code)}</title>
    <style>${ticketStyles}</style></head><body>
      ${bizName || bizAddrLine ? bizHeader : ""}
      ${SEP}
      <div class="cols">
        <div class="col">
          <div>Tel.: ${esc(order.phone || "")}</div>
          <div>${esc(order.customer_name || "")}</div>
        </div>
        <div class="col r">
          <div>FOLIO NO. ${esc(order.id ?? "")}</div>
          <div>${esc(fecha)}</div>
          <div>${esc(hora)}</div>
          <div>ORDEN NO. ${esc(order.order_code ?? "")}</div>
        </div>
      </div>
      ${deliveryBlock}
      ${SEP}
      <div class="thead"><span class="c-cant">CANT</span><span class="c-desc">DESCRIPCION</span><span class="c-imp">IMPORTE</span></div>
      ${items}
      ${deliveryCharge > 0 ? `<div class="item"><span class="c-cant">1</span><span class="c-desc">DELIVERY</span><span class="c-imp">$${f(deliveryCharge)}</span></div>` : ""}
      ${order.delivery_estimated ? `<div class="addr"><strong>** ENVIO ESTIMADO - REVISAR DISTANCIA **</strong></div>` : ""}
      ${SEP}
      <div class="row"><span>SUBTOTAL:</span><span>$${f(subtotal)}</span></div>
      ${discount > 0 ? `<div class="row"><span>DESCUENTO:</span><span>-$${f(discount)}</span></div>` : ""}
      ${tip > 0 ? `<div class="row"><span>PROPINA:</span><span>$${f(tip)}</span></div>` : ""}
      <div class="row total"><span>TOTAL:</span><span>$${f(total)}</span></div>
      <div class="letras">${esc(amountToWords(total))}</div>
      ${payment ? `<div class="row"><span>PAGO:</span><span>${esc(payment)}</span></div>` : ""}
      ${order.comments ? `${SEP}<div class="section-title">Comentarios</div><div class="info"><div>${esc(order.comments)}</div></div>` : ""}
      ${footer}
    </body></html>
  `;

  // Imprime en un iframe oculto: window.open queda bloqueado en móvil/in-app.
  const prev = document.getElementById("mc-admin-print-frame");
  if (prev) prev.remove();
  const iframe = document.createElement("iframe");
  iframe.id = "mc-admin-print-frame";
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
  });
  document.body.appendChild(iframe);

  let printed = false;
  const triggerPrint = () => {
    if (printed) return;
    printed = true;
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch {
      adminStore.messageStore.error(
        "Este navegador no permite imprimir. Ábrelo en Chrome o conecta una impresora."
      );
    }
  };

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  iframe.onload = () => setTimeout(triggerPrint, 200);
  setTimeout(triggerPrint, 700);
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
  clearInterval(nowTimer);
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
