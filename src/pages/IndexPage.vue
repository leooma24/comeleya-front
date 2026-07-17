<template>
  <q-page class="mc-page-bg">
    <div class="row">
      <div :class="['col-12', mainStore.isExternal ? '' : 'col-md-3']">
        <sidebar-component />
      </div>

      <div :class="['col-12', mainStore.isExternal ? '' : 'col-md-9']">
        <div
          :class="[
            'mc-content scroll',
            mainStore.isExternal ? 'mc-content-external' : '',
          ]"
        >
          <!-- Aviso: establecimiento cerrado -->
          <div
            v-if="mainStore.categories.length && !mainStore.company.isOpen"
            class="mc-closed-banner"
          >
            <q-icon name="schedule" size="22px" class="mc-closed-banner__icon" />
            <div class="mc-closed-banner__text">
              <strong>Cerrado por ahora</strong>
              <span>
                Puedes ver el menú, pero no se pueden hacer pedidos en este momento.
                <template v-if="mainStore.nextOpenText"> {{ mainStore.nextOpenText }}.</template>
              </span>
            </div>
          </div>

          <!-- Skeleton Loading -->
          <div
            v-if="!mainStore.categories.length"
            class="mc-content-products row"
          >
            <div
              v-for="n in 6"
              :key="'skeleton_' + n"
              :class="['q-pa-sm col-12', productColClass]"
            >
              <q-card flat class="mc-skeleton-card">
                <q-skeleton :ratio="4 / 3" square animation="wave" />
                <q-card-section>
                  <q-skeleton type="text" width="75%" animation="wave" />
                  <q-skeleton type="text" width="90%" class="q-mt-sm" animation="wave" />
                  <q-skeleton type="text" width="55%" class="q-mt-sm" animation="wave" />
                </q-card-section>
                <div class="mc-skeleton-card__footer">
                  <q-skeleton type="QBtn" width="28px" height="28px" animation="wave" />
                  <q-skeleton type="text" width="60px" animation="wave" />
                </div>
              </q-card>
            </div>
          </div>

          <!-- Search Results -->
          <div v-if="mainStore.isSearching" class="q-mb-xl">
            <div class="col-12">
              <div class="mc-category-heading">
                <q-icon name="search" size="20px" class="q-mr-xs" />
                {{ mainStore.searchResults.length }} resultado{{ mainStore.searchResults.length !== 1 ? 's' : '' }}
                para "{{ mainStore.search }}"
              </div>
            </div>
            <div class="mc-content-products row">
              <div
                :class="['q-pa-sm col-12', productColClass]"
                v-for="item in mainStore.searchResults"
                :key="'search_' + item.id"
              >
                <component
                  :is="mainStore.viewType === 'Tarjeta' ? CardDish : ListDish"
                  :item="item"
                />
              </div>
            </div>
            <div
              v-if="mainStore.searchResults.length === 0"
              class="mc-empty-search"
            >
              <q-icon name="search_off" size="48px" color="grey-4" />
              <p class="mc-empty-search__title">
                No encontramos "{{ mainStore.search }}"
              </p>
              <p class="mc-empty-search__hint">
                Revisa la ortografía o explora las categorías:
              </p>
              <div class="mc-empty-search__cats">
                <q-chip
                  v-for="cat in mainStore.categories"
                  :key="'sc_' + cat.id"
                  clickable
                  color="primary"
                  text-color="white"
                  :label="cat.name"
                  @click="goToCategoryFromSearch(cat.id)"
                />
              </div>
            </div>
          </div>

          <!-- Special Offers Section -->
          <div
            v-if="mainStore.specialOffers.length && !mainStore.isSearching"
            class="q-mb-xl mc-offers-section"
          >
            <div class="col-12">
              <div class="mc-offers-heading">
                <span class="mc-offers-heading__pill">
                  <q-icon name="local_offer" size="16px" class="q-mr-xs" />
                  Ofertas del día 🔥
                </span>
              </div>
            </div>
            <div class="mc-content-products row">
              <div
                :class="['q-pa-sm col-12', productColClass]"
                v-for="item in mainStore.specialOffers"
                :key="'offer_' + item.id"
              >
                <component
                  :is="mainStore.viewType === 'Tarjeta' ? CardDish : ListDish"
                  :item="item"
                />
              </div>
            </div>
          </div>

          <!-- Featured Section (carrusel horizontal) -->
          <div
            v-if="mainStore.featuredProducts.length && !mainStore.isSearching"
            class="q-mb-xl mc-featured-section"
          >
            <div class="col-12">
              <h2 class="mc-category-heading mc-featured-heading">
                <q-icon name="star" size="20px" color="amber-8" class="q-mr-xs" />
                Recomendados
              </h2>
            </div>
            <div class="mc-featured-carousel-wrap">
              <q-btn
                v-if="featuredPages > 1"
                round
                dense
                unelevated
                icon="chevron_left"
                class="mc-featured-arrow mc-featured-arrow--prev"
                aria-label="Anterior"
                @click="prevFeatured"
              />
              <div
                ref="featuredCarousel"
                class="mc-featured-carousel"
                @scroll="onFeaturedScroll"
                @pointerenter="pauseFeatured"
                @pointerleave="resumeFeatured"
              >
                <div
                  class="mc-featured-carousel__item"
                  v-for="item in mainStore.featuredProducts"
                  :key="'featured_' + item.id"
                >
                  <CardDish :item="item" />
                </div>
              </div>
              <q-btn
                v-if="featuredPages > 1"
                round
                dense
                unelevated
                icon="chevron_right"
                class="mc-featured-arrow mc-featured-arrow--next"
                aria-label="Siguiente"
                @click="nextFeatured"
              />
            </div>
            <div class="mc-featured-dots" v-if="featuredPages > 1">
              <button
                v-for="n in featuredPages"
                :key="'fdot_' + n"
                type="button"
                :class="[
                  'mc-featured-dot',
                  { 'mc-featured-dot--active': featuredPage === n - 1 },
                ]"
                :aria-label="'Ir al grupo ' + n"
                @click="scrollFeaturedTo(n - 1)"
              />
            </div>
          </div>

          <!-- Category Sections -->
          <div
            v-show="!mainStore.isSearching"
            class="q-mb-xl mc-category-section"
            v-for="record in mainStore.categories"
            :key="record.id"
            :id="record.id"
          >
            <div
              class="col-12"
              v-if="mainStore.countByCategory(record.id)"
              :data-id="record.id"
              v-intersection="onIntersection"
            >
              <h2 class="mc-category-heading">
                {{ record.name }}
              </h2>
            </div>
            <div class="mc-content-products row">
              <div
                :class="['q-pa-sm col-12', productColClass]"
                v-for="item in mainStore.getProductsByCategoryId(record.id)"
                :key="'product_' + item.id"
              >
                <component
                  :is="mainStore.viewType === 'Tarjeta' ? CardDish : ListDish"
                  :item="item"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
