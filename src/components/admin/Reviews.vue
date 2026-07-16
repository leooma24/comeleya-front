<template>
  <q-card flat class="mc-admin-card">
    <div class="mc-admin-card__header">
      <div class="mc-admin-card__title">
        <q-icon name="star" size="24px" color="amber-8" class="q-mr-sm" />
        Resenas
      </div>
    </div>

    <!-- Stats -->
    <div class="mc-review-stats q-pa-lg" v-if="totalReviews > 0">
      <div class="mc-review-stats__score">
        <div class="text-h3" style="font-weight: 800; line-height: 1">{{ avgRating }}</div>
        <div class="row q-mt-xs">
          <q-icon v-for="s in 5" :key="s" :name="s <= Math.round(avgRating) ? 'star' : 'star_border'" size="20px" color="amber-8" />
        </div>
        <div class="text-caption text-grey-6 q-mt-xs">{{ totalReviews }} {{ totalReviews === 1 ? 'resena' : 'resenas' }}</div>
      </div>

      <div class="mc-review-stats__bars">
        <div v-for="i in [5,4,3,2,1]" :key="i" class="mc-bar-row">
          <span class="mc-bar-label">{{ i }}</span>
          <q-icon name="star" size="14px" color="amber-8" />
          <q-linear-progress
            :value="totalReviews ? distribution[i] / totalReviews : 0"
            color="amber-8"
            track-color="grey-3"
            rounded
            size="8px"
            class="mc-bar"
          />
          <span class="mc-bar-count">{{ distribution[i] || 0 }}</span>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!loading && totalReviews === 0" class="mc-empty-state q-pa-xl">
      <q-icon name="rate_review" size="64px" color="grey-4" />
      <p class="q-mt-md text-grey-6">Aun no tienes resenas</p>
      <p class="text-caption text-grey-5">Las resenas apareceran aqui cuando tus clientes las envien.</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <!-- Reviews list -->
    <div v-if="reviews.length" class="q-pa-md">
      <q-card
        v-for="review in reviews"
        :key="review.id"
        flat
        bordered
        class="mc-review-card q-mb-sm"
      >
        <q-card-section class="q-py-md">
          <div class="row items-center justify-between q-mb-sm">
            <div class="row items-center q-gutter-sm">
              <q-avatar size="32px" color="grey-3" text-color="grey-7">
                {{ review.customer_name?.charAt(0)?.toUpperCase() }}
              </q-avatar>
              <div>
                <div class="text-weight-bold text-body2">{{ review.customer_name }}</div>
                <div class="text-caption text-grey-6">{{ formatDate(review.created_at) }}</div>
              </div>
            </div>
            <div class="row">
              <q-icon
                v-for="s in 5"
                :key="s"
                :name="s <= review.rating ? 'star' : 'star_border'"
                size="16px"
                color="amber-8"
              />
            </div>
          </div>
          <p v-if="review.comment" class="q-mb-none text-body2 text-grey-8">
            {{ review.comment }}
          </p>
          <p v-else class="q-mb-none text-caption text-grey-5 text-italic">
            Sin comentario
          </p>
        </q-card-section>
      </q-card>
    </div>
  </q-card>
</template>

<script setup>
defineOptions({ name: "ReviewsComponent" });

import { ref, onMounted } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";

const adminStore = useAdminStore();

const reviews = ref([]);
const avgRating = ref(0);
const totalReviews = ref(0);
const distribution = ref({});
const loading = ref(true);

const formatDate = (d) => {
  if (!d) return "";
  const date = new Date(d);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} dias`;
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
};

onMounted(async () => {
  try {
    const { data } = await api.get(`/admin/${adminStore.slug}/reviews`);
    reviews.value = data.reviews || [];
    avgRating.value = data.avg_rating || 0;
    totalReviews.value = data.total_reviews || 0;
    distribution.value = data.distribution || {};
  } catch (e) {
    // silently fail
  } finally {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
.mc-review-stats {
  display: flex;
  align-items: center;
  gap: var(--space-xl);
  flex-wrap: wrap;

  &__score {
    text-align: center;
    min-width: 100px;
  }

  &__bars {
    flex: 1;
    min-width: 200px;
  }
}

.mc-bar-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: 4px;
}

.mc-bar-label {
  width: 12px;
  text-align: right;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.mc-bar {
  flex: 1;
}

.mc-bar-count {
  width: 24px;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

.mc-review-card {
  border-radius: var(--radius-md);
  transition: box-shadow var(--transition-fast);

  &:hover {
    box-shadow: var(--shadow-sm);
  }
}

.mc-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
</style>
