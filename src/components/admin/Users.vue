<template>
  <q-card flat class="mc-admin-card">
    <div class="mc-admin-card__header">
      <div class="mc-admin-card__title">
        <q-icon name="people" size="24px" color="primary" class="q-mr-sm" />
        Usuarios
      </div>

      <div class="row items-center q-gutter-sm">
        <q-input
          color="primary"
          filled
          dense
          rounded
          debounce="300"
          v-model="filter"
          placeholder="Buscar usuario..."
          class="mc-admin-search"
        >
          <template v-slot:prepend>
            <q-icon name="search" size="18px" color="grey-5" />
          </template>
        </q-input>

        <q-btn
          unelevated
          color="primary"
          icon="add"
          no-caps
          label="Agregar"
          class="mc-admin-add-btn"
          @click="adminStore.addUser"
        />
      </div>
    </div>

    <!-- La lista de celular. Seis columnas no caben en 390 px. Aqui cada usuario dice quien es, con que correo entra y con que permisos.
         La tabla se queda intacta para escritorio. -->
    <div class="mc-lista" v-if="modoApp">
      <div
        v-for="u in usuariosFiltrados"
        :key="u.id"
        class="mc-lista__fila"
        :class="{ 'mc-lista__fila--off': u.status !== 'Activo' }"
      >
        <span class="mc-lista__ini">{{ (u.name || '?').trim().slice(0, 2).toUpperCase() }}</span>
        <div class="mc-lista__txt">
          <div class="mc-lista__nom">{{ u.name }}</div>
          <div class="mc-lista__meta">
            {{ u.email }}
            · {{ u.role === 'super_admin' ? 'Super Admin' : u.role }}
            <span v-if="u.status !== 'Activo'" class="mc-lista__apagado"> · inactivo</span>
          </div>
        </div>
        <div class="mc-lista__der" @click.stop>
          <row-actions-menu :titulo="u.name" :actions="accionesDe(u)" />
        </div>
      </div>

      <div v-if="!usuariosFiltrados.length" class="mc-lista__vacio">
        {{ filter ? "Ningún usuario con ese nombre." : "Todavía no hay usuarios." }}
      </div>
    </div>

    <q-table
      v-if="!modoApp"
      flat
      :rows="adminStore.users"
      :columns="columns"
      row-key="name"
      :filter="filter"
      no-data-label="No se encontraron usuarios"
      rows-per-page-label="Registros por página:"
      v-model:pagination="pagination"
      :rows-per-page-options="[5, 10, 15, 20]"
      class="mc-inner-table"
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="name" :props="props">
            <div class="row items-center q-gutter-sm no-wrap">
              <q-avatar size="32px" color="grey-3" text-color="grey-7">
                {{ props.row.name?.charAt(0)?.toUpperCase() }}
              </q-avatar>
              <span class="text-weight-medium">{{ props.row.name }}</span>
            </div>
          </q-td>
          <q-td key="email" :props="props">
            {{ props.row.email }}
          </q-td>
          <q-td key="role" :props="props">
            <q-chip
              dense
              size="sm"
              :color="props.row.role === 'super_admin' ? 'deep-purple-1' : 'grey-3'"
              :text-color="props.row.role === 'super_admin' ? 'deep-purple' : 'grey-8'"
            >
              {{ props.row.role === "super_admin" ? "Super Admin" : props.row.role }}
            </q-chip>
          </q-td>
          <q-td key="establishments_count" :props="props">
            <q-chip
              v-if="props.row.establishments_count > 0"
              dense
              size="sm"
              color="primary"
              text-color="white"
            >
              {{ props.row.establishments_count }}
            </q-chip>
            <span v-else class="text-grey-5">—</span>
          </q-td>
          <q-td key="phone" :props="props">
            {{ formatPhone(props.row.phone) }}
          </q-td>
          <q-td key="last_login" :props="props">
            <span v-if="props.row.last_login_at" class="text-caption">
              {{ formatDate(props.row.last_login_at) }}
            </span>
            <span v-else class="text-grey-5">—</span>
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
            <q-btn flat size="sm" dense round icon="edit" color="grey-7" @click="adminStore.editUser(props.row)">
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
            <q-btn flat size="sm" dense round icon="business" color="grey-7" @click="assignEstablishments(props.row)">
              <q-tooltip>Establecimientos</q-tooltip>
            </q-btn>
            <q-btn flat size="sm" dense round icon="delete_outline" color="negative" @click="deleteUser(props.row)">
              <q-tooltip>Eliminar</q-tooltip>
            </q-btn>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </q-card>

  <FormDrawer />

  <!-- Establishments assignment dialog -->
  <q-dialog v-model="establishmentDialog" persistent>
    <q-card class="mc-assign-dialog">
      <q-card-section class="mc-assign-dialog__header">
        <div class="row items-center q-gutter-sm">
          <q-icon name="business" size="24px" color="primary" />
          <span class="text-weight-bold text-body1">Establecimientos asignados</span>
        </div>
        <q-btn flat round dense icon="close" color="grey-6" v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-select
          filled
          dense
          rounded
          v-model="search"
          use-input
          input-debounce="0"
          label="Buscar establecimiento..."
          :options="establishments"
          option-value="id"
          option-label="name"
          @filter="filterFn"
          behavior="menu"
        >
          <template v-slot:append>
            <q-btn
              @click.stop="addCompany"
              flat
              dense
              round
              icon="add"
              color="primary"
            />
          </template>
        </q-select>
      </q-card-section>

      <q-card-section class="mc-assign-dialog__list">
        <q-list>
          <q-item
            v-for="(item, index) in userEstablishments"
            :key="index"
            class="mc-assign-item"
          >
            <q-item-section avatar>
              <q-icon name="store" color="grey-5" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ item.name }}</q-item-label>
              <q-item-label caption>{{ item.category?.name }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn
                flat
                dense
                round
                icon="delete_outline"
                color="negative"
                size="sm"
                @click="deleteEstablishmentFromUser(item)"
              >
                <q-tooltip>Quitar</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>
          <div v-if="!userEstablishments.length" class="text-center q-pa-md text-grey-5 text-caption">
            No tiene establecimientos asignados
          </div>
        </q-list>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
defineOptions({
  name: "UsersComponent",
});
import { ref, computed } from "vue";

import { useAdminStore } from "src/stores/admin-store";
import { useQuasar } from "quasar";
import { useConfirmDialog } from "src/composables/useConfirmDialog";
import FormDrawer from "./users/FormDrawer.vue";
import RowActionsMenu from "./RowActionsMenu.vue";
import { useModoApp } from "src/composables/useModoApp";
const adminStore = useAdminStore();
const { modoApp } = useModoApp();
const $q = useQuasar();
const { confirmDelete } = useConfirmDialog();

const filter = ref("");
const establishmentDialog = ref(false);

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Justo ahora";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
};

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
const search = ref("");
const userSelected = ref(null);

