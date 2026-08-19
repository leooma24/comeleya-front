<template>
  <q-drawer
    v-model="mainStore.cartDrawer"
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
      color="grey-8"
      size="md"
      class="mc-drawer-close"
      @click="mainStore.cartDrawer = false"
    />

    <q-scroll-area style="height: calc(100vh - 100px)">
      <div class="q-pa-md">
        <checkout-steps :current="1" />

        <!-- Header -->
        <div class="mc-drawer-header q-mb-md">
          <h5 class="mc-drawer-title">Tu Pedido</h5>
          <span class="mc-drawer-count">
            {{ unitCount }} {{ unitCount === 1 ? 'artículo' : 'artículos' }}
          </span>
        </div>

        <!-- Empty State -->
        <div v-if="!mainStore.cart.length" class="mc-empty-cart">
          <div class="mc-empty-cart__icon">
            <q-icon name="shopping_bag" size="40px" />
          </div>
          <p class="mc-empty-cart__text">Tu carrito está vacío</p>
          <p class="mc-empty-cart__hint">Agrega platillos del menú para empezar tu pedido 🍽️</p>
        </div>

        <!-- Cart Items -->
        <div class="mc-cart-list">
          <div
            class="mc-cart-item"
            v-for="(product, index) in mainStore.cart"
            :key="index"
          >
            <div class="mc-cart-item__main">
              <div class="mc-cart-item__thumb">
                <img
                  v-if="product.photo"
                  :src="product.photo"
                  :alt="product.name"
                />
                <q-icon v-else name="restaurant_menu" size="22px" color="grey-5" />
              </div>

              <div class="mc-cart-item__info">
                <span class="mc-cart-item__name">{{ product.name }}</span>

                <!-- Con nota se lee recortada; sin ella, la invitación a ponerla.
                     En ambos casos abre el mismo diálogo. -->
                <button
                  type="button"
                  class="mc-cart-item__note"
                  :class="{ 'mc-cart-item__note--filled': !!product.notes }"
                  @click="openNotes(index)"
                >
                  <q-icon
                    :name="product.notes ? 'chat_bubble' : 'chat_bubble_outline'"
                    size="13px"
                  />
                  <span class="mc-cart-item__note-text">{{
                    product.notes || "Agregar comentario"
                  }}</span>
                </button>
              </div>

              <div class="mc-cart-item__actions">
                <q-btn
                  flat
                  round
                  icon="edit"
                  size="sm"
                  color="grey-7"
                  class="mc-cart-item__action-btn"
                  @click="mainStore.editProduct(index)"
                >
                  <q-tooltip>Editar</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  icon="delete_outline"
                  size="sm"
                  color="negative"
                  class="mc-cart-item__action-btn"
                  @click="mainStore.removeProduct(index)"
                >
                  <q-tooltip>Eliminar</q-tooltip>
                </q-btn>
              </div>
            </div>

            <!-- Detalle CON extras (solo si el platillo tiene) -->
            <ul class="mc-cart-item__extras" v-if="hasExtras(product)">
              <template v-for="extra in product.extras" :key="extra.id">
                <li
                  v-for="option in (extra.options || [])"
                  :key="option.id"
                  v-show="option.qty || extra.value === option.id"
                >
                  <div class="row justify-between">
                    <span>
                      <span v-if="option.price">{{ option.qty * product.qty }} x </span>
                      {{ option.name }}
                    </span>
                    <strong v-if="option.price" class="mc-cart-item__extra-price">${{ option.price * product.qty * option.qty }}</strong>
                  </div>
                </li>
              </template>
            </ul>

            <!-- Cantidad + total de la línea -->
            <div class="mc-cart-item__footer">
              <div class="mc-qty-stepper">
                <q-btn
                  flat
                  dense
                  round
                  color="primary"
                  icon="remove"
                  size="sm"
                  :disable="product.qty <= 1"
                  @click="mainStore.cartStore.decrementLine(index)"
                />
                <span class="mc-qty-value">{{ product.qty }}</span>
                <q-btn
                  flat
                  dense
                  round
                  color="primary"
                  icon="add"
                  size="sm"
                  @click="mainStore.cartStore.incrementLine(index)"
                />
              </div>
              <div class="mc-cart-item__price">${{ lineTotal(product) }}</div>
            </div>
          </div>
        </div>

        <!-- Upsell / cross-sell: platillos destacados que aún no están en el carrito.
             El dueño los controla marcándolos como destacados (⭐). -->
        <div v-if="mainStore.cart.length && upsellItems.length" class="mc-upsell">
          <p class="mc-upsell__title">¿Le agregas algo más?</p>
          <div class="mc-upsell__row">
            <button
              v-for="item in upsellItems"
              :key="item.id"
              type="button"
              class="mc-upsell__card"
              @click="addUpsell(item)"
            >
              <q-img :src="item.photo" :ratio="1" class="mc-upsell__img" />
              <span class="mc-upsell__name">{{ item.name }}</span>
              <span class="mc-upsell__price">${{ Number(item.price).toFixed(2) }}</span>
              <span class="mc-upsell__add"><q-icon name="add" size="18px" /></span>
            </button>
          </div>
        </div>

        <!-- Subtotal -->
        <div v-if="mainStore.cart.length" class="mc-cart-subtotal">
          <span>Subtotal</span>
          <span class="mc-cart-subtotal__value">${{ Number(mainStore.total).toFixed(2) }}</span>
        </div>

        <!-- Aviso: pedidos pausados por el restaurante -->
        <div v-if="mainStore.cart.length && mainStore.ordersPaused" class="mc-cart-alert mc-cart-alert--paused">
          <q-icon name="pause_circle" size="20px" />
          <span>{{ mainStore.pausedMessage || "El restaurante no está recibiendo pedidos en este momento." }}</span>
        </div>

        <!-- Aviso: pedido mínimo -->
        <div
          v-else-if="mainStore.cart.length && mainStore.belowMinOrder"
          class="mc-cart-alert mc-cart-alert--min"
        >
          <q-icon name="info" size="20px" />
          <span>
            Pedido mínimo <strong>${{ mainStore.minOrder.toFixed(2) }}</strong>.
            Te faltan <strong>${{ (mainStore.minOrder - Number(mainStore.total)).toFixed(2) }}</strong>.
          </span>
        </div>
      </div>
    </q-scroll-area>

    <!-- Bottom Bar -->
    <div
      class="mc-cart-bar mc-mb-fix absolute-bottom"
      :class="{ 'mc-cart-bar--disabled': checkoutBlocked }"
      @click="continueCheckout"
    >
      <div class="row items-center justify-between full-width">
        <div class="mc-cart-bar-left">
          <img
            v-if="mainStore.establishment?.theme_config?.cart_image"
            :src="mainStore.establishment.theme_config.cart_image"
            class="mc-cart-bar-img"
            alt=""
          />
          <q-icon v-else name="shopping_cart" size="24px" />
          <q-badge color="white" text-color="primary" rounded>
            {{ unitCount }}
          </q-badge>
        </div>

        <div class="column items-center">
          <span class="mc-total-price">${{ mainStore.total }}</span>
        </div>

        <div class="mc-cart-bar-right">
          <span class="mc-cart-bar-label">Continuar</span>
          <q-icon name="arrow_forward" size="20px" />
        </div>
      </div>
    </div>

    <item-notes-dialog
      v-model="notesDialog"
      :dish-name="notesDishName"
      :model-value-text="notesCurrent"
      @save="saveNotes"
      @remove="removeNotes"
    />
  </q-drawer>
