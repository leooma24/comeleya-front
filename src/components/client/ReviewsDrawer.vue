<template>
  <q-drawer
    v-model="showDrawer"
    side="right"
    bordered
    overlay
    persistent
    no-swipe-open
    :width="$q.screen.lt.sm ? $q.screen.width : 440"
  >
    <q-btn
      flat
      round
      icon="close"
      class="mc-drawer-close"
      @click="showDrawer = false"
    />

    <q-scroll-area style="height: calc(100vh - 88px)">
      <div class="q-pa-md">
        <!-- Header -->
        <div class="mc-drawer-header q-mb-md">
          <h5 class="mc-drawer-title">Reseñas</h5>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="q-py-lg">
          <q-skeleton type="rect" height="90px" class="q-mb-md" style="border-radius: 12px" />
          <q-skeleton type="text" width="60%" class="q-mb-sm" />
          <q-skeleton type="text" width="80%" />
        </div>

        <template v-else>
          <!-- Resumen -->
          <div v-if="data.total_reviews > 0" class="mc-reviews-summary">
            <div class="mc-reviews-summary__score">
              {{ Number(data.avg_rating).toFixed(1) }}
            </div>
            <div class="mc-reviews-summary__meta">
              <div class="mc-reviews-summary__stars">
                <q-icon
                  v-for="s in 5"
                  :key="s"
                  :name="s <= Math.round(data.avg_rating) ? 'star' : 'star_border'"
                  color="amber-8"
                  size="18px"
                />
              </div>
              <span class="mc-reviews-summary__count">
                {{ data.total_reviews }} {{ data.total_reviews === 1 ? 'reseña' : 'reseñas' }}
              </span>
            </div>
          </div>

          <!-- Lista -->
          <div v-if="data.reviews.length" class="mc-reviews-list">
            <div
              v-for="(review, i) in data.reviews"
              :key="i"
              class="mc-review-item"
            >
              <div class="mc-review-item__head">
                <div class="mc-review-item__avatar">
                  {{ (review.customer_name || '?').charAt(0).toUpperCase() }}
                </div>
                <div class="mc-review-item__who">
                  <span class="mc-review-item__name">{{ review.customer_name || 'Anónimo' }}</span>
                  <span class="mc-review-item__date">{{ formatDate(review.created_at) }}</span>
                </div>
                <q-space />
                <div class="mc-review-item__stars">
                  <q-icon
                    v-for="s in 5"
                    :key="s"
                    :name="s <= review.rating ? 'star' : 'star_border'"
                    color="amber-8"
                    size="15px"
                  />
                </div>
              </div>
              <p v-if="review.comment" class="mc-review-item__comment">
                {{ review.comment }}
              </p>
            </div>
          </div>

          <!-- Vacío -->
          <div v-else class="mc-empty-state">
            <q-icon name="reviews" size="48px" color="grey-4" />
            <p>Aún no hay reseñas. ¡Sé el primero en dejar una!</p>
          </div>
        </template>
      </div>
    </q-scroll-area>

    <!-- Botón inferior: escribir reseña -->
    <div class="mc-reviews-cta">
      <q-btn
        unelevated
        no-caps
        color="primary"
        size="lg"
        icon="rate_review"
        label="Escribir reseña"
        class="full-width"
        @click="onAdd"
      />
    </div>
  </q-drawer>
</template>

<script setup>
defineOptions({
  name: "ReviewsDrawer",
});

import { ref, watch } from "vue";
import { api } from "boot/axios";
import { useMainStore } from "src/stores/main-store";

const mainStore = useMainStore();
const showDrawer = defineModel({ default: false });
const emit = defineEmits(["add"]);

const loading = ref(false);
const data = ref({ avg_rating: 0, total_reviews: 0, reviews: [] });

const fetchReviews = async () => {
  loading.value = true;
  try {
    const res = await api.get(
      `/establishment/${mainStore.companyStore.slug}/reviews`
    );
    data.value = {
      avg_rating: res.data.avg_rating || 0,
      total_reviews: res.data.total_reviews || 0,
      reviews: res.data.reviews || [],
    };
  } catch {
    // silencioso
  } finally {
    loading.value = false;
  }
};

// Cargar reseñas cada vez que se abre el drawer
watch(showDrawer, (open) => {
  if (open) fetchReviews();
});

const onAdd = () => {
  showDrawer.value = false;
  emit("add");
};

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
</script>

<style lang="scss" scoped>
.mc-drawer-header {
  padding-top: var(--space-lg);
}

.mc-drawer-title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 700;
  margin: 0;
  color: var(--color-text-primary);
}

.mc-reviews-summary {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-md);
  background: var(--color-surface-variant);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-lg);

  &__score {
    font-family: var(--font-display);
    font-size: 2.4rem;
    font-weight: 800;
    line-height: 1;
    color: var(--color-text-primary);
  }

  &__stars {
    display: flex;
    gap: 2px;
  }

  &__count {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }
}

.mc-reviews-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.mc-review-item {
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-md);

  &__head {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  &__avatar {
    width: 34px;
    height: 34px;
    border-radius: var(--radius-full);
    background: var(--color-primary-soft, #ffe5e3);
    color: var(--q-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    flex-shrink: 0;
  }

  &__who {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }

  &__name {
    font-weight: 600;
    font-size: var(--text-sm);
    color: var(--color-text-primary);
  }

  &__date {
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
  }

  &__stars {
    display: flex;
    gap: 1px;
    flex-shrink: 0;
  }

  &__comment {
    margin: var(--space-sm) 0 0;
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: 1.5;
  }
}

.mc-reviews-cta {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--space-md);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}
</style>
