<template>
  <!-- Floating button. En celular no se dibuja: flotaba encima de la ultima fila de
       cada lista y tapaba su boton. Ahi la ayuda se abre desde "Mas". -->
  <q-btn
    v-if="!modoApp"
    fab
    icon="support_agent"
    color="primary"
    class="mc-help-fab"
    @click="show = true"
  >
    <q-tooltip>Necesitas ayuda?</q-tooltip>
  </q-btn>

  <!-- Assistant dialog -->
  <q-dialog v-model="show" position="right" maximized>
    <q-card class="mc-help-card">
      <q-card-section class="mc-help-header">
        <q-avatar size="36px" color="primary" text-color="white" icon="support_agent" />
        <div class="col">
          <div class="text-weight-bold">Asistente ComeleYa</div>
          <div class="text-caption text-grey-6">Cómo te puedo ayudar?</div>
        </div>
        <q-btn flat round dense icon="close" @click="show = false" />
      </q-card-section>

      <q-scroll-area style="height: calc(100% - 60px)">
        <!-- Back button when viewing a guide -->
        <div v-if="activeGuide" class="q-pa-md">
          <q-btn flat no-caps icon="arrow_back" label="Volver" color="primary" @click="activeGuide = null" class="q-mb-md" />

          <div class="text-h6 text-weight-bold q-mb-sm">{{ activeGuide.title }}</div>
          <p class="text-grey-7 q-mb-lg">{{ activeGuide.desc }}</p>

          <q-timeline color="primary">
            <q-timeline-entry
              v-for="(step, i) in activeGuide.steps"
              :key="i"
              :subtitle="`Paso ${i + 1}`"
              :icon="step.icon"
              color="primary"
            >
              <template v-slot:title>
                <span class="text-body2 text-weight-bold">{{ step.title }}</span>
              </template>
              <p class="text-caption text-grey-7 q-mb-sm">{{ step.desc }}</p>
              <q-btn
                v-if="step.action"
                unelevated no-caps color="primary" size="sm"
                :label="step.btnLabel"
                :icon="step.btnIcon"
                @click="doAction(step.action)"
              />
            </q-timeline-entry>
          </q-timeline>
        </div>

        <!-- Guide list -->
        <div v-else class="q-pa-md">
          <div class="text-subtitle2 text-weight-bold q-mb-sm">Qué quieres hacer?</div>

          <q-list>
            <q-item
              v-for="guide in guides"
              :key="guide.id"
              clickable
              v-ripple
              class="mc-help-item"
              @click="activeGuide = guide"
            >
              <q-item-section avatar>
                <q-avatar :color="guide.color" text-color="white" size="36px">
                  <q-icon :name="guide.icon" size="18px" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">{{ guide.title }}</q-item-label>
                <q-item-label caption>{{ guide.desc }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" color="grey-5" />
              </q-item-section>
            </q-item>
          </q-list>

          <q-separator class="q-my-md" />

          <div class="text-subtitle2 text-weight-bold q-mb-sm">Contacto directo</div>
          <q-btn
            outline no-caps color="green" icon="fab fa-whatsapp"
            label="Escríbenos por WhatsApp"
            class="full-width q-mb-sm"
            @click="openWa"
          />
          <q-btn
            outline no-caps color="primary" icon="mail"
            label="Envíanos un correo"
            class="full-width"
            href="mailto:soporte@comeleya.com"
          />
        </div>
      </q-scroll-area>
    </q-card>
  </q-dialog>
</template>

<script setup>
defineOptions({ name: "HelpAssistant" });

import { ref } from "vue";
import { useAdminStore } from "src/stores/admin-store";
import { useModoApp } from "src/composables/useModoApp";
import { useAyuda } from "src/composables/useAyuda";

const adminStore = useAdminStore();
const { modoApp } = useModoApp();
// El mismo interruptor que usa "Más": la rueda solo es una de las dos entradas.
const { ayudaAbierta: show } = useAyuda();
const activeGuide = ref(null);

const doAction = (action) => {
  show.value = false;
  activeGuide.value = null;
  if (typeof action === "function") action();
};

const openWa = () => {
  const name = adminStore.company?.name || "mi negocio";
  const msg = encodeURIComponent(`Hola, soy del negocio ${name} en ComeleYa y necesito ayuda.`);
  window.open(`https://wa.me/526688180202?text=${msg}`, "_blank");
};

const guides = [
  {
    id: "setup",
    title: "Configurar mi menú desde cero",
    desc: "Sube tu logo, horario, categorías y platillos",
    icon: "rocket_launch",
    color: "primary",
    steps: [
      { title: "Sube tu logo", desc: "Ve a Establecimiento y sube una imagen de tu logo. También puedes agregar tu dirección y datos de contacto.", icon: "image", btnLabel: "Ir a establecimiento", btnIcon: "storefront", action: () => adminStore.setEstablishmentDrawer(true) },
      { title: "Configura tu horario", desc: "Define los días y horas que tu negocio está abierto. Los clientes verán cuándo estás disponible.", icon: "schedule", btnLabel: "Configurar horario", btnIcon: "schedule", action: () => adminStore.setScheduleDrawer(true) },
      { title: "Crea una categoría", desc: "Las categorías organizan tu menú (ej: Hamburguesas, Bebidas, Postres). Necesitas al menos una.", icon: "category", btnLabel: "Crear categoría", btnIcon: "add", action: () => { adminStore.tab = "categorias"; adminStore.addCategory(); } },
      { title: "Agrega tus platillos", desc: "Sube foto, nombre, precio y descripción. Puedes agregar extras y opciones después.", icon: "restaurant_menu", btnLabel: "Agregar platillo", btnIcon: "add", action: () => { adminStore.tab = "productos"; adminStore.addProduct(); } },
      { title: "Comparte tu menú", desc: "Descarga tu QR desde tu perfil e imprímelo. También puedes compartir el link de tu menú.", icon: "qr_code", btnLabel: "Ver mi QR", btnIcon: "qr_code", action: () => adminStore.setProfileDrawer(true) },
    ],
  },
  {
    id: "orders",
    title: "Recibir y gestionar pedidos",
    desc: "Cómo manejar pedidos que llegan a tu negocio",
    icon: "receipt_long",
    color: "blue",
    steps: [
      { title: "Los pedidos llegan automáticamente", desc: "Cuando un cliente hace un pedido desde tu menú, aparece en la sección de Pedidos.", icon: "notifications", btnLabel: "Ver pedidos", btnIcon: "receipt_long", action: () => { adminStore.tab = "pedidos_pendientes"; } },
      { title: "Cambia el estado del pedido", desc: "Marca como 'En preparación', 'Enviado' o 'Entregado'. El cliente recibe notificación.", icon: "swap_horiz" },
      { title: "También te llega por WhatsApp", desc: "El pedido se envía automáticamente a tu WhatsApp para que no pierdas ninguno.", icon: "fab fa-whatsapp" },
    ],
  },
  {
    id: "coupons",
    title: "Crear cupones de descuento",
    desc: "Atrae más clientes con promociones",
    icon: "confirmation_number",
    color: "purple",
    steps: [
      { title: "Ve a la sección de Cupones", desc: "Ahí podrás crear códigos de descuento con porcentaje o cantidad fija.", icon: "confirmation_number", btnLabel: "Ir a cupones", btnIcon: "confirmation_number", action: () => { adminStore.tab = "cupones"; } },
      { title: "Define el tipo de descuento", desc: "Porcentaje (ej: 15% OFF) o cantidad fija (ej: $50 de descuento). Puedes poner un mínimo de compra.", icon: "percent" },
      { title: "Comparte el código", desc: "Publica el código en tus redes sociales o imprímelo en tu local. Los clientes lo ingresan al hacer su pedido.", icon: "share" },
    ],
  },
  {
    id: "extras",
    title: "Agregar extras a mis platillos",
    desc: "Opciones como salsas, tamaños, ingredientes extra",
    icon: "add_circle",
    color: "teal",
    steps: [
      { title: "Crea un grupo de extras", desc: "Ve a Extras y crea un grupo (ej: 'Salsas', 'Tamaño', 'Ingredientes extra').", icon: "add_circle", btnLabel: "Ir a extras", btnIcon: "add_circle", action: () => { adminStore.tab = "extras"; } },
      { title: "Define las opciones", desc: "Agrega opciones con nombre y precio (ej: Salsa verde $0, Guacamole $15).", icon: "list" },
      { title: "Asigna al platillo", desc: "Edita un platillo y en la sección de extras, agrega el grupo que creaste. Puedes marcar como requerido.", icon: "link" },
    ],
  },
  {
    id: "qr",
    title: "Descargar e imprimir mi QR",
    desc: "Genera tu QR para colocar en tu local",
    icon: "qr_code",
    color: "grey-8",
    steps: [
      { title: "Ve a tu perfil", desc: "Haz click en tu nombre arriba a la derecha y selecciona 'Perfil'.", icon: "person", btnLabel: "Ir a perfil", btnIcon: "person", action: () => adminStore.setProfileDrawer(true) },
      { title: "Descarga el QR", desc: "Verás tu código QR. Haz click en 'Descargar QR' para guardarlo como imagen.", icon: "download" },
      { title: "Imprímelo y colócalo", desc: "Imprime el QR en tamaño visible y colócalo en mesas, mostrador, ventanas o tarjetas.", icon: "print" },
    ],
  },
  {
    id: "theme",
    title: "Personalizar mi menú",
    desc: "Colores, fuentes y apariencia de tu menú",
    icon: "palette",
    color: "pink",
    steps: [
      { title: "Ve a la sección Tema", desc: "Ahí puedes cambiar colores, fuentes y estilo de tu menú digital.", icon: "palette", btnLabel: "Ir a tema", btnIcon: "palette", action: () => { adminStore.tab = "tema"; } },
      { title: "Elige tu color primario", desc: "Selecciona el color principal de tu marca. Se aplica a botones, links y acentos.", icon: "color_lens" },
      { title: "Agrega un banner", desc: "Puedes mostrar un mensaje en la parte superior de tu menú (ej: '¡Envío gratis hoy!').", icon: "announcement" },
    ],
  },
  {
    id: "analytics",
    title: "Ver mis estadísticas",
    desc: "Conoce cuánto vendes y qué es lo más popular",
    icon: "analytics",
    color: "indigo",
    steps: [
      { title: "Dashboard", desc: "En el Dashboard ves pedidos, ingresos y ticket promedio de hoy, semana y mes.", icon: "dashboard", btnLabel: "Ver dashboard", btnIcon: "dashboard", action: () => { adminStore.tab = "dashboard"; } },
      { title: "Top productos", desc: "También ves cuáles son tus platillos más vendidos para saber qué promocionar.", icon: "trending_up" },
      { title: "Analíticas avanzadas", desc: "En la sección de Analíticas tienes gráficas detalladas y puedes exportar a CSV.", icon: "analytics", btnLabel: "Ver analíticas", btnIcon: "analytics", action: () => { adminStore.tab = "analiticas"; } },
    ],
  },
];
</script>

<style lang="scss" scoped>
.mc-help-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 999;
}

.mc-help-card {
  width: 380px;
  max-width: 100vw;
  height: 100vh;
  border-radius: 0;
}

.mc-help-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.mc-help-item {
  border-radius: 10px;
  margin-bottom: 4px;
  transition: background 0.15s;

  &:hover {
    background: #f5f5f5;
  }
}
</style>