</template>

<script setup>
defineOptions({
  name: "CartDrawer",
});
import { computed, ref } from "vue";
import { useMainStore } from "src/stores/main-store";
import CheckoutSteps from "./CheckoutSteps.vue";
import ItemNotesDialog from "./ItemNotesDialog.vue";
const mainStore = useMainStore();

// Comentario por platillo. Un solo diálogo reutilizado para todos los renglones:
// se guarda el índice del que se está editando.
const notesDialog = ref(false);
const notesIndex = ref(-1);

const notesDishName = computed(() => mainStore.cart[notesIndex.value]?.name ?? "");
const notesCurrent = computed(() => mainStore.cart[notesIndex.value]?.notes ?? "");

const openNotes = (index) => {
  notesIndex.value = index;
  notesDialog.value = true;
};

const saveNotes = (texto) => {
  mainStore.cartStore.setNotes(notesIndex.value, texto);
};

const removeNotes = () => {
  mainStore.cartStore.setNotes(notesIndex.value, "");
};

// El detalle del item se dibuja de DOS formas: con extras (muestra la lista de
// opciones) y sin extras (solo nombre + cantidad + precio). Los botones editar/
// eliminar y el precio salen SIEMPRE, tenga o no extras.
const hasExtras = (p) => Array.isArray(p?.extras) && p.extras.length > 0;

