<template>
  <q-page class="mc-login-page">
    <div class="mc-login-container">
      <!-- Left Panel - Branding -->
      <div class="mc-login-branding desktop-only">
        <div class="mc-login-branding__content">
          <q-img
            src="~assets/logo.svg"
            width="80px"
            class="q-mb-lg"
          />
          <h3 class="mc-login-branding__title">
            Gestiona tu negocio desde cualquier lugar
          </h3>
          <p class="mc-login-branding__desc">
            Controla pedidos, menús y estadísticas en tiempo real con el panel de administración.
          </p>

          <div class="mc-login-branding__features">
            <div class="mc-login-feature">
              <q-icon name="trending_up" size="20px" />
              <span>Estadísticas en tiempo real</span>
            </div>
            <div class="mc-login-feature">
              <q-icon name="restaurant_menu" size="20px" />
              <span>Gestión completa del menú</span>
            </div>
            <div class="mc-login-feature">
              <q-icon name="notifications_active" size="20px" />
              <span>Notificaciones de pedidos</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel - Login Form -->
      <div class="mc-login-form-wrapper">
        <div class="mc-login-form">
          <!-- Mobile Logo -->
          <div class="mc-login-logo mobile-only">
            <q-img
              src="~assets/logo.svg"
              width="64px"
            />
          </div>

          <h4 class="mc-login-title">Bienvenido</h4>
          <p class="mc-login-subtitle">Ingresa tus credenciales para acceder al panel</p>

          <!-- Email -->
          <div class="mc-login-field">
            <label class="mc-login-label">Correo electrónico</label>
            <q-input
              v-model="user.email"
              placeholder="tu@correo.com"
              filled
              dense
              rounded
              type="email"
              @keyup.enter="login"
              :error="emailError"
              hide-bottom-space
            >
              <template v-slot:prepend>
                <q-icon name="mail" color="grey-6" size="20px" />
              </template>
            </q-input>
          </div>

          <!-- Password -->
          <div class="mc-login-field">
            <label class="mc-login-label">Contraseña</label>
            <q-input
              v-model="user.password"
              placeholder="Tu contraseña"
              filled
              dense
              rounded
              :type="showPassword ? 'text' : 'password'"
              @keyup.enter="login"
              :error="passwordError"
              hide-bottom-space
            >
              <template v-slot:prepend>
                <q-icon name="lock" color="grey-6" size="20px" />
              </template>
              <template v-slot:append>
                <q-icon
                  :name="showPassword ? 'visibility_off' : 'visibility'"
                  color="grey-6"
                  size="20px"
                  class="cursor-pointer"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>
          </div>

          <!-- Forgot Password -->
          <div class="text-right q-mb-sm">
            <q-btn flat dense no-caps color="primary" label="¿Olvidaste tu contraseña?" size="sm" to="/recuperar-contrasena" />
          </div>

          <!-- Login Button -->
          <q-btn
            color="primary"
            label="Iniciar Sesión"
            no-caps
            unelevated
            size="lg"
            @click="login"
            :loading="user.loading"
            class="full-width mc-login-btn"
          />

          <!-- Divider -->
          <div class="mc-login-divider">
            <span>o continúa con</span>
          </div>

          <!-- Facebook Button -->
          <q-btn
            outline
            no-caps
            size="md"
            @click="loginWithFacebook"
            :loading="user.loading"
            class="full-width mc-facebook-btn"
            text-color="grey-8"
          >
            <q-icon name="fab fa-facebook" color="blue-8" size="20px" class="q-mr-sm" />
            Facebook
          </q-btn>

          <!-- Back link -->
          <div class="mc-login-footer">
            <q-btn
              flat
              no-caps
              color="primary"
              label="Volver al inicio"
              icon="arrow_back"
              size="sm"
              to="/"
              class="mc-back-btn"
            />
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
defineOptions({
  name: "LoginPage",
});
import { reactive, ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useUserStore } from "src/stores/user-store";
import { useQuasar } from "quasar";
const userStore = useUserStore();
const route = useRoute();
const $q = useQuasar();

const showPassword = ref(false);
const emailError = ref(false);
const passwordError = ref(false);

const user = reactive({
  email: "",
  password: "",
  loading: false,
});
const login = async () => {
  emailError.value = false;
  passwordError.value = false;

  if (!user.email) {
    emailError.value = true;
  }
  if (!user.password) {
    passwordError.value = true;
  }
  if (!user.email || !user.password) {
    $q.notify({
      type: "negative",
      message: "Correo y contraseña son requeridos",
    });
    return;
  }
  user.loading = true;
  const response = await userStore.login(user);

  if (response === true) {
    if (userStore.user.role === "super_admin") {
      userStore.router.push("/admin");
    } else {
      const slug = userStore.user.establishments[0].slug ?? route.params.slug;
      userStore.router.push(`/${slug}/admin`);
    }
  } else {
    $q.notify({
      type: "negative",
      message: response,
    });
  }

  user.loading = false;
};

