<template>
  <div>
    <q-card flat class="mc-admin-card" :class="{ 'mc-seccion-app': modoApp }">
      <mc-encabezado
        v-if="modoApp"
        atras
        titulo="Sucursales"
        :subtitulo="adminStore.company?.name || 'Tu negocio'"
        :cifras="[
          { v: sucursales.length, l: 'Sucursales' },
          { v: activasCuenta, l: 'Activas' },
          { v: sinUbicacion, l: 'Sin ubicar' },
        ]"
        @atras="volverAMas"
      >
        <template v-slot:acciones>
          <button type="button" class="mc-head__ic mc-head__ic--fuerte" @click="nueva">
            <mc-icon name="plus" :size="17" />
          </button>
        </template>
      </mc-encabezado>

      <div class="mc-admin-card__header" v-if="!modoApp">
        <div class="mc-admin-card__title">
          <q-icon name="storefront" size="24px" color="primary" class="q-mr-sm" />
          Sucursales
        </div>
        <q-btn
          unelevated
          color="primary"
          icon="add"
          no-caps
          label="Nueva sucursal"
          size="sm"
          @click="nueva"
        />
      </div>

      <!-- Lo que hay que entender antes de dar de alta la primera: la sucursal no
           duplica el menu, y el local de siempre no se captura aqui. Sin esto, lo
           primero que se pregunta el dueño es si va a tener que capturar sus platillos
           otra vez, o si tiene que dar de alta su propio negocio como sucursal. -->
      <div class="mc-suc-intro" v-if="!cargando">
        Tu negocio ya cuenta como la <strong>Matriz</strong>, con los datos de Dirección:
        aquí das de alta tus <strong>otros</strong> locales. El menú, los precios y las
        reglas de cobro son los mismos para todos; lo que cambia es el costo del envío,
        porque se mide desde el local más cercano al cliente.
      </div>

      <div class="mc-lista" v-if="modoApp && !cargando">
        <!-- La Matriz, fija arriba. No se edita aqui: sus datos son los del negocio y
             viven en Direccion; copiarlos era garantizar que un dia no coincidan. -->
        <div class="mc-lista__fila" @click="editarMatriz">
          <span class="mc-lista__ini">MA</span>
          <div class="mc-lista__txt">
            <div class="mc-lista__nom">Matriz</div>
            <div class="mc-lista__meta">
              {{ matriz.full_address || "Sin dirección" }}
              <span v-if="!matriz.coordinates" class="mc-lista__apagado"> · sin ubicación</span>
              <span v-else-if="matriz.orders_paused && hayActivas" class="mc-lista__apagado"> · en pausa</span>
            </div>
          </div>
          <div class="mc-lista__der" @click.stop>
            <row-actions-menu titulo="Matriz" :actions="accionesMatriz" />
          </div>
        </div>

        <div
          v-for="s in sucursales"
          :key="s.id"
          class="mc-lista__fila"
          :class="{ 'mc-lista__fila--off': !s.active }"
          @click="editar(s)"
        >
          <span class="mc-lista__ini">{{ (s.name || "?").trim().slice(0, 2).toUpperCase() }}</span>
          <div class="mc-lista__txt">
            <div class="mc-lista__nom">{{ s.name }}</div>
            <div class="mc-lista__meta">
              {{ s.full_address || "Sin dirección" }}
              <span v-if="!s.coordinates" class="mc-lista__apagado"> · sin ubicación</span>
              <span v-else-if="!s.active" class="mc-lista__apagado"> · apagada</span>
              <span v-else-if="s.orders_paused" class="mc-lista__apagado"> · en pausa</span>
            </div>
          </div>
          <div class="mc-lista__der" @click.stop>
            <row-actions-menu :titulo="s.name" :actions="accionesDe(s)" />
          </div>
        </div>

        <div v-if="!sucursales.length" class="mc-lista__vacio">
          Con tu primera sucursal, tus clientes van a poder elegir entre la Matriz y esa.
          Agrégala con el botón de arriba.
        </div>
      </div>

      <div class="mc-admin-table-wrapper" v-if="!modoApp && !cargando">
        <table class="mc-admin-table">
          <thead>
            <tr>
              <th class="text-left">Sucursal</th>
              <th class="text-left">Dirección</th>
              <th class="text-center">Ubicación</th>
              <th class="text-center">Estado</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <!-- La Matriz, fija arriba. Sin interruptor: es el negocio mismo. -->
            <tr>
              <td class="text-left text-weight-medium">Matriz</td>
              <td class="text-left">{{ matriz.full_address || "—" }}</td>
              <td class="text-center">
                <q-chip
                  dense
                  size="sm"
                  :color="matriz.coordinates ? 'positive' : 'grey-4'"
                  :text-color="matriz.coordinates ? 'white' : 'grey-8'"
                >
                  {{ matriz.coordinates ? "Ubicada" : "Sin ubicar" }}
                </q-chip>
              </td>
              <td class="text-center text-caption text-grey-7">
                <q-chip v-if="matriz.orders_paused && hayActivas" dense size="sm" color="warning" text-color="white">
                  En pausa
                </q-chip>
                <template v-else>Datos del negocio</template>
              </td>
              <td class="text-right">
                <row-actions-menu titulo="Matriz" :actions="accionesMatriz" />
              </td>
            </tr>
            <tr v-for="s in sucursales" :key="s.id">
              <td class="text-left text-weight-medium">{{ s.name }}</td>
              <td class="text-left">{{ s.full_address || "—" }}</td>
              <td class="text-center">
                <q-chip
                  dense
                  size="sm"
                  :color="s.coordinates ? 'positive' : 'grey-4'"
                  :text-color="s.coordinates ? 'white' : 'grey-8'"
                >
                  {{ s.coordinates ? "Ubicada" : "Sin ubicar" }}
                </q-chip>
              </td>
              <td class="text-center">
                <q-chip
                  dense
                  size="sm"
                  :color="!s.active ? 'grey-4' : s.orders_paused ? 'warning' : 'positive'"
                  :text-color="s.active ? 'white' : 'grey-8'"
                >
                  {{ !s.active ? "Apagada" : s.orders_paused ? "En pausa" : "Activa" }}
                </q-chip>
              </td>
              <td class="text-right">
                <row-actions-menu :titulo="s.name" :actions="accionesDe(s)" />
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!sucursales.length" class="mc-empty-state">
          <q-icon name="storefront" size="48px" color="grey-4" />
          <p>Con tu primera sucursal, tus clientes van a poder elegir entre la Matriz y esa.</p>
        </div>
      </div>

      <div v-if="cargando" class="mc-empty-state">
        <q-spinner color="primary" size="28px" />
      </div>
    </q-card>

    <base-form-drawer
      v-model="cajon"
      :form-data="forma"
      :title="forma.id ? 'Editar sucursal' : 'Nueva sucursal'"
      save-label="Guardar sucursal"
      :loading="guardando"
      @save="guardar"
    >
      <admin-section
        title="Identidad"
        icon="storefront"
        description="Como la va a ver el cliente al elegir de dónde le llega el pedido."
      >
        <q-input
          v-model="forma.name"
          label="Nombre de la sucursal"
          filled
          dense
          hint="Centro, Plaza del Sol, Sucursal Norte..."
        />
      </admin-section>

      <admin-section
        title="Dirección"
        icon="place"
        description="La que se imprime en el ticket y la que ve el repartidor."
      >
        <div class="row q-col-gutter-sm">
          <q-input class="col-8" v-model="forma.street" label="Calle" filled dense />
          <q-input class="col-4" v-model="forma.exterior_number" label="Número" filled dense />
        </div>
        <div class="row q-col-gutter-sm q-mt-xs">
          <q-input class="col-6" v-model="forma.town" label="Colonia" filled dense />
          <q-input class="col-6" v-model="forma.postal_code" label="C.P." filled dense />
        </div>
        <div class="row q-col-gutter-sm q-mt-xs">
          <q-input class="col-6" v-model="forma.city" label="Ciudad" filled dense />
          <q-input class="col-6" v-model="forma.state" label="Estado" filled dense />
        </div>
        <q-input
          v-model="forma.references"
          label="Referencias"
          filled
          dense
          class="q-mt-xs"
        />
      </admin-section>

      <admin-section
        title="Ubicación en el mapa"
        icon="my_location"
        description="De aquí sale el costo del envío: se mide desde este punto hasta el cliente. Sin ubicación, esta sucursal cobra la tarifa fija."
      >
        <q-input
          v-model="forma.coordinates"
          label="Coordenadas"
          filled
          dense
          placeholder="25.7925,-108.9807"
        >
          <template v-slot:append>
            <q-btn
              flat
              dense
              round
              icon="my_location"
              color="primary"
              :loading="ubicando"
              @click="usarMiUbicacion"
            >
              <q-tooltip>Usar mi ubicación actual</q-tooltip>
            </q-btn>
          </template>
        </q-input>
        <p class="mc-suc-hint">
          Lo más fácil: párate en la sucursal y toca el botón de ubicación.
          <a
            v-if="forma.coordinates"
            :href="'https://maps.google.com/?q=' + forma.coordinates"
            target="_blank"
            rel="noopener"
          >
            Ver en el mapa
          </a>
        </p>
      </admin-section>

      <admin-section
        title="Contacto"
        icon="chat"
        description="Con un WhatsApp propio, los pedidos de esta sucursal le llegan directo. Vacío, siguen llegando al número del negocio."
      >
        <q-input v-model="forma.whatsapp" label="WhatsApp" filled dense />
        <q-input v-model="forma.phone" label="Teléfono" filled dense class="q-mt-xs" />
      </admin-section>

      <admin-section
        title="Disponibilidad"
        icon="visibility"
        description="Apagada deja de ofrecerse al cliente, pero conserva los pedidos que ya salieron de ahí."
      >
        <q-toggle v-model="forma.active" color="primary" label="Se le ofrece al cliente" />
      </admin-section>
    </base-form-drawer>
  </div>
