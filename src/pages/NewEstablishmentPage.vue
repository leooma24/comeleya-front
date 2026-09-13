<template>
  <q-page class="mc-register-page">
    <div class="mc-register-container">
      <div class="mc-register-logo">
        <q-img src="~/src/assets/logo.svg" alt="ComeleYa" width="80px" />
      </div>

      <q-card flat bordered class="mc-register-card">
        <q-card-section>
          <h5 class="mc-register-title">Crea tu menú en un minuto</h5>
          <p class="mc-register-subtitle" :class="{ 'text-positive text-weight-bold': hasPaidPlan }">
            {{
              hasPaidPlan
                ? "Tu pago fue recibido. Completa tus datos para activar tu plan."
                : "15 días gratis con todas las funciones. Sin tarjeta."
            }}
          </p>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form ref="formulario" @submit="crear">
            <q-input
              v-model="forma.nombre"
              label="Tu nombre"
              autocomplete="name"
              filled rounded dense
              class="q-mb-sm"
              lazy-rules
              :rules="[requerido('Escribe tu nombre')]"
            >
              <template v-slot:prepend><q-icon name="person" color="grey-5" /></template>
            </q-input>

            <q-input
              v-model="forma.negocio"
              label="Nombre de tu negocio"
              autocomplete="organization"
              filled rounded dense
              class="q-mb-sm"
              lazy-rules
              :rules="[requerido('Escribe el nombre de tu negocio')]"
            >
              <template v-slot:prepend><q-icon name="storefront" color="grey-5" /></template>
            </q-input>

            <q-input
              v-model="forma.whatsapp"
              label="WhatsApp del negocio"
              type="tel"
              inputmode="numeric"
              autocomplete="tel"
              hint="Aquí te van a llegar los pedidos"
              filled rounded dense
              class="q-mb-sm"
              lazy-rules
              :rules="[whatsappValido]"
            >
              <template v-slot:prepend><q-icon name="fab fa-whatsapp" color="green-5" /></template>
            </q-input>

            <q-input
              v-model="forma.correo"
              label="Correo"
              type="email"
              autocomplete="email"
              filled rounded dense
              class="q-mb-sm"
              lazy-rules
              :rules="[requerido('Escribe tu correo'), correoValido]"
            >
              <template v-slot:prepend><q-icon name="mail" color="grey-5" /></template>
            </q-input>

            <q-input
              v-model="forma.clave"
              label="Contraseña"
              :type="verClave ? 'text' : 'password'"
              autocomplete="new-password"
              filled rounded dense
              lazy-rules
              :rules="[claveValida]"
            >
              <template v-slot:prepend><q-icon name="lock" color="grey-5" /></template>
              <template v-slot:append>
                <q-icon
                  :name="verClave ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  color="grey-5"
                  @click="verClave = !verClave"
                />
              </template>
            </q-input>

            <q-btn
              type="submit"
              unelevated
              no-caps
              color="primary"
              label="Crear mi menú"
              icon-right="rocket_launch"
              class="full-width mc-register-btn q-mt-md"
              :loading="guardando"
            />
          </q-form>
        </q-card-section>

        <p class="mc-register-despues">
          Tu horario, dirección y costo de envío los configuras después, desde tu panel.
        </p>
      </q-card>

      <div class="text-center q-mt-md">
        <span class="mc-register-subtitle">¿Ya tienes cuenta?</span>
        <q-btn flat no-caps dense color="primary" label="Iniciar sesión" to="/admin/iniciar-sesion" size="sm" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
/**
 * El alta de un negocio.
 *
 * Eran doce datos en dos pasos: telefono, celular, telefono del negocio y WhatsApp por
 * separado, costo de envio, categoria, tipo y la contraseña dos veces. Cada dato de mas
 * es alguien que se va antes de ver su menu. Ahora son cinco en una pantalla, y lo demas
 * lo va pidiendo el panel cuando hace falta (Avisos.vue).
 */
