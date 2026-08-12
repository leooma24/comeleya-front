<template>
  <div
    :class="[
      'mc-sidebar',
      mainStore.isExternal ? 'mc-sidebar-external' : '',
    ]"
    style="background: var(--color-surface-variant)"
  >
    <div ref="establishmentRef" class="mc-sidebar-establishment" v-if="!mainStore.isExternal">
      <!-- Portada / hero -->
      <div
        class="mc-restaurant-cover"
        :class="{ 'mc-restaurant-cover--placeholder': !mainStore.company.banner }"
        :style="mainStore.company.banner ? { backgroundImage: `url(${mainStore.company.banner})` } : null"
      >
        <div class="mc-restaurant-cover__scrim"></div>
        <div class="mc-restaurant-cover__identity">
          <q-avatar
            :size="$q.screen.lt.md ? '54px' : '62px'"
            class="mc-restaurant-avatar"
          >
            <img :src="mainStore.company.logo" />
          </q-avatar>
          <h1 class="mc-restaurant-cover__name">{{ mainStore.company.name }}</h1>
        </div>
      </div>

      <div class="mc-restaurant-info">
        <div class="mc-restaurant-details">
          <div class="mc-restaurant-meta">
            <q-chip
              :color="mainStore.company.isOpen ? 'positive' : 'negative'"
              text-color="white"
              size="sm"
              dense
              :icon="mainStore.company.isOpen ? 'check_circle' : 'cancel'"
              :label="mainStore.company.isOpen ? 'Abierto' : 'Cerrado'"
            />

            <q-btn
              dense
              flat
              round
              icon="schedule"
              size="sm"
              color="grey-7"
              class="mc-hours-btn"
              @click="dialog = true"
            >
              <q-tooltip>Horario</q-tooltip>
            </q-btn>

            <q-btn
              dense
              flat
              round
              icon="share"
              size="sm"
              color="grey-7"
              class="mc-hours-btn"
              @click="shareMenu"
            >
              <q-tooltip>Compartir menú</q-tooltip>
            </q-btn>

            <q-separator vertical inset class="q-mx-xs" v-if="reviewData.total > 0" />

            <!-- Rating inline -->
            <div
              v-if="reviewData.total > 0"
              class="mc-rating-badge cursor-pointer"
              @click="reviewsDrawer = true"
            >
              <q-icon name="star" size="14px" color="amber-8" />
              <span class="mc-rating-badge__score">{{ reviewData.avg.toFixed(1) }}</span>
              <span class="mc-rating-badge__count">({{ reviewData.total }})</span>
              <q-tooltip>Ver reseñas</q-tooltip>
            </div>
            <q-btn
              v-else
              dense
              flat
              round
              icon="rate_review"
              size="sm"
              color="grey-7"
              class="mc-hours-btn"
              @click="reviewsDrawer = true"
            >
              <q-tooltip>Reseñas</q-tooltip>
            </q-btn>
          </div>
          <div
            v-if="mainStore.businessAddress && !mainStore.businessAddress.includes('undefined')"
            class="mc-address"
            @click="openMap"
          >
            <q-icon name="location_on" size="14px" />
            <span>{{ mainStore.businessAddress }}</span>
          </div>
          <div
            v-if="!mainStore.company.isOpen && mainStore.nextOpenText"
            class="mc-next-open"
          >
            <q-icon name="access_time" size="14px" class="q-mr-xs" />
            {{ mainStore.nextOpenText }}
          </div>
        </div>
      </div>
    </div>

    <!-- Establishment Banner -->
    <div
      v-if="mainStore.company.theme_config?.show_banner && mainStore.company.theme_config?.banner_text"
      class="mc-establishment-banner"
    >
      {{ mainStore.company.theme_config.banner_text }}
    </div>

    <q-tabs
      v-model="mainStore.tab"
      mobile-arrows
      :vertical="$q.screen.width >= 1024 && !mainStore.isExternal"
      class="mc-sidebar-tabs"
      style="background: var(--color-surface)"
    >
      <q-tab
        v-for="category in visibleCategories"
        :key="category.id"
        :name="category.id"
        @click="goToCategory(category.id)"
      >
        <div class="mc-tab-inner">
          <span class="mc-tab-name">{{ category.name }}</span>
          <span
            v-if="$q.screen.width >= 1024 && categoryCount(category.id)"
            class="mc-tab-count"
          >{{ categoryCount(category.id) }}</span>
        </div>
      </q-tab>
    </q-tabs>

    <!-- Loyalty Banner -->
    <loyalty-banner />

    <!-- Reservation Button -->
    <div class="mc-reservation-btn-wrapper" v-if="hasReservations">
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="event_seat"
        label="Reservar mesa"
        class="full-width mc-reservation-btn"
        @click="reservationDialog = true"
      />
    </div>

    <!-- Order History -->
    <div class="mc-history-btn-wrapper" v-if="mainStore.orderHistory.length">
      <button
        type="button"
        class="mc-history-btn"
        @click="orderHistoryDrawer = true"
      >
        <q-icon name="history" size="18px" class="q-mr-xs" />
        <span class="mc-history-btn__label">Pedidos anteriores</span>
        <q-badge
          color="primary"
          rounded
          class="mc-history-btn__count"
          :label="mainStore.orderHistory.length"
        />
        <q-icon name="chevron_right" size="18px" class="mc-history-btn__chevron" />
      </button>
    </div>
    <order-history v-model="orderHistoryDrawer" />

    <!-- Reservation Dialog -->
    <reservation-dialog v-model="reservationDialog" />

    <!-- Espacio para que la barra del carrito no tape las categorías (solo escritorio docked) -->
    <div v-if="mainStore.cart.length > 0 && !mainStore.externalCartBar && !mainStore.isExternal" class="mc-cart-bar-spacer"></div>

    <!-- Cart Bar -->
    <div
      class="mc-cart-bar mc-mb-fix mc-sidebar-cart-bar"
      :class="{ 'mc-sidebar-cart-bar--external': mainStore.isExternal }"
      @click="mainStore.cartDrawer = true"
      v-if="mainStore.cart.length > 0 && !mainStore.externalCartBar && mainStore.orderingEnabled"
    >
      <div class="row items-center justify-between full-width">
        <div class="mc-cart-bar-left" :key="cartUnits">
          <img
            v-if="mainStore.establishment?.theme_config?.cart_image"
            :src="mainStore.establishment.theme_config.cart_image"
            class="mc-cart-bar-img"
            alt=""
          />
          <q-icon v-else name="shopping_cart" size="24px" />
          <q-badge color="white" text-color="primary" rounded>
            {{ cartUnits }}
          </q-badge>
        </div>

        <div class="column items-center">
          <span
            class="mc-total-price"
            :key="mainStore.total"
          >${{ Number(mainStore.total).toFixed(2) }}</span>
        </div>

        <div class="mc-cart-bar-right">
          <span class="mc-cart-bar-label">Ver pedido</span>
          <q-icon name="arrow_forward" size="20px" />
        </div>
      </div>
    </div>

    <!-- Review Dialog -->
    <review-dialog v-model="reviewDialog" @submitted="refreshReviews" />
    <reviews-drawer v-model="reviewsDrawer" @add="reviewDialog = true" />

    <!-- Hours Dialog -->
    <q-dialog v-model="dialog" backdrop-filter="blur(8px)">
      <q-card class="mc-hours-dialog">
        <q-card-section class="mc-hours-header">
          <q-icon name="schedule" size="24px" color="primary" />
          <span>Horario de Atención</span>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div
            v-for="(item, index) in mainStore.getHours"
            :key="index"
            :class="[
              'mc-hour-row',
              item.is_closed ? 'mc-hour-row--closed' : ''
            ]"
          >
            <span class="mc-hour-day">{{ item.day_of_week }}</span>
            <span class="mc-hour-time" v-if="!item.is_closed">
              {{ item.open_time.substring(0, 5) }} - {{ item.close_time.substring(0, 5) }}
            </span>
            <q-badge v-else color="negative" text-color="white" rounded label="Cerrado" />
          </div>
        </q-card-section>

        <q-card-actions class="q-px-lg q-pb-lg">
          <q-btn
            flat
            no-caps
            label="Cerrar"
            color="grey-8"
            class="full-width"
            style="border-radius: var(--radius-sm)"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