</template>

<script setup>
defineOptions({ name: "AdminSucursales" });

import { ref, computed, onMounted } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";
import { useConfirmDialog } from "src/composables/useConfirmDialog";
import { useModoApp } from "src/composables/useModoApp";
import BaseFormDrawer from "./BaseFormDrawer.vue";
import AdminSection from "./AdminSection.vue";
import RowActionsMenu from "./RowActionsMenu.vue";
import McIcon from "./movil/McIcon.vue";
import McEncabezado from "./movil/Encabezado.vue";
import { matrizDe } from "src/utils/sucursales";

const adminStore = useAdminStore();
const { confirmDelete } = useConfirmDialog();
const { modoApp } = useModoApp();

const sucursales = ref([]);
const cargando = ref(true);
const guardando = ref(false);
const ubicando = ref(false);
const cajon = ref(false);

const vacia = () => ({
  id: null,
  name: "",
  street: "",
  exterior_number: "",
  interior_number: "",
  town: "",
  city: "",
  state: "",
  postal_code: "",
  references: "",
  coordinates: "",
  whatsapp: "",
  phone: "",
  active: true,
});

const forma = ref(vacia());

const activasCuenta = computed(() => sucursales.value.filter((s) => s.active).length);

/** Las que no pueden cobrar envío por distancia: es el dato que hay que arreglar. */
const sinUbicacion = computed(() => sucursales.value.filter((s) => !s.coordinates).length);

