<template>
  <div class="mc-track">
    <div class="mc-track__inner">
      <!-- Cargando -->
      <div v-if="loading && !data" class="mc-track__center">
        <q-spinner-dots color="primary" size="42px" />
        <p>Cargando tu pedido…</p>
      </div>

      <!-- No encontrado -->
      <div v-else-if="notFound" class="mc-track__center">
        <q-icon name="search_off" size="52px" color="grey-5" />
        <p>No encontramos ese pedido.</p>
        <q-btn flat no-caps color="primary" label="Ir al menú" :to="`/${slug}`" />
      </div>

      <template v-else-if="data">
        <!-- Cabecera negocio -->
        <div class="mc-track__head">
          <q-avatar size="52px" class="mc-track__logo">
            <img v-if="data.establishment.logo" :src="data.establishment.logo" alt="logo" />
            <q-icon v-else name="storefront" size="28px" color="primary" />
          </q-avatar>
          <div>
            <div class="mc-track__biz">{{ data.establishment.name }}</div>
            <!-- En un negocio con varios locales, de cual es: el boton de WhatsApp le
                 escribe a ese local. -->
            <div class="mc-track__code" v-if="data.establishment.local">
              Sucursal {{ data.establishment.local }}
            </div>
            <div class="mc-track__code">Pedido #{{ data.order_code }}</div>
          </div>
        </div>

        <!-- Cancelado -->
        <div v-if="isCancelled" class="mc-track__cancelled">
          <q-icon name="cancel" size="40px" color="negative" />
          <div class="mc-track__cancelled-title">Pedido cancelado</div>
          <p>Si crees que es un error, contacta al restaurante.</p>
        </div>

        <!-- Estado actual + timeline -->
        <template v-else>
          <div class="mc-track__status">
            <q-icon :name="currentStep.icon" size="34px" color="primary" />
            <div>
              <div class="mc-track__status-label">{{ currentStep.label }}</div>
              <div class="mc-track__status-sub">{{ currentStep.sub }}</div>
            </div>
          </div>

          <div class="mc-track__timeline">
            <div
              v-for="(step, i) in steps"
              :key="step.id"
              class="mc-track__step"
              :class="{
                'mc-track__step--done': stepState(step.id) === 'done',
                'mc-track__step--current': stepState(step.id) === 'current',
              }"
            >
              <div class="mc-track__step-marker">
                <q-icon
                  :name="stepState(step.id) === 'done' ? 'check' : step.icon"
                  size="16px"
                />
                <span v-if="i < steps.length - 1" class="mc-track__step-line"></span>
              </div>
              <div class="mc-track__step-body">
                <div class="mc-track__step-label">{{ step.label }}</div>
                <div v-if="stepTime(step.id)" class="mc-track__step-time">{{ stepTime(step.id) }}</div>
              </div>
            </div>
          </div>

          <!-- Repartidor -->
          <div v-if="data.driver" class="mc-track__driver">
            <q-icon name="delivery_dining" size="22px" color="primary" />
            <div class="mc-track__driver-body">
              <div><strong>{{ data.driver.name }}</strong> lleva tu pedido</div>
              <div class="mc-track__driver-sub">Repartidor asignado</div>
            </div>
            <q-btn
              v-if="data.driver.phone"
              flat round dense icon="phone" color="primary"
              :href="`tel:${data.driver.phone}`" type="a"
            />
          </div>

          <!-- Reseña post-entrega -->
          <div v-if="data.current_status_id === 4 && !reviewed" class="mc-track__review">
            <div class="mc-track__review-title">¿Cómo estuvo tu pedido?</div>
            <div class="mc-track__stars">
              <q-icon
                v-for="n in 5"
                :key="n"
                :name="n <= rating ? 'star' : 'star_border'"
                size="32px"
                color="amber-8"
                class="mc-track__star"
                @click="rating = n"
              />
            </div>
            <q-input
              v-model="comment"
              type="textarea"
              autogrow
              filled dense
              placeholder="Cuéntanos qué tal (opcional)"
              class="q-mt-sm"
            />
            <q-btn
              unelevated no-caps color="primary" label="Enviar reseña"
              class="full-width q-mt-sm"
              :disable="!rating"
              :loading="submittingReview"
              @click="submitReview"
            />
          </div>
          <div v-else-if="data.current_status_id === 4 && reviewed" class="mc-track__review mc-track__review--done">
            <q-icon name="check_circle" color="positive" size="26px" />
            <span>¡Gracias por tu reseña! 🙌</span>
          </div>
        </template>

        <!-- Contacto -->
        <div class="mc-track__actions">
          <q-btn
            v-if="waUrl"
            unelevated no-caps color="primary" icon="fab fa-whatsapp"
            label="Contactar al restaurante" :href="waUrl" type="a" target="_blank"
          />
          <q-btn flat no-caps color="grey-7" label="Ver el menú" :to="`/${slug}`" />
        </div>

        <p class="mc-track__refresh">
          <q-icon name="autorenew" size="14px" /> Se actualiza solo
        </p>
      </template>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: "OrderTrackingPage" });

