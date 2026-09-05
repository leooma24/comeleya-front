<template>
  <q-card flat class="mc-admin-card">
    <div class="mc-admin-card__header">
      <div class="mc-admin-card__title">
        <q-icon name="store" size="24px" color="primary" class="q-mr-sm" />
        Establecimientos
      </div>

      <div class="row items-center q-gutter-sm">
        <q-input
          color="primary"
          filled
          dense
          rounded
          debounce="300"
          v-model="filter"
          placeholder="Buscar establecimiento..."
          class="mc-admin-search"
        >
          <template v-slot:prepend>
            <q-icon name="search" size="18px" color="grey-5" />
          </template>
        </q-input>

        <!-- Escritorio nada mas: en celular la vista es la lista de app y este par
             de botones solo ocuparia un renglon para no cambiar nada. -->
        <div class="mc-view-toggle" v-if="!modoApp">
          <q-btn
            flat round
            :color="showResults === 'table' ? 'primary' : 'grey-5'"
            icon="view_list" size="sm"
            @click="showResults = 'table'; pagination.rowsPerPage = 5"
          >
            <q-tooltip>Vista lista</q-tooltip>
          </q-btn>
          <q-btn
            flat round
            :color="showResults === 'card' ? 'primary' : 'grey-5'"
            icon="grid_view" size="sm"
            @click="showResults = 'card'; pagination.rowsPerPage = 6"
          >
            <q-tooltip>Vista tarjeta</q-tooltip>
          </q-btn>
        </div>

        <!-- Generar Demo es para ensenar el producto, no para todos los dias. En
             celular se queda como icono: el renglon completo que ocupaba su texto
             empujaba la lista fuera de la primera pantalla. -->
        <q-btn
          v-if="!modoApp"
          outline
          color="teal"
          icon="science"
          no-caps
          label="Generar Demo"
          class="mc-admin-add-btn"
          @click="generateDemo"
          :loading="generatingDemo"
        />
        <q-btn
          v-else
          outline
          round
          color="teal"
          icon="science"
          @click="generateDemo"
          :loading="generatingDemo"
        >
          <q-tooltip>Generar Demo</q-tooltip>
        </q-btn>
        <q-btn
          unelevated
          color="primary"
          icon="add"
          no-caps
          label="Agregar"
          class="mc-admin-add-btn"
          @click="adminStore.addEstablishment"
        />
      </div>
    </div>

    <!-- La lista de celular. La tabla se queda intacta para escritorio: son ocho
         columnas y en 390 px no caben, asi que se arrastraba de lado y lo primero
         que quedaba fuera era el nombre -reportado con una foto donde se leia
         "oneless Pizza"-. Aqui cada negocio es un renglon con lo que se necesita
         para decidir: quien es, de que es y en que plan esta. -->
    <div class="mc-lista" v-if="modoApp">
      <div
        v-for="est in establecimientosFiltrados"
        :key="est.id"
        class="mc-lista__fila"
        :class="{ 'mc-lista__fila--off': est.status !== 'Activo' }"
        @click="adminEstablishment(est)"
      >
        <span class="mc-lista__ini">
          <img v-if="est.logo" :src="est.logo" alt="" />
          <template v-else>{{ (est.name || '?').trim().slice(0, 2).toUpperCase() }}</template>
        </span>
        <div class="mc-lista__txt">
          <div class="mc-lista__nom">{{ est.name }}</div>
          <div class="mc-lista__meta">
            {{ est.category?.name || 'Sin categoría' }}
            · {{ est.active_subscription?.package?.name || 'Sin plan' }}
            <span v-if="est.status !== 'Activo'" class="mc-lista__apagado"> · inactivo</span>
          </div>
        </div>
        <div class="mc-lista__der" @click.stop>
          <row-actions-menu :titulo="est.name" :actions="accionesDe(est)" />
        </div>
      </div>

      <div v-if="!establecimientosFiltrados.length" class="mc-lista__vacio">
        {{ filter ? "Ningún establecimiento con ese nombre." : "Todavía no hay establecimientos." }}
      </div>
    </div>

    <q-table
      v-if="!modoApp"
      flat
      :grid="showResults === 'card'"
      :rows="adminStore.establishments"
      :columns="columns"
      row-key="name"
      :filter="filter"
      no-data-label="No se encontraron establecimientos"
      rows-per-page-label="Registros por página:"
      v-model:pagination="pagination"
      :rows-per-page-options="rowsPerPageOptions"
      hide-header-in-grid
      class="mc-inner-table"
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="logo" :props="props" style="width: 60px">
            <q-avatar v-if="props.row.logo" size="40px" rounded>
              <q-img :src="props.row.logo" />
            </q-avatar>
            <q-avatar v-else size="40px" rounded color="grey-3" text-color="grey-6" icon="store" />
          </q-td>
          <q-td key="name" :props="props">
            <span class="text-weight-medium">{{ props.row.name }}</span>
          </q-td>
          <q-td key="category" :props="props">
            <q-chip v-if="props.row.category?.name" dense size="sm" color="grey-3" text-color="grey-8">
              {{ props.row.category?.name }}
            </q-chip>
            <span v-else class="text-grey-5">—</span>
          </q-td>
          <q-td key="slug" :props="props">
            <code class="mc-slug-code">{{ props.row.slug }}</code>
          </q-td>
          <q-td
            key="users"
            :props="props"
            class="relative show-hover"
            style="max-width: 200px"
          >
            <div class="row items-center q-gutter-xs">
              <q-chip
                v-for="user in props.row.users"
                :key="user.id"
                dense
                size="sm"
                color="primary"
                text-color="white"
                :label="user.name"
              />
            </div>
            <q-btn
              flat
              size="sm"
              dense
              round
              icon="person_add"
              color="primary"
              class="absolute-right item-to-show"
              @click="searchUserShow(props.row)"
            >
              <q-tooltip>Agregar usuario</q-tooltip>
            </q-btn>
          </q-td>
          <q-td key="plan" :props="props">
            <template v-if="props.row.active_subscription">
              <q-chip dense size="sm" color="teal-1" text-color="teal-9">
                {{ props.row.active_subscription.package?.name || 'Plan' }}
              </q-chip>
              <div class="text-caption text-grey-6" style="font-size: 10px">
                {{ props.row.active_subscription.days_remaining != null
                  ? props.row.active_subscription.days_remaining + ' días'
                  : '' }}
              </div>
            </template>
            <span v-else class="text-grey-5 text-caption">Sin plan</span>
          </q-td>
          <q-td key="phone" :props="props">
            {{ formatPhone(props.row.phone) }}
          </q-td>
          <q-td key="status" :props="props">
            <q-chip
              dense
              :color="props.row.status === 'Activo' ? 'positive' : 'grey-4'"
              :text-color="props.row.status === 'Activo' ? 'white' : 'grey-7'"
              size="sm"
            >
              {{ props.row.status === 'Activo' ? 'Activo' : 'Inactivo' }}
            </q-chip>
          </q-td>
          <q-td key="actions" :props="props">
            <q-btn flat size="sm" dense round icon="open_in_new" color="grey-7" @click="adminEstablishment(props.row)">
              <q-tooltip>Abrir panel</q-tooltip>
            </q-btn>
            <q-btn flat size="sm" dense round icon="card_membership" color="teal" @click="openAssignPlan(props.row)">
              <q-tooltip>Asignar plan</q-tooltip>
            </q-btn>
            <q-btn flat size="sm" dense round icon="edit" color="grey-7" @click="adminStore.editEstablishment(props.row)">
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
            <q-btn flat size="sm" dense round icon="delete_outline" color="negative" @click="deleteEstablishment(props.row)">
              <q-tooltip>Eliminar</q-tooltip>
            </q-btn>
          </q-td>
        </q-tr>
      </template>

      <template v-slot:item="props">
        <div class="q-pa-sm col-xs-12 col-sm-6 col-md-4">
          <q-card flat class="mc-establishment-card">
            <q-card-section class="mc-establishment-card__top">
              <q-avatar v-if="props.row.logo" size="48px" rounded>
                <q-img :src="props.row.logo" />
              </q-avatar>
              <q-avatar v-else size="48px" rounded color="grey-3" text-color="grey-6" icon="store" />
              <div class="mc-establishment-card__info">
                <div class="text-weight-bold">{{ props.row.name }}</div>
                <div class="text-caption text-grey-6">{{ props.row.category?.name || 'Sin categoría' }}</div>
              </div>
            </q-card-section>
            <q-card-section class="mc-establishment-card__details">
              <div class="mc-detail-row">
                <q-icon name="link" size="14px" color="grey-5" />
                <code class="mc-slug-code">{{ props.row.slug }}</code>
              </div>
              <div class="mc-detail-row" v-if="props.row.phone">
                <q-icon name="phone" size="14px" color="grey-5" />
                <span>{{ formatPhone(props.row.phone) }}</span>
              </div>
              <div class="mc-detail-row">
                <q-icon name="card_membership" size="14px" color="grey-5" />
                <q-chip v-if="props.row.active_subscription" dense size="sm" color="teal-1" text-color="teal-9">
                  {{ props.row.active_subscription.package?.name || 'Plan' }}
                  <template v-if="props.row.active_subscription.days_remaining != null">
                    · {{ props.row.active_subscription.days_remaining }}d
                  </template>
                </q-chip>
                <span v-else class="text-grey-5">Sin plan</span>
              </div>
            </q-card-section>
            <q-card-actions class="mc-establishment-card__actions">
              <q-btn flat size="sm" dense round icon="open_in_new" color="grey-7" @click="adminEstablishment(props.row)">
                <q-tooltip>Abrir panel</q-tooltip>
              </q-btn>
              <q-space />
              <q-btn flat size="sm" dense round icon="card_membership" color="teal" @click="openAssignPlan(props.row)">
                <q-tooltip>Asignar plan</q-tooltip>
              </q-btn>
              <q-btn flat size="sm" dense round icon="edit" color="grey-7" @click="adminStore.editEstablishment(props.row)">
                <q-tooltip>Editar</q-tooltip>
              </q-btn>
              <q-btn flat size="sm" dense round icon="delete_outline" color="negative" @click="deleteEstablishment(props.row)">
                <q-tooltip>Eliminar</q-tooltip>
              </q-btn>
            </q-card-actions>
          </q-card>
        </div>
      </template>
    </q-table>
  </q-card>

  <FormDrawer />

  <!-- Assign plan dialog -->
  <q-dialog v-model="showPlanDialog">
    <q-card style="min-width: 380px">
      <q-card-section>
        <div class="text-h6">Asignar plan</div>
        <div class="text-caption text-grey-6">{{ planTarget?.name }}</div>
      </q-card-section>
      <q-card-section>
        <q-select v-model="planForm.package_id" :options="packageOptions" emit-value map-options filled dense label="Paquete" class="q-mb-md" />
        <q-select v-model="planForm.type" :options="[{label:'Mensual',value:'monthly'},{label:'Anual',value:'yearly'}]" emit-value map-options filled dense label="Tipo" class="q-mb-md" />
        <q-input v-model.number="planForm.duration_days" type="number" filled dense label="Duración (días)" hint="15 = prueba, 30 = mensual, 365 = anual" />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat no-caps label="Cancelar" v-close-popup />
        <q-btn unelevated no-caps color="primary" label="Asignar" icon="check" @click="assignPlan" :loading="assigningPlan" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- User assignment dialog -->
  <q-dialog v-model="adminStore.searchUserDialog" persistent>
    <q-card class="mc-user-dialog">
      <q-card-section class="mc-user-dialog__header">
        <div class="row items-center q-gutter-sm">
          <q-icon name="people" size="24px" color="primary" />
          <span class="text-weight-bold text-body1">Usuarios asignados</span>
        </div>
        <q-btn
          flat
          round
          dense
          icon="close"
          color="grey-6"
          @click="adminStore.searchUserDialog = false"
        />
      </q-card-section>

      <q-card-section class="mc-user-dialog__chips">
        <q-chip
          v-for="u in establishmentUsers"
          :key="u.id"
          removable
          color="primary"
          text-color="white"
          @remove="removeUserFromEstablishment(u, establish)"
          :label="u.name"
        />
        <span v-if="!establishmentUsers.length" class="text-grey-5 text-caption">
          No hay usuarios asignados
        </span>
      </q-card-section>

      <q-card-section>
        <q-input
          v-model="adminStore.searchUser"
          filled
          dense
          rounded
          placeholder="Buscar usuario..."
        >
          <template v-slot:prepend>
            <q-icon name="search" size="18px" color="grey-5" />
          </template>
        </q-input>
      </q-card-section>

      <q-card-section class="mc-user-dialog__list">
        <q-list>
          <q-item
            v-for="user in adminStore.usersToSearch"
            :key="user.id"
            clickable
            v-ripple
            v-show="!establishmentUsers.some((u) => u.id === user.id)"
            @click="addUserToEstablishment(user)"
            class="mc-user-list-item"
          >
            <q-item-section avatar>
              <q-avatar size="32px" color="grey-3" text-color="grey-7">
                {{ user.name?.charAt(0)?.toUpperCase() }}
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ user.name }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="add" color="primary" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
defineOptions({
  name: "EstablishmentsComponent",
});

