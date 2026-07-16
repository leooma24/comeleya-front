<template>
  <q-page class="mc-register-page">
    <div class="mc-register-container">
      <!-- Logo -->
      <div class="mc-register-logo">
        <q-img src="~/src/assets/logo.svg" alt="ComeleYa" width="80px" />
      </div>

      <!-- Progress -->
      <div class="mc-register-progress">
        <div v-for="s in steps" :key="s.num" :class="['mc-progress-step', step >= s.num ? 'mc-progress-step--active' : '', step > s.num ? 'mc-progress-step--done' : '']">
          <div class="mc-progress-dot">
            <q-icon v-if="step > s.num" name="check" size="14px" color="white" />
            <span v-else>{{ s.num }}</span>
          </div>
          <span class="mc-progress-label">{{ s.label }}</span>
        </div>
      </div>

      <!-- Step 1: Tu cuenta -->
      <transition name="mc-slide" mode="out-in">
        <q-card v-if="step === 1" flat bordered class="mc-register-card" key="step1">
          <q-card-section>
            <h5 class="mc-register-title">Crea tu cuenta</h5>
            <p class="mc-register-subtitle">Datos de acceso para administrar tu negocio</p>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <q-form ref="formUser">
              <q-input
                v-model="adminStore.userForm.name"
                label="Nombre completo"
                filled rounded dense
                class="q-mb-md"
                lazy-rules
                :rules="[val => !!val || 'El nombre es requerido']"
              >
                <template v-slot:prepend><q-icon name="person" color="grey-5" /></template>
              </q-input>

              <q-input
                v-model="adminStore.userForm.email"
                label="Correo electronico"
                filled rounded dense
                type="email"
                class="q-mb-md"
                lazy-rules
                :rules="[val => !!val || 'El correo es requerido', val => /.+@.+\..+/.test(val) || 'Ingresa un correo valido']"
              >
                <template v-slot:prepend><q-icon name="mail" color="grey-5" /></template>
              </q-input>

              <div class="row q-col-gutter-md q-mb-md">
                <div class="col-6">
                  <q-input v-model="adminStore.userForm.phone" label="Telefono" filled rounded dense
                    lazy-rules :rules="[val => !!val || 'Requerido']">
                    <template v-slot:prepend><q-icon name="phone" color="grey-5" /></template>
                  </q-input>
                </div>
                <div class="col-6">
                  <q-input v-model="adminStore.userForm.cellphone" label="Celular" filled rounded dense
                    lazy-rules :rules="[val => !!val || 'Requerido']">
                    <template v-slot:prepend><q-icon name="smartphone" color="grey-5" /></template>
                  </q-input>
                </div>
              </div>

              <q-input
                v-model="adminStore.userForm.password"
                label="Contrasena"
                filled rounded dense
                :type="showPass ? 'text' : 'password'"
                class="q-mb-md"
                lazy-rules
                :rules="[val => !!val || 'La contrasena es requerida', val => val.length >= 8 || 'Minimo 8 caracteres']"
              >
                <template v-slot:prepend><q-icon name="lock" color="grey-5" /></template>
                <template v-slot:append>
                  <q-icon :name="showPass ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="showPass = !showPass" color="grey-5" />
                </template>
              </q-input>

              <q-input
                v-model="adminStore.userForm.repeatedPassword"
                label="Confirmar contrasena"
                filled rounded dense
                :type="showPass ? 'text' : 'password'"
                lazy-rules
                :rules="[val => !!val || 'Confirma tu contrasena', val => val === adminStore.userForm.password || 'Las contrasenas no coinciden']"
              >
                <template v-slot:prepend><q-icon name="lock" color="grey-5" /></template>
              </q-input>
            </q-form>
          </q-card-section>
          <q-card-actions class="q-px-md q-pb-lg">
            <q-btn unelevated no-caps color="primary" label="Continuar" icon-right="arrow_forward"
              class="full-width mc-register-btn" @click="toStep2" />
          </q-card-actions>
        </q-card>

        <!-- Step 2: Tu negocio -->
        <q-card v-else-if="step === 2" flat bordered class="mc-register-card" key="step2">
          <q-card-section>
            <h5 class="mc-register-title">Tu negocio</h5>
            <p class="mc-register-subtitle">Informacion basica de tu establecimiento</p>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <q-form ref="formEstablishment">
              <q-input
                v-model="adminStore.companyStore.companyForm.name"
                label="Nombre del negocio"
                filled rounded dense
                class="q-mb-md"
                lazy-rules
                :rules="[val => !!val || 'El nombre es requerido']"
              >
                <template v-slot:prepend><q-icon name="storefront" color="grey-5" /></template>
              </q-input>

              <div class="row q-col-gutter-md q-mb-md">
                <div class="col-6">
                  <q-input v-model="adminStore.companyStore.companyForm.phone" label="Telefono del negocio" filled rounded dense
                    lazy-rules :rules="[val => !!val || 'Requerido']">
                    <template v-slot:prepend><q-icon name="phone" color="grey-5" /></template>
                  </q-input>
                </div>
                <div class="col-6">
                  <q-input v-model="adminStore.companyStore.companyForm.whatsapp" label="WhatsApp" filled rounded dense
                    lazy-rules :rules="[val => !!val || 'Requerido']">
                    <template v-slot:prepend><q-icon name="fab fa-whatsapp" color="green-5" /></template>
                  </q-input>
                </div>
              </div>

              <q-input
                v-model="adminStore.companyStore.companyForm.delivery_charge"
                label="Costo de envio a domicilio"
                filled rounded dense
                prefix="$"
                type="number"
                class="q-mb-md"
                hint="Dejar en 0 si no aplica"
              >
                <template v-slot:prepend><q-icon name="delivery_dining" color="grey-5" /></template>
              </q-input>

              <div class="row q-col-gutter-md">
                <div class="col-6">
                  <q-select
                    v-model="adminStore.companyStore.companyForm.category"
                    label="Categoria"
                    filled rounded dense
                    option-value="id" option-label="name"
                    :options="adminStore.companyStore.categories"
                    :loading="loadingOptions"
                  >
                    <template v-slot:prepend><q-icon name="category" color="grey-5" /></template>
                  </q-select>
                </div>
                <div class="col-6">
                  <q-select
                    v-model="adminStore.companyStore.companyForm.type"
                    label="Tipo"
                    filled rounded dense
                    option-value="id" option-label="name"
                    :options="adminStore.companyStore.types"
                    :loading="loadingOptions"
                  >
                    <template v-slot:prepend><q-icon name="label" color="grey-5" /></template>
                  </q-select>
                </div>
              </div>
            </q-form>
          </q-card-section>
          <q-card-actions class="q-px-md q-pb-lg q-gutter-sm">
            <q-btn flat no-caps color="grey-7" label="Regresar" icon="arrow_back" @click="step = 1" class="col" />
            <q-btn unelevated no-caps color="primary" label="Crear mi negocio" icon-right="rocket_launch"
              @click="save" :loading="saving" class="col mc-register-btn" />
          </q-card-actions>
          <div class="text-center q-pb-md">
            <span v-if="hasPaidPlan" class="text-caption text-positive text-weight-bold">
              Tu pago fue recibido. Completa tu registro para activar tu plan.
            </span>
            <span v-else class="text-caption text-grey-6">Incluye 15 dias gratis con todas las funciones premium</span>
          </div>
        </q-card>
      </transition>

      <!-- Login link -->
      <div class="text-center q-mt-md">
        <span class="mc-register-subtitle">Ya tienes cuenta?</span>
        <q-btn flat no-caps dense color="primary" label="Iniciar sesion" to="/admin/iniciar-sesion" size="sm" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";
