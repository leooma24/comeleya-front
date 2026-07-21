<template>
  <div>
    <!-- ONBOARDING WIZARD (only if setup incomplete) -->
    <q-card v-if="showWizard && !loading" flat class="mc-admin-card q-mb-md">
      <div class="mc-admin-card__header">
        <div class="mc-admin-card__title">
          <q-icon name="rocket_launch" size="24px" color="primary" class="q-mr-sm" />
          Configura tu negocio
        </div>
        <q-chip dense :color="wizardProgress >= 100 ? 'positive' : 'primary'" text-color="white">
          {{ wizardProgress }}% completado
        </q-chip>
      </div>
      <div class="q-pa-lg">
        <q-linear-progress :value="wizardProgress / 100" color="primary" rounded size="8px" class="q-mb-lg" />

        <div class="mc-wizard-steps">
          <div
            v-for="step in wizardSteps"
            :key="step.key"
            :class="['mc-wizard-step', step.done ? 'mc-wizard-step--done' : '']"
          >
            <div class="mc-wizard-step__check">
              <q-icon :name="step.done ? 'check_circle' : 'radio_button_unchecked'" :color="step.done ? 'positive' : 'grey-4'" size="24px" />
            </div>
            <div class="mc-wizard-step__content">
              <div class="mc-wizard-step__title">{{ step.title }}</div>
              <div class="mc-wizard-step__desc">{{ step.desc }}</div>
            </div>
            <q-btn
              v-if="!step.done"
              unelevated
              no-caps
              color="primary"
              :label="step.btnLabel"
              :icon="step.btnIcon"
              size="sm"
              class="mc-wizard-step__btn"
              @click="step.action"
            />
            <q-icon v-else name="done" color="positive" size="20px" />
          </div>
        </div>
      </div>
    </q-card>

    <!-- OPTIMIZATION CHECKLIST (after wizard is done) -->
    <q-card v-if="!showWizard && optimizations.length && !loading" flat class="mc-admin-card q-mb-md">
      <div class="mc-admin-card__header">
        <div class="mc-admin-card__title">
          <q-icon name="lightbulb" size="24px" color="amber-8" class="q-mr-sm" />
          Oportunidades de mejora
        </div>
      </div>
      <div class="q-px-lg q-pb-lg">
        <div v-for="opt in optimizations" :key="opt.key" class="mc-optimization-row">
          <q-icon :name="opt.icon" :color="opt.color" size="20px" />
          <div class="mc-optimization-row__text">
            <span class="text-weight-medium">{{ opt.title }}</span>
            <span class="text-caption text-grey-6">{{ opt.desc }}</span>
          </div>
          <q-btn outline no-caps :color="opt.color" :label="opt.btnLabel" size="sm" @click="opt.action" />
        </div>
      </div>
    </q-card>

    <!-- MAIN DASHBOARD (existing stats) -->
    <q-card flat class="mc-admin-card">
      <div class="mc-admin-card__header">
        <div class="mc-admin-card__title">
          <q-icon name="dashboard" size="24px" color="primary" class="q-mr-sm" />
          Dashboard
        </div>
        <div class="row q-gutter-sm items-center">
          <q-btn unelevated no-caps color="red" icon="local_fire_department" label="Oferta flash" size="sm" @click="showFlashOffer = true" />
          <q-btn outline no-caps color="green" icon="fab fa-whatsapp" label="Compartir" size="sm" @click="shareMenuWa" class="gt-xs" />
          <q-btn-toggle
            v-model="period"
            no-caps rounded unelevated toggle-color="primary" size="sm"
            :options="[
              { label: 'Hoy', value: 'today' },
              { label: 'Semana', value: 'week' },
              { label: 'Mes', value: 'month' },
            ]"
          />
        </div>
      </div>

      <div v-if="loading" class="mc-dashboard-loading">
        <q-spinner-dots size="40px" color="primary" />
      </div>

      <template v-else>
        <!-- Stats Cards with comparison -->
        <div class="mc-stats-grid">
          <div class="mc-stat-card">
            <div class="mc-stat-card__icon mc-stat-card__icon--orders">
              <q-icon name="receipt_long" size="24px" />
            </div>
            <div class="mc-stat-card__content">
              <span class="mc-stat-card__value">{{ stats.orders[period] }}</span>
              <span class="mc-stat-card__label">Pedidos</span>
              <span v-if="ordersChange !== null" :class="['mc-stat-card__change', ordersChange >= 0 ? 'mc-stat-card__change--up' : 'mc-stat-card__change--down']">
                <q-icon :name="ordersChange >= 0 ? 'trending_up' : 'trending_down'" size="12px" />
                {{ Math.abs(ordersChange) }}% {{ comparisonLabel }}
              </span>
            </div>
          </div>
          <div class="mc-stat-card">
            <div class="mc-stat-card__icon mc-stat-card__icon--revenue">
              <q-icon name="attach_money" size="24px" />
            </div>
            <div class="mc-stat-card__content">
              <span class="mc-stat-card__value">${{ formatNumber(stats.revenue[period]) }}</span>
              <span class="mc-stat-card__label">Ingresos</span>
              <span v-if="revenueChange !== null" :class="['mc-stat-card__change', revenueChange >= 0 ? 'mc-stat-card__change--up' : 'mc-stat-card__change--down']">
                <q-icon :name="revenueChange >= 0 ? 'trending_up' : 'trending_down'" size="12px" />
                {{ Math.abs(revenueChange) }}% {{ comparisonLabel }}
              </span>
            </div>
          </div>
          <div class="mc-stat-card">
            <div class="mc-stat-card__icon mc-stat-card__icon--avg">
              <q-icon name="trending_up" size="24px" />
            </div>
            <div class="mc-stat-card__content">
              <span class="mc-stat-card__value">${{ formatNumber(stats.avgTicket[period]) }}</span>
              <span class="mc-stat-card__label">Ticket promedio</span>
            </div>
          </div>
          <div class="mc-stat-card" v-if="stats.reviews">
            <div class="mc-stat-card__icon" style="background: #FFF8E1; color: #FFB300;">
              <q-icon name="star" size="24px" />
            </div>
            <div class="mc-stat-card__content">
              <span class="mc-stat-card__value">{{ stats.reviews.avg || '—' }}</span>
              <span class="mc-stat-card__label">{{ stats.reviews.total }} resenas</span>
            </div>
          </div>
        </div>

        <!-- SMART SUGGESTIONS -->
        <div v-if="stats.suggestions?.length" class="q-px-lg q-pb-md">
          <div v-for="sug in stats.suggestions" :key="sug.title" class="mc-suggestion">
            <q-icon :name="sug.icon" :color="sug.color" size="20px" />
            <div class="mc-suggestion__text">
              <span class="text-weight-bold">{{ sug.title }}</span>
              <span class="text-caption text-grey-6">{{ sug.desc }}</span>
            </div>
            <q-btn v-if="sug.action" flat no-caps :color="sug.color" size="sm" :label="actionLabel(sug.action)" @click="handleSuggestion(sug.action)" />
          </div>
        </div>

        <!-- Chart -->
        <div class="mc-chart-section">
          <h4 class="mc-chart-title">Pedidos - Ultimos 7 dias</h4>
          <div class="mc-chart">
            <div class="mc-chart-bar-wrapper" v-for="(day, index) in stats.chart" :key="index">
              <span class="mc-chart-bar__value">{{ day.count }}</span>
              <div class="mc-chart-bar" :style="{ height: getBarHeight(day.count) + '%' }" />
              <span class="mc-chart-bar__label">{{ day.label }}</span>
            </div>
          </div>
        </div>

        <!-- Peak hours -->
        <div class="mc-chart-section" v-if="peakTotal > 0">
          <h4 class="mc-chart-title">Horas pico - ultimos 30 dias</h4>
          <div class="mc-hours-chart">
            <div
              class="mc-hour-bar-wrapper"
              v-for="h in stats.peakHours"
              :key="h.hour"
              :class="{ 'mc-hour-bar-wrapper--peak': h.hour === peakHour }"
            >
              <div class="mc-hour-bar" :style="{ height: getHourHeight(h.count) + '%' }">
                <q-tooltip v-if="h.count">{{ h.count }} pedidos ~ {{ formatHour(h.hour) }}</q-tooltip>
              </div>
              <span v-if="h.hour % 3 === 0" class="mc-hour-bar__label">{{ formatHour(h.hour) }}</span>
            </div>
          </div>
          <p v-if="peakHour !== null" class="mc-hours-hint">
            <q-icon name="bolt" size="14px" color="amber-8" />
            Tu hora mas fuerte es alrededor de las <strong>{{ formatHour(peakHour) }}</strong>. Ten personal y stock listos.
          </p>
        </div>

        <!-- Top Products -->
        <div class="mc-top-products" v-if="stats.topProducts?.length">
          <h4 class="mc-chart-title">Top productos del mes</h4>
          <div class="mc-top-product" v-for="(product, index) in stats.topProducts" :key="index">
            <div class="mc-top-product__rank">{{ index + 1 }}</div>
            <div class="mc-top-product__info">
              <span class="mc-top-product__name">{{ product.name }}</span>
              <span class="mc-top-product__qty">{{ product.total_qty }} vendidos</span>
            </div>
            <span class="mc-top-product__revenue">${{ formatNumber(product.total_revenue) }}</span>
          </div>
        </div>

        <!-- Tips -->
        <div class="mc-tips-section" v-if="currentTip">
          <q-card flat bordered class="mc-tip-card">
            <q-card-section class="row items-center no-wrap q-py-md">
              <q-icon name="tips_and_updates" size="28px" color="amber-8" class="q-mr-md" />
              <div class="col">
                <div class="text-weight-bold text-body2">{{ currentTip.title }}</div>
                <div class="text-caption text-grey-6">{{ currentTip.desc }}</div>
              </div>
              <q-btn v-if="currentTip.action" flat no-caps color="primary" :label="currentTip.btnLabel" size="sm" @click="currentTip.action" />
            </q-card-section>
          </q-card>
        </div>
      </template>
    </q-card>

    <!-- CUSTOMERS SECTION -->
    <q-card v-if="stats.customers?.length && !loading" flat class="mc-admin-card q-mt-md">
      <div class="mc-admin-card__header">
        <div class="mc-admin-card__title">
          <q-icon name="people" size="24px" color="primary" class="q-mr-sm" />
          Tus clientes ({{ stats.customers.length }})
        </div>
        <div class="row q-gutter-sm">
          <q-btn outline no-caps color="green" icon="fab fa-whatsapp" label="Compartir menu" size="sm" @click="shareMenuWa" />
        </div>
      </div>

      <q-table flat :rows="stats.customers" :columns="customerColumns" row-key="phone"
        :pagination="{ rowsPerPage: 10 }" rows-per-page-label="Por pagina:" class="mc-inner-table"
        :filter="customerSearch"
      >
        <template v-slot:top-left>
          <q-input v-model="customerSearch" filled dense rounded debounce="300" placeholder="Buscar cliente..." class="mc-admin-search" style="min-width: 200px">
            <template v-slot:prepend><q-icon name="search" size="18px" color="grey-5" /></template>
          </q-input>
        </template>
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td key="customer_name" :props="props">
              <span class="text-weight-medium">{{ props.row.customer_name }}</span>
            </q-td>
            <q-td key="phone" :props="props">{{ props.row.phone }}</q-td>
            <q-td key="order_count" :props="props">
              <q-badge :color="props.row.order_count >= 5 ? 'positive' : props.row.order_count >= 3 ? 'primary' : 'grey'" :label="props.row.order_count" />
            </q-td>
            <q-td key="total_spent" :props="props">
              <span class="text-weight-bold text-positive">${{ formatNumber(props.row.total_spent) }}</span>
            </q-td>
            <q-td key="last_order" :props="props">
              <span class="text-caption">{{ timeAgo(props.row.last_order_at) }}</span>
            </q-td>
            <q-td key="actions" :props="props">
              <q-btn flat dense round size="xs" icon="fab fa-whatsapp" color="green" @click="sendWaToCustomer(props.row)">
                <q-tooltip>Enviar promo por WhatsApp</q-tooltip>
              </q-btn>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card>

    <!-- FLASH OFFER DIALOG -->
    <q-dialog v-model="showFlashOffer">
      <q-card style="min-width: 360px; border-radius: 16px">
        <q-card-section>
          <div class="row items-center q-gutter-sm">
            <q-icon name="local_fire_department" size="24px" color="red" />
            <span style="font-size: 18px; font-weight: 700">Oferta flash</span>
          </div>
          <p class="text-caption text-grey-6 q-mt-sm">Crea una oferta temporal en segundos</p>
        </q-card-section>
        <q-card-section>
          <q-select
            v-model="flashForm.dish_id"
            :options="adminStore.products.map(p => ({ label: `${p.name} — $${p.price}`, value: p.id }))"
            emit-value map-options filled dense label="Platillo" class="q-mb-md"
          />
          <q-input v-model.number="flashForm.special_price" type="number" filled dense label="Precio de oferta" prefix="$" class="q-mb-md" />
          <q-select
            v-model="flashForm.hours"
            :options="[{ label: '2 horas', value: 2 }, { label: '4 horas', value: 4 }, { label: '8 horas', value: 8 }, { label: '24 horas', value: 24 }, { label: '48 horas', value: 48 }]"
            emit-value map-options filled dense label="Duracion"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancelar" v-close-popup />
          <q-btn unelevated no-caps color="red" label="Activar oferta" icon="local_fire_department" :loading="flashLoading" @click="activateFlash" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- DISH TEMPLATES DIALOG -->
    <q-dialog v-model="showTemplates" maximized>
      <q-card style="max-width: 600px; margin: auto; border-radius: 16px">
        <q-card-section class="row items-center">
          <q-icon name="restaurant_menu" size="24px" color="primary" class="q-mr-sm" />
          <span style="font-size: 18px; font-weight: 700">Platillos sugeridos</span>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <p class="text-grey-6 text-caption q-mb-md">Selecciona los platillos que quieras agregar. Puedes editarlos despues.</p>

          <q-list>
            <q-item v-for="tpl in dishTemplates" :key="tpl.name" tag="label" v-ripple>
              <q-item-section side>
                <q-checkbox v-model="selectedTemplates" :val="tpl" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ tpl.name }}</q-item-label>
                <q-item-label caption>{{ tpl.description }} — ${{ tpl.price }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions class="q-px-lg q-pb-lg">
          <q-btn flat no-caps label="Cancelar" v-close-popup />
          <q-space />
          <q-btn
            unelevated no-caps color="primary"
            :label="`Agregar ${selectedTemplates.length} platillos`"
            icon="add"
            :disable="!selectedTemplates.length"
            :loading="addingTemplates"
            @click="addSelectedTemplates"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
defineOptions({ name: "DashboardComponent" });

import { ref, computed, onMounted } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";

const adminStore = useAdminStore();
const loading = ref(true);
const period = ref("today");
const showTemplates = ref(false);
const selectedTemplates = ref([]);
const addingTemplates = ref(false);
const customerSearch = ref("");
const showFlashOffer = ref(false);
const flashForm = ref({ dish_id: null, special_price: null, hours: 4 });
const flashLoading = ref(false);

const stats = ref({
  orders: { today: 0, week: 0, month: 0 },
  revenue: { today: 0, week: 0, month: 0 },
  avgTicket: { today: 0, week: 0, month: 0 },
  topProducts: [],
  chart: [],
  peakHours: [],
  reviews: null,
});

const formatNumber = (num) => Number(num || 0).toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const getBarHeight = (count) => {
  const max = Math.max(...(stats.value.chart || []).map((d) => d.count), 1);
  return Math.max((count / max) * 100, 4);
};

// --- COMPARATIVAS por periodo (hoy vs ayer / semana vs semana pasada / mes vs mes pasado) ---
const comparisonLabel = computed(
  () => ({ today: "vs ayer", week: "vs semana anterior", month: "vs mes anterior" })[period.value]
);
const ordersChange = computed(() => {
  const c = stats.value.comparison || {};
  return (period.value === "today" ? c.orders_change_today : period.value === "week" ? c.orders_change_week : c.orders_change) ?? null;
});
const revenueChange = computed(() => {
  const c = stats.value.comparison || {};
  return (period.value === "today" ? c.revenue_change_today : period.value === "week" ? c.revenue_change_week : c.revenue_change) ?? null;
});

// --- HORAS PICO (últimos 30 días) ---
const peakTotal = computed(() => (stats.value.peakHours || []).reduce((s, h) => s + h.count, 0));
const peakHour = computed(() => {
  const hrs = stats.value.peakHours || [];
  if (!hrs.length) return null;
  const top = hrs.reduce((a, b) => (b.count > a.count ? b : a), hrs[0]);
  return top.count > 0 ? top.hour : null;
});
const getHourHeight = (count) => {
  const max = Math.max(...(stats.value.peakHours || []).map((h) => h.count), 1);
  return Math.max((count / max) * 100, 3);
};
const formatHour = (h) => {
  const suffix = h < 12 ? "am" : "pm";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}${suffix}`;
};

// --- WIZARD ---
const wizardSteps = computed(() => {
  const c = adminStore.company || {};
  return [
    {
      key: "logo",
      title: "Sube tu logo",
      desc: "Tu logo aparecera en tu menu digital y QR",
      done: !!c.logo,
      btnLabel: "Subir",
      btnIcon: "image",
      action: () => adminStore.setEstablishmentDrawer(true),
    },
    {
      key: "hours",
      title: "Configura tu horario",
      desc: "Tus clientes sabran cuando estas abierto",
      done: c.hours?.length > 0,
      btnLabel: "Configurar",
      btnIcon: "schedule",
      action: () => adminStore.setScheduleDrawer(true),
    },
    {
      key: "categories",
      title: "Agrega una categoria",
      desc: "Organiza tu menu por tipo de platillo",
      done: adminStore.categories?.length > 0,
      btnLabel: "Agregar",
      btnIcon: "category",
      action: () => { adminStore.tab = "categorias"; adminStore.addCategory(); },
    },
    {
      key: "products",
      title: "Agrega tu primer platillo",
      desc: "Sube fotos, precios y descripcion",
      done: adminStore.products?.length > 0,
      btnLabel: "Agregar",
      btnIcon: "restaurant_menu",
      action: () => { adminStore.tab = "productos"; adminStore.addProduct(); },
    },
    {
      key: "address",
      title: "Agrega tu direccion",
      desc: "Para que tus clientes te encuentren",
      done: !!c.address,
      btnLabel: "Agregar",
      btnIcon: "location_on",
      action: () => adminStore.setAddressDrawer(true),
    },
  ];
});

const wizardProgress = computed(() => {
  const done = wizardSteps.value.filter((s) => s.done).length;
  return Math.round((done / wizardSteps.value.length) * 100);
});

const showWizard = computed(() => wizardProgress.value < 100);

// --- OPTIMIZATION CHECKLIST ---
const optimizations = computed(() => {
  const opts = [];
  const c = adminStore.company || {};
  const products = adminStore.products || [];

  const productsNoPhoto = products.filter((p) => !p.photo).length;
  if (productsNoPhoto > 0) {
    opts.push({
      key: "photos",
      icon: "photo_camera",
      color: "orange",
      title: `${productsNoPhoto} platillos sin foto`,
      desc: "Los platillos con foto se venden hasta 3x mas",
      btnLabel: "Ir a productos",
      action: () => { adminStore.tab = "productos"; },
    });
  }

  if (!products.some((p) => p.is_featured)) {
    opts.push({
      key: "featured",
      icon: "star",
      color: "amber-8",
      title: "Sin platillos destacados",
      desc: "Destaca tus mejores platillos para que aparezcan primero",
      btnLabel: "Ir a productos",
      action: () => { adminStore.tab = "productos"; },
    });
  }

  const hasCoupons = adminStore.company?.coupons_count > 0;
  if (!hasCoupons && products.length > 0) {
    opts.push({
      key: "coupons",
      icon: "confirmation_number",
      color: "purple",
      title: "Sin cupones activos",
      desc: "Crea un cupon de descuento para atraer nuevos clientes",
      btnLabel: "Crear cupon",
      action: () => { adminStore.tab = "cupones"; },
    });
  }

  if (!c.whatsapp) {
    opts.push({
      key: "whatsapp",
      icon: "fab fa-whatsapp",
      color: "green",
      title: "WhatsApp no configurado",
      desc: "Recibe pedidos directamente a tu WhatsApp",
      btnLabel: "Configurar",
      action: () => adminStore.setEstablishmentDrawer(true),
    });
  }

  return opts;
});

// --- TIPS ---
const allTips = [
  { title: "Comparte tu menu en redes sociales", desc: "Comparte el link de tu menu en Instagram, Facebook y WhatsApp para atraer mas clientes.", btnLabel: "Ver menu", action: () => window.open(`/${adminStore.slug}`, "_blank") },
  { title: "Imprime tu QR en tu local", desc: "Coloca tu codigo QR en mesas, mostrador y entrada para que tus clientes lo escaneen.", btnLabel: "Ver QR", action: () => adminStore.setProfileDrawer(true) },
  { title: "Responde las resenas de tus clientes", desc: "Los clientes valoran la atencion. Responder resenas aumenta la confianza.", btnLabel: "Ver resenas", action: () => { adminStore.tab = "resenas"; } },
  { title: "Actualiza tus precios regularmente", desc: "Mantener precios actualizados evita confusiones y mejora la experiencia.", btnLabel: null, action: null },
  { title: "Usa fotos reales de tus platillos", desc: "Las fotos reales generan mas confianza que imagenes genericas. Usa buena iluminacion.", btnLabel: null, action: null },
  { title: "Ofrece promociones en dias lentos", desc: "Si un dia tiene pocos pedidos, crea un cupon especial para ese dia.", btnLabel: "Crear cupon", action: () => { adminStore.tab = "cupones"; } },
];

const currentTip = computed(() => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return allTips[dayOfYear % allTips.length];
});

// --- DISH TEMPLATES ---
const restaurantTemplates = {
  pizza: [
    { name: "Hawaiana", description: "Jamon y pina con queso mozzarella", price: 129 },
    { name: "Pepperoni", description: "Pepperoni con extra queso", price: 129 },
    { name: "Mexicana", description: "Chorizo, jalapeno y tomate", price: 139 },
    { name: "Margarita", description: "Tomate fresco, albahaca y mozzarella", price: 119 },
  ],
  hamburguesas: [
    { name: "Clasica", description: "Carne de res, lechuga, tomate, cebolla y queso amarillo", price: 89 },
    { name: "BBQ Bacon", description: "Carne de res, tocino, queso cheddar y salsa BBQ", price: 109 },
    { name: "Doble Queso", description: "Doble carne, doble queso amarillo", price: 119 },
    { name: "Pollo Crispy", description: "Pechuga empanizada, mayonesa y lechuga", price: 99 },
  ],
  tacos: [
    { name: "Tacos al Pastor", description: "Con pina, cilantro y cebolla", price: 18 },
    { name: "Tacos de Bistec", description: "Bistec asado con guacamole", price: 22 },
    { name: "Tacos de Suadero", description: "Suadero con salsa verde", price: 18 },
    { name: "Quesadilla", description: "Tortilla de harina con queso fundido", price: 35 },
  ],
  sushi: [
    { name: "California Roll", description: "Surimi, aguacate y pepino", price: 89 },
    { name: "Philadelphia Roll", description: "Salmon, queso crema y aguacate", price: 109 },
    { name: "Tempura Roll", description: "Camaron empanizado con aguacate", price: 119 },
    { name: "Spicy Tuna", description: "Atun picante con chile serrano", price: 129 },
  ],
  general: [
    { name: "Entrada del dia", description: "Pregunta por nuestra entrada especial", price: 59 },
    { name: "Plato fuerte", description: "Platillo principal con guarnicion", price: 129 },
    { name: "Ensalada de la casa", description: "Mezcla de lechugas con aderezo", price: 69 },
    { name: "Postre del dia", description: "Pregunta por nuestro postre", price: 49 },
    { name: "Agua fresca", description: "Agua de fruta del dia (1L)", price: 35 },
    { name: "Refresco", description: "Coca-Cola, Sprite, Fanta", price: 25 },
  ],
};

const dishTemplates = computed(() => {
  const category = adminStore.company?.category?.name?.toLowerCase() || "";
  if (category.includes("pizza")) return restaurantTemplates.pizza;
  if (category.includes("hamburguesa") || category.includes("burger")) return restaurantTemplates.hamburguesas;
  if (category.includes("taco") || category.includes("mexican")) return restaurantTemplates.tacos;
  if (category.includes("sushi") || category.includes("japon")) return restaurantTemplates.sushi;
  return restaurantTemplates.general;
});

const addSelectedTemplates = async () => {
  if (!selectedTemplates.value.length) return;
  addingTemplates.value = true;

  const categoryId = adminStore.categories[0]?.id;
  if (!categoryId) {
    adminStore.messageStore.error("Agrega una categoria primero");
    addingTemplates.value = false;
    return;
  }

  let added = 0;
  for (const tpl of selectedTemplates.value) {
    try {
      const { data } = await api.post(`/admin/${adminStore.slug}/dish`, {
        name: tpl.name,
        description: tpl.description,
        price: tpl.price,
        dish_category: { id: categoryId },
        status: "Activo",
        photo: null,
      });
      if (data.product) {
        adminStore.products.push(data.product);
        added++;
      }
    } catch (e) {}
  }

  adminStore.messageStore.success(`${added} platillos agregados`);
  selectedTemplates.value = [];
  showTemplates.value = false;
  addingTemplates.value = false;
};

// --- SUGGESTION ACTIONS ---
const actionLabel = (action) => ({
  share: "Compartir menu",
  products: "Ir a productos",
  coupons: "Crear cupon",
  loyalty: "Ver lealtad",
  customers: "Ver clientes",
})[action] || "Ver";

const handleSuggestion = (action) => {
  if (action === "share") window.open(`/${adminStore.slug}`, "_blank");
  else if (action === "products") adminStore.tab = "productos";
  else if (action === "coupons") adminStore.tab = "cupones";
  else if (action === "loyalty") adminStore.tab = "lealtad";
  else if (action === "customers") {} // scroll to customers section
};

// --- CUSTOMER TOOLS ---
const timeAgo = (d) => {
  if (!d) return "";
  const days = Math.floor((Date.now() - new Date(d)) / 86400000);
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days}d`;
  if (days < 30) return `Hace ${Math.floor(days / 7)} sem`;
  return new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
};

