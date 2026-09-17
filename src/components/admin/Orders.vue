<template>
  <q-card flat class="mc-admin-card" :class="{ 'mc-orders-app': modoApp }">
    <!-- La banda de arriba es la misma en las cuatro pantallas del panel: cambia lo
         que dice, no como se ve. Aqui lleva las tres cifras que se miran de reojo
         mientras se cocina. -->
    <mc-encabezado
      v-if="modoApp"
      titulo="Pedidos"
      :subtitulo="subtituloPedidos"
      :vivo="pollingActive"
      :cifras="[
        { v: activosAhora, l: 'Activos' },
        { v: esperaPromedio, l: 'Espera' },
        { v: ventaVisible, l: 'En curso' },
      ]"
    >
      <template v-slot:acciones>
        <!-- De que local: el nombre ya va en el subtitulo, aqui solo se cambia. -->
        <q-btn-dropdown
          v-if="puedeElegirLocal"
          flat
          round
          dense
          class="mc-head__ic"
          dropdown-icon="none"
          no-icon-animation
          aria-label="Local"
        >
          <template v-slot:label><mc-icon name="pin" :size="17" /></template>
          <q-list dense>
            <q-item
              v-for="o in opcionesLocal"
              :key="o.value ?? 'todos'"
              clickable
              v-close-popup
              @click="adminStore.elegirLocal(o.value)"
            >
              <q-item-section>{{ o.label }}</q-item-section>
              <q-item-section side v-if="o.value === adminStore.localEfectivo">
                <q-icon name="check" size="16px" color="primary" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
        <button type="button" class="mc-head__ic" @click="buscarAbierto = !buscarAbierto">
          <mc-icon name="buscar" :size="17" />
        </button>
        <button
          type="button"
          class="mc-head__ic"
          title="Corte de caja"
          aria-label="Corte de caja"
          @click="corteAbierto = true"
        >
          <mc-icon name="caja" :size="17" />
        </button>
        <q-btn-dropdown flat round dense class="mc-head__ic" dropdown-icon="none" no-icon-animation>
          <template v-slot:label><mc-icon name="sonido" :size="17" /></template>
          <q-list dense>
            <q-item
              v-for="t in ALERT_TONES"
              :key="t.key"
              clickable
              v-close-popup
              @click="chooseTone(t.key)"
            >
              <q-item-section>{{ t.label }}</q-item-section>
              <q-item-section side v-if="alertTone === t.key">
                <q-icon name="check" size="16px" color="primary" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </template>

      <template v-slot:pie>
        <div class="mc-head__pie" v-if="buscarAbierto">
          <q-input
            filled dense rounded debounce="300" v-model="filter"
            placeholder="Buscar pedido..." autofocus
          >
            <template v-slot:prepend><q-icon name="search" size="18px" /></template>
          </q-input>
        </div>
      </template>
    </mc-encabezado>

    <div class="mc-admin-card__header" v-if="!modoApp">
      <div class="mc-admin-card__title">
        <q-icon name="receipt_long" size="24px" color="primary" class="q-mr-sm" />
        Pedidos
      </div>

      <!-- De que local se ven los pedidos, en un negocio con sucursales. El dueño elige y
           este aparato lo recuerda; a la cajera se lo fijo el dueño y solo se le dice. -->
      <q-btn-dropdown
        v-if="puedeElegirLocal"
        flat
        no-caps
        dense
        icon="storefront"
        :label="adminStore.nombreLocalVisto || 'Todos los locales'"
        color="primary"
      >
        <q-list style="min-width: 220px">
          <q-item-label header>Ver pedidos de</q-item-label>
          <q-item
            v-for="o in opcionesLocal"
            :key="o.value ?? 'todos'"
            clickable
            v-close-popup
            @click="adminStore.elegirLocal(o.value)"
          >
            <q-item-section avatar>
              <q-icon
                :name="o.value === adminStore.localEfectivo ? 'radio_button_checked' : 'radio_button_unchecked'"
                :color="o.value === adminStore.localEfectivo ? 'primary' : 'grey-5'"
              />
            </q-item-section>
            <q-item-section>{{ o.label }}</q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
      <q-chip
        v-else-if="adminStore.nombreLocalVisto"
        dense
        square
        icon="storefront"
        color="primary"
        text-color="white"
      >
        {{ adminStore.nombreLocalVisto }}
      </q-chip>

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

      <!-- Aqui y no solo en el Dashboard: la cajera cierra su turno desde Pedidos, que es
           la unica seccion que ve. -->
      <q-btn
        outline
        no-caps
        dense
        color="primary"
        icon="point_of_sale"
        label="Corte de caja"
        class="q-px-sm"
        @click="corteAbierto = true"
      />
    </div>

    <corte-de-caja v-model="corteAbierto" />

    <!-- En celular, chips: las pestañas de Quasar se desbordaban y los globos se
         encimaban con el texto. Mismo v-model, misma navegacion. -->
    <div class="mc-chips" v-if="modoApp">
      <button
        v-for="c in chipsEstado"
        :key="c.tab"
        type="button"
        :class="['mc-chips__c', { 'mc-chips__c--on': adminStore.orderTab === c.tab }]"
        @click="adminStore.orderTab = c.tab"
      >
        {{ c.texto }}
        <i v-if="c.n">{{ c.n }}</i>
      </button>
    </div>

    <!-- Order status tabs -->
    <div class="mc-order-tabs" v-if="!modoApp">
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
        :class="[
          { 'mc-order-card--overdue': isOverdue(order) },
          modoApp ? 'mc-order-card--app mc-t-' + nivelTiempo(order) : ''
        ]"
        v-for="order in paginatedOrders"
        :key="order.id"
      >
        <!-- Anillo de tiempo (solo celular): el mismo dato que ya se muestra en texto,
             dicho de una forma que se lee de reojo y a un metro de distancia. -->
        <div class="mc-anillo" v-if="modoApp" :aria-label="agoText(order.created_at)">
          <svg width="38" height="38" viewBox="0 0 38 38">
            <circle cx="19" cy="19" r="16" class="mc-anillo__pista" />
            <circle
              cx="19" cy="19" r="16" class="mc-anillo__linea"
              :stroke-dasharray="100.5"
              :stroke-dashoffset="100.5 - (100.5 * avanceAnillo(order)) / 100"
            />
          </svg>
          <span class="mc-anillo__t">{{ relojTexto(order) }}</span>
        </div>

        <!-- Order header -->
        <div class="mc-order-card__header">
          <div>
            <span class="mc-order-code">#{{ order.order_code }}</span>
            <span class="mc-order-time">
              {{ helperStore.formatDate(order.created_at, "HH:mm") }}
            </span>
            <span
              v-if="!modoApp"
              class="mc-order-ago"
              :class="{ 'mc-order-ago--overdue': isOverdue(order) }"
            >
              · {{ agoText(order.created_at) }}
            </span>
          </div>
          <q-chip
            v-if="!modoApp"
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
          <!-- De que local es: una sucursal o la Matriz. Un negocio con varios recibe
               todos los pedidos en el mismo panel, y sin este renglon no hay forma de
               saber que cocina lo arma. En un negocio de un solo local no existe. -->
          <div class="mc-order-info-row" v-if="origenDelPedido(order, companyStore.company)">
            <q-icon name="storefront" size="16px" color="grey-5" />
            <span>Sucursal {{ origenDelPedido(order, companyStore.company) }}</span>
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
        <!-- Dinero y entrega, solo en celular.
             Hasta hoy la tarjeta no decia cuanto valia el pedido, con que se paga ni a
             donde va: para saberlo habia que imprimir el ticket. En la comandera eso es
             justo lo que se necesita antes de aceptar. -->
        <div class="mc-cobro" v-if="modoApp">
          <div class="mc-cobro__fila">
            <span class="mc-cobro__monto">{{ dinero(totalCobrar(order)) }}</span>
            <span class="mc-cobro__pago" v-if="pagoTexto(order)">{{ pagoTexto(order) }}</span>
          </div>
          <div class="mc-cobro__dir" v-if="order.delivery === 'Envio' && order.delivery_address">
            <mc-icon name="pin" :size="13" />
            <span>{{ order.delivery_address }}</span>
          </div>
        </div>

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

      <!-- El negocio que nunca ha vendido pasa aqui todo su tiempo. Es el momento
           exacto para ofrecerle la prueba: no hay nada que revisar en la pantalla y
           la duda que tiene es si esto de verdad funciona. Solo cuando no ha vendido
           NUNCA -si ya tuvo pedidos, esta pantalla solo significa que hoy no hay-. -->
      <prueba-de-pedido v-if="!hayPedidosAlguna && !adminStore.esCajero" />
    </div>

    <!-- Pagination -->
    <!-- En celular un paginador con flechas, numeros y selector de filas es de
         escritorio: son seis controles chiquitos donde solo hace falta uno. Se cambia
         por "Ver mas", que es lo que se espera en una lista de telefono. -->
    <div v-if="modoApp && totalPages > 1" class="mc-vermas">
      <button
        v-if="currentPage < totalPages"
        type="button"
        class="mc-vermas__btn"
        @click="currentPage++"
      >
        Ver más
        <small>{{ Math.min(currentPage * rowsPerPage, filteredOrders.length) }} de {{ filteredOrders.length }}</small>
      </button>
      <!-- Sin esta, la lista solo crecia: quien abria de mas se quedaba con una
           pantalla larguisima y sin forma de volver. -->
      <button
        v-if="currentPage > 1"
        type="button"
        class="mc-vermas__menos"
        :class="{ 'mc-vermas__menos--solo': currentPage >= totalPages }"
        :aria-label="currentPage >= totalPages ? 'Ver menos' : 'Colapsar la lista'"
        @click="verMenos"
      >
        <mc-icon name="sube" :size="16" />
        <span v-if="currentPage >= totalPages">Ver menos</span>
      </button>
    </div>

    <div v-if="totalPages > 1 && !modoApp" class="mc-pagination">
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
    <!-- El </template> cierra aqui, pegado al <orders-history v-else> de abajo. Si entre
         los dos queda otro elemento con v-if, el v-else se empareja con ese: asi estuvo,
         con el de la paginacion, y la pestaña Historial salia en blanco. -->
    </template>
    <orders-history v-else />
    <!-- Driver selection dialog -->
    <q-dialog v-model="driverDialog" :position="modoApp ? 'bottom' : 'standard'" :maximized="false">
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
                  <q-item-label caption>
                    {{ scope.opt.vehicle_type }} {{ scope.opt.vehicle_plate ? '- ' + scope.opt.vehicle_plate : '' }}
                    <template v-if="conSucursales"> · {{ localDelRepartidor(scope.opt) }}</template>
                  </q-item-label>
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
import { useModoApp } from "src/composables/useModoApp";
import McIcon from "./movil/McIcon.vue";
import { etiquetaPago } from "src/utils/metodosPago.js";
import McEncabezado from "./movil/Encabezado.vue";
import PruebaDePedido from "./PruebaDePedido.vue";
import { orderTotals } from "src/utils/orderTotals";
import { useHelperStore } from "src/stores/helper";
import { useCompanyStore } from "src/stores/company-store";
import { useConfirmDialog } from "src/composables/useConfirmDialog";
import { printOrderTicket } from "src/utils/orderTicket";
import {
  origenDelPedido,
  opcionesDeLocal,
  tieneSucursales,
  nombreDelLocal,
  localDelPedido,
  ordenarRepartidores,
} from "src/utils/sucursales";
import OrdersHistory from "./OrdersHistory.vue";
import CorteDeCaja from "./CorteDeCaja.vue";
import { ALERT_TONES, getAlertTone, setAlertTone, previewTone } from "src/composables/useOrderAlerts";

