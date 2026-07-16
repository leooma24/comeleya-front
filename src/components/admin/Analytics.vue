<template>
  <q-card flat class="mc-admin-card">
    <div class="mc-admin-card__header">
      <div class="mc-admin-card__title">
        <q-icon name="analytics" size="24px" color="primary" class="q-mr-sm" />
        Analíticas y Exportación
      </div>
      <div class="row q-gutter-sm">
        <q-btn
          unelevated no-caps color="positive" icon="download" label="Exportar CSV" size="sm"
          @click="exportCSV" :loading="exporting"
        />
        <q-btn
          outline no-caps color="primary" icon="print" label="Imprimir Ticket" size="sm"
          @click="printTicket" :loading="printing"
          v-if="lastOrderId"
        />
      </div>
    </div>

    <div v-if="loading" class="mc-loading">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <template v-else>
      <!-- Summary Cards -->
      <div class="mc-analytics-summary">
        <div class="mc-summary-card">
          <q-icon name="receipt_long" size="28px" color="primary" />
          <div class="mc-summary-card__data">
            <span class="mc-summary-card__value">{{ summary.total_orders }}</span>
            <span class="mc-summary-card__label">Pedidos del mes</span>
          </div>
        </div>
        <div class="mc-summary-card">
          <q-icon name="attach_money" size="28px" color="positive" />
          <div class="mc-summary-card__data">
            <span class="mc-summary-card__value">${{ formatNumber(summary.total_revenue) }}</span>
            <span class="mc-summary-card__label">Ingresos</span>
          </div>
        </div>
        <div class="mc-summary-card">
          <q-icon name="local_offer" size="28px" color="warning" />
          <div class="mc-summary-card__data">
            <span class="mc-summary-card__value">${{ formatNumber(summary.total_discount) }}</span>
            <span class="mc-summary-card__label">Descuentos</span>
          </div>
        </div>
        <div class="mc-summary-card">
          <q-icon name="volunteer_activism" size="28px" color="info" />
          <div class="mc-summary-card__data">
            <span class="mc-summary-card__value">${{ formatNumber(summary.total_tips) }}</span>
            <span class="mc-summary-card__label">Propinas</span>
          </div>
        </div>
        <div class="mc-summary-card">
          <q-icon name="trending_up" size="28px" color="secondary" />
          <div class="mc-summary-card__data">
            <span class="mc-summary-card__value">${{ formatNumber(summary.avg_ticket) }}</span>
            <span class="mc-summary-card__label">Ticket promedio</span>
          </div>
        </div>
      </div>

      <!-- Data Table -->
      <div class="mc-analytics-table" v-if="rows.length">
        <h4 class="mc-section-title q-px-lg">Detalle de pedidos del mes</h4>
        <q-table
          flat
          :rows="rows"
          :columns="columns"
          row-key="orden"
          :pagination="{ rowsPerPage: 20 }"
          dense
          class="mc-data-table"
        />
      </div>

      <div v-else class="mc-empty-state">
        <q-icon name="analytics" size="56px" color="grey-4" />
        <p>No hay datos para este mes</p>
      </div>

      <!-- Print Ticket Dialog -->
      <q-dialog v-model="showTicketDialog">
        <q-card class="mc-ticket-dialog">
          <q-card-section class="mc-form-header">
            <span>Imprimir Ticket</span>
            <q-btn flat round dense icon="close" v-close-popup />
          </q-card-section>
          <q-card-section>
            <q-input
              filled dense rounded
              v-model="ticketOrderId"
              label="ID o código de orden"
              class="q-mb-md"
            />
          </q-card-section>
          <q-card-actions class="q-px-lg q-pb-lg">
            <q-space />
            <q-btn unelevated no-caps color="primary" label="Generar ticket" @click="generateTicket" :loading="generatingTicket" />
          </q-card-actions>

          <q-card-section v-if="ticketData">
            <div class="mc-ticket-preview" ref="ticketRef">
              <div class="mc-ticket-preview__header">
                <strong>{{ ticketData.establishment }}</strong>
                <span>{{ ticketData.date }}</span>
              </div>
              <div class="mc-ticket-preview__order">
                Orden: {{ ticketData.order_code }}
              </div>
              <hr />
              <div class="mc-ticket-preview__items">
                <div v-for="(item, i) in ticketData.items" :key="i" class="mc-ticket-item">
                  <span>{{ item.qty }}x {{ item.name }}</span>
                  <span>${{ item.total }}</span>
                </div>
              </div>
              <hr />
              <div class="mc-ticket-preview__totals">
                <div><span>Subtotal:</span><span>${{ ticketData.subtotal }}</span></div>
                <div v-if="ticketData.discount"><span>Descuento:</span><span>-${{ ticketData.discount }}</span></div>
                <div v-if="ticketData.tip"><span>Propina:</span><span>${{ ticketData.tip }}</span></div>
                <div class="mc-ticket-total"><span>TOTAL:</span><span>${{ ticketData.total }}</span></div>
              </div>
              <div class="mc-ticket-preview__footer">
                <span>{{ ticketData.payment_method }}</span>
                <span>¡Gracias por su compra!</span>
              </div>
            </div>
            <q-btn unelevated no-caps color="primary" label="Imprimir" icon="print" class="full-width q-mt-md" @click="printTicketContent" />
          </q-card-section>
        </q-card>
      </q-dialog>
    </template>
  </q-card>
</template>

<script setup>
defineOptions({ name: "AnalyticsComponent" });

import { ref, onMounted } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";