import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { api } from "boot/axios";

const route = useRoute();
const slug = route.params.slug;
const code = route.params.code;

const data = ref(null);
const loading = ref(true);
const notFound = ref(false);
let timer = null;

// Reseña post-entrega
const rating = ref(0);
const comment = ref("");
const submittingReview = ref(false);
const reviewed = ref(false);

const submitReview = async () => {
  if (!rating.value) return;
  submittingReview.value = true;
  try {
    await api.post(`/establishment/${slug}/review`, {
      order_code: Number(code),
      rating: rating.value,
      comment: comment.value || null,
    });
    reviewed.value = true;
  } catch (e) {
    // Si ya existe una reseña para este pedido, igual mostramos el agradecimiento.
    if (e.response?.status === 422 || e.response?.status === 409) {
      reviewed.value = true;
    }
  } finally {
    submittingReview.value = false;
  }
};

const isCancelled = computed(() => data.value?.current_status_id === 5);
const isFinished = computed(
  () => data.value && (data.value.current_status_id === 4 || data.value.current_status_id === 5)
);

const steps = computed(() => {
  const isDelivery = data.value?.delivery === "Envio";
  return [
    { id: 1, label: "Pedido recibido", icon: "receipt_long", sub: "El restaurante recibió tu pedido" },
    { id: 2, label: "En preparación", icon: "restaurant", sub: "Están preparando tu pedido" },
    {
      id: 3,
      label: isDelivery ? "En camino" : "Listo para recoger",
      icon: isDelivery ? "delivery_dining" : "shopping_bag",
      sub: isDelivery ? "Tu pedido va en camino" : "Ya puedes pasar por tu pedido",
    },
    { id: 4, label: "Entregado", icon: "check_circle", sub: "¡Buen provecho!" },
  ];
});

const currentStep = computed(() => {
  const id = data.value?.current_status_id || 1;
  return steps.value.find((s) => s.id === id) || steps.value[0];
});

const stepState = (id) => {
  const cur = data.value?.current_status_id || 1;
  if (id < cur) return "done";
  if (id === cur) return "current";
  return "pending";
};

const stepTime = (id) => {
  const h = (data.value?.history || []).find((x) => x.order_status_id === id);
  if (!h) return "";
  const d = new Date(h.created_at);
  return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
};

const waUrl = computed(() => {
  const raw = (data.value?.establishment?.whatsapp || "").replace(/\D/g, "");
  if (!raw) return "";
  const normalized = raw.length === 10 ? "52" + raw : raw;
  const msg = encodeURIComponent(`Hola, quiero preguntar por mi pedido #${data.value.order_code}`);
  return `https://wa.me/${normalized}?text=${msg}`;
});