const helperStore = useHelperStore();
const adminStore = useAdminStore();
const companyStore = useCompanyStore();
const { confirm } = useConfirmDialog();

const corteAbierto = ref(false);

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

const conSucursales = computed(() => tieneSucursales(companyStore.company));

const localDelRepartidor = (driver) =>
  driver.local ? nombreDelLocal(driver.local, companyStore.company) ?? "Otro local" : "Compartido";

/**
 * Abre el dialogo con los repartidores que se pueden asignar a este pedido. El servidor ya
 * le quita a la cajera los de otros locales; aqui solo se ordenan: primero los del local
 * del pedido, luego los compartidos.
 */
const cargarRepartidores = async (order) => {
  sendingOrder.value = order;
  selectedDriver.value = null;
  loadingDrivers.value = true;
  driverDialog.value = true;
  try {
    const { data } = await api.get(`/admin/${adminStore.slug}/drivers`);
    const disponibles = (data.drivers || []).filter((d) => d.status !== "offline");
    availableDrivers.value = conSucursales.value
      ? ordenarRepartidores(disponibles, localDelPedido(order))
      : disponibles;
  } catch (e) {
    availableDrivers.value = [];
  } finally {
    loadingDrivers.value = false;
  }
};

const handleSendOrder = async (order) => {
  if (hasDeliveryFeature.value && order.delivery === "Envio") {
    await cargarRepartidores(order);
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
      const { data } = await api.post(`/admin/${adminStore.slug}/drivers/${driver.id}/assign`, { order_id: order.id });
      adminStore.messageStore.success(`Repartidor ${driver.name} asignado`);
      // Con el id de la asignacion que dio el servidor. Sin el, "cambiar repartidor" antes
      // de que se recargara la lista mandaba PUT delivery/undefined/status.
      order.delivery_assignment = { id: data.assignment?.id, driver, status: "assigned" };
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
  await cargarRepartidores(order);
};

const handleAssignDriver = (order) => cargarRepartidores(order);

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

// --- De que local ---------------------------------------------------------------
// Elegir solo lo hace el dueño, y solo en un negocio con sucursales. Al cambiar, AdminPage
// vuelve a montar esta seccion con el local nuevo.
const puedeElegirLocal = computed(
  () => !adminStore.esCajero && tieneSucursales(companyStore.company)
);
const opcionesLocal = computed(() => opcionesDeLocal(companyStore.company));
const subtituloPedidos = computed(() =>
  [adminStore.company?.name || "Tu negocio", adminStore.nombreLocalVisto].filter(Boolean).join(" · ")
);

// --- Vista de celular -------------------------------------------------------
// Solo presentacion: los datos y las acciones son los mismos de arriba.
const { modoApp } = useModoApp();

/** Regresa la lista a su tamaño inicial y sube: al colapsar, quedarse a media
 *  pantalla desorienta mas que ayudar. */
const verMenos = () => {
  currentPage.value = 1;
  window.scrollTo({ top: 0, behavior: "smooth" });
};
const buscarAbierto = ref(false);

const chipsEstado = computed(() => [
  { tab: "pedidos_pendientes", texto: "Nuevos", n: adminStore.getOrderCounts(1) },
  { tab: "pedidos_en_preparacion", texto: "Cocina", n: adminStore.getOrderCounts(2) },
  { tab: "pedidos_enviados", texto: "En camino", n: adminStore.getOrderCounts(3) },
  { tab: "pedidos_entregados", texto: "Entregados", n: adminStore.getOrderCounts(4) },
  { tab: "pedidos_cancelados", texto: "Cancelados", n: 0 },
]);

/** Los que siguen en juego: nuevos, en cocina y en camino. */
const activosAhora = computed(
  () => adminStore.getOrderCounts(1) + adminStore.getOrderCounts(2) + adminStore.getOrderCounts(3)
);

/** Cuanto lleva esperando el mas viejo de los que estan en pantalla. */
const esperaPromedio = computed(() => {
  const lista = filteredOrders.value.filter((o) => o?.created_at);
  if (!lista.length) return "—";
  const mins = Math.max(...lista.map((o) => minutesSince(o.created_at)));
  if (mins < 60) return `${mins} min`;
  const horas = Math.floor(mins / 60);
  // Mas de un dia rompia la reticula de la cabecera: "17309 h" no cabe en tres cifras.
  return horas < 24 ? `${horas} h` : `${Math.floor(horas / 24)} d`;
});

/** Lo que suman los pedidos de esta pestaña, no la venta del dia. */
const ventaVisible = computed(() => {
  const total = filteredOrders.value.reduce((a, o) => a + (parseFloat(o?.total) || 0), 0);
  return "$" + Math.round(total).toLocaleString("es-MX");
});

/**
 * El semaforo del pedido. Verde los primeros 5 minutos, ambar hasta 15, rojo despues.
 * Es la convencion de las pantallas de cocina, y aqui se dice tres veces -franja,
 * anillo y numero- para leerse de reojo con las manos ocupadas.
 */
const UMBRAL_MEDIO = 5;
const UMBRAL_TARDE = 15;
const nivelTiempo = (order) => {
  const m = minutesSince(order?.created_at);
  if (m >= UMBRAL_TARDE || isOverdue(order)) return "tarde";
  if (m >= UMBRAL_MEDIO) return "medio";
  return "bien";
};
/** Cuanto del anillo se ha consumido, tomando 20 minutos como vuelta completa. */
const avanceAnillo = (order) => {
  const m = Math.min(minutesSince(order?.created_at), 20);
  return Math.round((m / 20) * 100);
};
const relojTexto = (order) => {
  // Tres caracteres como maximo: dentro del anillo no cabe mas. Un pedido de ayer
  // decia "17084h" y se salia del circulo.
  const m = minutesSince(order?.created_at);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return d < 100 ? `${d}d` : "+99d";
};

/**
 * Lo que se cobra de verdad: `order.total` es solo el subtotal de platillos.
 * Se usa la MISMA cuenta del ticket impreso, no una propia, para que el papel y la
 * pantalla nunca digan cosas distintas.
 */
const totalCobrar = (order) => {
  try {
    return orderTotals(order).grandTotal;
  } catch (e) {
    return parseFloat(order?.total) || 0;
  }
};
const dinero = (n) => "$" + Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const pagoTexto = (order) => etiquetaPago(order?.payment_method);
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

// Si el negocio ya vendio alguna vez. La plantilla la usaba sin que existiera, asi que
// la tarjeta de "haz un pedido de prueba" salia en cada pestaña vacia, tambien en
// negocios con cientos de pedidos. Lo dice el servidor: los contadores ya no cuentan lo
// cerrado, y un negocio que cerro su dia tambien ya vendio.
const hayPedidosAlguna = computed(() => adminStore.orderStore.hayPedidos);

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
  const deQue = adminStore.nombreLocalVisto ? ` de ${adminStore.nombreLocalVisto}` : "";
  confirm(
    "Cerrar el día",
    `Se cerrarán ${cuantos} ${cuantos === 1 ? "pedido" : "pedidos"}${deQue} y esta lista quedará vacía. ` +
      "No se borra nada: los vas a seguir viendo completos en la pestaña Historial.",
    cerrarPedidos
  );
};