defineOptions({
  name: "SidebarComponent",
});
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { api } from "boot/axios";
import { useMainStore } from "src/stores/main-store";
import { useQuasar } from "quasar";
import OrderHistory from "./OrderHistory.vue";
import ReviewDialog from "./ReviewDialog.vue";
import ReviewsDrawer from "./ReviewsDrawer.vue";
import ReservationDialog from "./ReservationDialog.vue";
import LoyaltyBanner from "./LoyaltyBanner.vue";

const $q = useQuasar();
const mainStore = useMainStore();
const dialog = ref(false);
const establishmentRef = ref(null);

const updateSidebarHeight = () => {
  nextTick(() => {
    if (!establishmentRef.value || $q.screen.width >= 1024) return;
    const h = establishmentRef.value.offsetHeight;
    document.documentElement.style.setProperty('--mc-establishment-height', (56 + h) + 'px');
    document.documentElement.style.setProperty('--mc-sidebar-total-height', (h + 50) + 'px');
  });
};
const reviewDialog = ref(false);
const reviewsDrawer = ref(false);
const reservationDialog = ref(false);
const orderHistoryDrawer = ref(false);
const reviewData = ref({ avg: 0, total: 0 });

const refreshReviews = async () => {
  try {
    const { data } = await api.get(`/establishment/${mainStore.companyStore.slug}/reviews`);
    reviewData.value = { avg: data.avg_rating || 0, total: data.total_reviews || 0 };
  } catch {
    // silently fail
  }
};

