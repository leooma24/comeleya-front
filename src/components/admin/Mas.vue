<template>
  <div class="mc-mas">
    <!-- Cabecera propia: al quitar la barra de ComeleYa en celular, cada pantalla
         necesita decir dónde está uno. -->
    <div class="mc-mas__top">
      <div>
        <div class="mc-mas__tit">Más</div>
        <div class="mc-mas__sub">{{ adminStore.company?.name || "Tu negocio" }}</div>
      </div>
      <button type="button" class="mc-mas__vermenu" @click="verMenu">
        <mc-icon name="mundo" :size="15" /> Ver menú
      </button>
    </div>

    <!-- El plan vive aquí y no encabezando Pedidos, que es donde menos importa:
         nadie revisa cuántos días le quedan al plan en plena hora pico. -->
    <div class="mc-mas__plan" v-if="plan">
      <b>{{ plan.nombre }}</b>
      <small>{{ plan.detalle }}</small>
    </div>

    <template v-for="grupo in grupos" :key="grupo.titulo">
      <div class="mc-mas__rotulo" v-if="grupo.items.length">{{ grupo.titulo }}</div>
      <div class="mc-mas__lista" v-if="grupo.items.length">
        <button
          v-for="item in grupo.items"
          :key="item.tab || item.cajon"
          type="button"
          class="mc-mas__fila"
          @click="abrir(item)"
        >
          <span class="mc-mas__gi"><mc-icon :name="item.icono" :size="17" /></span>
          <span class="mc-mas__nom">{{ item.texto }}</span>
          <span class="mc-mas__der">
            <span v-if="item.dato" class="mc-mas__dato">{{ item.dato }}</span>
            <mc-icon name="flecha" :size="16" />
          </span>
        </button>
      </div>
    </template>

    <template v-if="otrosNegocios.length">
      <div class="mc-mas__rotulo">Tus establecimientos</div>
      <div class="mc-mas__lista">
        <button
          v-for="negocio in otrosNegocios"
          :key="negocio.id"
          type="button"
          class="mc-mas__fila"
          @click="irANegocio(negocio)"
        >
          <span class="mc-mas__gi"><mc-icon name="caja" :size="17" /></span>
          <span class="mc-mas__nom">{{ negocio.name }}</span>
          <span class="mc-mas__der"><mc-icon name="flecha" :size="16" /></span>
        </button>
      </div>
    </template>

    <div class="mc-mas__pie">
      <button type="button" class="mc-mas__salir" @click="salir">
        <mc-icon name="salir" :size="17" /> Cerrar sesión
      </button>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: "AdminMas" });
import { computed } from "vue";
import { useQuasar } from "quasar";
import { useAdminStore } from "src/stores/admin-store";
import McIcon from "./movil/McIcon.vue";

const adminStore = useAdminStore();
const $q = useQuasar();

/**
 * Las secciones que NO se usan en hora pico.
 *
 * Los grupos son los mismos de la barra de escritorio —Operación, Catálogo,
 * Crecimiento— para no obligar a aprender dos organizaciones del mismo panel.
 */
const tieneFuncion = (nombre) => {
  const features = adminStore.companyConfiguration?.features ?? [];
  if (features.find((f) => (f.name === nombre || f.slug === nombre) && f.value)) return true;

  const pkg = adminStore.company?.active_subscription?.package;
  if (!pkg) return false;
  const mapa = {
    delivery: "has_drivers",
    reservations: "has_reservations",
    loyalty: "has_loyalty",
    analytics: "has_analytics",
    seo: "has_seo",
    theme: "has_theme_customization",
    facebook: "has_facebook",
  };
  return !!pkg[mapa[nombre]];
};

const grupos = computed(() => [
  {
    titulo: "Operación",
    items: [
      { tab: "pedidos_historial", texto: "Historial de pedidos", icono: "caja" },
      tieneFuncion("delivery") && { tab: "repartidores", texto: "Repartidores", icono: "moto" },
      tieneFuncion("reservations") && {
        tab: "reservaciones",
        texto: "Reservaciones",
        icono: "silla",
      },
      { tab: "cupones", texto: "Cupones", icono: "cupon" },
      { tab: "resenas", texto: "Reseñas", icono: "estrella" },
      tieneFuncion("loyalty") && { tab: "lealtad", texto: "Lealtad", icono: "gente" },
    ].filter(Boolean),
  },
  {
    titulo: "Catálogo",
    items: [
      { tab: "categorias", texto: "Categorías", icono: "menu" },
      { tab: "extras", texto: "Extras y grupos", icono: "plus" },
    ],
  },
  {
    titulo: "Crecimiento",
    items: [
      tieneFuncion("analytics") && { tab: "analiticas", texto: "Analíticas", icono: "grafica" },
      tieneFuncion("theme") && { tab: "tema", texto: "Tema del menú", icono: "paleta" },
      tieneFuncion("seo") && { tab: "seo", texto: "SEO", icono: "mundo" },
      tieneFuncion("facebook") && { tab: "facebook", texto: "Facebook", icono: "mundo" },
    ].filter(Boolean),
  },
  {
    // Estos cuatro vivían en el menú del avatar, que en celular ya no existe. Son
    // cajones que ya estaban montados en el layout: aquí solo se abren.
    titulo: "Tu negocio",
    items: [
      { cajon: "establecimiento", texto: "Datos del establecimiento", icono: "caja" },
      { cajon: "horario", texto: "Horario", icono: "reloj" },
      { cajon: "direccion", texto: "Dirección", icono: "pin" },
      { cajon: "configuracion", texto: "Configuración", icono: "engrane" },
    ],
  },
  {
    titulo: "Tu cuenta",
    items: [
      { cajon: "perfil", texto: "Mi perfil", icono: "gente" },
      { tab: "mi_plan", texto: "Mi plan", icono: "tarjeta" },
    ],
  },
]);