const customerColumns = [
  { name: "customer_name", label: "Cliente", align: "left", field: "customer_name", sortable: true },
  { name: "phone", label: "Telefono", align: "left", field: "phone" },
  { name: "order_count", label: "Pedidos", align: "center", field: "order_count", sortable: true },
  { name: "total_spent", label: "Total gastado", align: "right", field: "total_spent", sortable: true },
  { name: "last_order", label: "Ultimo pedido", align: "center", field: "last_order_at", sortable: true },
  { name: "actions", label: "", align: "right" },
];

const sendWaToCustomer = (customer) => {
  const name = adminStore.company?.name || "nuestro restaurante";
  const phone = customer.phone.replace(/\D/g, "");
  const normalized = phone.length === 10 ? "52" + phone : phone;
  const msg = encodeURIComponent(
    `Hola ${customer.customer_name}! Gracias por ser cliente de ${name}. Tenemos promociones especiales para ti. Visita nuestro menu: https://comeleya.com/${adminStore.slug}`
  );
  window.open(`https://wa.me/${normalized}?text=${msg}`, "_blank");
};

const shareMenuWa = () => {
  const name = adminStore.company?.name || "mi restaurante";
  const msg = encodeURIComponent(`Mira el menu de ${name}: https://comeleya.com/${adminStore.slug}`);
  window.open(`https://wa.me/?text=${msg}`, "_blank");
};