const hasReservations = computed(() => {
  const features = mainStore.company?.features ?? [];
  return features.some((f) => (f.name === "reservations" || f.slug === "reservations") && f.value === "1");
});

// Unidades totales en el carrito (suma de cantidades)
const cartUnits = computed(() =>
  mainStore.cart.reduce((acc, item) => acc + (item.qty || 0), 0)
);

// Productos por categoría (para el contador en los tabs del sidebar)
const categoryCount = (id) =>
  mainStore.productStore.items.filter((p) => p.dish_category_id === id).length;

// Solo categorías con productos (evita tabs que no llevan a nada)
const visibleCategories = computed(() =>
  mainStore.categories.filter((c) => categoryCount(c.id) > 0)
);

watch(() => mainStore.company?.name, () => {
  setTimeout(updateSidebarHeight, 100);
});

onMounted(async () => {
  setTimeout(updateSidebarHeight, 200);
  window.addEventListener('resize', updateSidebarHeight);
  await refreshReviews();
});


function shareMenu() {
  const url = window.location.href;
  const text = `Mira el menú de ${mainStore.company.name}`;

  if (navigator.share) {
    navigator.share({ title: mainStore.company.name, text, url });
  } else {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
    window.open(waUrl, "_blank");
  }
}

function openMap() {
  const addr = mainStore.businessAddress;
  if (mainStore.bussinessMap) {
    window.open(`https://maps.google.com/?q=${mainStore.bussinessMap}`, "_blank");
  } else {
    window.open(`https://maps.google.com/?q=${encodeURIComponent(addr)}`, "_blank");
  }
}

function goToCategory(id) {
  // Misma acción que usa el deep-link ?cat= del iframe: fija el tab, bloquea el
  // scroll-spy mientras dura el movimiento y mide los tabs en vivo.
  mainStore.goToCategory(id, $q.screen.width <= 1023);
  centerActiveTab();
}

// Centra el tab activo en la barra horizontal (móvil). El primero/último quedan
// pegados a su orilla porque el scroll no puede pasar de 0 ni del máximo.
function centerActiveTab() {
  // Espera a que Quasar aplique la clase activa y haga su propio ajuste.
  setTimeout(() => {
    const content = document.querySelector(".mc-sidebar-tabs .q-tabs__content");
    const active = document.querySelector(".mc-sidebar-tabs .q-tab--active");
    if (!content || !active) return;
    const cRect = content.getBoundingClientRect();
    const aRect = active.getBoundingClientRect();
    const delta = aRect.left + aRect.width / 2 - (cRect.left + cRect.width / 2);
    if (Math.abs(delta) > 2) {
      content.scrollBy({ left: delta, behavior: "smooth" });
    }
  }, 60);
}
</script>

<style lang="scss" scoped>
@keyframes mcTotalPulse {
  0% { transform: scale(1); }
  40% { transform: scale(1.14); }
  100% { transform: scale(1); }
}

.mc-total-price {
  display: inline-block;
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 800;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  animation: mcTotalPulse 0.35s ease;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

.mc-restaurant-cover {
  position: relative;
  // Sangra el padding del contenedor (var(--space-md)) para llegar a los bordes
  margin: calc(-1 * var(--space-md)) calc(-1 * var(--space-md)) 0;
  height: 132px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;

  &--placeholder {
    // Sin banner: el cover se ajusta al logo+nombre (no reservar altura vacía)
    height: auto;
    background: linear-gradient(
      135deg,
      var(--q-primary) 0%,
      color-mix(in srgb, var(--q-primary) 60%, #000 40%) 100%
    );

    .mc-restaurant-cover__scrim {
      display: none;
    }

    .mc-restaurant-cover__identity {
      position: static;
    }
  }

  &__scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.05) 0%,
      rgba(0, 0, 0, 0.15) 45%,
      rgba(0, 0, 0, 0.62) 100%
    );
  }

  &__identity {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-md);
  }

  &__name {
    font-family: var(--font-display);
    font-size: 1.35rem;
    font-weight: 800;
    line-height: 1.15;
    color: #fff;
    margin: 0;
    letter-spacing: -0.01em;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.mc-restaurant-avatar {
  border: 3px solid #fff;
  flex-shrink: 0;
  box-shadow: var(--shadow-md);
  background: #fff;
}

.mc-restaurant-info {
  padding: var(--space-sm) var(--space-md);

  @media screen and (min-width: 1024px) {
    text-align: center;
  }
}

.mc-restaurant-details {
  width: 100%;
}

.mc-restaurant-details {
  flex: 1;
}

.mc-restaurant-meta {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-top: var(--space-xs);

  @media screen and (min-width: 1024px) {
    justify-content: center;
  }
}

.mc-hours-btn {
  transition: var(--transition-fast);

  &:hover {
    background: var(--color-surface-variant);
  }
}

@keyframes mcCartBounce {
  0% { transform: scale(1); }
  35% { transform: scale(1.25); }
  60% { transform: scale(0.92); }
  100% { transform: scale(1); }
}

.mc-cart-bar-spacer {
  height: 84px;
  flex: none;
}

// La barra va por encima del contenido y de los marginales de Quasar (header/footer,
// z 2000), pero SIEMPRE por debajo de los drawers (z 3000) y de su backdrop (z 2999).
// Si empata en 3000 con el drawer, gana la barra por orden del DOM (el q-page-container
// se pinta después de <add-cart-drawer/>) y se come el click del botón "Agregar".
// En móvil web esto no se notaba porque .mc-sidebar (position:relative; z-index:2) crea
// un contexto de apilamiento que encierra a la barra; en embebido .mc-sidebar-external
// es position:static, así que el z-index sube hasta la raíz y sí compite con el drawer.
$mc-cart-bar-z: 2500;

// Posición de la barra del carrito del sidebar por CSS (no por JS), para que sea
// correcta desde el primer render (antes fallaba en móvil al recargar con carrito).
// Escritorio: anclada al fondo de la columna del sidebar.
.mc-sidebar-cart-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
}