const volverAMas = () => {
  adminStore.tab = "mc_mas";
};

/** El negocio mismo, que cuenta como un local más. Se lee de sus datos, no se captura. */
const matriz = computed(() => matrizDe(adminStore.company));

// Sus datos viven en los cajones de siempre -la dirección en Dirección, la ubicación en
// Configuración junto al cobro por distancia, el WhatsApp en los datos del
// establecimiento-. Aquí solo se abren. Tocar la fila lleva a lo que le falta.
const editarMatriz = () =>
  matriz.value.coordinates
    ? adminStore.setAddressDrawer(true)
    : adminStore.setConfigurationDrawer(true);
/** Con al menos una sucursal encendida: sin ellas, pausar la Matriz no significa nada. */
const hayActivas = computed(() => sucursales.value.some((s) => s.active));

/** Pausar o reanudar un local desde la lista, sin tener que ir a Pedidos. */
const accionPausa = (local, pausado) => ({
  key: "pausa",
  icon: pausado ? "play_arrow" : "pause",
  color: pausado ? "positive" : "warning",
  label: pausado ? "Reanudar pedidos" : "Pausar pedidos",
  handler: async () => {
    if (await adminStore.pausarLocal(local, !pausado)) await cargar();
  },
});

const accionesMatriz = computed(() => [
  ...(hayActivas.value ? [accionPausa("matriz", matriz.value.orders_paused)] : []),
  {
    key: "dir",
    icon: "place",
    color: "grey-7",
    label: "Editar dirección",
    handler: () => adminStore.setAddressDrawer(true),
  },
  {
    key: "ubi",
    icon: "my_location",
    color: "grey-7",
    label: "Editar ubicación",
    handler: () => adminStore.setConfigurationDrawer(true),
  },
  {
    key: "wa",
    icon: "chat",
    color: "grey-7",
    label: "Editar WhatsApp",
    handler: () => adminStore.setEstablishmentDrawer(true),
  },
]);