// --- FLASH OFFER ---
const activateFlash = async () => {
  if (!flashForm.value.dish_id || !flashForm.value.special_price) {
    adminStore.messageStore.error("Completa todos los campos");
    return;
  }
  flashLoading.value = true;
  try {
    const { data } = await api.post(`/admin/${adminStore.slug}/flash-offer`, flashForm.value);
    adminStore.messageStore.success(data.message);
    // Update product in admin store
    const dish = adminStore.products.find((p) => p.id === flashForm.value.dish_id);
    if (dish) {
      dish.special_price = flashForm.value.special_price;
      dish.special_until = new Date(Date.now() + flashForm.value.hours * 3600000).toISOString();
    }
    showFlashOffer.value = false;
  } catch (e) {
    adminStore.messageStore.error(e.response?.data?.message || "Error al activar oferta");
  } finally {
    flashLoading.value = false;
  }
};

// --- LOAD ---
onMounted(async () => {
  try {
    const { data } = await api.get(`/admin/${adminStore.slug}/stats`);
    stats.value = data;
  } catch (e) {
    // Stats not available
  } finally {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
.mc-dashboard-loading { display: flex; justify-content: center; align-items: center; min-height: 300px; }

// Wizard
.mc-wizard-steps { display: flex; flex-direction: column; gap: 8px; }
.mc-wizard-step {
  display: flex; align-items: center; gap: 12px; padding: 12px 16px;
  border: 1px solid var(--color-border-subtle); border-radius: 10px;
  transition: all 0.2s;
  &:hover { background: var(--color-surface-variant); }
  &--done { opacity: 0.6; }
  &__content { flex: 1; }
  &__title { font-weight: 600; font-size: 14px; color: var(--color-text-primary); }
  &__desc { font-size: 12px; color: var(--color-text-secondary); }
  &__btn { flex-shrink: 0; }
}

// Optimization
.mc-optimization-row {
  display: flex; align-items: center; gap: 12px; padding: 10px 0;
  border-bottom: 1px solid var(--color-border-subtle);
  &:last-child { border-bottom: none; }
  &__text { flex: 1; display: flex; flex-direction: column; }
}

// Stats
.mc-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--space-md); padding: var(--space-lg); }
.mc-stat-card {
  display: flex; align-items: center; gap: var(--space-md); padding: var(--space-lg);
  background: var(--color-surface); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-lg);
  transition: box-shadow var(--transition-fast);
  &:hover { box-shadow: var(--shadow-md); }
  &__icon { width: 48px; height: 48px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    &--orders { background: color-mix(in srgb, var(--q-primary) 12%, transparent); color: var(--q-primary); }
    &--revenue { background: color-mix(in srgb, var(--q-positive) 12%, transparent); color: var(--q-positive); }
    &--avg { background: color-mix(in srgb, var(--q-info) 12%, transparent); color: var(--q-info); }
  }
  &__content { display: flex; flex-direction: column; }
  &__value { font-size: var(--text-2xl); font-weight: 700; color: var(--color-text-primary); font-variant-numeric: tabular-nums; line-height: 1.2; }
  &__label { font-size: var(--text-sm); color: var(--color-text-secondary); margin-top: 2px; }
}