const adminStore = useAdminStore();
const route = useRoute();

// Check if coming from MercadoPago checkout
const preapprovalId = ref(route.query.preapproval_id || "");
const paidPackageId = ref(route.query.package_id || "");
const paidBillingType = ref(route.query.billing_type || "");
const hasPaidPlan = ref(!!preapprovalId.value);

const step = ref(1);
const showPass = ref(false);
const saving = ref(false);
const loadingOptions = ref(true);

const formUser = ref(null);
const formEstablishment = ref(null);

const steps = [
  { num: 1, label: "Cuenta" },
  { num: 2, label: "Negocio" },
];


adminStore.userStore.setForm();
adminStore.companyStore.setForm({});

onMounted(async () => {
  try {
    const [catRes, typeRes] = await Promise.all([
      api.get("/public/categories"),
      api.get("/public/types"),
    ]);
    adminStore.companyStore.setCategories(catRes.data.categories || []);
    adminStore.companyStore.setTypes(typeRes.data.types || []);
  } catch (e) {} finally {
    loadingOptions.value = false;
  }
});

const toStep2 = () => {
  formUser.value.validate().then((ok) => {
    if (ok) step.value = 2;
  });
};

const save = async () => {
  formEstablishment.value.validate().then(async (ok) => {
    if (!ok) return;
    saving.value = true;
    try {
      const payload = {
        company: adminStore.companyStore.companyForm,
        user: adminStore.userStore.userForm,
      };
      if (hasPaidPlan.value) {
        payload.preapproval_id = preapprovalId.value;
        payload.package_id = paidPackageId.value;
        payload.billing_type = paidBillingType.value;
        payload.payer_email = adminStore.userStore.userForm.email;
      }
      const { data } = await api.post("/admin/new-establishment", payload);
      adminStore.messageStore.success("Bienvenido a ComeleYa!");
      adminStore.userStore.token = data.token;
      adminStore.userStore.router.push(`/${data.establishment.slug}/admin`);
    } catch (e) {
      adminStore.messageStore.error(e.response?.data?.msg || e.response?.data?.message || "Error al crear el establecimiento");
    } finally {
      saving.value = false;
    }
  });
};
</script>

