<template>
  <q-page class="mc-register-page">
    <div class="mc-register-container" style="max-width: 440px;">
      <div class="mc-register-logo">
        <q-img src="~/src/assets/logo.svg" alt="ComeleYa" width="80px" />
      </div>

      <q-card flat bordered class="mc-register-card">
        <q-card-section>
          <h5 class="mc-register-title">Recuperar contraseña</h5>
          <p class="mc-register-subtitle">Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña</p>
        </q-card-section>

        <q-card-section class="q-pt-none" v-if="!sent">
          <q-input
            v-model="email"
            label="Correo electronico"
            filled rounded dense
            type="email"
            @keyup.enter="submit"
            :error="!!error"
            :error-message="error"
          >
            <template v-slot:prepend><q-icon name="mail" color="grey-5" /></template>
          </q-input>
        </q-card-section>

        <q-card-section v-else>
          <div class="text-center q-py-md">
            <q-icon name="check_circle" color="positive" size="56px" />
            <p class="text-body1 text-weight-medium q-mt-md">Correo enviado</p>
            <p class="mc-register-subtitle">Si el correo existe en nuestro sistema, recibiras un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada y spam.</p>
          </div>
        </q-card-section>

        <q-card-actions class="q-px-md q-pb-lg" v-if="!sent">
          <q-btn unelevated no-caps color="primary" label="Enviar enlace" icon="send"
            class="full-width mc-register-btn" @click="submit" :loading="loading" />
        </q-card-actions>

        <q-card-actions class="q-px-md q-pb-lg" v-else>
          <q-btn unelevated no-caps color="primary" label="Volver a iniciar sesion" icon="arrow_back"
            class="full-width mc-register-btn" to="/admin/iniciar-sesion" />
        </q-card-actions>
      </q-card>

      <div class="text-center q-mt-md">
        <q-btn flat no-caps dense color="primary" label="Volver a iniciar sesion" to="/admin/iniciar-sesion" size="sm" icon="arrow_back" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import { api } from "boot/axios";

const email = ref("");
const loading = ref(false);
const sent = ref(false);
const error = ref("");

const submit = async () => {
  error.value = "";
  if (!email.value) { error.value = "El correo es requerido"; return; }
  loading.value = true;
  try {
    await api.post("/forgot-password", { email: email.value });
    sent.value = true;
  } catch (e) {
    error.value = e.response?.data?.message || "Error al enviar. Intenta de nuevo.";
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.mc-register-page {
  background: var(--color-surface-variant);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl) var(--space-md);
}
.mc-register-container { width: 100%; }
.mc-register-logo { text-align: center; margin-bottom: var(--space-lg); }
.mc-register-card { border-radius: var(--radius-xl); border-color: var(--color-border); }
.mc-register-title { font-size: var(--text-xl); font-weight: 700; margin: 0 0 4px 0; }
.mc-register-subtitle { font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0; }
.mc-register-btn { font-weight: 600; padding: 10px 24px; border-radius: var(--radius-full); }
</style>