// Chart
.mc-chart-section { padding: 0 var(--space-lg) var(--space-lg); }
.mc-chart-title { font-size: var(--text-base); font-weight: 600; color: var(--color-text-primary); margin: 0 0 var(--space-md) 0; }
.mc-chart { display: flex; align-items: flex-end; gap: var(--space-sm); height: 180px; padding: var(--space-md) 0; border-bottom: 1px solid var(--color-border-subtle); }
.mc-chart-bar-wrapper { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; gap: var(--space-xs); }
.mc-chart-bar { width: 100%; max-width: 48px; background: var(--q-primary); border-radius: var(--radius-sm) var(--radius-sm) 0 0; transition: height 0.5s ease; min-height: 4px; opacity: 0.85; &:hover { opacity: 1; } }
.mc-chart-bar__value { font-size: var(--text-xs); font-weight: 600; color: var(--color-text-primary); }
.mc-chart-bar__label { font-size: var(--text-xs); color: var(--color-text-tertiary); white-space: nowrap; text-transform: capitalize; }

// Peak hours
.mc-hours-chart { display: flex; align-items: flex-end; gap: 3px; height: 130px; padding: var(--space-md) 0 22px; }
.mc-hour-bar-wrapper { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; position: relative; }
.mc-hour-bar { width: 100%; max-width: 22px; background: var(--q-info); border-radius: 3px 3px 0 0; min-height: 3px; opacity: 0.55; transition: opacity var(--transition-fast); &:hover { opacity: 1; } }
.mc-hour-bar-wrapper--peak .mc-hour-bar { background: var(--q-primary); opacity: 1; }
.mc-hour-bar__label { position: absolute; bottom: -20px; font-size: 10px; color: var(--color-text-tertiary); white-space: nowrap; }
.mc-hours-hint { font-size: var(--text-xs); color: var(--color-text-secondary); margin: var(--space-sm) 0 0; display: flex; align-items: center; gap: 4px; }

