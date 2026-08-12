<template>
  <q-drawer
    v-model="mainStore.addCartDrawer"
    bordered
    overlay
    side="right"
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
      @click="mainStore.addCartDrawer = false"
    />

    <div class="mc-addcart-scroll">
      <div class="q-pa-md">
        <div v-if="mainStore.product">
          <!-- Hero Image -->
          <div class="mc-hero-image">
            <q-img
              v-if="mainStore.product.photo"
              :src="mainStore.product.photo"
              :ratio="4 / 3"
              class="mc-hero-img"
              fit="cover"
            >
              <template #loading>
                <q-skeleton class="full-width full-height" square />
              </template>
            </q-img>
            <div v-else class="mc-hero-placeholder">
              <q-icon name="restaurant_menu" size="48px" />
            </div>
          </div>

          <!-- Product Header -->
          <div class="q-mt-md">
            <h5 class="mc-product-name">{{ mainStore.product.name }}</h5>
            <p class="mc-product-desc">{{ mainStore.product.description }}</p>
          </div>

          <!-- Todo lo que sirve para ARMAR un pedido: extras, comentario y
               cantidad. Con los pedidos apagados el cajón es una ficha de menú y
               nada de esto tiene a dónde ir, así que no se dibuja: elegir el
               término de la carne o pedir tres piezas no lleva a ninguna parte si
               no se puede agregar al carrito. Queda la foto, el nombre y la
               descripción. -->
          <div class="q-mt-md" v-if="mainStore.orderingEnabled">
            <div
              v-for="extra in extrasVisibles"
              :key="extra.id"
              :class="[
                'mc-extra-group',
                extra.hasError ? 'mc-extra-group--error' : ''
              ]"
            >
              <div class="mc-extra-header">
                <span class="mc-extra-name">{{ extra.name }}</span>
                <q-badge
                  v-if="extra.is_required"
                  color="negative"
                  text-color="white"
                  label="Requerido"
                  rounded
                  class="q-ml-sm"
                />
                <q-space />
                <span class="mc-extra-rule">{{ selectionRule(extra) }}</span>
              </div>
              <q-list dense class="mc-extra-list">
                <q-item
                  tag="label"
                  v-ripple
                  v-for="(option, indexOption) in extra.options"
                  :key="'EOptions' + indexOption"
                  class="mc-extra-item"
                >
                  <q-item-section>
                    <q-item-label>
                      {{ option.name }}
                      <!-- Solo aparece cuando ESTA opción tiene un techo menor al
                           del grupo: sin esto el comensal ve un + apagado y no
                           sabe si el límite es del grupo o de este rollo. -->
                      <span
                        v-if="capLabel(extra, option)"
                        class="mc-extra-cap"
                      >{{ capLabel(extra, option) }}</span>
                    </q-item-label>
                  </q-item-section>
                  <q-item-section class="col-2">
                    <q-item-label class="mc-extra-price">{{ checkOptionType(extra, option) }}</q-item-label>
                  </q-item-section>
                  <q-item-section avatar>
                    <!-- El control lo decide la configuración del extra, no sus precios -->
                    <q-radio
                      v-if="controlOf(extra) === 'radio'"
                      v-model="option.qty"
                      :val="1"
                      color="primary"
                      @update:model-value="selectOnly(extra, option)"
                    />
                    <!-- Cantidades: permite repetir la misma opción hasta el tope -->
                    <div v-else-if="controlOf(extra) === 'counter'" class="mc-qty-stepper">
                      <q-btn
                        flat
                        dense
                        round
                        color="primary"
                        icon="remove"
                        size="sm"
                        @click="decrementValue(option)"
                        :disabled="option.qty === 0"
                      />
                      <span class="mc-qty-value">{{ option.qty }}</span>
                      <q-btn
                        flat
                        dense
                        round
                        color="primary"
                        icon="add"
                        size="sm"
                        @click="incrementValue(option)"
                        :disabled="mainStore.isDisabled(extra) || optionFull(extra, option)"
                      />
                    </div>
                    <!-- Varias opciones distintas, sin repetir. Se deshabilitan las
                         no marcadas al llegar al tope: antes dejaba marcar de más. -->
                    <q-checkbox
                      v-else
                      v-model="option.qty"
                      :val="option.id"
                      :true-value="1"
                      :false-value="0"
                      color="primary"
                      :disable="!option.qty && (isFull(extra, extrasDelProducto) || optionFull(extra, option))"
                      @update:model-value="mainStore.updatePrice"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <!-- Comentario del platillo. También aquí y no solo en el carrito:
                 si el comensal le da al lápiz para editar, lo busca donde está
                 todo lo demás del platillo. -->
            <div class="mc-extra-group">
              <div class="row items-center justify-between">
                <span class="mc-extra-name">Comentario</span>
                <q-btn
                  flat
                  dense
                  no-caps
                  size="sm"
                  color="primary"
                  :icon="notaActual ? 'chat_bubble' : 'chat_bubble_outline'"
                  :label="notaActual ? 'Editar' : 'Agregar'"
                  @click="notesDialog = true"
                />
              </div>
              <p v-if="notaActual" class="mc-product-note">{{ notaActual }}</p>
            </div>

            <!-- Quantity -->
            <div class="mc-extra-group">
              <div class="row items-center justify-between">
                <span class="mc-extra-name">Cantidad</span>
                <div class="mc-qty-stepper">
                  <q-btn
                    flat
                    dense
                    round
                    color="primary"
                    icon="remove"
                    size="sm"
                    @click="mainStore.decrementProduct"
                    :disabled="mainStore.product.qty === 1"
                  />
                  <span class="mc-qty-value">{{ mainStore.product.qty }}</span>
                  <q-btn
                    flat
                    dense
                    round
                    color="primary"
                    icon="add"
                    size="sm"
                    @click="mainStore.incrementProduct"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Botón Agregar: en el flujo (se alcanza scrolleando), no tapado en móvil.
               Con los pedidos apagados el menú es solo de consulta: se ven platillos
               y precios, pero no hay forma de agregar nada. -->
          <div class="mc-add-to-cart-bar" v-if="mainStore.orderingEnabled">
            <q-btn
              ref="addBtnRef"
              color="primary"
              unelevated
              no-caps
              class="full-width mc-add-btn"
              size="lg"
              @click="handleAdd"
            >
              <div class="row items-center justify-between full-width q-px-sm">
                <span>{{ mainStore.btnType }} {{ mainStore.product?.qty }}</span>
                <span class="mc-add-btn-price">${{ mainStore.totalPrice }}</span>
              </div>
            </q-btn>
          </div>
        </div>
      </div>
    </div>

    <item-notes-dialog
      v-model="notesDialog"
      :dish-name="mainStore.product?.name || ''"
      :model-value-text="notaActual"
      @save="guardarNota"
      @remove="quitarNota"
    />
  </q-drawer>