const fetchStatus = async () => {
  try {
    const { data: res } = await api.get(`/establishment/${slug}/order/${code}/status`);
    data.value = res;
    notFound.value = false;
    if (isFinished.value && timer) {
      clearInterval(timer);
      timer = null;
    }
  } catch (e) {
    if (e.response?.status === 404) notFound.value = true;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchStatus();
  timer = setInterval(fetchStatus, 20000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style lang="scss" scoped>
.mc-track {
  min-height: 100vh;
  background: var(--color-surface-variant, #f4f1ec);
  display: flex;
  justify-content: center;
  padding: 24px 16px 48px;

  &__inner {
    width: 100%;
    max-width: 460px;
    background: var(--color-surface, #fff);
    border-radius: 18px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
    padding: 22px;
  }

  &__center {
    text-align: center;
    color: var(--color-text-secondary, #6b7280);
    padding: 60px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--color-border, #e7e2da);
  }
  &__logo img { object-fit: cover; }
  &__biz { font-weight: 700; font-size: 1.05rem; color: var(--color-text-primary); }
  &__code { font-size: 0.85rem; color: var(--color-text-secondary); }

  &__status {
    display: flex; align-items: center; gap: 14px;
    padding: 20px 0 8px;
    &-label { font-size: 1.25rem; font-weight: 800; color: var(--color-text-primary); letter-spacing: -0.01em; }
    &-sub { font-size: 0.9rem; color: var(--color-text-secondary); }
  }

  &__timeline { padding: 8px 0 4px; }
  &__step {
    display: flex; gap: 14px;
    &-marker {
      position: relative; flex: none;
      width: 30px; height: 30px; border-radius: 50%;
      display: grid; place-items: center;
      background: var(--color-surface-variant, #eee);
      color: var(--color-text-tertiary, #9ca3af);
      border: 2px solid var(--color-border, #e7e2da);
    }
    &-line {
      position: absolute; top: 30px; left: 50%; transform: translateX(-50%);
      width: 2px; height: calc(100% + 6px);
      background: var(--color-border, #e7e2da);
    }
    &-body { padding-bottom: 22px; }
    &-label { font-weight: 600; color: var(--color-text-primary); }
    &-time { font-size: 0.8rem; color: var(--color-text-secondary); }

    &--done &-marker,
    &--current &-marker {
      background: var(--q-primary); color: #fff; border-color: var(--q-primary);
    }
    &--done &-line { background: var(--q-primary); }
    &--current &-marker { box-shadow: 0 0 0 4px color-mix(in srgb, var(--q-primary) 22%, transparent); }
  }

  &__driver {
    display: flex; align-items: center; gap: 12px;
    background: color-mix(in srgb, var(--q-primary) 7%, transparent);
    border: 1px solid color-mix(in srgb, var(--q-primary) 20%, var(--color-border));
    border-radius: 12px; padding: 12px 14px; margin-top: 8px;
    &-body { flex: 1; font-size: 0.92rem; color: var(--color-text-primary); }
    &-sub { font-size: 0.8rem; color: var(--color-text-secondary); }
  }

  &__review {
    margin-top: 16px;
    padding: 16px;
    border-radius: 12px;
    background: var(--color-surface-variant, #f4f1ec);
    border: 1px solid var(--color-border, #e7e2da);

    &-title { font-weight: 700; color: var(--color-text-primary); margin-bottom: 8px; }
    &--done {
      display: flex; align-items: center; gap: 10px;
      font-weight: 600; color: var(--color-text-primary);
    }
  }
  &__stars { display: flex; gap: 4px; }
  &__star { cursor: pointer; transition: transform 0.1s; &:active { transform: scale(1.2); } }

  &__cancelled {
    text-align: center; padding: 28px 0;
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    &-title { font-size: 1.2rem; font-weight: 800; color: var(--q-negative); }
    p { color: var(--color-text-secondary); margin: 0; }
  }

  &__actions {
    display: flex; flex-direction: column; gap: 8px;
    margin-top: 18px; padding-top: 16px;
    border-top: 1px solid var(--color-border, #e7e2da);
  }

  &__refresh {
    text-align: center; font-size: 0.78rem; color: var(--color-text-tertiary, #9ca3af);
    margin: 14px 0 0;
  }
}
</style>
