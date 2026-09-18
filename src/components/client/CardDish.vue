<template>
  <q-card
    class="dish-card cursor-pointer"
    :class="{ 'dish-card--sold-out': agotado }"
    flat
    bordered
    @click="seeProduct"
  >
    <!-- Imagen con overlay de precio -->
    <div class="dish-card__image-wrapper">
      <!-- Etiquetas -->
      <!-- Prioridad: agotado > oferta > nuevo. La oferta le gana a NUEVO porque un
           descuento mueve más que una novedad, y dos sellos encimados no se leen. -->
      <div v-if="agotado" class="dish-card__badge dish-card__badge--sold-out">
        AGOTADO
      </div>
      <!-- El descuento en número. Antes solo se tachaba el precio anterior, y tachar
           obliga a restar de cabeza: casi nadie lo hace. -->
      <div v-else-if="savings" class="dish-card__badge dish-card__badge--offer">
        -{{ savings.porcentaje }}%
      </div>
      <!-- El platillo que ES la promoción sube al bloque de ofertas con su propio
           precio, sin descuento que anunciar. Sin sello quedaba ahí como un platillo
           cualquiera bajo un letrero que dice "Ofertas del día", que se lee como un
           error del menú. Va antes que NUEVO: es la razón por la que está arriba. -->
      <div v-else-if="item.is_promo" class="dish-card__badge dish-card__badge--promo">
        PROMO
      </div>
      <div v-else-if="isNew" class="dish-card__badge dish-card__badge--new">
        NUEVO
      </div>
      <q-img
        v-if="item.photo"
        class="dish-card__image"
        :src="item.photo"
        :ratio="4 / 3"
        fit="cover"
      >
        <template #loading>
          <q-skeleton class="full-width full-height" square />
        </template>

        <!-- Precio flotante sobre imagen -->
        <div class="dish-card__price-overlay" :class="{ 'dish-card__price-overlay--offer': hasSpecialPrice }">
          <template v-if="hasSpecialPrice">
            <span class="dish-card__old-price">${{ item.price }}</span>
            <span>${{ item.special_price }}</span>
          </template>
          <span v-else>${{ item.price }}</span>
        </div>
      </q-img>

      <!-- Placeholder cuando el platillo no tiene foto -->
      <div v-else class="dish-card__image dish-card__no-image" style="aspect-ratio: 4 / 3">
        <q-icon name="restaurant_menu" size="40px" />
        <div class="dish-card__price-overlay" :class="{ 'dish-card__price-overlay--offer': hasSpecialPrice }">
          <template v-if="hasSpecialPrice">
            <span class="dish-card__old-price">${{ item.price }}</span>
            <span>${{ item.special_price }}</span>
          </template>
          <span v-else>${{ item.price }}</span>
        </div>
      </div>
    </div>

    <!-- Contenido -->
    <q-card-section class="dish-card__content">
      <h3 class="dish-card__title">
        {{ item.name }}
      </h3>

      <p class="dish-card__description">
        {{ item.description }}
      </p>

      <!-- El ahorro en pesos, que es como la gente decide. La urgencia solo aparece
           cuando la oferta tiene un límite de verdad: inventársela a una permanente
           funciona una vez y a la tercera el cliente deja de creerle al menú. -->
      <p v-if="savings" class="dish-card__savings">
        Ahorras ${{ savings.ahorro }}<span v-if="urgency"> · {{ urgency }}</span>
      </p>
    </q-card-section>

    <!-- Footer con indicador de acción -->
    <q-card-actions class="dish-card__actions">
      <q-btn
        flat
        dense
        round
        size="sm"
        icon="share"
        color="grey-5"
        @click.stop="shareProduct"
      >
        <q-tooltip>Compartir</q-tooltip>
      </q-btn>
      <q-space />
      <q-btn
        v-if="agotado"
        flat
        dense
        color="grey-6"
        label="No disponible"
        no-caps
        class="dish-card__cta"
      />
      <q-btn
        v-else
        flat
        dense
        color="primary"
        icon-right="arrow_forward"
        label="Ver más"
        no-caps
        class="dish-card__cta"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup>
defineOptions({
  name: "CardDish",
});