</template>

<script setup>
defineOptions({
  name: "AddCartDrawer",
});
import { ref, computed, nextTick } from "vue";
import { useMainStore } from "src/stores/main-store";
import ItemNotesDialog from "./ItemNotesDialog.vue";
import {
  controlOf,
  priceModeOf,
  isFull,
  isOptionFull,
  optionCapLabel,
  isDecorative,
  selectionRuleOf,
} from "src/utils/extraConfig";
const mainStore = useMainStore();
const addBtnRef = ref(null);

// Anima un "punto" con la foto del producto desde el botón hacia la barra del carrito
const flyToCart = (fromRect, photo) => {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const bars = [...document.querySelectorAll(".mc-cart-bar")];
  const target = bars
    .map((b) => b.getBoundingClientRect())
    .find((r) => r.width > 0 && r.top >= 0 && r.top < window.innerHeight);
  if (!target) return;

  const dot = document.createElement("div");
  const size = 60;
  Object.assign(dot.style, {
    position: "fixed",
    left: `${fromRect.left + fromRect.width / 2 - size / 2}px`,
    top: `${fromRect.top + fromRect.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    zIndex: "9999",
    pointerEvents: "none",
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
    background: photo
      ? `center/cover no-repeat url(${photo})`
      : "var(--q-primary)",
  });
  document.body.appendChild(dot);

  const dx = target.left + target.width / 2 - (fromRect.left + fromRect.width / 2);
  const dy = target.top + target.height / 2 - (fromRect.top + fromRect.height / 2);

  const anim = dot.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 40}px) scale(0.9)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.15)`, opacity: 0.4 },
    ],
    { duration: 650, easing: "cubic-bezier(0.4, 0, 0.6, 1)" }
  );
  anim.onfinish = () => dot.remove();
};

const handleAdd = async () => {
  const el = addBtnRef.value?.$el;
  const fromRect = el?.getBoundingClientRect();
  const photo = mainStore.product?.photo;
  const wasEditing = mainStore.cartStore.isEditing;

  mainStore.addToCart();

  // Si se agregó (el drawer se cerró) y no era edición, lanza la animación
  if (!mainStore.addCartDrawer && !wasEditing && fromRect) {
    await nextTick();
    flyToCart(fromRect, photo);
  }
};

const decrementValue = (option) => {
  option.qty = option.qty ?? 0;
  option.qty--;
  mainStore.updatePrice();
};
const incrementValue = (option) => {
  option.qty = option.qty ?? 0;
  option.qty++;
  mainStore.updatePrice();
};