const adminStore = useAdminStore();
const loading = ref(true);
const exporting = ref(false);
const printing = ref(false);
const rows = ref([]);
const summary = ref({ total_orders: 0, total_revenue: 0, total_discount: 0, total_tips: 0, avg_ticket: 0 });
const lastOrderId = ref(null);
const showTicketDialog = ref(false);
const ticketOrderId = ref("");
const generatingTicket = ref(false);
const ticketData = ref(null);
const ticketRef = ref(null);

const columns = [
  { name: "orden", label: "Orden", field: "orden", align: "left", sortable: true },
  { name: "fecha", label: "Fecha", field: "fecha", align: "left", sortable: true },
  { name: "cliente", label: "Cliente", field: "cliente", align: "left" },
  { name: "producto", label: "Producto", field: "producto", align: "left" },
  { name: "cantidad", label: "Cant.", field: "cantidad", align: "center" },
  { name: "precio", label: "Precio", field: "precio", align: "right", format: (v) => `$${v}` },
  { name: "total_item", label: "Total Item", field: "total_item", align: "right", format: (v) => `$${v}` },
  { name: "total_orden", label: "Total Orden", field: "total_orden", align: "right", format: (v) => `$${v}` },
  { name: "metodo_pago", label: "Pago", field: "metodo_pago", align: "center" },
];

const formatNumber = (num) => {
  return Number(num || 0).toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const exportCSV = async () => {
  if (!rows.value.length) {
    adminStore.messageStore.error("No hay datos para exportar");
    return;
  }
  exporting.value = true;
  try {
    const headers = columns.map((c) => c.label).join(",");
    const csvRows = rows.value.map((row) =>
      columns.map((c) => `"${row[c.field] ?? ""}"`).join(",")
    );
    const csv = [headers, ...csvRows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${adminStore.slug}-analiticas-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    adminStore.messageStore.success("CSV exportado");
  } catch (e) {
    adminStore.messageStore.error("Error al exportar");
  } finally {
    exporting.value = false;
  }
};

const printTicket = () => {
  ticketData.value = null;
  ticketOrderId.value = "";
  showTicketDialog.value = true;
};

const generateTicket = async () => {
  if (!ticketOrderId.value) return;
  generatingTicket.value = true;
  try {
    const { data } = await api.get(`/admin/${adminStore.slug}/ticket/${ticketOrderId.value}`);
    ticketData.value = data.ticket;
  } catch (e) {
    adminStore.messageStore.error("Error al generar ticket");
  } finally {
    generatingTicket.value = false;
  }
};

const printTicketContent = () => {
  if (!ticketRef.value) return;
  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html><head><title>Ticket</title>
    <style>
      body { font-family: monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 10px; }
      hr { border: none; border-top: 1px dashed #000; }
      .mc-ticket-item, .mc-ticket-preview__totals > div { display: flex; justify-content: space-between; }
      .mc-ticket-total { font-weight: bold; font-size: 14px; margin-top: 4px; }
      .mc-ticket-preview__header { text-align: center; margin-bottom: 8px; }
      .mc-ticket-preview__header span { display: block; font-size: 11px; }
      .mc-ticket-preview__order { text-align: center; font-weight: bold; }
      .mc-ticket-preview__footer { text-align: center; margin-top: 8px; font-size: 11px; }
      .mc-ticket-preview__footer span { display: block; }
    </style></head><body>
    ${ticketRef.value.innerHTML}
    </body></html>
  `);
  printWindow.document.close();
  printWindow.print();
  printWindow.close();
};

onMounted(async () => {
  try {
    const { data } = await api.get(`/admin/${adminStore.slug}/stats/export`);
    rows.value = data.data;
    summary.value = data.summary;
  } catch (e) {
    adminStore.messageStore.error("Error al cargar analíticas");
  } finally {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
.mc-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.mc-section-title {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: var(--space-lg) 0 var(--space-md) 0;
}

.mc-analytics-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-md);
  padding: var(--space-lg);
}

.mc-summary-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);

  &__data {
    display: flex;
    flex-direction: column;
  }

  &__value {
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--color-text-primary);
    font-variant-numeric: tabular-nums;
  }

  &__label {
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
  }
}

.mc-data-table {
  max-height: 500px;
}

.mc-ticket-dialog {
  border-radius: var(--radius-xl);
  min-width: 360px;
  max-width: 420px;
}

.mc-form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--text-xl);
  font-weight: 700;
}

.mc-ticket-preview {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  font-family: monospace;
  font-size: 12px;

  &__header {
    text-align: center;
    margin-bottom: var(--space-sm);

    strong { display: block; font-size: 14px; }
    span { display: block; font-size: 11px; color: var(--color-text-tertiary); }
  }

  &__order {
    text-align: center;
    font-weight: bold;
    margin-bottom: var(--space-sm);
  }

  &__footer {
    text-align: center;
    margin-top: var(--space-sm);
    font-size: 11px;
    color: var(--color-text-tertiary);

    span { display: block; }
  }
}

.mc-ticket-item {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
}

.mc-ticket-preview__totals > div {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
}

.mc-ticket-total {
  font-weight: bold;
  font-size: 14px;
  margin-top: 4px;
}

@media screen and (max-width: 600px) {
  .mc-analytics-summary {
    grid-template-columns: repeat(2, 1fr);
    padding: var(--space-md);
  }
  .mc-ticket-dialog {
    min-width: 300px;
    max-width: calc(100vw - 32px);
  }
}
</style>