const initFb = () => {
  try {
    window.FB.init({
      appId: import.meta.env.VITE_FACEBOOK_APP_ID || "",
      cookie: true,
      xfbml: true,
      version: "v21.0",
    });
  } catch (e) {
    console.error("FB.init falló", e);
  }
};

// El backend verifica el access token contra la Graph API de Meta y obtiene el email
// real (no se confía en datos del cliente).
const handleFbAuth = async (authResponse) => {
  const ok = await userStore.loginWithFacebook({ access_token: authResponse.accessToken });
  if (ok === true) {
    if (route.params.slug === undefined) {
      userStore.router.push("/admin");
    } else {
      userStore.router.push(`/${route.params.slug}/admin`);
    }
  } else if (typeof ok === "string") {
    $q.notify({ type: "negative", message: ok });
  } else {
    $q.notify({ type: "negative", message: "No se pudo iniciar sesión con Facebook" });
  }
};

const loginWithFacebook = () => {
  // Si el SDK aún no cargó (o está bloqueado), avisamos en vez de quedar mudos.
  if (typeof window.FB === "undefined") {
    $q.notify({
      type: "warning",
      message: "Facebook aún se está cargando. Espera un momento e intenta de nuevo.",
    });
    return;
  }
  // IMPORTANTE: FB.login exige una función NORMAL como callback (no async), o lanza
  // "Expression is of type asyncfunction, not function". El trabajo async se delega.
  window.FB.login(
    (response) => {
      if (response.authResponse) {
        handleFbAuth(response.authResponse);
      } else {
        console.error("El usuario canceló el inicio de sesión.");
      }
    },
    { scope: "email" }
  );
};

onMounted(() => {
  // El SDK (index.html) puede cargar ANTES o DESPUÉS de este onMounted. Si ya está,
  // inicializamos ya; si no, encadenamos su callback sin pisar otro fbAsyncInit.
  if (window.FB) {
    initFb();
  } else {
    const prev = window.fbAsyncInit;
    window.fbAsyncInit = () => {
      if (typeof prev === "function") {
        try {
          prev();
        } catch {
          // noop
        }
      }
      initFb();
    };
  }
});
</script>

<style lang="scss" scoped>
.mc-login-page {
  background: var(--color-surface-variant);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
}

.mc-login-container {
  display: flex;
  width: 100%;
  max-width: 900px;
  min-height: 560px;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

// Left branding panel
.mc-login-branding {
  flex: 1;
  background: var(--q-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: -60px;
    right: -60px;
    width: 200px;
    height: 200px;
    border-radius: var(--radius-full);
    background: rgba(255, 255, 255, 0.08);
  }

  &::after {
    content: "";
    position: absolute;
    bottom: -40px;
    left: -40px;
    width: 150px;
    height: 150px;
    border-radius: var(--radius-full);
    background: rgba(255, 255, 255, 0.06);
  }

  &__content {
    position: relative;
    z-index: 1;
  }

  &__title {
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-weight: 700;
    line-height: 1.3;
    margin: 0 0 var(--space-md);
    letter-spacing: -0.02em;
  }

  &__desc {
    font-size: var(--text-base);
    opacity: 0.85;
    line-height: 1.6;
    margin: 0 0 var(--space-xl);
  }

  &__features {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }
}

.mc-login-feature {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  opacity: 0.9;
  font-weight: 500;
}

// Right form panel
.mc-login-form-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  min-width: 0;
}

.mc-login-form {
  width: 100%;
  max-width: 360px;
}

.mc-login-logo {
  text-align: center;
  margin-bottom: var(--space-lg);
}

.mc-login-title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 700;
  margin: 0 0 var(--space-xs);
  color: var(--color-text-primary);
}

.mc-login-subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-xl);
  line-height: 1.5;
}

.mc-login-field {
  margin-bottom: var(--space-md);
}

.mc-login-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-xs);
}

.mc-login-btn {
  border-radius: var(--radius-md);
  font-weight: 700;
  letter-spacing: 0.02em;
  margin-top: var(--space-sm);
}

.mc-login-divider {
  display: flex;
  align-items: center;
  margin: var(--space-lg) 0;

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: var(--color-border);
  }

  span {
    padding: 0 var(--space-md);
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }
}

.mc-facebook-btn {
  border-radius: var(--radius-md);
  border-color: var(--color-border);
  font-weight: 600;
  transition: all var(--transition-fast);

  &:hover {
    border-color: var(--color-text-tertiary);
    background: var(--color-surface-variant);
  }
}

.mc-login-footer {
  text-align: center;
  margin-top: var(--space-xl);
}

.mc-back-btn {
  font-weight: 500;
}

@media screen and (max-width: 768px) {
  .mc-login-container {
    max-width: 440px;
    min-height: auto;
    border-radius: var(--radius-lg);
  }

  .mc-login-form-wrapper {
    padding: var(--space-lg);
  }
}

@media screen and (max-width: 400px) {
  .mc-login-page {
    padding: 0;
    align-items: stretch;
  }

  .mc-login-container {
    border-radius: 0;
    box-shadow: none;
    min-height: 100vh;
  }

  .mc-login-form-wrapper {
    align-items: flex-start;
    padding-top: var(--space-2xl);
  }
}
</style>
