<template>
  <q-dialog v-model="showDialog" backdrop-filter="blur(8px)">
    <q-card style="border-radius: 16px; min-width: 320px; max-width: 420px">
      <q-card-section class="review-header">
        <q-icon name="rate_review" size="24px" color="amber-8" class="q-mr-sm" />
        <span class="review-header__title">Calificar pedido</span>
        <q-space />
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-card-section>
        <p class="text-grey-7 q-mb-md">
          ¿Cómo fue tu experiencia con tu pedido?
        </p>

        <!-- Star Rating -->
        <div class="review-stars q-mb-lg">
          <q-btn
            v-for="star in 5"
            :key="star"
            flat
            round
            dense
            :icon="star <= rating ? 'star' : 'star_border'"
            :color="star <= rating ? 'amber-8' : 'grey-4'"
            size="lg"
            @click="rating = star"
          />
        </div>

        <q-input
          filled
          dense
          rounded
          v-model="orderCode"
          label="Número de pedido"
          class="q-mb-md"
        >
          <template v-slot:prepend>
            <q-icon name="confirmation_number" />
          </template>
        </q-input>

        <q-input
          filled
          dense
          rounded
          v-model="customerName"
          label="Tu nombre"
          class="q-mb-md"
        >
          <template v-slot:prepend>
            <q-icon name="person" />
          </template>
        </q-input>

        <q-input
          filled
          dense
          rounded
          v-model="comment"
          type="textarea"
          label="Comentario (opcional)"
          autogrow
        />
      </q-card-section>

      <q-card-actions class="q-px-lg q-pb-lg">
        <q-space />
        <q-btn
          unelevated
          no-caps
          color="primary"
          label="Enviar reseña"
          :disable="!rating || !orderCode || !customerName"
          :loading="submitting"
          @click="submitReview"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
defineOptions({
  name: "ReviewDialog",
});

import { ref } from "vue";
import { api } from "boot/axios";
import { useMainStore } from "src/stores/main-store";

const mainStore = useMainStore();

const showDialog = defineModel({ default: false });
const emit = defineEmits(["submitted"]);

const rating = ref(0);
const comment = ref("");
const orderCode = ref("");
const customerName = ref("");
const submitting = ref(false);

const submitReview = async () => {
  submitting.value = true;
  try {
    await api.post(`/establishment/${mainStore.companyStore.slug}/review`, {
      order_code: orderCode.value,
      rating: rating.value,
      comment: comment.value,
      customer_name: customerName.value,
    });
    mainStore.messageStore.success("¡Gracias por tu reseña!");
    emit("submitted");
    showDialog.value = false;
    rating.value = 0;
    comment.value = "";
    orderCode.value = "";
    customerName.value = "";
  } catch (error) {
    mainStore.messageStore.error(
      error.response?.data?.message || "No se pudo enviar la reseña"
    );
  } finally {
    submitting.value = false;
  }
};
</script>

<style lang="scss" scoped>
.review-header {
  display: flex;
  align-items: center;

  &__title {
    font-size: 18px;
    font-weight: 700;
  }
}

.review-stars {
  display: flex;
  justify-content: center;
  gap: var(--space-xs);
}
</style>
