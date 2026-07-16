<template>
  <q-page class="mc-register-page">
    <div class="mc-register-container" style="max-width: 440px;">
      <div class="mc-register-logo">
        <q-img src="~/src/assets/logo.svg" alt="ComeleYa" width="80px" />
      </div>

      <q-card flat bordered class="mc-register-card">
        <q-card-section>
          <h5 class="mc-register-title">Nueva contraseña</h5>
          <p class="mc-register-subtitle">Ingresa tu nueva contraseña</p>
        </q-card-section>

        <q-card-section class="q-pt-none" v-if="!success">
          <q-input
            v-model="form.password"
            label="Nueva contraseña"
            filled rounded dense
            :type="showPass ? 'text' : 'password'"
            class="q-mb-md"
            :rules="[val => !!val || 'Requerido', val => val.length >= 8 || 'Minimo 8 caracteres']"
            lazy-rules
          >
            <template v-slot:prepend><q-icon name="lock" color="grey-5" /></template>
            <template v-slot:append>
              <q-icon :name="showPass ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="showPass = !showPass" color="grey-5" />
            </template>
          </q-input>

          <q-input
            v-model="form.password_confirmation"
            label="Confirmar contraseña"
            filled rounded dense
            :type="showPass ? 'text' : 'password'"
            :rules="[val => !!val || 'Requerido', val => val === form.password || 'Las contraseñas no coinciden']"
            lazy-rules
          >
            <template v-slot:prepend><q-icon name="lock" color="grey-5" /></template>
          </q-input>

          <div v-if="error" class="text-negative text-caption q-mt-sm">{{ error }}</div>
        </q-card-section>

        <q-card-section v-else>
          <div class="text-center q-py-md">
            <q-icon name="check_circle" color="positive" size="56px" />
            <p class="text-body1 text-weight-medium q-mt-md">Contrasena actualizada</p>
            <p class="mc-register-subtitle">Ya puedes iniciar sesion con tu nueva contraseña.</p>
          </div>
        </q-card-section>

        <q-card-actions class="q-px-md q-pb-lg" v-if="!success">
          <q-btn unelevated no-caps color="primary" label="Restablecer contraseña" icon="lock_reset"
            class="full-width mc-register-btn" @click="submit" :loading="loading" />
        </q-card-actions>

        <q-card-actions class="q-px-md q-pb-lg" v-else>
          <q-btn unelevated no-caps color="primary" label="Iniciar sesion" icon="login"
            class="full-width mc-register-btn" to="/admin/iniciar-sesion" />
        </q-card-actions>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "boot/axios";

const route = useRoute();
const router = useRouter();
const showPass = ref(false);
const loading = ref(false);
const success = ref(false);
const error = ref("");

const form = ref({
  email: "",
  token: "",
  password: "",
  password_confirmation: "",
});

onMounted(() => {
  form.value.token = route.query.token || "";
  form.value.email = route.query.email || "";
  if (!form.value.token || !form.value.email) {
    router.push("/recuperar-contraseña");
  }
});

const submit = async () => {
  error.value = "";
  if (!form.value.password || form.value.password.length < 8) { error.value = "La contraseña debe tener minimo 8 caracteres"; return; }
  if (form.value.password !== form.value.password_confirmation) { error.value = "Las contraseñas no coinciden"; return; }
  loading.value = true;
  try {
    await api.post("/reset-password", form.value);
    success.value = true;
  } catch (e) {
    error.value = e.response?.data?.message || "Error al restablecer. El enlace puede haber expirado.";
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