<style lang="scss" scoped>
.mc-register-page {
  background: var(--color-surface-variant);
  min-height: 100vh;
  padding: var(--space-xl) var(--space-md);
}

.mc-register-container {
  max-width: 520px;
  margin: 0 auto;
}

.mc-register-logo {
  text-align: center;
  margin-bottom: var(--space-lg);
}

// Progress
.mc-register-progress {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: var(--space-xl);
  position: relative;
}

.mc-progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  position: relative;
}

.mc-progress-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: white;
  transition: all 0.3s ease;
}

.mc-progress-step--active .mc-progress-dot {
  background: var(--q-primary);
  box-shadow: 0 0 0 4px rgba(229, 57, 53, 0.15);
}

.mc-progress-step--done .mc-progress-dot {
  background: var(--q-positive);
}

.mc-progress-label {
  font-size: 11px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.mc-progress-step--active .mc-progress-label {
  color: var(--q-primary);
  font-weight: 700;
}

// Card
.mc-register-card {
  border-radius: var(--radius-xl);
  border-color: var(--color-border);
  overflow: hidden;
}

.mc-register-card--wide {
  max-width: 720px;
  margin: 0 auto;
}

.mc-register-title {
  font-size: var(--text-xl);
  font-weight: 700;
  margin: 0 0 4px 0;
  color: var(--color-text-primary);
}

.mc-register-subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.mc-register-btn {
  font-weight: 600;
  padding: 10px 24px;
  border-radius: var(--radius-full);
}

// Plan cards
.mc-plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.mc-plan-card {
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  text-align: center;

  &:hover {
    border-color: var(--q-primary);
    box-shadow: var(--shadow-md);
  }
}

.mc-plan-card--selected {
  border-color: var(--q-primary);
  background: color-mix(in srgb, var(--q-primary) 4%, white);
  box-shadow: var(--shadow-md);
}

.mc-plan-badge {
  position: absolute;
  top: -10px;
  right: 12px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.mc-plan-name {
  font-weight: 700;
  font-size: var(--text-base);
  color: var(--color-text-primary);
}

.mc-plan-price {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--q-primary);
  margin: 4px 0 8px;

  small {
    font-size: var(--text-sm);
    font-weight: 400;
    color: var(--color-text-secondary);
  }
}

.mc-plan-features {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;

  li {
    font-size: 12px;
    color: var(--color-text-secondary);
    padding: 3px 0;

    &::before {
      content: "\2713";
      color: var(--q-primary);
      font-weight: 700;
      margin-right: 6px;
    }
  }
}

.mc-plan-check {
  position: absolute;
  top: 10px;
  left: 10px;
}

// Transition
.mc-slide-enter-active,
.mc-slide-leave-active {
  transition: all 0.3s ease;
}

.mc-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.mc-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

@media (max-width: 600px) {
  .mc-register-progress { gap: 24px; }
  .mc-plan-grid { grid-template-columns: 1fr; }
  .mc-register-card--wide { max-width: 100%; }
}
</style>
