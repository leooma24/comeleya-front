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

          <!-- Toolbar -->
          <div class="mc-toolbar">
            <div class="mc-view-toggle">
              <q-btn
                flat
                round
                :color="type === 'Tarjeta' ? 'primary' : 'grey-5'"
                icon="grid_view"
                size="sm"
                @click="type = 'Tarjeta'"
              >
                <q-tooltip>Vista cuadrícula</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                :color="type === 'Lista' ? 'primary' : 'grey-5'"
                icon="view_list"
                size="sm"
                @click="type = 'Lista'"
              >
                <q-tooltip>Vista lista</q-tooltip>
              </q-btn>
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
              class="q-pa-sm col-12 col-sm-6 col-lg-4"
            >
              <q-card flat class="mc-skeleton-card">
                <q-skeleton height="180px" square animation="wave" />
                <q-card-section>
                  <q-skeleton type="text" width="70%" animation="wave" />
                  <q-skeleton type="text" class="q-mt-sm" animation="wave" />
                  <q-skeleton type="text" width="40%" class="q-mt-sm" animation="wave" />
                </q-card-section>
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
                :class="[
                  'q-pa-sm col-12',
                  type === 'Tarjeta'
                    ? !mainStore.isExternal
                      ? 'col-sm-6 col-lg-4 col-xl-2'
                      : 'col-sm-6 col-md-4'
                    : !mainStore.isExternal
                    ? 'col-md-6 col-xl-3'
                    : 'col-md-6 ',
                ]"
                v-for="item in mainStore.searchResults"
                :key="'search_' + item.id"
              >
                <component
                  :is="type === 'Tarjeta' ? CardDish : ListDish"
                  :item="item"
                />
              </div>
            </div>
            <div
              v-if="mainStore.searchResults.length === 0"
              class="mc-empty-search"
            >
              <q-icon name="search_off" size="48px" color="grey-4" />
              <p>No se encontraron productos</p>
            </div>
          </div>

          <!-- Special Offers Section -->
          <div
            v-if="mainStore.specialOffers.length && !mainStore.isSearching"
            class="q-mb-xl mc-offers-section"
          >
            <div class="col-12">
              <div class="mc-category-heading mc-offers-heading">
                <q-icon name="local_offer" size="20px" color="red-6" class="q-mr-xs" />
                Ofertas del día
              </div>
            </div>
            <div class="mc-content-products row">
              <div
                :class="[
                  'q-pa-sm col-12',
                  type === 'Tarjeta'
                    ? !mainStore.isExternal
                      ? 'col-sm-6 col-lg-4 col-xl-2'
                      : 'col-sm-6 col-md-4'
                    : !mainStore.isExternal
                    ? 'col-md-6 col-xl-3'
                    : 'col-md-6 ',
                ]"
                v-for="item in mainStore.specialOffers"
                :key="'offer_' + item.id"
              >
                <component
                  :is="type === 'Tarjeta' ? CardDish : ListDish"
                  :item="item"
                />
              </div>
            </div>
          </div>

          <!-- Featured Section -->
          <div
            v-if="mainStore.featuredProducts.length && !mainStore.isSearching"
            class="q-mb-xl mc-featured-section"
          >
            <div class="col-12">
              <div class="mc-category-heading mc-featured-heading">
                <q-icon name="star" size="20px" color="amber-8" class="q-mr-xs" />
                Destacados
              </div>
            </div>
            <div class="mc-content-products row">
              <div
                :class="[
                  'q-pa-sm col-12',
                  type === 'Tarjeta'
                    ? !mainStore.isExternal
                      ? 'col-sm-6 col-lg-4 col-xl-2'
                      : 'col-sm-6 col-md-4'
                    : !mainStore.isExternal
                    ? 'col-md-6 col-xl-3'
                    : 'col-md-6 ',
                ]"
                v-for="item in mainStore.featuredProducts"
                :key="'featured_' + item.id"
              >
                <component
                  :is="type === 'Tarjeta' ? CardDish : ListDish"
                  :item="item"
                />
              </div>
            </div>
          </div>

          <!-- Category Sections -->
          <div
            v-show="!mainStore.isSearching"
            class="q-mb-xl"
            v-for="(record, indexRecord) in mainStore.categories"
            :key="indexRecord"
            :id="record.id"
          >
            <div
              class="col-12"
              v-if="mainStore.countByCategory(record.id)"
              :data-id="record.id"
              v-intersection="onIntersection"
            >
              <div class="mc-category-heading">
                {{ record.name }}
              </div>
            </div>
            <div class="mc-content-products row">
              <div
                :class="[
                  'q-pa-sm col-12',
                  type === 'Tarjeta'
                    ? !mainStore.isExternal
                      ? 'col-sm-6 col-lg-4 col-xl-2'
                      : 'col-sm-6 col-md-4'
                    : !mainStore.isExternal
                    ? 'col-md-6 col-xl-3'
                    : 'col-md-6 ',
                ]"
                v-for="item in mainStore.getProductsByCategoryId(record.id)"
                :key="'product_' + item.id"
              >
                <component
                  :is="type === 'Tarjeta' ? CardDish : ListDish"
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

import { ref, computed, onMounted } from "vue";
import { useMeta } from "quasar";
import SidebarComponent from "src/components/client/Sidebar.vue";
import CardDish from "src/components/client/CardDish.vue";
import ListDish from "src/components/client/ListDish.vue";
import { useRoute } from "vue-router";
import { useMainStore } from "src/stores/main-store";

const mainStore = useMainStore();
const route = useRoute();
const type = ref("Lista");

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

onMounted(async () => {
  await mainStore.getEstablishment(route.params.slug);
});
</script>

<style lang="scss" scoped>
.mc-page-bg {
  background: var(--color-surface-variant);
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

.mc-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: var(--space-sm) var(--space-md);
}

.mc-view-toggle {
  display: flex;
  gap: var(--space-xs);
  background: var(--color-surface);
  border-radius: var(--radius-full);
  padding: 2px;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.mc-results-count {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
}

.mc-offers-section {
  background: linear-gradient(135deg, rgba(244, 67, 54, 0.06) 0%, rgba(255, 87, 34, 0.04) 100%);
  border-radius: var(--radius-lg);
  padding: var(--space-sm);
  margin-left: var(--space-sm);
  margin-right: var(--space-sm);
  border: 1px solid rgba(244, 67, 54, 0.15);
}

.mc-offers-heading {
  display: flex;
  align-items: center;
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

.mc-empty-search {
  text-align: center;
  padding: var(--space-xl) var(--space-md);
  color: var(--color-text-tertiary);

  p {
    margin-top: var(--space-sm);
    font-size: var(--text-sm);
  }
}
</style>
