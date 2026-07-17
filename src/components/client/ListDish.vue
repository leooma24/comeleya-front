<template>
  <q-card
    class="dish-card dish-card--list cursor-pointer"
    :class="{ 'dish-card--sold-out': item.is_sold_out }"
    flat
    bordered
    @click="mainStore.seeProduct(item)"
  >
    <div class="row no-wrap full-height">
      <!-- Imagen -->
      <div class="col-4 relative-position">
        <!-- Etiquetas -->
        <div v-if="item.is_sold_out" class="dish-card__sold-out-badge">
          AGOTADO
        </div>
        <div v-else-if="isNew" class="dish-card__sold-out-badge dish-card__new-badge">
          NUEVO
        </div>
        <q-img
          v-if="item.photo"
          class="dish-card__image full-height"
          :src="item.photo"
          :ratio="1"
          fit="cover"
        >
          <template #loading>
            <q-skeleton class="full-width full-height" square />
          </template>
        </q-img>

        <!-- Placeholder cuando el platillo no tiene foto -->
        <div v-else class="dish-card__image dish-card__no-image full-height">
          <q-icon name="restaurant_menu" size="28px" />
        </div>
      </div>

      <!-- Contenido -->
      <q-card-section class="col-8 column justify-between q-pa-md">
        <div>
          <h3 class="dish-card__title q-mb-xs">
            {{ item.name }}
          </h3>

          <p class="dish-card__description q-mb-none">
            {{ item.description }}
          </p>
        </div>

        <!-- Precio + acción (consistente en móvil y desktop) -->
        <div class="dish-card__footer">
          <span class="dish-card__price-text">
            <template v-if="hasSpecialPrice">
              <span class="dish-card__old-price">${{ item.price }}</span>
              ${{ item.special_price }}
            </template>
            <template v-else>${{ item.price }}</template>
          </span>
          <div class="dish-card__footer-actions">
            <q-btn
              flat
              dense
              round
              size="xs"
              icon="share"
              color="grey-5"
              @click.stop="shareProduct(item)"
            >
              <q-tooltip>Compartir</q-tooltip>
            </q-btn>
            <span v-if="item.is_sold_out" class="dish-card__unavailable">No disponible</span>
            <q-icon v-else name="arrow_forward" size="18px" class="dish-card__go" />
          </div>
        </div>
      </q-card-section>
    </div>
  </q-card>
</template>

<script setup>
defineOptions({
  name: "ListDish",
});

import { computed } from "vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const hasSpecialPrice = computed(() => {
  return props.item.special_price && (!props.item.special_until || new Date(props.item.special_until) > new Date());
});

const isNew = computed(() => {
  if (!props.item.created_at) return false;
  const created = new Date(props.item.created_at);
  if (isNaN(created)) return false;
  return (Date.now() - created.getTime()) / 86400000 <= 14;
});

import { useMainStore } from "src/stores/main-store";
const mainStore = useMainStore();

const shareProduct = (item) => {
  const url = window.location.href;
  const text = `${item.name} - $${item.price} en ${mainStore.company.name}`;

  if (navigator.share) {
    navigator.share({ title: item.name, text, url });
  } else {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
    window.open(waUrl, "_blank");
  }
};
</script>

<style lang="scss" scoped>
.dish-card {
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: all var(--transition-normal);
  border: 1px solid var(--color-border-subtle);
  background: var(--color-surface);
  min-height: 120px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: transparent;

    .dish-card__image {
      transform: scale(1.04);
    }
  }

  &:active {
    transform: translateY(0);
    box-shadow: var(--shadow-sm);
  }

  &--sold-out {
    cursor: not-allowed;

    .dish-card__image,
    .dish-card__no-image {
      filter: grayscale(1);
      opacity: 0.55;
    }

    &:hover {
      transform: none;
      box-shadow: none;
      border-color: var(--color-border-subtle);

      .dish-card__image {
        transform: none;
      }
    }
  }

  &__sold-out-badge {
    position: absolute;
    top: 6px;
    left: 6px;
    z-index: 2;
    background: var(--q-negative, #D32F2F);
    color: #fff;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.06em;
    padding: 3px 8px;
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-md);
  }

  &__new-badge {
    background: var(--q-positive, #43A047);
  }

  &__image {
    min-height: 120px;
    transition: transform var(--transition-slow);

    @media (min-width: 600px) {
      min-height: 140px;
    }
  }

  &__no-image {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-surface-variant);
    color: var(--color-text-tertiary);
  }

  &__title {
    font-size: var(--text-base);
    font-weight: 600;
    line-height: 1.3;
    color: var(--color-text-primary);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__description {
    font-size: var(--text-sm);
    line-height: 1.5;
    color: var(--color-text-secondary);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-top: var(--space-xs);
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: var(--space-sm);
    padding-top: var(--space-sm);
    border-top: 1px dashed var(--color-border);
  }

  &__price {
    margin-top: var(--space-sm);
    padding-top: var(--space-sm);
    border-top: 1px dashed var(--color-border);
  }

  &__old-price {
    text-decoration: line-through;
    opacity: 0.5;
    font-size: var(--text-sm);
    margin-right: 4px;
  }

  &__price-text {
    font-weight: 700;
    color: var(--q-primary);
    letter-spacing: -0.5px;
    font-variant-numeric: tabular-nums;
    font-size: var(--text-lg);
  }

  &__footer-actions {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  &__go {
    color: var(--q-primary);
  }

  &__unavailable {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-tertiary);
  }
}
</style>