const cargar = async () => {
  cargando.value = true;
  try {
    const { data } = await api.get(`/admin/${adminStore.slug}/branches`);
    sucursales.value = data.branches ?? [];
    // Los pedidos y la comanda deciden con esta lista si hablar de "Matriz". Se
    // actualiza aquí para que no haga falta recargar el panel después de dar de alta.
    if (adminStore.company?.id) {
      adminStore.company.active_branches = sucursales.value.filter((s) => s.active);
    }
  } catch (e) {
    adminStore.messageStore.error("No se pudieron cargar las sucursales");
  } finally {
    cargando.value = false;
  }
};

const nueva = () => {
  forma.value = vacia();
  cajon.value = true;
};

const editar = (s) => {
  // Copia y no el objeto de la lista: si se cierra sin guardar, la fila no debe
  // quedarse con lo que se alcanzó a teclear.
  forma.value = { ...vacia(), ...s };
  cajon.value = true;
};

const guardar = async () => {
  if (!forma.value.name?.trim()) {
    adminStore.messageStore.error("Ponle un nombre a la sucursal");
    return;
  }
  guardando.value = true;
  try {
    const cuerpo = { ...forma.value };
    if (cuerpo.id) {
      await api.put(`/admin/${adminStore.slug}/branches/${cuerpo.id}`, cuerpo);
    } else {
      await api.post(`/admin/${adminStore.slug}/branches`, cuerpo);
    }
    adminStore.messageStore.success(cuerpo.id ? "Sucursal actualizada" : "Sucursal creada");
    cajon.value = false;
    await cargar();
  } catch (e) {
    adminStore.messageStore.error(
      e?.response?.data?.message || "No se pudo guardar la sucursal"
    );
  } finally {
    guardando.value = false;
  }
};

const alternar = async (s) => {
  try {
    await api.put(`/admin/${adminStore.slug}/branches/${s.id}`, { ...s, active: !s.active });
    await cargar();
  } catch (e) {
    adminStore.messageStore.error("No se pudo cambiar la sucursal");
  }
};

const borrar = (s) => {
  confirmDelete("sucursal", async () => {
    try {
      await api.delete(`/admin/${adminStore.slug}/branches/${s.id}`);
      adminStore.messageStore.success("Sucursal eliminada");
      await cargar();
    } catch (e) {
      // El servidor no deja borrar una sucursal con cajeros asignados y dice quienes son:
      // un "no se pudo" generico dejaba al dueño sin saber que hacer.
      adminStore.messageStore.error(e?.response?.data?.message || "No se pudo eliminar la sucursal");
    }
  });
};

const accionesDe = (s) => [
  { key: "edit", icon: "edit", color: "grey-7", label: "Editar", handler: () => editar(s) },
  // Una apagada no se ofrece al cliente: no hay nada que pausar.
  ...(s.active ? [accionPausa(String(s.id), s.orders_paused)] : []),
  {
    key: "toggle",
    icon: s.active ? "visibility_off" : "visibility",
    color: "grey-7",
    label: s.active ? "Apagar" : "Encender",
    handler: () => alternar(s),
  },
  {
    key: "delete",
    icon: "delete_outline",
    color: "negative",
    label: "Eliminar",
    handler: () => borrar(s),
  },
];

/**
 * Las coordenadas a mano son la parte donde se equivoca cualquiera. Parado en la
 * sucursal, el propio teléfono ya sabe la respuesta.
 */
const usarMiUbicacion = () => {
  if (!navigator.geolocation) {
    adminStore.messageStore.error("Este dispositivo no puede darnos la ubicación");
    return;
  }
  ubicando.value = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      forma.value.coordinates = `${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`;
      ubicando.value = false;
      adminStore.messageStore.success("Ubicación tomada");
    },
    () => {
      ubicando.value = false;
      adminStore.messageStore.error(
        "No se pudo obtener la ubicación. Escríbela a mano o revisa el permiso."
      );
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
};

onMounted(cargar);
</script>

<style lang="scss" scoped>
.mc-suc-intro {
  margin: 12px var(--mc-lado, 16px) 0;
  padding: 11px 13px;
  border-radius: 12px;
  background: var(--color-surface-variant);
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.mc-suc-hint {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin: var(--space-xs) 0 0;
  line-height: 1.5;
}
</style>
