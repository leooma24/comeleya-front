<template>
  <div>
    <q-card flat class="mc-admin-card" :class="{ 'mc-seccion-app': modoApp }">
      <mc-encabezado
        v-if="modoApp"
        atras
        titulo="Equipo"
        :subtitulo="adminStore.company?.name || 'Tu negocio'"
        :cifras="[{ v: equipo.length, l: equipo.length === 1 ? 'Cajero' : 'Cajeros' }]"
        @atras="volverAMas"
      >
        <template v-slot:acciones>
          <button
            v-if="habilitado"
            type="button"
            class="mc-head__ic mc-head__ic--fuerte"
            aria-label="Nuevo cajero"
            @click="nuevo"
          >
            <mc-icon name="plus" :size="17" />
          </button>
        </template>
      </mc-encabezado>

      <div class="mc-admin-card__header" v-if="!modoApp">
        <div class="mc-admin-card__title">
          <q-icon name="badge" size="24px" color="primary" class="q-mr-sm" />
          Equipo
        </div>
        <q-btn
          v-if="habilitado"
          unelevated
          color="primary"
          icon="person_add"
          no-caps
          label="Nuevo cajero"
          size="sm"
          @click="nuevo"
        />
      </div>

      <!-- Lo primero que pregunta el dueño es que va a poder ver la otra persona. Se
           contesta aqui, antes de que la de de alta, y no despues en una llamada. -->
      <div class="mc-equipo-intro" v-if="!cargando">
        Tus cajeros entran con su correo y su contraseña y <strong>solo ven Pedidos</strong>:
        aceptan, preparan, envían, entregan y cancelan, imprimen el ticket, asignan
        repartidor, ven el historial, cierran el día y sacan el corte de caja. No ven tu
        menú, tus ventas, tu configuración ni tu plan.
      </div>

      <!-- Sin el plan no se da de alta a nadie, pero la lista se sigue viendo: si el plan
           vencio, el dueño tiene que poder quitarle el acceso a quien ya estaba. -->
      <div class="mc-equipo-plan" v-if="!cargando && !habilitado">
        <span>Tu plan no incluye cuentas para tu equipo.</span>
        <q-btn flat dense no-caps color="primary" label="Ver planes" @click="irAPlanes" />
      </div>

      <div class="mc-lista" v-if="modoApp && !cargando">
        <div v-for="p in equipo" :key="p.id" class="mc-lista__fila" @click="editar(p)">
          <span class="mc-lista__ini">{{ iniciales(p.name) }}</span>
          <div class="mc-lista__txt">
            <div class="mc-lista__nom">{{ p.name }}</div>
            <div class="mc-lista__meta">{{ p.email }} · {{ ultimoAcceso(p) }}</div>
          </div>
          <div class="mc-lista__der" @click.stop>
            <row-actions-menu :titulo="p.name" :actions="accionesDe(p)" />
          </div>
        </div>

        <div v-if="!equipo.length" class="mc-lista__vacio">
          Todavía no hay nadie en tu equipo.
          <template v-if="habilitado">Agrega a tu primer cajero con el botón de arriba.</template>
        </div>
      </div>

      <div class="mc-admin-table-wrapper" v-if="!modoApp && !cargando">
        <table class="mc-admin-table">
          <thead>
            <tr>
              <th class="text-left">Nombre</th>
              <th class="text-left">Correo</th>
              <th class="text-left">Último acceso</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in equipo" :key="p.id">
              <td class="text-left text-weight-medium">{{ p.name }}</td>
              <td class="text-left">{{ p.email }}</td>
              <td class="text-left">{{ ultimoAcceso(p) }}</td>
              <td class="text-right">
                <row-actions-menu :titulo="p.name" :actions="accionesDe(p)" />
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!equipo.length" class="mc-empty-state">
          <q-icon name="badge" size="48px" color="grey-4" />
          <p>Todavía no hay nadie en tu equipo</p>
        </div>
      </div>

      <div v-if="cargando" class="mc-empty-state">
        <q-spinner color="primary" size="28px" />
      </div>
    </q-card>

    <base-form-drawer
      v-model="cajon"
      :form-data="forma"
      :title="forma.id ? 'Editar cajero' : 'Nuevo cajero'"
      :save-label="forma.id ? 'Guardar cambios' : 'Dar de alta'"
      :loading="guardando"
      @save="guardar"
    >
      <admin-section
        title="Quién es"
        icon="badge"
        description="Con este nombre lo vas a reconocer en la lista de tu equipo."
      >
        <q-input v-model="forma.name" label="Nombre" filled dense />
      </admin-section>

      <admin-section
        title="Acceso"
        icon="lock"
        :description="
          forma.id
            ? 'Deja la contraseña en blanco para no cambiarla. Si la cambias, dásela en persona.'
            : 'Con este correo y esta contraseña entra al panel. Dáselos en persona: no le mandamos correo.'
        "
      >
        <q-input v-model="forma.email" type="email" label="Correo" filled dense autocomplete="off" />
        <q-input
          v-model="forma.password"
          :type="verClave ? 'text' : 'password'"
          :label="forma.id ? 'Nueva contraseña (opcional)' : 'Contraseña'"
          hint="Mínimo 8 caracteres"
          filled
          dense
          class="q-mt-xs"
          autocomplete="new-password"
        >
          <template v-slot:append>
            <q-icon
              :name="verClave ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="verClave = !verClave"
            />
          </template>
        </q-input>
      </admin-section>
    </base-form-drawer>
  </div>