// Comentario del platillo. Se escribe sobre el borrador que se está armando, así
// que viaja solo al carrito cuando le da Agregar, igual que los extras.
const notesDialog = ref(false);
const notaActual = computed(() => mainStore.product?.notes || "");

const guardarNota = (texto) => {
  if (mainStore.product) mainStore.product.notes = texto;
};

const quitarNota = () => {
  if (mainStore.product) delete mainStore.product.notes;
};

// Los extras del platillo, para resolver topes que dependen de otro grupo.
// OJO: aquí van TODOS, incluidos los escondidos. Un grupo decorativo puede seguir
// siendo la fuente del tope de otro, así que filtrarlos aquí rompería el cálculo.
const extrasDelProducto = computed(() => mainStore.product?.extras || []);

// Se esconden los grupos de una sola opción que no cambian el precio: son una
// pregunta con una sola respuesta. Siguen existiendo en los datos y su opción
// sigue seleccionada, así que ni el precio ni la validación de requeridos cambian.
const extrasVisibles = computed(() =>
  extrasDelProducto.value.filter((e) => !isDecorative(e, mainStore.product?.price))
);

const optionFull = (extra, option) => isOptionFull(extra, option, extrasDelProducto.value);
const capLabel = (extra, option) => optionCapLabel(extra, option, extrasDelProducto.value);

// El radio es excluyente: al elegir uno se limpian los demás.
const selectOnly = (extra, option) => {
  extra.options.forEach((o) => {
    if (o.id !== option.id) o.qty = 0;
  });

  // Cambiar de tamaño puede achicar el cupo de otro grupo (de 4 rollos a 3) y
  // reactivar techos por rollo. Se conserva lo elegido y se recorta el sobrante,
  // avisando qué se quitó para que no parezca que la app perdió la selección.
  const quitados = mainStore.productStore.enforceLimits();
  if (quitados.length) {
    const detalle = quitados.map((q) => `${q.count} ${q.name}`).join(", ");
    mainStore.messageStore.error(`Quitamos ${detalle}: ya no cabían en este tamaño`);
  }

  mainStore.updatePrice();
};

// "$425" cuando la opción ES el precio del platillo, "+ $50" cuando se le suma.
const checkOptionType = (extra, option) => {
  if (!(option.price > 0)) return "";
  return priceModeOf(extra) === "replace" ? `$${option.price}` : `+ $${option.price}`;
};

const selectionRule = (extra) => selectionRuleOf(extra, extrasDelProducto.value);
</script>

<style lang="scss" scoped>
.mc-hero-image {
  border-radius: var(--radius-lg);
  overflow: hidden;
  max-height: 340px;
}

.mc-hero-img {
  border-radius: var(--radius-lg);
  max-height: 340px;
}

.mc-hero-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 16 / 9;
  background: var(--color-surface-variant);
  color: var(--color-text-tertiary);
  border-radius: var(--radius-lg);
}

// Techo propio de una opción ("máx. 2"). Discreta pero legible: es la explicación
// de por qué su + está apagado mientras los otros siguen activos.
// El comentario ya escrito, dentro del cajón del platillo.
.mc-product-note {
  margin: var(--space-xs) 0 0;
  font-size: var(--text-sm);
  font-style: italic;
  color: var(--color-text-secondary);
  overflow-wrap: break-word;
}

.mc-extra-cap {
  display: inline-block;
  margin-left: var(--space-xs);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-variant);
  border: 1px solid var(--color-border);
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  vertical-align: middle;
}

.mc-extra-rule {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  font-weight: 500;
  white-space: nowrap;
}

.mc-product-name {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 700;
  margin: 0 0 var(--space-sm);
  color: var(--color-text-primary);
}

.mc-product-desc {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
}

.mc-extra-group {
  background: var(--color-surface-variant);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
  border: 1px solid var(--color-border-subtle);
  transition: border-color var(--transition-fast);

  &--error {
    border-color: var(--q-negative);
    background: var(--color-error-bg);
    animation: shake 0.4s ease;
  }
}

.mc-extra-header {
  display: flex;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.mc-extra-name {
  font-weight: 600;
  font-size: var(--text-base);
  color: var(--color-text-primary);
}

.mc-extra-list {
  margin: 0 calc(var(--space-md) * -1);
}

.mc-extra-item {
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);

  &:hover {
    background: rgba(0, 0, 0, 0.03);
  }
}

.mc-extra-price {
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-secondary);
}

.mc-add-btn {
  border-radius: var(--radius-md);
  font-weight: 600;
}

.mc-add-btn-price {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.mc-addcart-scroll {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.mc-add-to-cart-bar {
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  padding-bottom: calc(var(--space-sm) + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--color-border);
}
</style>