// Precio de la línea, blindado: si totalPrice/qty vienen mal (undefined/NaN) no
// rompe el render ni muestra "NaN" — cae a 0 / 1.
const lineTotal = (p) => {
  const unit = Number(p?.totalPrice) || 0;
  const qty = Number(p?.qty) || 1;
  return (unit * qty).toFixed(2);
};

// Total de artículos por unidades (no por líneas)
const unitCount = computed(() =>
  mainStore.cart.reduce((acc, item) => acc + (item.qty || 0), 0)
);

// Upsell: platillos destacados (⭐, controlados por el dueño) que aún no están en el
// carrito, disponibles y con foto. Al tocar uno se abre su detalle (maneja extras).
const upsellItems = computed(() => {
  const inCart = new Set(mainStore.cart.map((p) => p.id));
  return mainStore.featuredProducts
    .filter((p) => !inCart.has(p.id) && !p.is_sold_out && p.photo)
    .slice(0, 8);
});

const addUpsell = (item) => {
  mainStore.cartDrawer = false;
  mainStore.seeProduct(JSON.parse(JSON.stringify(item)));
};

// Se bloquea "Continuar" si el restaurante pausó pedidos o no se alcanza el mínimo.
const checkoutBlocked = computed(
  () => mainStore.ordersPaused || mainStore.belowMinOrder
);

const continueCheckout = () => {
  if (checkoutBlocked.value) return;
  mainStore.dataDrawer = true;
};
</script>

<style lang="scss" scoped>
// QScrollArea renderiza su contenido con position:absolute y solo min-width:100%,
// o sea ancho "shrink-to-fit". Un hijo con overflow-x:auto (la fila de upsell) NO se
// recorta ahi: aporta su ancho max-content y estira TODO el contenido del cajon, con
// lo que se sale de la vista todo lo alineado a la derecha (editar/eliminar, precio
// de la linea, contador de articulos, pasos 2 y 3, subtotal). Se nota solo cuando hay
// varios destacados. Fijar el ancho al del contenedor devuelve el scroll horizontal
// a la fila de upsell, que es donde debe estar.
:deep(.q-scrollarea__content) {
  width: 100%;
  max-width: 100%;
}

.mc-drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-top: var(--space-lg);
}

.mc-drawer-title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 700;
  margin: 0;
  color: var(--color-text-primary);
}

