<template>
  <q-page class="mc-page-bg">
    <div class="row">
      <div :class="['col-12', mainStore.isExternal ? '' : 'col-md-3']">
        <sidebar-component />
      </div>

      <div :class="['col-12', mainStore.isExternal ? '' : 'col-md-9']">
        <div
          :class="[
            'mc-content',
            mainStore.isExternal ? 'mc-content-external' : '',
          ]"
        >
          <!-- Selector de vista, SOLO embebido.
               Fuera del iframe vive en la barra de arriba (MainLayout); embebido esa
               barra se esconde entera —el logo de ComeleYa no pinta nada dentro de la
               página de un cliente— y el comensal quedaba atrapado en la vista que
               tuviera guardada.
               Va aquí, con el contenido y sin fijar, y no junto a las categorías: esa
               tira es `position: fixed` dentro del iframe, así que todo lo que se le
               acerca termina encimado. Aquí se desplaza con la página y no tapa nada.
               Es además donde vive este control en cualquier tienda. -->
          <div
            v-if="mainStore.isExternal && mainStore.categories.length"
            class="mc-view-toggle-inline"
          >
            <q-btn
              flat
              dense
              round
              size="sm"
              :color="mainStore.viewType === 'Tarjeta' ? 'primary' : 'grey-6'"
              icon="grid_view"
              aria-label="Vista cuadrícula"
              @click="mainStore.setViewType('Tarjeta')"
            >
              <q-tooltip>Vista cuadrícula</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              round
              size="sm"
              :color="mainStore.viewType === 'Lista' ? 'primary' : 'grey-6'"
              icon="view_list"
              aria-label="Vista lista"
              @click="mainStore.setViewType('Lista')"
            >
              <q-tooltip>Vista lista</q-tooltip>
            </q-btn>
          </div>

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

          <!-- Estado de error de carga (con reintento) -->
          <div
            v-if="mainStore.loadError && !mainStore.categories.length"
            class="mc-load-error"
          >
            <!-- El ícono ya no es siempre el de "sin wifi": decirle "no hay internet"
                 a alguien cuyo internet funciona fue justo lo que escondió el bug de
                 la zona horaria durante quién sabe cuánto tiempo. -->
            <q-icon
              :name="mainStore.loadErrorInfo?.nuestra ? 'error_outline' : 'wifi_off'"
              size="52px"
              color="grey-5"
            />
            <p class="mc-load-error__title">No pudimos cargar el menú</p>
            <p class="mc-load-error__desc">
              {{ mainStore.loadErrorInfo?.mensaje || "Revisa tu conexión e inténtalo de nuevo." }}
            </p>
            <q-btn
              unelevated
              no-caps
              color="primary"
              icon="refresh"
              label="Reintentar"
              :loading="retrying"
              @click="retryLoad"
            />
            <!-- Chiquito y al final: al comensal no le dice nada, pero es lo que
                 convierte un screenshot de WhatsApp en un diagnóstico. -->
            <p v-if="mainStore.loadErrorInfo?.codigo" class="mc-load-error__code">
              {{ mainStore.loadErrorInfo.codigo }}
            </p>
          </div>

          <!-- Skeleton Loading -->
          <div
            v-else-if="!mainStore.categories.length"
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
            <h2
              class="mc-category-heading"
              v-if="mainStore.countByCategory(record.id)"
              :data-id="record.id"
            >
              {{ record.name }}
            </h2>
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

          <!-- Al final del menu, donde ya no le estorba a quien esta pidiendo. -->
          <hecho-con-comeleya
            v-if="mainStore.categories.length && !mainStore.isSearching"
            :slug="String(route.params.slug || '')"
          />
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
import { useMeta, useQuasar } from "quasar";
import SidebarComponent from "src/components/client/Sidebar.vue";
import HechoConComeleya from "src/components/client/HechoConComeleya.vue";
import CardDish from "src/components/client/CardDish.vue";
import ListDish from "src/components/client/ListDish.vue";
import { useRoute } from "vue-router";
import { useMainStore } from "src/stores/main-store";
import { estaEnElFondo, spyThresholdFor } from "src/utils/categoryScroll";

