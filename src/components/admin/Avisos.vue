<template>
  <!-- Compacto: dentro de la banda oscura, pegado abajo. -->
  <div class="mc-avisos" v-if="compacto && avisos.length">
    <button
      v-for="a in avisos"
      :key="a.clave"
      type="button"
      :class="['mc-avisos__fila', 'mc-avisos__fila--' + a.tono]"
      @click="a.accion.handler()"
    >
      <q-icon :name="a.icono" size="15px" />
      <span class="mc-avisos__txt">{{ a.titulo }}</span>
      <span class="mc-avisos__cta" v-if="etiqueta(a)">{{ etiqueta(a) }}</span>
    </button>
  </div>

  <!-- Escritorio: las tarjetas de siempre. -->
  <div class="mc-setup-banners" v-else-if="!compacto && avisos.length">
    <div
      v-for="a in avisos"
      :key="a.clave"
      class="mc-setup-banner"
      :class="a.tono === 'urgente' ? 'mc-setup-banner--trial' : ''"
      :style="a.borde ? { borderLeftColor: a.borde } : {}"
    >
      <div class="mc-setup-banner__icon" :style="a.fondoIcono ? { background: a.fondoIcono } : {}">
        <q-icon :name="a.icono" size="20px" :color="a.colorIcono" />
      </div>
      <div class="mc-setup-banner__text">
        <strong>{{ a.titulo }}</strong>
        <span>{{ a.detalle }}</span>
      </div>
      <q-btn
        v-if="a.accion.label"
        unelevated
        no-caps
        :color="a.accion.color || 'primary'"
        text-color="white"
        size="sm"
        :label="a.accion.label"
        :icon="a.accion.icono"
        class="mc-setup-banner__btn"
        @click="a.accion.handler()"
      />
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: "AdminAvisos" });

import { computed } from "vue";
import { useAdminStore } from "src/stores/admin-store";

/**
 * Los avisos del panel: el plan y lo que falta por configurar.
 *
 * Vivían escritos a mano en `AdminPage`, nueve bloques casi iguales, y se dibujaban
 * ARRIBA de la cabecera. En celular eso empujaba la banda oscura hacia abajo y le
 * cortaba el titulo: la pantalla empezaba con un aviso a medias y la cabecera —que es
 * lo que dice donde estas— quedaba de segunda. Aqui son datos, y con eso la misma
 * lista se puede dibujar de dos formas: tarjetas en escritorio y un renglon dentro de
 * la banda en celular, que es donde no estorba.
 */
const props = defineProps({
  // Dentro de la banda oscura. Solo el titulo y su accion: el detalle explica algo que
  // en un renglon de 34 px nadie va a leer, y para eso esta la pantalla a la que lleva.
  compacto: { type: Boolean, default: false },
});

const adminStore = useAdminStore();

const finDelPlan = computed(() => adminStore.company?.active_subscription?.end_date);

const diasDePlan = computed(() => {
  const sub = adminStore.company?.active_subscription;
  if (!sub || !sub.end_date) return null;
  const dias = Math.ceil((new Date(sub.end_date) - new Date()) / 86400000);
  return Math.max(0, dias);
});

const nombreDelPlan = computed(
  () => adminStore.company?.active_subscription?.package?.name || "Plan temporal"
);

const sinPlan = computed(
  () => !adminStore.company?.active_subscription && !!adminStore.company?.created_at
);

const irAPlanes = () => { adminStore.tab = "mi_plan"; };

/** Lo que dice la pastilla del renglon compacto. */
const etiqueta = (a) => a.accion.compacta || a.accion.label;