.mc-cart-alert {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  line-height: 1.35;

  &--min {
    background: color-mix(in srgb, #ff9800 12%, transparent);
    color: var(--color-text-primary);
    border: 1px solid color-mix(in srgb, #ff9800 35%, transparent);
    .q-icon { color: #f57c00; }
  }

  &--paused {
    background: color-mix(in srgb, var(--q-negative) 10%, transparent);
    color: var(--color-text-primary);
    border: 1px solid color-mix(in srgb, var(--q-negative) 35%, transparent);
    .q-icon { color: var(--q-negative); }
  }
}

.mc-cart-bar--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.mc-upsell {
  margin-top: var(--space-lg);
  padding-top: var(--space-md);
  border-top: 1px dashed var(--color-border);
  // El bloque de upsell NUNCA debe pasar del ancho del cajon: si crece, empuja
  // fuera de vista todo lo alineado a la derecha (editar/eliminar, precio, subtotal).
  width: 100%;
  max-width: 100%;
  min-width: 0;

  &__title {
    font-weight: 700;
    font-size: var(--text-base);
    margin: 0 0 var(--space-sm);
    color: var(--color-text-primary);
  }

  &__row {
    display: flex;
    gap: var(--space-sm);
    // La fila se queda en el 100% del cajon y las tarjetas se desplazan DENTRO de
    // ella. Ojo: esto solo recorta si el ancestro tiene un ancho definido — de ahi
    // el width del .q-scrollarea__content de arriba, que QScrollArea deja en auto.
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: auto;
    padding-bottom: var(--space-xs);
    -webkit-overflow-scrolling: touch;
  }

  &__card {
    position: relative;
    flex: 0 0 108px;
    width: 108px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    padding: 0 0 var(--space-xs);
    cursor: pointer;
    text-align: left;
    overflow: hidden;
    transition: var(--transition-fast);

    &:hover {
      border-color: var(--q-primary);
    }
  }

  &__img {
    width: 100%;
    border-radius: var(--radius-md) var(--radius-md) 0 0;
  }

  &__name {
    display: block;
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-primary);
    padding: var(--space-xs) var(--space-xs) 0;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__price {
    display: block;
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--q-primary);
    padding: 0 var(--space-xs);
  }

  &__add {
    position: absolute;
    top: var(--space-xs);
    right: var(--space-xs);
    background: var(--q-primary);
    color: #fff;
    border-radius: 50%;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-sm);
  }
}

.mc-drawer-count {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  font-weight: 500;
}

.mc-empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl) var(--space-lg);
  gap: var(--space-sm);
  text-align: center;

  &__icon {
    width: 76px;
    height: 76px;
    border-radius: var(--radius-full);
    background: var(--color-primary-soft, #ffe5e3);
    color: var(--q-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--space-xs);
  }

  &__text {
    color: var(--color-text-primary);
    font-size: var(--text-base);
    font-weight: 600;
    margin: 0;
  }

  &__hint {
    color: var(--color-text-tertiary);
    font-size: var(--text-sm);
    margin: 0;
    max-width: 240px;
    line-height: 1.4;
  }
}

.mc-cart-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.mc-cart-item {
  background: var(--color-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  transition: border-color var(--transition-fast);

  &:hover {
    border-color: var(--color-border);
  }

  &__main {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  &__thumb {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    border-radius: var(--radius-sm);
    overflow: hidden;
    background: var(--color-surface-variant);
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    display: block;
    font-weight: 600;
    font-size: var(--text-base);
    color: var(--color-text-primary);
  }

  // Botón de comentario. max-width:100% y el ellipsis del texto son obligatorios:
  // un comentario largo desbordaría el q-scrollarea y sacaría de vista el precio
  // y los botones alineados a la derecha (ver el comentario del :deep de arriba).
  &__note {
    display: flex;
    align-items: center;
    gap: 4px;
    max-width: 100%;
    margin-top: 2px;
    padding: 2px 0;
    background: none;
    border: 0;
    cursor: pointer;
    font-family: inherit;
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
    transition: color var(--transition-fast);

    &:hover {
      color: var(--q-primary);
    }

    &--filled {
      color: var(--color-text-secondary);
      font-style: italic;
    }
  }

  &__note-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__qty {
    color: var(--color-text-tertiary);
    font-weight: 500;
    margin-left: var(--space-xs);
    font-variant-numeric: tabular-nums;
  }

  &__extras {
    margin: var(--space-sm) 0 0;
    padding-left: var(--space-md);
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    list-style: none;

    li::before {
      content: "+";
      margin-right: var(--space-xs);
      color: var(--color-text-tertiary);
    }
  }

  &__extra-price {
    font-variant-numeric: tabular-nums;
    color: var(--color-text-primary);
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
    text-align: right;
    font-weight: 700;
    font-size: var(--text-base);
    color: var(--q-primary);
    font-variant-numeric: tabular-nums;
  }

  &__actions {
    display: flex;
    gap: var(--space-xs);
    flex-shrink: 0;
  }

  &__action-btn {
    transition: var(--transition-fast);
    opacity: 0.7;

    &:hover {
      opacity: 1;
    }
  }
}

.mc-cart-subtotal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-md);
  padding: var(--space-md);
  background: var(--color-surface-variant);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text-secondary);

  &__value {
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-text-primary);
    font-variant-numeric: tabular-nums;
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
</style>