// Top products
.mc-top-products { padding: 0 var(--space-lg) var(--space-lg); }
.mc-top-product {
  display: flex; align-items: center; gap: var(--space-md); padding: var(--space-sm) var(--space-md); border-radius: var(--radius-md);
  transition: background var(--transition-fast); &:hover { background: var(--color-surface-variant); }
  &__rank { width: 28px; height: 28px; border-radius: var(--radius-full); background: var(--color-surface-variant); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: var(--text-sm); color: var(--q-primary); flex-shrink: 0; }
  &__info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
  &__name { font-weight: 500; font-size: var(--text-sm); color: var(--color-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  &__qty { font-size: var(--text-xs); color: var(--color-text-tertiary); }
  &__revenue { font-weight: 700; font-size: var(--text-sm); color: var(--q-positive); font-variant-numeric: tabular-nums; flex-shrink: 0; }
}

// Suggestions
.mc-suggestion {
  display: flex; align-items: center; gap: 12px; padding: 10px 0;
  border-bottom: 1px solid var(--color-border-subtle);
  &:last-child { border-bottom: none; }
  &__text { flex: 1; display: flex; flex-direction: column; }
}

// Stat change
.mc-stat-card__change {
  font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 2px; margin-top: 2px;
  &--up { color: var(--q-positive); }
  &--down { color: var(--q-negative); }
}

// Tips
.mc-tips-section { padding: 0 var(--space-lg) var(--space-lg); }
.mc-tip-card { border-radius: 10px; border-left: 4px solid #FFB300; }

// Inner table
.mc-inner-table { box-shadow: none; background: transparent; }
.mc-admin-search .q-field__control { border-radius: 20px !important; }

@media screen and (max-width: 600px) {
  .mc-stats-grid { grid-template-columns: 1fr 1fr; padding: var(--space-md); }
  .mc-chart-section, .mc-top-products, .mc-tips-section { padding: 0 var(--space-md) var(--space-md); }
  .mc-wizard-step { flex-wrap: wrap; &__btn { width: 100%; margin-top: 4px; } }
}
</style>