const avisos = computed(() => {
  // En Pedidos no: es la pantalla de servicio, y ahi lo unico que importa es la comanda.
  if (!adminStore.showBanners) return [];
  if (props.compacto && String(adminStore.tab || "").startsWith("pedidos")) return [];

  const d = diasDePlan.value;
  const lista = [];

  if (d !== null && d > 3) {
    lista.push({
      clave: "plan",
      tono: "info",
      icono: "card_membership",
      colorIcono: "primary",
      fondoIcono: "#E3F2FD",
      borde: "#2196F3",
      titulo: `${nombreDelPlan.value} — ${d} ${d === 1 ? "día" : "días"} restantes`,
      detalle: finDelPlan.value
        ? `Tu plan vence el ${new Date(finDelPlan.value).toLocaleDateString("es-MX", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}`
        : "",
      // Sin boton en escritorio -es informativo-, pero en el renglon de celular el
      // toque necesita decir a donde lleva.
      accion: { label: "", compacta: "Ver plan", handler: irAPlanes },
    });
  }

  if (d !== null && d <= 3 && d > 0) {
    lista.push({
      clave: "plan-por-vencer",
      tono: "urgente",
      icono: "hourglass_top",
      colorIcono: "orange",
      fondoIcono: "#FFF3E0",
      titulo: `${nombreDelPlan.value} — ${d === 1 ? "Vence mañana" : `Vence en ${d} días`}`,
      detalle: "Renueva tu plan para no perder acceso a las funciones premium.",
      accion: { label: "Ver planes", icono: "rocket_launch", color: "orange", handler: irAPlanes },
    });
  }

  if (d === 0) {
    lista.push({
      clave: "plan-vence-hoy",
      tono: "urgente",
      icono: "warning",
      colorIcono: "orange",
      fondoIcono: "#FFF3E0",
      titulo: `${nombreDelPlan.value} — Vence hoy`,
      detalle: "Renueva ahora para no perder acceso.",
      accion: { label: "Renovar", icono: "rocket_launch", color: "orange", handler: irAPlanes },
    });
  }

  if (sinPlan.value) {
    lista.push({
      clave: "sin-plan",
      tono: "malo",
      icono: "error",
      colorIcono: "negative",
      titulo: "No tienes un plan activo",
      detalle:
        "Elige un plan para disfrutar de todas las funciones premium como repartidores, reservaciones, lealtad y mas.",
      accion: { label: "Elegir plan", icono: "rocket_launch", color: "negative", handler: irAPlanes },
    });
  }

  // El numero al que llegan los pedidos. Es lo primero que hay que revisar y era
  // justo lo unico que ningun aviso mencionaba: el panel pedia categorias, productos,
  // horario, direccion y servicios, pero no el telefono al que se va la venta.
  const wa = (adminStore.company?.whatsapp || "").trim();
  const tel = (adminStore.company?.phone || "").trim();

  if (!wa && !tel) {
    lista.push({
      clave: "sin-numero",
      tono: "malo",
      icono: "phone_disabled",
      titulo: "No hay número para recibir pedidos",
      detalle:
        "Sin un WhatsApp o un teléfono, el cliente termina su pedido y no tiene a dónde mandártelo.",
      accion: {
        label: "Agregar",
        icono: "add",
        handler: () => { adminStore.establishmentDrawer = true; },
      },
    });
  } else if (!wa) {
    lista.push({
      clave: "whatsapp-sin-confirmar",
      tono: "pendiente",
      icono: "chat",
      titulo: `Los pedidos llegarán al ${tel}`,
      detalle:
        "No tienes un WhatsApp aparte, así que usamos tu teléfono. Confirma que ese número tenga WhatsApp, o pon otro.",
      accion: {
        label: "Revisar",
        icono: "edit",
        compacta: "Revisar",
        handler: () => { adminStore.establishmentDrawer = true; },
      },
    });
  }

  if (!adminStore.categories?.length) {
    lista.push({
      clave: "sin-categorias",
      tono: "pendiente",
      icono: "category",
      titulo: "Categorías pendientes",
      detalle: "Agrega al menos una categoría para organizar tus productos",
      accion: {
        label: "Agregar",
        icono: "add",
        handler: () => {
          adminStore.tab = "categorias";
          adminStore.categoryFormDrawer = true;
        },
      },
    });
  }

  if (!adminStore.products?.length) {
    lista.push({
      clave: "sin-productos",
      tono: "pendiente",
      icono: "restaurant_menu",
      titulo: "Productos pendientes",
      detalle: "Agrega productos para que tus clientes puedan realizar pedidos",
      accion: {
        label: "Agregar",
        icono: "add",
        handler: () => {
          adminStore.tab = "productos";
          adminStore.productFormDrawer = true;
        },
      },
    });
  }

  if (!adminStore.company?.hours?.length) {
    lista.push({
      clave: "sin-horario",
      tono: "pendiente",
      icono: "schedule",
      titulo: "Horario no configurado",
      detalle:
        "Establece tu horario de atención para que los clientes sepan cuándo pueden ordenar",
      accion: { label: "Configurar", icono: "settings", handler: () => adminStore.setScheduleDrawer(true) },
    });
  }

  if (!adminStore.company?.address) {
    lista.push({
      clave: "sin-direccion",
      tono: "pendiente",
      icono: "place",
      titulo: "Dirección no registrada",
      detalle: "Agrega la dirección de tu establecimiento",
      accion: { label: "Agregar", icono: "add", handler: () => { adminStore.addressDrawer = true; } },
    });
  }

  if (!adminStore.company?.features?.length) {
    lista.push({
      clave: "sin-servicios",
      tono: "pendiente",
      icono: "tune",
      titulo: "Servicios no configurados",
      detalle: "Configura los servicios que ofrece tu establecimiento",
      accion: {
        label: "Configurar",
        icono: "settings",
        handler: () => { adminStore.configurationDrawer = true; },
      },
    });
  }

  return lista;
});
</script>
