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
      ></div>

      <div class="mc-restaurant-info">
        <q-avatar
          :size="$q.screen.lt.md ? '64px' : '88px'"
          class="mc-restaurant-avatar"
        >
          <img :src="mainStore.company.logo" />
        </q-avatar>

        <div class="mc-restaurant-details">
          <h6 class="mc-restaurant-name">
            {{ mainStore.company.name }}
          </h6>

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
        v-for="(category, indexCategory) in mainStore.categories"
        :key="indexCategory"
        :name="category.id"
        :label="category.name"
        @click="goToCategory(category.id)"
      />
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
    <order-history />

    <!-- Reservation Dialog -->
    <reservation-dialog v-model="reservationDialog" />

    <!-- Cart Bar -->
    <div
      class="mc-cart-bar mc-mb-fix"
      :class="[
        $q.screen.width <= 1024 || mainStore.isExternal
          ? 'fixed-bottom'
          : 'absolute-bottom',
      ]"
      @click="mainStore.cartDrawer = true"
      v-if="mainStore.cart.length > 0"
    >
      <div class="row items-center justify-between full-width">
        <div class="mc-cart-bar-left">
          <q-icon name="shopping_cart" size="24px" />
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
  const section = document.getElementById(id);
  if (section) {
    const yOffset = $q.screen.width <= 1024 ? -230 : -60;
    const y = section.getBoundingClientRect().top + window.scrollY + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  }
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
  // Sangra el padding del contenedor (var(--space-md)) para llegar a los bordes
  margin: calc(-1 * var(--space-md)) calc(-1 * var(--space-md)) 0;
  height: 92px; // móvil: modesto para no comer pantalla (header fijo)
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  &--placeholder {
    background: linear-gradient(
      135deg,
      var(--q-primary) 0%,
      color-mix(in srgb, var(--q-primary) 65%, #000 35%) 100%
    );
  }

  @media screen and (min-width: 1024px) {
    height: 110px;
  }
}

.mc-restaurant-info {
  display: flex;
  align-items: flex-end;
  gap: var(--space-md);
  padding: 0 var(--space-md) var(--space-sm);
  margin-top: -36px; // superpone el logo sobre la portada

  @media screen and (min-width: 1024px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--space-sm);
  }
}

.mc-restaurant-avatar {
  border: 3px solid var(--color-surface);
  flex-shrink: 0;
  box-shadow: var(--shadow-md);
  background: var(--color-surface);
}

.mc-restaurant-name {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 700;
  margin: 0;
  line-height: 1.25;
  color: var(--color-text-primary);
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

.mc-cart-bar-left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
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

.mc-establishment-banner {
  background: var(--q-primary);
  color: white;
  padding: 8px 16px;
  text-align: center;
  font-size: 13px;
  font-weight: 500;
}

</style>