const cerrarPedidos = async () => {
  cerrando.value = true;
  try {
    // Solo los del local que se esta viendo: cerrar el dia de Centro no cierra la Matriz.
    const { data } = await api.post(
      `/admin/${adminStore.slug}/orders/close`,
      { status: props.status },
      { params: adminStore.paramsDeLocal }
    );
    const n = data.cerrados ?? 0;
    adminStore.messageStore.success(
      `${n} ${n === 1 ? "pedido cerrado" : "pedidos cerrados"}. Están en Historial.`
    );
    // El contador de la pestaña sale de otra consulta, asi que se recarga: si no, el
    // badge seguiria enseñando los que acaba de cerrar.
    await Promise.all([adminStore.recargarConteos(), adminStore.getOrders(props.status)]);
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

/* Los diálogos como hoja en celular: llegan desde abajo, cerca del pulgar, y toman
   todo el ancho. La esquina inferior queda recta porque la hoja nace del borde. */
body.mc-modo-app .q-dialog__inner--bottom > div {
  width: 100%;
  max-width: 100%;
  border-radius: 18px 18px 0 0 !important;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}


/* "Ver más" en lugar del paginador de escritorio.
   Los dos botones van en el MISMO renglon: apilados se leian como dos decisiones
   distintas -y del mismo tamaño- cuando en realidad una es la que se usa y la otra
   es para deshacer. Colapsar es una flecha; solo se escribe "Ver menos" cuando ya no
   queda nada por cargar y la flecha se quedaria sola sin decir de que es. */
.mc-vermas {
  display: flex;
  align-items: stretch;
  gap: 8px;
  padding: 4px var(--mc-lado) 12px;
}

.mc-vermas__btn {
  appearance: none;
  flex: 1;
  min-width: 0;
  border: 0.5px solid var(--color-border);
  background: var(--color-surface);
  border-radius: 13px;
  padding: 13px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 620;
  color: var(--color-text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  small { font-size: 11px; font-weight: 500; color: var(--color-text-tertiary); }
}

.mc-vermas__menos {
  appearance: none;
  flex: 0 0 46px;
  border: 0.5px solid var(--color-border);
  background: transparent;
  border-radius: 13px;
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: 13px;
  font-weight: 560;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  /* Cuando ya se cargo todo, es el unico control del renglon y toma el ancho. */
  &--solo { flex: 1; }
}


/* ===========================================================================
   Vista de celular. Todo cuelga de .mc-orders-app, asi que nada de esto puede
   filtrarse al panel de escritorio ni al menu embebido: si la clase no esta,
   estas reglas no existen.
   =========================================================================== */
.mc-orders-app {
  background: #eef0f4 !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  margin: calc(-1 * var(--mc-lado)) calc(-1 * var(--mc-lado)) 0 !important;
}

/* La banda de arriba vive ahora en Encabezado.vue, que la comparten las cuatro
   pantallas: aqui solo quedaba una copia con otro nombre. */

/* Chips de estado: se desvanecen a la derecha, que es la señal de que hay mas. */
.mc-chips {
  display: flex; gap: 7px; padding: 10px var(--mc-lado); overflow-x: auto;
  background: var(--color-surface); border-bottom: 0.5px solid var(--color-border);
  scrollbar-width: none;
  -webkit-mask-image: linear-gradient(90deg, #000 90%, transparent);
  mask-image: linear-gradient(90deg, #000 90%, transparent);

  &::-webkit-scrollbar { display: none; }
}
.mc-chips__c {
  appearance: none; border: 0; flex: 0 0 auto; cursor: pointer; font-family: inherit;
  font-size: 11.5px; font-weight: 540; padding: 6px 11px; border-radius: 10px;
  background: var(--color-surface-variant); color: var(--color-text-secondary);
  display: flex; align-items: center; gap: 6px;

  i {
    font-style: normal; font-size: 9.5px; font-weight: 700;
    background: rgba(13, 16, 21, 0.08); border-radius: 999px; padding: 0.5px 5px;
  }

  &--on {
    background: #0d1015; color: #fff; font-weight: 620;
    i { background: rgba(255, 255, 255, 0.22); }
  }
}

/* Una tarjeta por renglon: en 390 px de ancho, dos columnas no dejan leer nada. */
.mc-orders-app .mc-orders-grid {
  display: block !important;
  padding: 0 var(--mc-lado);
}

.mc-order-card--app {
  position: relative;
  margin: var(--mc-hueco) 0 0;
  border-radius: 17px;
  padding-left: 3px;
  overflow: hidden;

  /* La franja del semaforo. Es la primera de las tres señales del tiempo. */
  &::before {
    content: "";
    position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: #12915a;
  }
  &.mc-t-medio::before { background: #b06f00; }
  &.mc-t-tarde::before { background: var(--q-negative); }
}

/* --- Densidad: en el diseño entran tres pedidos por pantalla, no uno --- */
.mc-order-card--app {
  /* La fecha completa sobra: el encabezado ya trae la hora y el anillo el tiempo. */
  .mc-order-info-row:last-child { display: none; }

  /* Cliente y tipo de entrega en renglones apretados, no como lista con sangria. */
  .mc-order-card__body { padding: 9px 13px 0; gap: 3px; }
  .mc-order-info-row { font-size: 12.5px; gap: 7px; }

  .mc-order-items { padding: 8px 13px 0; }
  /* "PRODUCTOS" gastaba un renglon entero para decir lo evidente. */
  .mc-order-items__title { display: none; }
  .mc-order-item { padding: 2px 0; }

  .mc-order-card__header { padding: 11px 48px 9px 13px; }
  .mc-order-card__footer { padding: 9px 13px 11px; }
}

.mc-anillo {
  position: absolute; top: 12px; right: 13px; width: 38px; height: 38px; z-index: 2;
}
.mc-anillo svg { transform: rotate(-90deg); }
.mc-anillo__pista { fill: none; stroke: var(--color-border-subtle); stroke-width: 3; }
.mc-anillo__linea {
  fill: none; stroke: #12915a; stroke-width: 3; stroke-linecap: round;
  transition: stroke-dashoffset 0.6s ease;
}
.mc-t-medio .mc-anillo__linea { stroke: #b06f00; }
.mc-t-tarde .mc-anillo__linea { stroke: var(--q-negative); }
.mc-cobro {
  padding: 9px 13px 0;
}
.mc-cobro__fila { display: flex; align-items: baseline; gap: 9px; }
.mc-cobro__monto {
  font-size: 17px; font-weight: 700; letter-spacing: -0.035em;
  font-variant-numeric: tabular-nums; color: var(--color-text-primary);
}
.mc-cobro__pago {
  font-size: 10px; font-weight: 620; color: var(--color-text-secondary);
  background: var(--color-surface-variant); border-radius: 6px; padding: 2.5px 7px;
}
.mc-cobro__dir {
  display: flex; align-items: flex-start; gap: 6px; margin-top: 5px;
  font-size: 11.5px; color: var(--color-text-secondary); line-height: 1.35;
}

.mc-anillo__t {
  position: absolute; inset: 0; display: grid; place-items: center;
  font-size: 10px; font-weight: 700; letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums; color: var(--color-text-primary);
}

/* El folio no puede quedar debajo del anillo. */
.mc-order-card--app .mc-order-card__header { padding-right: 48px; }

/* La accion principal manda: grande y sola. Las de apoyo se hacen a un lado. */
.mc-order-card--app {
  .mc-order-actions {
    display: flex; flex-wrap: wrap; gap: 7px;

    .q-btn { flex: 0 0 auto; }
    // Preparar, Enviar y Entregar son las que avanzan el pedido.
    .q-btn--unelevated { flex: 1 1 auto; min-height: 42px; border-radius: 12px; font-weight: 620; }
  }
}

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