defineOptions({
  name: "IndexPage",
});

import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { useMeta } from "quasar";
import SidebarComponent from "src/components/client/Sidebar.vue";
import CardDish from "src/components/client/CardDish.vue";
import ListDish from "src/components/client/ListDish.vue";
import { useRoute } from "vue-router";
import { useMainStore } from "src/stores/main-store";

const mainStore = useMainStore();
const route = useRoute();

// Clases de columna para la cuadrícula de productos (una sola fuente de verdad).
// Vista Tarjeta: máx 4 por fila en pantallas anchas (antes eran 6, muy chicas).
const productColClass = computed(() => {
  if (mainStore.viewType === "Tarjeta") {
    return mainStore.isExternal
      ? "col-sm-6 col-md-4"
      : "col-sm-6 col-lg-4 col-xl-3";
  }
  return mainStore.isExternal ? "col-md-6" : "col-md-6 col-xl-3";
});

// Desde el estado vacío de búsqueda: limpia el término y salta a la categoría
const goToCategoryFromSearch = (id) => {
  mainStore.search = "";
  nextTick(() => {
    const el = document.getElementById(String(id));
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  });
};

// Dynamic SEO meta tags
const metaData = computed(() => {
  const company = mainStore.establishment;
  const seo = company?.seo || {};
  const name = company?.name || "Menú Digital";
  const description = seo.meta_description || `Ordena en línea en ${name}. Menú digital, pedidos rápidos y entrega a domicilio.`;
  const title = seo.meta_title || `${name} - Menú Digital`;
  const ogImage = seo.og_image || company?.logo || "";
  const url = window.location.href;

  return {
    title,
    meta: {
      description: { name: "description", content: description },
      keywords: { name: "keywords", content: seo.meta_keywords || `${name}, menú, delivery, pedidos, comida` },
      ogTitle: { property: "og:title", content: seo.og_title || title },
      ogDescription: { property: "og:description", content: seo.og_description || description },
      ogImage: { property: "og:image", content: ogImage },
      ogUrl: { property: "og:url", content: url },
      ogType: { property: "og:type", content: "restaurant" },
      twitterCard: { name: "twitter:card", content: "summary_large_image" },
      twitterTitle: { name: "twitter:title", content: seo.og_title || title },
      twitterDescription: { name: "twitter:description", content: seo.og_description || description },
      twitterImage: { name: "twitter:image", content: ogImage },
    },
    script: seo.schema_org ? {
      ldJson: {
        type: "application/ld+json",
        innerHTML: JSON.stringify(seo.schema_org),
      },
    } : {},
  };
});
useMeta(metaData);