const mainStore = useMainStore();
const route = useRoute();
const $q = useQuasar();

// Clases de columna para la cuadrícula de productos (una sola fuente de verdad).
// Vista Tarjeta: máx 4 por fila en pantallas anchas (antes eran 6, muy chicas).
const productColClass = computed(() => {
  if (mainStore.viewType === "Tarjeta") {
    return mainStore.isExternal
      ? "col-sm-6 col-md-4 col-lg-3"
      : "col-sm-6 col-lg-4 col-xl-3";
  }
  return mainStore.isExternal ? "col-md-6 col-lg-4" : "col-md-6 col-xl-3";
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

// Scroll-spy basado en scroll real (más robusto que IntersectionObserver dentro de
// un iframe): en cada scroll, la categoría activa es la última cuyo encabezado ya
// pasó la línea de fijado (justo debajo del header/tabs).
let spyRaf = false;

const updateActiveCategory = (enElFondo = false) => {
  // Mientras hay un scroll por click en un tab, el spy NO cambia el tab (evita que
  // el movimiento pise la categoría que el usuario eligió).
  if (Date.now() < mainStore.spyLockUntil) return;
  // Sale de la MISMA medición que el punto de aterrizaje, así el título siempre
  // cae por encima de esta línea. Con el 60 fijo de antes y tabs de ~53px, el
  // título aterrizaba en 65 y quedaba a 5px de activar su tab.
  const threshold = spyThresholdFor({
    isExternal: !!mainStore.isExternal,
    isNarrow: $q.screen.width <= 1023,
  });
  const headings = document.querySelectorAll(".mc-category-heading[data-id]");
  if (!headings.length) return;
  // Por defecto la primera categoría (cuando aún no pasa ninguna por la línea)
  let id = headings[0].dataset.id;
  headings.forEach((h) => {
    if (h.getBoundingClientRect().top <= threshold) id = h.dataset.id;
  });
  // Tocando fondo mandan las últimas: una categoría corta al final -Postres con dos
  // platillos- nunca alcanza a subir su título arriba de la línea, así que su tab no
  // se prendía JAMÁS por más que el cliente estuviera viéndola. Y no hay más scroll
  // que darle. Meterle un hueco vacío al final lo taparía a costa de una pantalla en
  // blanco que el cliente sí ve; esto lo resuelve donde está la falla.
  if (enElFondo) id = headings[headings.length - 1].dataset.id;
  if (mainStore.tab !== parseInt(id)) {
    mainStore.tab = parseInt(id);
  }
};
const onScrollSpy = (e) => {
  if (spyRaf) return;
  spyRaf = true;
  // El target se lee AHORA: dentro del rAF el evento ya no sirve.
  const enElFondo = estaEnElFondo(
    e?.target,
    document.scrollingElement || document.documentElement
  );
  requestAnimationFrame(() => {
    spyRaf = false;
    updateActiveCategory(enElFondo);
  });
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

// Deep-link a una categoría vía ?cat=<id|nombre> (ej. ?cat=12 o ?cat=bebidas).
// Pensado para incrustar el iframe apuntando directo a una categoría desde otra web.
const scrollToDeepLinkCategory = async () => {
  const raw = route.query.cat ?? route.query.categoria ?? route.query.category;
  if (raw === undefined || raw === null || raw === "") return;
  const cats = mainStore.categories || [];
  if (!cats.length) return;

  const val = String(raw).toLowerCase().trim();
  let target = null;
  if (/^\d+$/.test(val)) {
    target = cats.find((c) => String(c.id) === val);
  }
  if (!target) {
    const needle = val.replace(/-/g, " ").replace(/\s+/g, " ").trim();
    target =
      cats.find((c) => (c.name || "").toLowerCase().trim() === needle) ||
      cats.find((c) => (c.name || "").toLowerCase().includes(needle));
  }
  if (!target) return;

  mainStore.tab = target.id;
  await nextTick();
  // Espera a que las secciones/productos rendericen para medir bien la posición.
  setTimeout(() => {
    // La MISMA acción que el click en un tab: antes esto tenía su propia versión
    // con un offset fijo y sin candado del spy, y por eso el tab se quedaba en la
    // categoría anterior.
    mainStore.goToCategory(target.id, $q.screen.width <= 1023);
  }, 500);
};

const retrying = ref(false);
const retryLoad = async () => {
  retrying.value = true;
  try {
    const ok = await mainStore.getEstablishment(route.params.slug);
    if (ok) {
      nextTick(() => {
        updateActiveCategory();
        scrollToDeepLinkCategory();
      });
    }
  } finally {
    retrying.value = false;
  }
};

onMounted(async () => {
  window.addEventListener("resize", measureFeatured);
  // Capture: atrapa el scroll venga del window o de cualquier contenedor interno.
  // touchmove: red de seguridad en móvil/iframe (dispara al arrastrar el dedo aunque
  // los eventos 'scroll' no lleguen bien dentro del iframe).
  window.addEventListener("scroll", onScrollSpy, { capture: true, passive: true });
  window.addEventListener("touchmove", onScrollSpy, { passive: true });
  await mainStore.getEstablishment(route.params.slug);
  // Los destacados pueden venir ya cargados (store persistido), así que el watch
  // no siempre dispara: inicializamos el carrusel aquí también.
  if (mainStore.featuredProducts.length) {
    nextTick(() => { measureFeatured(); startFeaturedAutoplay(); });
  }
  nextTick(updateActiveCategory);
  scrollToDeepLinkCategory();
  // Link compartido a un platillo: abre su detalle al entrar.
  //
  // Dos formas conviviendo. /kazuki-sushi-delivery/maguro-roll es la de ahora, la
  // que Google indexa; ?dish=<id> es la de antes y no se va a ir: vive en anuncios
  // corriendo y en el catálogo que Meta ya leyó. La direccion manda porque es la
  // que un cliente puede haber compartido a mano.
  if (route.params.platillo) {
    setTimeout(() => mainStore.seeProductBySlug(route.params.platillo), 500);
  } else if (route.query.dish) {
    setTimeout(() => mainStore.seeProductById(route.query.dish), 500);
  }
});

onBeforeUnmount(() => {
  stopFeaturedAutoplay();
  window.removeEventListener("resize", measureFeatured);
  window.removeEventListener("scroll", onScrollSpy, { capture: true });
  window.removeEventListener("touchmove", onScrollSpy);
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

.mc-load-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--space-xs);
  padding: 48px var(--space-md);
  min-height: 300px;

  &__title {
    font-size: var(--text-lg, 18px);
    font-weight: 700;
    color: var(--color-text-primary);
    margin: var(--space-sm) 0 0;
  }

  &__desc {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0 0 var(--space-sm);
  }

  // El dato tecnico: tiene que estar, pero no tiene que competir con el boton de
  // Reintentar, que es lo unico que el comensal puede hacer.
  &__code {
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
    font-variant-numeric: tabular-nums;
    margin: var(--space-md) 0 0;
    opacity: 0.75;
  }
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

@keyframes mcSectionIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.mc-offers-section {
  background: linear-gradient(135deg, rgba(244, 67, 54, 0.08) 0%, rgba(255, 87, 34, 0.05) 100%);
  border-radius: var(--radius-lg);
  padding: var(--space-sm);
  margin-left: var(--space-sm);
  margin-right: var(--space-sm);
  animation: mcSectionIn 0.45s ease both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
  border: 1px solid rgba(244, 67, 54, 0.18);
  border-left: 4px solid var(--q-primary);
  box-shadow: 0 4px 16px rgba(244, 67, 54, 0.08);
  // Más aire debajo: separa las secciones especiales del listado de categorías
  margin-bottom: var(--space-2xl);
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
  margin-bottom: var(--space-2xl);
  border: 1px solid rgba(255, 193, 7, 0.15);
  animation: mcSectionIn 0.45s ease 0.05s both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
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

// Selector de vista embebido: a la derecha, discreto, y en el flujo del contenido.
// Sin fondo ni recuadro a propósito — compitiendo con la tira de categorías se veía
// como un parche pegado encima.
.mc-view-toggle-inline {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
  margin-bottom: var(--space-xs);
}
</style>