/** Los otros negocios del mismo dueño: en la barra vieja estaban al final del menú. */
const otrosNegocios = computed(() => {
  if (adminStore.user.isSuperAdmin) return [];
  const lista = adminStore.user.user?.establishments ?? [];
  return lista.length > 1 ? lista : [];
});

const verMenu = () => window.open(`/${adminStore.slug}`, "_blank");

const CAJONES = {
  perfil: (v) => adminStore.setProfileDrawer(v),
  horario: (v) => adminStore.setScheduleDrawer(v),
  establecimiento: (v) => adminStore.setEstablishmentDrawer(v),
  direccion: (v) => adminStore.setAddressDrawer(v),
  configuracion: (v) => adminStore.setConfigurationDrawer(v),
};

const plan = computed(() => {
  const sub = adminStore.company?.active_subscription;
  if (!sub?.package) return null;
  const fin = sub.end_date ? new Date(sub.end_date) : null;
  const dias = fin ? Math.ceil((fin - new Date()) / 86400000) : null;
  return {
    nombre: dias !== null ? `${sub.package.name} · ${dias} días` : sub.package.name,
    detalle: fin
      ? `Vence el ${fin.toLocaleDateString("es-MX", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}`
      : "Suscripción activa",
  };
});

const abrir = (item) => {
  // Varias de estas no son pestañas: son cajones que el layout ya tiene montados.
  if (item.cajon) {
    CAJONES[item.cajon]?.(true);
    return;
  }
  if (item.tab === "pedidos_historial") {
    adminStore.tab = "pedidos_pendientes";
    adminStore.orderTab = "pedidos_historial";
    return;
  }
  adminStore.tab = item.tab;
};

const irANegocio = (negocio) => adminStore.router.push(`/${negocio.slug}/admin`);

const salir = () => {
  $q.dialog({
    title: "Confirmación",
    message: "¿Estás seguro que deseas salir?",
    cancel: "Cancelar",
    persistent: true,
    ok: true,
  }).onOk(() => {
    const slug = adminStore.router.currentRoute.value.params.slug;
    adminStore.logout();
    adminStore.router.push(slug ? `/${slug}/admin/iniciar-sesion` : "/admin/iniciar-sesion");
    adminStore.messageStore.success("Sesión cerrada correctamente");
  });
};
</script>

<style lang="scss" scoped>
.mc-mas {
  padding: 0 0 4px;
}

.mc-mas__top {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px 12px;
  background: var(--color-surface);
  border-bottom: 0.5px solid var(--color-border);
  margin-bottom: 12px;
}
.mc-mas__tit {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1.15;
}
.mc-mas__sub {
  font-size: 11px;
  color: var(--color-text-secondary);
}
.mc-mas__vermenu {
  appearance: none;
  border: 0;
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 620;
  color: #fff;
  background: var(--q-positive);
  border-radius: 11px;
  padding: 8px 13px;
  cursor: pointer;
}

.mc-mas__plan {
  margin: 0 13px 4px;
  border-radius: 16px;
  padding: 14px;
  color: #fff;
  background: linear-gradient(135deg, #1d222c, #14171e);
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    top: -30px;
    right: -20px;
    width: 100px;
    height: 100px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.05);
  }

  b {
    display: block;
    font-size: 15px;
    font-weight: 660;
    letter-spacing: -0.03em;
  }
  small {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.58);
  }
}

.mc-mas__rotulo {
  font-size: 11px;
  font-weight: 620;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  padding: 16px 18px 7px;
}

.mc-mas__lista {
  margin: 0 13px;
  background: var(--color-surface);
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 0 0 0.5px rgba(13, 16, 21, 0.05), 0 1px 1px rgba(13, 16, 21, 0.04);
}

.mc-mas__fila {
  appearance: none;
  border: 0;
  width: 100%;
  background: none;
  font-family: inherit;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 11px 14px;
  position: relative;
  cursor: pointer;
  color: var(--color-text-primary);

  & + &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 14px;
    right: 0;
    height: 0.5px;
    background: var(--color-border-subtle);
  }

  &:active {
    background: var(--color-surface-variant);
  }
}

.mc-mas__gi {
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  background: var(--color-surface-variant);
  color: var(--color-text-secondary);
}

.mc-mas__nom {
  font-size: 13px;
  font-weight: 580;
  letter-spacing: -0.015em;
}

.mc-mas__der {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--color-text-tertiary);
}

.mc-mas__dato {
  font-size: 12.5px;
  font-weight: 620;
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}

.mc-mas__pie {
  padding: 22px 13px 8px;
}

.mc-mas__salir {
  appearance: none;
  width: 100%;
  border: 0;
  background: var(--color-surface);
  border-radius: 15px;
  padding: 13px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--q-negative);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 0 0 0.5px rgba(13, 16, 21, 0.05);
}
</style>