</template>

<script setup>
/**
 * El equipo del negocio: las cuentas de cajero.
 *
 * El dueño da de alta a quien le cobra en el mostrador. Esa cuenta solo ve Pedidos; lo
 * impide el servidor (CheckAdminOrCompanyAccess) y el panel solo lo refleja.
 */
defineOptions({ name: "AdminEquipo" });

import { ref, onMounted } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";
import { useConfirmDialog } from "src/composables/useConfirmDialog";
import { useModoApp } from "src/composables/useModoApp";
import BaseFormDrawer from "./BaseFormDrawer.vue";
import AdminSection from "./AdminSection.vue";
import RowActionsMenu from "./RowActionsMenu.vue";
import McIcon from "./movil/McIcon.vue";
import McEncabezado from "./movil/Encabezado.vue";

const adminStore = useAdminStore();
const { confirm } = useConfirmDialog();
const { modoApp } = useModoApp();

const equipo = ref([]);
// Si el plan permite dar de alta. Lo dice el servidor junto con la lista.
const habilitado = ref(false);
const cargando = ref(true);
const guardando = ref(false);
const cajon = ref(false);
const verClave = ref(false);

const vacia = () => ({ id: null, name: "", email: "", password: "" });
const forma = ref(vacia());

const volverAMas = () => {
  adminStore.tab = "mc_mas";
};
const irAPlanes = () => {
  adminStore.tab = "mi_plan";
};

const iniciales = (nombre) => (nombre || "?").trim().slice(0, 2).toUpperCase();

const ultimoAcceso = (p) =>
  p.last_login_at
    ? `entró ${new Date(p.last_login_at).toLocaleString("es-MX", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : "aún no entra";

const cargar = async () => {
  cargando.value = true;
  try {
    const { data } = await api.get(`/admin/${adminStore.slug}/team`);
    equipo.value = data.team ?? [];
    habilitado.value = !!data.enabled;
  } catch (e) {
    adminStore.messageStore.error("No se pudo cargar tu equipo");
  } finally {
    cargando.value = false;
  }
};

const nuevo = () => {
  forma.value = vacia();
  verClave.value = false;
  cajon.value = true;
};

const editar = (p) => {
  // Copia, y la contraseña en blanco: nunca viaja del servidor al panel.
  forma.value = { ...vacia(), id: p.id, name: p.name, email: p.email };
  verClave.value = false;
  cajon.value = true;
};

/** El primer error que mande el servidor, dicho como lo dijo. */
const mensajeDe = (e, porDefecto) => {
  const errores = e?.response?.data?.errors;
  const primero = errores && Object.values(errores)[0];
  return (Array.isArray(primero) ? primero[0] : primero) || e?.response?.data?.message || porDefecto;
};

const guardar = async () => {
  const f = forma.value;
  if (!f.name?.trim() || !f.email?.trim()) {
    adminStore.messageStore.error("Escribe el nombre y el correo");
    return;
  }
  if ((!f.id || f.password) && (f.password || "").length < 8) {
    adminStore.messageStore.error("La contraseña debe tener al menos 8 caracteres");
    return;
  }

  guardando.value = true;
  try {
    const cuerpo = { name: f.name.trim(), email: f.email.trim() };
    if (f.password) cuerpo.password = f.password;

    if (f.id) {
      await api.put(`/admin/${adminStore.slug}/team/${f.id}`, cuerpo);
      adminStore.messageStore.success("Cajero actualizado");
    } else {
      await api.post(`/admin/${adminStore.slug}/team`, cuerpo);
      adminStore.messageStore.success("Listo: ya puede entrar con su correo y contraseña");
    }
    cajon.value = false;
    await cargar();
  } catch (e) {
    adminStore.messageStore.error(mensajeDe(e, "No se pudo guardar"));
  } finally {
    guardando.value = false;
  }
};

const quitar = (p) => {
  confirm(
    "Quitar acceso",
    `${p.name} ya no va a poder entrar al panel. Los pedidos que atendió no se borran.`,
    async () => {
      try {
        await api.delete(`/admin/${adminStore.slug}/team/${p.id}`);
        adminStore.messageStore.success("Acceso retirado");
        await cargar();
      } catch (e) {
        adminStore.messageStore.error(mensajeDe(e, "No se pudo quitar el acceso"));
      }
    }
  );
};

const accionesDe = (p) => [
  ...(habilitado.value
    ? [{ key: "edit", icon: "edit", color: "grey-7", label: "Editar", handler: () => editar(p) }]
    : []),
  {
    key: "remove",
    icon: "person_remove",
    color: "negative",
    label: "Quitar acceso",
    handler: () => quitar(p),
  },
];

onMounted(cargar);
</script>

<style lang="scss" scoped>
.mc-equipo-intro {
  margin: 12px var(--mc-lado, 16px) 0;
  padding: 11px 13px;
  border-radius: 12px;
  background: var(--color-surface-variant);
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.mc-equipo-plan {
  margin: 10px var(--mc-lado, 16px) 0;
  padding: 8px 13px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12.5px;
  background: color-mix(in srgb, var(--q-warning, #fb8c00) 12%, transparent);
  color: var(--color-text-primary);
}
</style>