import { ref, reactive } from "vue";
import { useRoute } from "vue-router";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";
import { leerReferencia } from "src/utils/referencia";

const adminStore = useAdminStore();
const route = useRoute();

// Si viene de pagar en Mercado Pago: SubscriptionResultPage lo manda con estos datos.
const preapprovalId = route.query.preapproval_id || "";
const paidPackageId = route.query.package_id || "";
const paidBillingType = route.query.billing_type || "";
const hasPaidPlan = !!preapprovalId;

const forma = reactive({ nombre: "", negocio: "", whatsapp: "", correo: "", clave: "" });
const verClave = ref(false);
const guardando = ref(false);
const formulario = ref(null);

const soloDigitos = (v) => String(v ?? "").replace(/\D/g, "");

const requerido = (mensaje) => (val) => !!String(val ?? "").trim() || mensaje;
const correoValido = (val) => /.+@.+\..+/.test(String(val ?? "").trim()) || "Escribe un correo válido";
const whatsappValido = (val) =>
  soloDigitos(val).length >= 10 || "Escribe los 10 dígitos de tu WhatsApp";
const claveValida = (val) => String(val ?? "").length >= 8 || "Mínimo 8 caracteres";

/** El primer error que mande el servidor, dicho como lo dijo. */
const mensajeDe = (e) => {
  const errores = e?.response?.data?.errors;
  const primero = errores && Object.values(errores)[0];
  return (
    (Array.isArray(primero) ? primero[0] : primero) ||
    e?.response?.data?.msg ||
    e?.response?.data?.message ||
    "No pudimos crear tu negocio. Intenta de nuevo."
  );
};

// q-form solo llama a crear cuando todos los campos pasaron sus reglas.
const crear = async () => {
  guardando.value = true;
  const whatsapp = soloDigitos(forma.whatsapp);
  try {
    const payload = {
      // El WhatsApp llena los telefonos: es el numero que el negocio de verdad contesta.
      // Se mandan aunque el servidor ya no los exija, para que el alta funcione tambien
      // con un servidor que todavia los pida.
      user: {
        name: forma.nombre.trim(),
        email: forma.correo.trim(),
        password: forma.clave,
        phone: whatsapp,
        cellphone: whatsapp,
      },
      company: { name: forma.negocio.trim(), whatsapp, phone: whatsapp },
    };
    const referencia = leerReferencia();
    if (referencia) payload.ref = referencia;
    if (hasPaidPlan) {
      payload.preapproval_id = preapprovalId;
      payload.package_id = paidPackageId;
      payload.billing_type = paidBillingType;
      payload.payer_email = payload.user.email;
    }

    const { data } = await api.post("/admin/new-establishment", payload);
    adminStore.userStore.token = data.token;
    // Sin el usuario, el panel lo daba por no autenticado y el dueño nuevo aterrizaba en
    // su primer vistazo sin barra de navegacion, hasta que volviera a iniciar sesion.
    try {
      await adminStore.userStore.getUser();
    } catch {
      // Si falla, el panel igual abre; la barra aparece en cuanto vuelva a entrar.
    }
    adminStore.messageStore.success("¡Bienvenido a ComeleYa!");
    adminStore.userStore.router.push(`/${data.establishment.slug}/admin`);
  } catch (e) {
    adminStore.messageStore.error(mensajeDe(e));
  } finally {
    guardando.value = false;
  }
};
</script>

<style lang="scss" scoped>
.mc-register-page {
  background: var(--color-surface-variant);
  min-height: 100vh;
  padding: var(--space-xl) var(--space-md);
}

.mc-register-container {
  max-width: 460px;
  margin: 0 auto;
}

.mc-register-logo {
  text-align: center;
  margin-bottom: var(--space-lg);
}

.mc-register-card {
  border-radius: var(--radius-xl);
  border-color: var(--color-border);
  overflow: hidden;
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

.mc-register-despues {
  margin: 0;
  padding: 0 var(--space-md) var(--space-md);
  text-align: center;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}
</style>