const deleteUser = (user) => {
  confirmDelete("usuario", () => adminStore.deleteUser(user));
};

const deleteEstablishmentFromUser = (establishment) => {
  adminStore.deleteEstablishmentFromUser(userSelected.value, establishment);
  userEstablishments.value = userEstablishments.value.filter(
    (e) => e.id != establishment.id
  );
  userSelected.value.establishments_count = userEstablishments.value.length;
};

const addCompany = () => {
  if (search.value == "") return;
  adminStore.addEstablishmentToUser(userSelected.value, search.value);
  userEstablishments.value.push(search.value);
  userSelected.value.establishments_count++;
  search.value = "";
};

const establishments = ref([]);
const userEstablishments = ref([]);

const assignEstablishments = async (user) => {
  userSelected.value = user;
  userEstablishments.value = await adminStore.getEstablishmentsByUser(user);
  establishmentDialog.value = true;
};

const filterFn = (val, update) => {
  let companies = adminStore.companies.filter((v) => {
    return userEstablishments.value.find((e) => e.id == v.id) == undefined;
  });
  if (val === "") {
    update(() => {
      establishments.value = companies.slice(0, 10);
    });
    return;
  }

  update(() => {
    const needle = val.toLowerCase();
    establishments.value = companies
      .filter((v) => v.name.toLowerCase().indexOf(needle) > -1)
      .slice(0, 10);
  });
};

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
});

adminStore.getUsers();

const columns = [
  {
    name: "name",
    align: "left",
    label: "Nombre",
    field: (row) => row.name,
    sortable: true,
  },
  {
    align: "left",
    name: "email",
    label: "Correo",
    field: (row) => row.email,
    sortable: true,
  },
  {
    align: "left",
    name: "role",
    label: "Rol",
    field: (row) => row.role,
    sortable: true,
  },
  {
    align: "center",
    name: "establishments_count",
    label: "Establecimientos",
    field: (row) => row.establishments_count,
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
    align: "left",
    name: "last_login",
    label: "Último acceso",
    field: (row) => row.last_login_at,
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

// La q-table filtra sola con su prop `filter`; la lista de celular no, asi que el
// mismo texto se aplica aqui.
const usuariosFiltrados = computed(() => {
  const q = filter.value.trim().toLowerCase();
  const todos = adminStore.users || [];
  if (!q) return todos;

  return todos.filter((u) =>
    [u.name, u.email, u.phone].some((x) => String(x || "").toLowerCase().includes(q))
  );
});

// Las mismas acciones de la tabla. En celular se abren en la hoja de abajo, donde
// "Eliminar" queda separado del resto en vez de a un dedo de "Editar".
const accionesDe = (u) => [
  { key: "edit", icon: "edit", color: "grey-7", label: "Editar", handler: () => adminStore.editUser(u) },
  { key: "negocios", icon: "business", color: "grey-7", label: "Establecimientos", handler: () => assignEstablishments(u) },
  { key: "delete", icon: "delete_outline", color: "negative", label: "Eliminar", handler: () => deleteUser(u) },
];

</script>

<style lang="scss" scoped>
.mc-inner-table {
  box-shadow: none;
  background: transparent;

  :deep(.q-table__top) {
    display: none;
  }
}

.mc-assign-dialog {
  width: 100%;
  max-width: 440px;
  border-radius: var(--radius-xl);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md) var(--space-lg);
    border-bottom: 1px solid var(--color-border);
  }

  &__list {
    max-height: 350px;
    overflow-y: auto;
    padding: 0 var(--space-sm);
  }
}

.mc-assign-item {
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-subtle);
  margin-bottom: var(--space-xs);
  transition: background var(--transition-fast);

  &:hover {
    background: var(--color-surface-variant);
  }
}
</style>