import { computed, toRef } from "vue";
import { useDish } from "src/composables/useDish";
import { offerSavings, offerUrgency } from "src/utils/dishPrice";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const { agotado, hasSpecialPrice, isNew, seeProduct, shareProduct } = useDish(
  toRef(props, "item")
);

// Null cuando no hay oferta vigente o cuando el descuento no se puede afirmar (precio
// mal capturado). El template usa eso para decidir si habla: es más barato callarse
// que anunciar "-0%".
const savings = computed(() => offerSavings(props.item));
const urgency = computed(() => offerUrgency(props.item));
</script>

<style lang="scss" scoped>
@keyframes mcCardIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dish-card {
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-normal);
  border: 1px solid var(--color-border-subtle);
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  animation: mcCardIn 0.35s ease both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-lg);
    border-color: transparent;

    .dish-card__image {
      transform: scale(1.04);
    }

    .dish-card__cta {
      transform: translateX(var(--space-xs));
    }

    .dish-card__price-overlay {
      box-shadow: var(--shadow-md);
    }
  }

  &:active {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
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

  &__image-wrapper {
    position: relative;
    overflow: hidden;
  }

  &__badge {
    position: absolute;
    top: var(--space-sm);
    left: var(--space-sm);
    z-index: 2;
    color: #fff;
    font-size: var(--text-xs);
    font-weight: 800;
    letter-spacing: 0.08em;
    padding: 4px 10px;
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-md);

    &--sold-out {
      background: var(--q-negative, #D32F2F);
    }

    &--new {
      background: var(--q-positive, #43A047);
    }

    // Rojo fijo y NO el color del negocio: el rojo se lee como "oferta" sin pensarlo,
    // aunque la marca sea verde. Más grande que los otros dos sellos porque es el
    // único que da una razón para comprar; los otros solo informan.
    &--offer {
      background: #e53935;
      font-size: var(--text-sm);
      font-weight: 900;
      letter-spacing: 0.02em;
      padding: 5px 12px;
      box-shadow: 0 3px 12px rgba(229, 57, 53, 0.45);
    }

    // Mismo rojo que la oferta -es la misma promesa para el cliente- pero del tamaño
    // de los sellos informativos: sin porcentaje que gritar, no compite con un -30%
    // de la tarjeta de al lado.
    &--promo {
      background: #e53935;
    }
  }

  // El ahorro en pesos, debajo de la descripción: es donde la vista ya está cuando
  // termina de leer qué es el platillo.
  &__savings {
    margin: var(--space-xs) 0 0;
    font-size: var(--text-sm);
    font-weight: 700;
    color: #e53935;
    line-height: 1.3;
  }

  &__image {
    transition: transform var(--transition-slow);
    display: block;
  }

  &__no-image {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    background: var(--color-surface-variant);
    color: var(--color-text-tertiary);
  }

  &__old-price {
    text-decoration: line-through;
    opacity: 0.5;
    font-size: var(--text-sm);
    margin-right: 4px;
  }

  &__price-overlay {
    position: absolute;
    bottom: var(--space-sm);
    right: var(--space-sm);
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);

    :global(body.body--dark) & {
      background: rgba(20, 20, 24, 0.88);
    }
    padding: var(--space-xs) 14px;
    border-radius: var(--radius-full);
    box-shadow: var(--shadow-sm);
    font-size: var(--text-base);
    font-weight: 700;

    &--offer {
      background: rgba(244, 67, 54, 0.95);
      color: white;
    }
    color: var(--q-primary);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.3px;
    transition: box-shadow var(--transition-fast);
  }

  &__content {
    flex: 1;
    padding: var(--space-md);
  }

  &__title {
    font-family: var(--font-display);
    font-size: var(--text-base);
    font-weight: 700;
    line-height: 1.3;
    color: var(--color-text-primary);
    margin: 0 0 var(--space-xs) 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__description {
    font-size: var(--text-sm);
    line-height: 1.5;
    color: var(--color-text-secondary);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__actions {
    padding: var(--space-xs) var(--space-md) var(--space-md);
  }

  &__cta {
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: 0.02em;
    transition: transform var(--transition-fast);
  }
}
</style>