import { ref, computed } from "vue";

import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";
import { useConfirmDialog } from "src/composables/useConfirmDialog";
import FormDrawer from "./establishments/FormDrawer.vue";
import RowActionsMenu from "./RowActionsMenu.vue";
import { useModoApp } from "src/composables/useModoApp";
const adminStore = useAdminStore();
const { confirmDelete } = useConfirmDialog();
const { modoApp } = useModoApp();

const filter = ref("");
const showResults = ref("table");
const generatingDemo = ref(false);

const formatPhone = (phone) => {
  if (!phone || phone === "0") return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 13 && digits.startsWith("521")) {
    const local = digits.slice(3);
    return `+52 (${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
  }
  return phone;
};

// Assign plan
// La q-table filtra sola con su prop `filter`; la lista de celular no, asi que el
// mismo texto se aplica aqui. Se busca por lo que alguien teclearia para dar con un
// negocio: su nombre, su slug, su categoria o su telefono.
const establecimientosFiltrados = computed(() => {
  const q = filter.value.trim().toLowerCase();
  const todos = adminStore.establishments || [];
  if (!q) return todos;

  return todos.filter((e) =>
    [e.name, e.slug, e.category?.name, e.phone].some((v) =>
      String(v || "").toLowerCase().includes(q)
    )
  );
});

// Las mismas cuatro acciones de la tabla. En celular se abren en la hoja de abajo,
// donde "Eliminar" queda separado del resto en vez de a un dedo de "Editar".
const accionesDe = (est) => [
  { key: "abrir", icon: "open_in_new", color: "grey-7", label: "Abrir panel", handler: () => adminEstablishment(est) },
  { key: "plan", icon: "card_membership", color: "teal", label: "Asignar plan", handler: () => openAssignPlan(est) },
  { key: "edit", icon: "edit", color: "grey-7", label: "Editar", handler: () => adminStore.editEstablishment(est) },
  { key: "delete", icon: "delete_outline", color: "negative", label: "Eliminar", handler: () => deleteEstablishment(est) },
];

const showPlanDialog = ref(false);
const planTarget = ref(null);
const assigningPlan = ref(false);
const planForm = ref({ package_id: null, type: "monthly", duration_days: 15 });
const packageOptions = ref([]);

const openAssignPlan = async (est) => {
  planTarget.value = est;
  planForm.value = { package_id: null, type: "monthly", duration_days: 15 };
  showPlanDialog.value = true;
  if (!packageOptions.value.length) {
    try {
      const { data } = await api.get("/admin/packages");
      packageOptions.value = (data.packages || []).map(p => ({ label: `${p.name} ($${p.monthly_price}/mes)`, value: p.id }));
    } catch (e) {
      adminStore.messageStore.error("No se pudieron cargar los paquetes");
    }
  }
};

const assignPlan = async () => {
  if (!planForm.value.package_id) return adminStore.messageStore.error("Selecciona un paquete");
  assigningPlan.value = true;
  try {
    const { data } = await api.post(`/admin/establishments/${planTarget.value.id}/assign-plan`, planForm.value);
    // Update the row in the list so UI reflects the new plan immediately
    if (data.subscription) {
      planTarget.value.active_subscription = data.subscription;
    } else {
      // Fallback: build it from form data so it shows right away
      const pkg = packageOptions.value.find(p => p.value === planForm.value.package_id);
      planTarget.value.active_subscription = {
        package: { name: pkg?.label?.split(' (')[0] || 'Plan' },
        days_remaining: planForm.value.duration_days,
      };
    }
    adminStore.messageStore.success(data.message || "Plan asignado");
    showPlanDialog.value = false;
  } catch (e) {
    adminStore.messageStore.error(e.response?.data?.message || "Error al asignar plan");
  } finally {
    assigningPlan.value = false;
  }
};

const generateDemo = async () => {
  generatingDemo.value = true;
  try {
    const { data } = await api.post("/admin/generate-demo");
    adminStore.messageStore.success(data.message);
    adminStore.getEstablishments();
  } catch (e) {
    adminStore.messageStore.error(e.response?.data?.message ?? "Error al generar demo");
  } finally {
    generatingDemo.value = false;
  }
};

const pagination = ref({
  page: 1,
  rowsPerPage: 5,
});

const establishmentUsers = ref([]);
const establish = ref(null);

const searchUserShow = async (establishment) => {
  establish.value = establishment;
  establishmentUsers.value = establishment.users || [];
  adminStore.searchUser = "";
  if (!adminStore.userStore.users.length) {
    await adminStore.getUsers();
  }
  adminStore.searchUserDialog = true;
};

const adminEstablishment = (establishment) => {
  window.open(`/${establishment.slug}/admin`, "_blank");
};

const addUserToEstablishment = (user) => {
  adminStore.searchUserDialog = false;
  establishmentUsers.value.push(user);
  adminStore.addUserToEstablishment(user, establish.value);
};

const removeUserFromEstablishment = (user) => {
  adminStore.searchUserDialog = false;
  adminStore.removeUserFromEstablishment(user, establish.value);
};

const deleteEstablishment = (row) => {
  confirmDelete("establecimiento", () => adminStore.deleteEstablishment(row));
};

const rowsPerPageOptions = computed(() => {
  return showResults.value == "table" ? [5, 10, 15, 20] : [6, 9, 12];
});
const columns = [
  {
    name: "logo",
    label: "",
    sortable: false,
    style: "width: 60px",
  },
  {
    name: "name",
    align: "left",
    label: "Establecimiento",
    field: (row) => row.name,
    sortable: true,
  },
  {
    align: "left",
    name: "category",
    label: "Categoría",
    field: (row) => row.category?.name,
    sortable: true,
  },
  {
    align: "left",
    name: "slug",
    label: "Slug",
    field: (row) => row.slug,
    sortable: true,
  },
  {
    align: "left",
    name: "users",
    label: "Usuarios",
    field: "users",
  },
  {
    align: "left",
    name: "plan",
    label: "Plan",
    field: (row) => row.active_subscription?.package?.name,
    sortable: true,
  },
  {
    align: "left",
    name: "phone",
    label: "Teléfono",
    field: (row) => row.phone,
    sortable: true,
  },
  {
    name: "status",
    label: "Estado",
    field: (row) => row.status,
    sortable: true,
  },
  { name: "actions", label: "Acciones", align: "right", field: "actions", sortable: false },
];

adminStore.getEstablishments();
</script>

<style lang="scss" scoped>
.mc-view-toggle {
  display: flex;
  gap: 2px;
  background: var(--color-surface-variant);
  border-radius: var(--radius-full);
  padding: 2px;
  border: 1px solid var(--color-border);
}

.mc-inner-table {
  box-shadow: none;
  background: transparent;

  :deep(.q-table__top) {
    display: none;
  }
}

.mc-slug-code {
  font-size: var(--text-xs);
  background: var(--color-surface-variant);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-family: monospace;
}

.mc-establishment-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: box-shadow var(--transition-fast);

  &:hover {
    box-shadow: var(--shadow-md);
  }

  &__top {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md);
  }

  &__info {
    min-width: 0;
    flex: 1;
  }

  &__details {
    padding: 0 var(--space-md) var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__actions {
    border-top: 1px solid var(--color-border-subtle);
    padding: var(--space-xs) var(--space-sm);
  }
}

.mc-detail-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

.mc-user-dialog {
  width: 100%;
  max-width: 400px;
  border-radius: var(--radius-xl);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md) var(--space-lg);
    border-bottom: 1px solid var(--color-border);
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    padding: var(--space-md) var(--space-lg);
  }

  &__list {
    max-height: 300px;
    overflow-y: auto;
    padding: 0 var(--space-sm);
  }
}

.mc-user-list-item {
  border-radius: var(--radius-sm);
  min-height: 48px;

  &:hover {
    background: var(--color-surface-variant);
  }
}
</style>