const onIntersection = (entry) => {
  if (entry.isIntersecting === true) {
    mainStore.tab = parseInt(entry.target.dataset.id);
  }
};

// --- Carrusel de Recomendados: auto-avanza y brinca por página (tarjetas visibles) ---
const featuredCarousel = ref(null);
const featuredPage = ref(0);
const featuredPages = ref(1);
let featuredTimer = null;
let featuredPaused = false;

const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Recalcula cuántas páginas hay (ancho total / ancho visible) y la página actual
const measureFeatured = () => {
  const el = featuredCarousel.value;
  if (!el) return;
  featuredPages.value = Math.max(1, Math.round(el.scrollWidth / el.clientWidth));
  featuredPage.value = Math.round(el.scrollLeft / el.clientWidth);
};

const onFeaturedScroll = () => {
  const el = featuredCarousel.value;
  if (el) featuredPage.value = Math.round(el.scrollLeft / el.clientWidth);
};

// Salta a una página (brinca exactamente el ancho visible), con loop
const scrollFeaturedTo = (page) => {
  const el = featuredCarousel.value;
  if (!el) return;
  const pages = featuredPages.value;
  const target = ((page % pages) + pages) % pages;
  el.scrollTo({ left: target * el.clientWidth, behavior: "smooth" });
};

const nextFeatured = () => {
  const el = featuredCarousel.value;
  if (!el) return;
  const current = Math.round(el.scrollLeft / el.clientWidth);
  const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
  scrollFeaturedTo(atEnd ? 0 : current + 1);
};

const prevFeatured = () => {
  const el = featuredCarousel.value;
  if (!el) return;
  scrollFeaturedTo(Math.round(el.scrollLeft / el.clientWidth) - 1);
};

const pauseFeatured = () => { featuredPaused = true; };
const resumeFeatured = () => { featuredPaused = false; };

const stopFeaturedAutoplay = () => {
  if (featuredTimer) { clearInterval(featuredTimer); featuredTimer = null; }
};

const startFeaturedAutoplay = () => {
  stopFeaturedAutoplay();
  if (prefersReducedMotion()) return;
  featuredTimer = setInterval(() => {
    if (!featuredPaused && featuredPages.value > 1) nextFeatured();
  }, 4500);
};

watch(
  () => mainStore.featuredProducts.length,
  (len) => {
    if (len) nextTick(() => { measureFeatured(); startFeaturedAutoplay(); });
    else stopFeaturedAutoplay();
  }
);

onMounted(async () => {
  window.addEventListener("resize", measureFeatured);
  await mainStore.getEstablishment(route.params.slug);
  // Los destacados pueden venir ya cargados (store persistido), así que el watch
  // no siempre dispara: inicializamos el carrusel aquí también.
  if (mainStore.featuredProducts.length) {
    nextTick(() => { measureFeatured(); startFeaturedAutoplay(); });
  }
});

onBeforeUnmount(() => {
  stopFeaturedAutoplay();
  window.removeEventListener("resize", measureFeatured);
});
</script>