// Móvil/tablet: SIEMPRE pegada (sticky) al fondo del viewport.
@media (max-width: 1024px) {
  .mc-sidebar-cart-bar {
    position: fixed;
    z-index: $mc-cart-bar-z;
    margin-bottom: 0;
  }
  .mc-cart-bar-spacer {
    display: none; // en móvil la barra es fixed y no ocupa flujo
  }
}

// Modo embebido (iframe): también fija aunque el ancho sea grande.
.mc-sidebar-cart-bar--external {
  position: fixed;
  z-index: $mc-cart-bar-z;
}

.mc-cart-bar-left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  animation: mcCartBounce 0.4s ease;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

.mc-cart-bar-right {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.mc-cart-bar-label {
  font-weight: 600;
  font-size: var(--text-base);
}

.mc-hours-dialog {
  border-radius: var(--radius-xl);
  min-width: 320px;
  max-width: 400px;

  @media screen and (max-width: 400px) {
    min-width: 280px;
    max-width: calc(100vw - 32px);
  }
}

.mc-hours-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 700;
}

.mc-hour-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--color-border-subtle);
  transition: background var(--transition-fast);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--color-surface-variant);
    border-radius: var(--radius-sm);
  }

  &--closed {
    opacity: 0.5;
  }
}

.mc-hour-day {
  text-transform: capitalize;
  font-weight: 500;
  font-size: var(--text-base);
}

.mc-hour-time {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.mc-address {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  margin-top: var(--space-xs);
  cursor: pointer;
  line-height: 1.4;

  &:hover {
    color: var(--q-primary);
  }

  @media screen and (min-width: 1024px) {
    justify-content: center;
    text-align: center;
  }
}

.mc-next-open {
  display: flex;
  align-items: center;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  margin-top: var(--space-xs);

  @media screen and (min-width: 1024px) {
    justify-content: center;
  }
}

.mc-history-btn-wrapper {
  padding: 0 var(--space-sm);
  margin-bottom: var(--space-xs);
}

.mc-history-btn {
  display: flex;
  align-items: center;
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast);

  &:hover {
    background: var(--color-surface-variant);
  }

  &__label {
    text-align: left;
  }

  &__count {
    margin-left: var(--space-xs);
  }

  &__chevron {
    margin-left: auto;
    color: var(--color-text-tertiary);
  }
}

.mc-reservation-btn-wrapper {
  padding: 0 var(--space-sm);
  margin-bottom: var(--space-xs);
}

.mc-reservation-btn {
  border-radius: var(--radius-md);
  font-weight: 600;
}

.mc-rating-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  transition: background var(--transition-fast);

  &:hover {
    background: color-mix(in srgb, #ffb300 15%, transparent);
  }

  &__score {
    font-weight: 700;
    font-size: var(--text-xs);
    color: var(--color-text-primary);
  }

  &__count {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }
}

.mc-tab-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  width: 100%;
}

.mc-tab-count {
  font-size: var(--text-xs);
  font-weight: 700;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-variant);
  color: var(--color-text-secondary);
}

// En el tab activo (fondo primary), el contador se adapta
.q-tab--active .mc-tab-count {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
}

.mc-establishment-banner {
  background: var(--q-primary);
  color: white;
  padding: 8px 16px;
  text-align: center;
  font-size: 13px;
  font-weight: 500;
}

</style>