<style lang="scss" scoped>
.mc-page-bg {
  background:
    radial-gradient(1200px 400px at 100% 0%, rgba(229, 57, 53, 0.04), transparent 60%),
    radial-gradient(900px 300px at 0% 0%, rgba(255, 109, 0, 0.03), transparent 55%),
    var(--color-surface-variant);
  min-height: 100vh;
}

.mc-closed-banner {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin: var(--space-md) var(--space-md) 0;
  padding: var(--space-md);
  background: var(--color-warning-bg, #FFF3E0);
  border: 1px solid #FFB74D;
  border-radius: var(--radius-md);
  color: #E65100;

  &__icon {
    flex-shrink: 0;
  }

  &__text {
    display: flex;
    flex-direction: column;
    line-height: 1.35;

    strong {
      font-size: var(--text-base);
    }

    span {
      font-size: var(--text-sm);
      color: color-mix(in srgb, #E65100 85%, #000 15%);
    }
  }
}

.mc-offers-section {
  background: linear-gradient(135deg, rgba(244, 67, 54, 0.08) 0%, rgba(255, 87, 34, 0.05) 100%);
  border-radius: var(--radius-lg);
  padding: var(--space-sm);
  margin-left: var(--space-sm);
  margin-right: var(--space-sm);
  border: 1px solid rgba(244, 67, 54, 0.18);
  border-left: 4px solid var(--q-primary);
  box-shadow: 0 4px 16px rgba(244, 67, 54, 0.08);
}

.mc-offers-heading {
  display: flex;
  align-items: center;
  padding: var(--space-sm) var(--space-sm) 0;
  margin-bottom: var(--space-xs);

  &__pill {
    display: inline-flex;
    align-items: center;
    background: var(--q-primary);
    color: #fff;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: var(--text-sm);
    letter-spacing: 0.02em;
    padding: 6px 14px;
    border-radius: var(--radius-full);
    box-shadow: 0 2px 8px rgba(229, 57, 53, 0.3);
  }
}

// Deja aire al saltar a una categoría (search o tabs) para que el header/tabs fijos no la tapen
.mc-category-section {
  scroll-margin-top: 80px;

  @media screen and (max-width: 1023px) {
    scroll-margin-top: var(--mc-sidebar-total-height, 230px);
  }
}

.mc-featured-section {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.06) 0%, rgba(255, 152, 0, 0.04) 100%);
  border-radius: var(--radius-lg);
  padding: var(--space-sm);
  margin-left: var(--space-sm);
  margin-right: var(--space-sm);
  border: 1px solid rgba(255, 193, 7, 0.15);
}

.mc-featured-heading {
  display: flex;
  align-items: center;
}

.mc-featured-carousel-wrap {
  position: relative;
}

.mc-featured-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  background: var(--color-surface);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-md);

  &--prev {
    left: 4px;
  }
  &--next {
    right: 4px;
  }

  // En móvil el swipe es más natural; las flechas estorban
  @media (max-width: 599px) {
    display: none;
  }
}

.mc-featured-carousel {
  display: flex;
  gap: var(--space-sm);
  overflow-x: auto;
  padding: var(--space-sm) var(--space-md) var(--space-md);
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;

  // Sin barra de scroll: se navega con flechas/puntitos (look de slider)
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }

  &__item {
    flex: 0 0 auto;
    width: 220px;
    scroll-snap-align: start;

    @media (max-width: 599px) {
      width: 70vw;
      max-width: 260px;
    }
  }
}

.mc-featured-dots {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  padding-bottom: var(--space-sm);
}

.mc-featured-dot {
  width: 7px;
  height: 7px;
  padding: 0;
  border: none;
  border-radius: var(--radius-full);
  background: var(--color-border);
  cursor: pointer;
  transition: all var(--transition-fast);

  &--active {
    width: 20px;
    background: var(--q-primary);
  }
}

.mc-empty-search {
  text-align: center;
  padding: var(--space-xl) var(--space-md);
  color: var(--color-text-tertiary);

  &__title {
    margin-top: var(--space-sm);
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  &__hint {
    margin-top: var(--space-xs);
    font-size: var(--text-sm);
  }

  &__cats {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-xs);
    margin-top: var(--space-md);
  }
}
</style>
