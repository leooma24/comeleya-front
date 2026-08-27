<template>
  <div
    ref="sidebarRef"
    :class="[
      'mc-sidebar',
      mainStore.isExternal ? 'mc-sidebar-external' : '',
    ]"
    style="background: var(--color-surface-variant)"
  >
    <!-- La ficha del negocio y la tira de categorias, fijas COMO UN SOLO BLOQUE.

         Antes se fijaba cada una por su cuenta y la tira se colocaba contra una
         variable que medía la ficha desde JavaScript. Mientras la ficha se encogía esa
         medida llegaba tarde: la barra del negocio ya había subido y las categorías
         seguían donde estaban, así que al bajar se abría una franja blanca entre las
         dos -14 px medidos en producción- que se cerraba sola un instante después. Eso
         es la costura que se veía al deslizar.

         Juntas en el mismo bloque, la tira va detrás de la ficha en flujo normal: no
         hay dos posiciones que sincronizar y el hueco no puede existir aunque la
         medición tarde. -->
    <div ref="fijoRef" class="mc-sidebar-fijo">
      <div
        ref="establishmentRef"
        class="mc-sidebar-establishment"
        :class="{ 'mc-sidebar-establishment--compacta': fichaCompacta }"
        v-if="!mainStore.isExternal"
      >
        <!-- Portada / hero -->
        <div
          class="mc-restaurant-cover"
          :class="{ 'mc-restaurant-cover--placeholder': !mainStore.company.banner }"
          :style="mainStore.company.banner ? { backgroundImage: `url(${mainStore.company.banner})` } : null"
        >
          <div class="mc-restaurant-cover__scrim"></div>
          <div class="mc-restaurant-cover__identity">
            <q-avatar
              :size="$q.screen.lt.md ? '54px' : '62px'"
              class="mc-restaurant-avatar"
            >
              <img :src="mainStore.company.logo" />
            </q-avatar>
            <h1 class="mc-restaurant-cover__name">{{ mainStore.company.name }}</h1>
          </div>
        </div>

        <div class="mc-restaurant-info">
          <div class="mc-restaurant-details">
            <div class="mc-restaurant-meta">
              <q-chip
                :color="mainStore.company.isOpen ? 'positive' : 'negative'"
                text-color="white"
                size="sm"
                dense
                :icon="mainStore.company.isOpen ? 'check_circle' : 'cancel'"
                :label="mainStore.company.isOpen ? 'Abierto' : 'Cerrado'"
              />

              <q-btn
                dense
                flat
                round
                icon="schedule"
                size="sm"
                color="grey-7"
                class="mc-hours-btn"
                @click="dialog = true"
              >
                <q-tooltip>Horario</q-tooltip>
              </q-btn>

              <q-btn
                dense
                flat
                round
                icon="share"
                size="sm"
                color="grey-7"
                class="mc-hours-btn"
                @click="shareMenu"
              >
                <q-tooltip>Compartir menú</q-tooltip>
              </q-btn>

              <q-separator vertical inset class="q-mx-xs" v-if="reviewData.total > 0" />

              <!-- Rating inline -->
              <div
                v-if="reviewData.total > 0"
                class="mc-rating-badge cursor-pointer"
                @click="reviewsDrawer = true"
              >
                <q-icon name="star" class="mc-ic-sm" color="amber-8" />
                <span class="mc-rating-badge__score">{{ reviewData.avg.toFixed(1) }}</span>
                <span class="mc-rating-badge__count">({{ reviewData.total }})</span>
                <q-tooltip>Ver reseñas</q-tooltip>
              </div>
              <q-btn
                v-else
                dense
                flat
                round
                icon="rate_review"
                size="sm"
                color="grey-7"
                class="mc-hours-btn"
                @click="reviewsDrawer = true"
              >
                <q-tooltip>Reseñas</q-tooltip>
              </q-btn>
            </div>
            <div
              v-if="mainStore.businessAddress && !mainStore.businessAddress.includes('undefined')"
              class="mc-address"
              @click="openMap"
            >
              <q-icon name="location_on" class="mc-ic-sm" />
              <span>{{ mainStore.businessAddress }}</span>
            </div>
            <div
              v-if="!mainStore.company.isOpen && mainStore.nextOpenText"
              class="mc-next-open"
            >
              <q-icon name="access_time" class="q-mr-xs mc-ic-sm" />
              {{ mainStore.nextOpenText }}
            </div>
          </div>
        </div>

        <!-- El aviso que escribe el negocio desde su Tema.
             Va DENTRO de la ficha a proposito: en celular la ficha es `position: fixed` y
             su alto es el que se mide para colocar las categorias y el contenido. Fuera de
             aqui el banner quedaba en flujo normal, o sea tapado por la propia ficha.

             Ademas leia de `mainStore.company`, que NO es el negocio sino el store
             completo, y ahi theme_config nunca existio: la condicion era falsa siempre,
             para los 106 negocios, desde el primer commit. Nunca se habia visto. -->
        <div
          v-if="temaDelNegocio.show_banner && temaDelNegocio.banner_text"
          class="mc-establishment-banner"
        >
          {{ temaDelNegocio.banner_text }}
        </div>
      </div>

      <div class="mc-tabs-fila" :class="{ 'mc-tabs-fila--con-indice': mostrarIndice }">
      <q-tabs
        ref="tabsRef"
        v-model="mainStore.tab"
        mobile-arrows
        :vertical="tabsVertical"
        class="mc-sidebar-tabs"
        style="background: var(--color-surface)"
      >
        <q-tab
          v-for="category in visibleCategories"
          :key="category.id"
          :name="category.id"
          @click="goToCategory(category.id)"
        >
          <div class="mc-tab-inner">
            <span class="mc-tab-name">{{ category.name }}</span>
            <span
              v-if="$q.screen.width >= 1024 && categoryCount(category.id)"
              class="mc-tab-count"
            >{{ categoryCount(category.id) }}</span>
          </div>
        </q-tab>
      </q-tabs>

        <!-- Ver todas.
             La tira sirve para saber DONDE estas; el indice, para IR a donde quieres.
             Son dos trabajos distintos y con 12 categorias la tira estaba haciendo los
             dos mal: solo se alcanzan a ver tres. -->
        <button
          v-if="mostrarIndice"
          type="button"
          class="mc-indice-btn"
          aria-label="Ver todas las categorías"
          @click="indiceAbierto = true"
        >
          <q-icon name="menu" class="mc-ic-sm" />
        </button>
      </div>
    </div>

    <!-- El indice completo -->
    <q-dialog v-model="indiceAbierto" position="bottom" @hide="alCerrarIndice">
      <div class="mc-indice">
        <div class="mc-indice__tit">
          Categorías
          <span>{{ visibleCategories.length }}</span>
        </div>
        <div class="mc-indice__lista">
          <button
            v-for="c in visibleCategories"
            :key="c.id"
            type="button"
            class="mc-indice__fila"
            :class="{ 'mc-indice__fila--on': mainStore.tab === c.id }"
            @click="irDesdeIndice(c.id)"
          >
            <span class="mc-indice__nom">{{ c.name }}</span>
            <span class="mc-indice__n">{{ categoryCount(c.id) }}</span>
          </button>
        </div>
        <button type="button" class="mc-indice__cerrar" @click="indiceAbierto = false">
          Cerrar
        </button>
      </div>
    </q-dialog>

    <!-- Loyalty Banner -->
    <loyalty-banner />

    <!-- Reservation Button -->
    <div class="mc-reservation-btn-wrapper" v-if="hasReservations">
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="event_seat"
        label="Reservar mesa"
        class="full-width mc-reservation-btn"
        @click="reservationDialog = true"
      />
    </div>

    <!-- Order History -->
    <div class="mc-history-btn-wrapper" v-if="mainStore.orderHistory.length">
      <button
        type="button"
        class="mc-history-btn"
        @click="orderHistoryDrawer = true"
      >
        <q-icon name="history" size="18px" class="q-mr-xs" />
        <span class="mc-history-btn__label">Pedidos anteriores</span>
        <q-badge
          color="primary"
          rounded
          class="mc-history-btn__count"
          :label="mainStore.orderHistory.length"
        />
        <q-icon name="chevron_right" size="18px" class="mc-history-btn__chevron" />
      </button>
    </div>
    <order-history v-model="orderHistoryDrawer" />

    <!-- Reservation Dialog -->
    <reservation-dialog v-model="reservationDialog" />

    <!-- Espacio para que la barra del carrito no tape las categorías (solo escritorio docked) -->
    <div v-if="mainStore.cart.length > 0 && !mainStore.externalCartBar && !mainStore.isExternal" class="mc-cart-bar-spacer"></div>

    <!-- Cart Bar -->
    <div
      class="mc-cart-bar mc-mb-fix mc-sidebar-cart-bar"
      :class="{ 'mc-sidebar-cart-bar--external': mainStore.isExternal }"
      @click="mainStore.cartDrawer = true"
      v-if="mainStore.cart.length > 0 && !mainStore.externalCartBar && mainStore.orderingEnabled"
    >
      <div class="row items-center justify-between full-width">
        <div class="mc-cart-bar-left" :key="cartUnits">
          <img
            v-if="mainStore.establishment?.theme_config?.cart_image"
            :src="mainStore.establishment.theme_config.cart_image"
            class="mc-cart-bar-img"
            alt=""
          />
          <q-icon v-else name="shopping_cart" size="24px" />
          <q-badge color="white" text-color="primary" rounded>
            {{ cartUnits }}
          </q-badge>
        </div>

        <div class="column items-center">
          <span
            class="mc-total-price"
            :key="mainStore.total"
          >${{ Number(mainStore.total).toFixed(2) }}</span>
        </div>

        <!-- Con enlace configurado este lado deja de decir "Ver pedido" y se vuelve la
             salida al sitio del negocio. El pedido sigue abriéndose desde el resto de
             la barra (el carrito y el total), que es donde vive el @click.

             `@click.stop` es lo que separa las dos cosas: el click que abre el cajón
             está en el <div> de TODA la barra, así que sin detenerlo pasarían las dos
             a la vez. `target="_top"` porque esto solo aparece embebido: un enlace
             normal metería el sitio del negocio dentro de su propio iframe. -->
        <a
          v-if="cta"
          class="mc-cart-bar-right mc-cart-bar-link"
          :href="cta.url"
          target="_top"
          rel="noopener noreferrer"
          @click.stop
        >
          <span class="mc-cart-bar-label">{{ cta.label }}</span>
          <q-icon name="arrow_forward" size="20px" />
        </a>
        <div v-else class="mc-cart-bar-right">
          <span class="mc-cart-bar-label">Ver pedido</span>
          <q-icon name="arrow_forward" size="20px" />
        </div>
      </div>
    </div>

    <!-- Review Dialog -->
    <review-dialog v-model="reviewDialog" @submitted="refreshReviews" />
    <reviews-drawer v-model="reviewsDrawer" @add="reviewDialog = true" />

    <!-- Hours Dialog -->
    <q-dialog v-model="dialog" backdrop-filter="blur(8px)">
      <q-card class="mc-hours-dialog">
        <q-card-section class="mc-hours-header">
          <q-icon name="schedule" size="24px" color="primary" />
          <span>Horario de Atención</span>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div
            v-for="(item, index) in mainStore.getHours"
            :key="index"
            :class="[
              'mc-hour-row',
              item.is_closed ? 'mc-hour-row--closed' : ''
            ]"
          >
            <span class="mc-hour-day">{{ item.day_of_week }}</span>
            <span class="mc-hour-time" v-if="!item.is_closed">
              {{ item.open_time.substring(0, 5) }} - {{ item.close_time.substring(0, 5) }}
            </span>
            <q-badge v-else color="negative" text-color="white" rounded label="Cerrado" />
          </div>
        </q-card-section>

        <q-card-actions class="q-px-lg q-pb-lg">
          <q-btn
            flat
            no-caps
            label="Cerrar"
            color="grey-8"
            class="full-width"
            style="border-radius: var(--radius-sm)"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
defineOptions({
  name: "SidebarComponent",
});
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { api } from "boot/axios";
import { useMainStore } from "src/stores/main-store";
import { useQuasar } from "quasar";
import OrderHistory from "./OrderHistory.vue";
import ReviewDialog from "./ReviewDialog.vue";
import ReviewsDrawer from "./ReviewsDrawer.vue";
import ReservationDialog from "./ReservationDialog.vue";
import LoyaltyBanner from "./LoyaltyBanner.vue";
import { cartBarCta } from "src/utils/cartBarCta";
import { centerTabScroll } from "src/utils/categoryScroll";
import { urlDelMapa, abrirEnMapa } from "src/utils/mapa";

const $q = useQuasar();
const mainStore = useMainStore();
const dialog = ref(false);
const fijoRef = ref(null);
const establishmentRef = ref(null);

/**
 * El hueco que hay que reservarle al encabezado fijo.
 *
 * En celular la ficha y la tira de categorias estan fuera del flujo, asi que el
 * contenido no las "ve": si nadie mide su alto, el menu arranca debajo de ellas.
 *
 * La tira SE MIDE. Antes eran 50 px escritos a mano, que valian mientras fuera una sola
 * linea; con dos renglones ese numero deja de ser cierto y el primer platillo queda
 * tapado. Y como las categorias las pone cada negocio -de 3 a 13, con nombres de
 * distinto largo-, el alto real cambia de un menu a otro.
 */
// El alto del encabezado CON la ficha abierta. Es el que reserva el contenido, y no
// cambia cuando la ficha se encoge (ver abajo). No es reactivo: solo lo lee esta funcion.
let altoExpandido = 0;
// Si ya se alcanzo a medir con la ficha abierta. Recargar la pagina a media carta deja
// al comensal deslizado y la ficha nace encogida: ahi todavia no hay un alto bueno que
// conservar, asi que se sigue midiendo hasta que lo haya.
let medidoExpandido = false;

const updateSidebarHeight = () => {
  nextTick(() => {
    // El embebido tambien mide, aunque el iframe sea ancho: ahi el renglon de
    // categorias va fijo al tope y hay que reservarle su espacio igual que en celular.
    if (!fijoRef.value) return;
    if ($q.screen.width >= 1024 && !mainStore.isExternal) return;

    // Con la ficha ya encogida NO se vuelve a medir, y esto es lo que evita el brinco.
    //
    // El margen del contenido se queda con el alto de la ficha abierta. Si se actualizara
    // al encogerse, el menu entero subiria de golpe: medido en produccion, un platillo
    // saltaba 145 px hacia arriba bajo el dedo justo mientras uno deslizaba. Como el encabezado
    // es fijo, al contraerse solo destapa contenido que ya venia pasando por debajo; y no
    // se abre un hueco por dejar el margen largo, porque para cuando la ficha se encoge
    // -pasados 140 px de deslizamiento- ese margen ya quedo arriba de la pantalla.
    if (fichaCompacta.value && medidoExpandido) return;

    // Una sola medida: el bloque entero, que ya trae la ficha y la tira. Antes se median
    // por separado para poder colocar la tira debajo de la ficha; ahora van juntas y no
    // hay nada que colocar.
    // En embebido el que va fijo es el renglon de categorias, asi que el envoltorio se
    // queda sin alto y hay que medir el renglon. En el menu normal es al reves: el que
    // va fijo es el envoltorio, con la ficha y el renglon dentro.
    const medible = mainStore.isExternal
      ? fijoRef.value.querySelector('.mc-tabs-fila')
      : fijoRef.value;
    if (!medible) return;

    altoExpandido = medible.offsetHeight;
    if (!fichaCompacta.value) medidoExpandido = true;
    document.documentElement.style.setProperty(
      '--mc-sidebar-total-height',
      altoExpandido + 'px'
    );
  });
};
const reviewDialog = ref(false);
const reviewsDrawer = ref(false);
const reservationDialog = ref(false);
const orderHistoryDrawer = ref(false);
const reviewData = ref({ avg: 0, total: 0 });

const refreshReviews = async () => {
  try {
    const { data } = await api.get(`/establishment/${mainStore.companyStore.slug}/reviews`);
    reviewData.value = { avg: data.avg_rating || 0, total: data.total_reviews || 0 };
  } catch {
    // silently fail
  }
};

const hasReservations = computed(() => {
  const features = mainStore.company?.features ?? [];
  return features.some((f) => (f.name === "reservations" || f.slug === "reservations") && f.value === "1");
});

// Enlace propio del negocio para el lado derecho de la barra. Null en el caso normal
// (y siempre fuera del iframe), que deja "Ver pedido".
const cta = computed(() =>
  cartBarCta(mainStore.establishment, { embedded: mainStore.isEmbedded })
);

// Unidades totales en el carrito (suma de cantidades)
const cartUnits = computed(() =>
  mainStore.cart.reduce((acc, item) => acc + (item.qty || 0), 0)
);

// Productos por categoría (para el contador en los tabs del sidebar)
const categoryCount = (id) =>
  mainStore.productStore.items.filter((p) => p.dish_category_id === id).length;

// Solo categorías con productos (evita tabs que no llevan a nada)
/**
 * El tema del negocio. Se lee de `establishment`, que es el objeto que devuelve el API,
 * y no de `mainStore.company`, que es el store: ahi theme_config no existe.
 */
const temaDelNegocio = computed(() => mainStore.establishment?.theme_config || {});

const visibleCategories = computed(() =>
  mainStore.categories.filter((c) => categoryCount(c.id) > 0)
);

// La tira de categorías sigue sola a la sección que se está viendo. Cuál es la activa
// lo decide el scroll-spy (IndexPage); esto es solo CÓMO se mueve la tira cuando esa
// decisión cambia.
//
// Quasar ya la movía, con dos defectos: brincaba en un frame y dejaba el tab pegado a
// la orilla, sin que se asomara la categoría siguiente. Su scrollToTabEl no se puede
// apagar, así que se trabaja con él:
//
//   - El scroll-behavior: smooth del CSS convierte su "scrollLeft += offset" en una
//     animación en vez de un brinco.
//   - En nextTick, ya con Quasar pasado, este scrollTo al punto centrado REAPUNTA esa
//     animación. Los dos ocurren antes del primer repintado, así que no se ve el paso
//     intermedio: es un solo deslizamiento hasta el centro.
//
// El nextTick es lo que no se puede quitar. Si centramos antes, Quasar corre después,
// mide el tab a mitad de la animación y lo regresa a la orilla.
//
// El recuadro azul viaja aparte, sin JavaScript: vive en el indicador de Quasar y lo
// anima él. Está en app.scss, en .mc-sidebar-tabs .q-tab__indicator.
const tabsRef = ref(null);
const tabsVertical = computed(
  () => $q.screen.width >= 1024 && !mainStore.isExternal
);

const tabsContent = () => tabsRef.value?.$el?.querySelector(".q-tabs__content") ?? null;

watch(
  () => mainStore.tab,
  () => {
    const content = tabsContent();
    if (!content) return;

    nextTick(() => {
      const tab = content.querySelector(".q-tab--active");
      if (!tab) return;

      const vertical = tabsVertical.value;
      const destino = centerTabScroll({
        tabStart: vertical ? tab.offsetTop : tab.offsetLeft,
        tabSize: vertical ? tab.offsetHeight : tab.offsetWidth,
        viewSize: vertical ? content.clientHeight : content.clientWidth,
        contentSize: vertical ? content.scrollHeight : content.scrollWidth,
      });

      // Centrar sí, deslizar no: hoy Quasar ya brincaba, así que centrar de golpe no
      // le agrega movimiento a quien pidió que no lo hubiera.
      content.scrollTo({
        [vertical ? "top" : "left"]: destino,
        behavior:
          window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
            ? "auto"
            : "smooth",
      });
    });
  }
);

watch(() => mainStore.company?.name, () => {
  setTimeout(updateSidebarHeight, 100);
});


/**
 * La ficha se compacta al bajar.
 *
 * En celular el encabezado es fijo y se comia el 45% de la pantalla en un iPhone 13 y
 * el 53% en un SE -57 px de barra, 191 de ficha, mas las categorias-. Con dos renglones
 * de categorias eso ya no cabia. Al bajar, la ficha se queda en una barra con el logo y
 * el nombre, y las categorias suben con ella: el menu gana la pantalla que necesita.
 *
 * No hay salto de pagina: `.mc-content` conserva el margen de la altura expandida y el
 * encabezado es fijo, asi que al contraerse solo destapa contenido que ya venia
 * deslizandose.
 */
const fichaCompacta = ref(false);

// El encabezado de la aplicacion vive en MainLayout, no aqui, asi que se le avisa por
// una clase en el cuerpo: translucido sobre la portada -que se ve bien- y solido en
// cuanto la ficha se compacta, porque ahi el contenido pasa por debajo y se
// transparenta. Se veia el titulo de una seccion en fantasma sobre el logo.
watch(fichaCompacta, (compacta) => {
  document.body.classList.toggle('mc-encabezado-solido', compacta);
});

// Dos umbrales y no uno: con uno solo, arrastrar despacio justo en ese pixel hace que
// el encabezado parpadee entre las dos alturas.
const BAJAR = 140;
const SUBIR = 60;

const alDeslizar = () => {
  if ($q.screen.width >= 1024 || mainStore.isExternal) return;

  // Con un cajon o un dialogo abierto, NO.
  //
  // Para bloquear el scroll, Quasar le pone `position: fixed` al cuerpo, y entonces
  // `window.scrollY` se lee como 0 aunque el comensal siga parado a media carta. Sin
  // esta guarda, abrir el indice -o el carrito, o el detalle de un platillo- disparaba
  // este detector como si hubiera vuelto arriba y la ficha se expandia DETRAS de la
  // hoja: el fondo se movia solo mientras uno miraba el menu emergente.
  if (document.body.classList.contains('q-body--prevent-scroll')) return;

  const y = window.scrollY || document.documentElement.scrollTop || 0;
  const antes = fichaCompacta.value;

  if (!antes && y > BAJAR) fichaCompacta.value = true;
  else if (antes && y < SUBIR) fichaCompacta.value = false;

  // No hace falta medir aqui: el observador de abajo lo hace solo cuando la ficha
  // termina de encogerse.
};

/**
 * Vuelve a medir cada vez que la ficha o la tira cambian de alto, sea por lo que sea:
 * al contraerse, al cargar el logo, al cambiar de tamaño la letra.
 *
 * Antes se medía con un temporizador despues de contraer, o sea adivinando cuando
 * terminaba la animacion. En un iPhone 13 acertaba y en un SE no: quedaban 16 px de
 * hueco entre la ficha y las categorias por donde se veia pasar el contenido. Un
 * observador no adivina, se entera.
 */
let observador = null;
let vigilanteDelCuerpo = null;

onMounted(async () => {
  setTimeout(updateSidebarHeight, 200);
  window.addEventListener('resize', updateSidebarHeight);
  window.addEventListener('scroll', alDeslizar, { passive: true });

  // Cuando se cierra un cajon, Quasar devuelve el scroll y quita su marca de bloqueo,
  // pero el evento de scroll llega mientras la marca sigue puesta: la guarda de
  // `alDeslizar` lo descarta y ya nadie vuelve a decidir si la ficha va compacta. Se
  // quedaba expandida aunque el comensal siguiera a media carta. Esto se entera de
  // cuando la marca desaparece y recalcula.
  if (typeof MutationObserver !== 'undefined') {
    let bloqueadoAntes = document.body.classList.contains('q-body--prevent-scroll');
    vigilanteDelCuerpo = new MutationObserver(() => {
      const ahora = document.body.classList.contains('q-body--prevent-scroll');
      // Un instante despues, no en el acto: Quasar quita su marca ANTES de devolver la
      // posicion del scroll, asi que preguntando de inmediato se lee 0.
      if (bloqueadoAntes && !ahora) setTimeout(resincronizar, 120);
      bloqueadoAntes = ahora;
    });
    vigilanteDelCuerpo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  if (typeof ResizeObserver !== 'undefined') {
    observador = new ResizeObserver(() => updateSidebarHeight());
    if (fijoRef.value) observador.observe(fijoRef.value);
  }

  await refreshReviews();
});

onUnmounted(() => {
  window.removeEventListener('resize', updateSidebarHeight);
  window.removeEventListener('scroll', alDeslizar);
  observador?.disconnect();
  vigilanteDelCuerpo?.disconnect();
});


function shareMenu() {
  const url = window.location.href;
  const text = `Mira el menú de ${mainStore.company.name}`;

  if (navigator.share) {
    navigator.share({ title: mainStore.company.name, text, url });
  } else {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
    window.open(waUrl, "_blank");
  }
}

function openMap() {
  const url = urlDelMapa({
    coordenadas: mainStore.bussinessMap,
    direccion: mainStore.businessAddress,
  });
  abrirEnMapa(url, {
    alFallar: () =>
      mainStore.messageStore.error(
        "Este sitio no deja abrir el mapa. Manten presionada la direccion para abrirla aparte."
      ),
  });
}

const indiceAbierto = ref(false);

/**
 * Si se le ofrece al comensal el indice de categorias.
 *
 * En automatico -lo normal- aparece cuando hay mas categorias de las que caben en la
 * tira. El numero sale de la medida real: en 390 px se ven tres, asi que de seis en
 * adelante ya hay mas escondidas que a la vista y el indice empieza a hacer falta. Un
 * negocio de cuatro categorias no necesita un indice de cuatro renglones.
 *
 * El negocio puede forzarlo o apagarlo desde su Tema. Los dos renglones NO son una
 * opcion: escondian la categoria activa, y repartir eso como ajuste es repartir el
 * fallo.
 */
const mostrarIndice = computed(() => {
  if (tabsVertical.value) return false;          // escritorio: caben todas, en vertical
  const modo = temaDelNegocio.value.category_index || "auto";
  if (modo === "siempre") return visibleCategories.value.length > 1;
  if (modo === "nunca") return false;
  return visibleCategories.value.length >= 6;
});

/**
 * Elegir una categoria desde el indice.
 *
 * El salto NO puede ir aqui: mientras el dialogo esta abierto, Quasar bloquea el scroll
 * del cuerpo, asi que un `scrollTo` disparado en el mismo instante en que se cierra no
 * hace nada -medido en produccion: desde la tira bajaba a 10,623 y desde el indice a
 * cero-. Se guarda la categoria y se salta en `@hide`, cuando Quasar ya devolvio el
 * scroll.
 */
const categoriaPendiente = ref(null);

/**
 * Deja la ficha como corresponde a donde esta la pagina AHORA, sin histeresis.
 *
 * Los dos umbrales sirven mientras uno arrastra, para que el encabezado no parpadee.
 * Al cerrar un cajon estorban: entre que Quasar quita su marca de bloqueo y devuelve la
 * posicion, se cuela un evento de scroll con la pagina leyendose en 0, la ficha se
 * expande, y al volver a -por decir- 118 ya no se vuelve a contraer, porque 118 no
 * llega al umbral de bajada. Se quedaba expandida a media carta.
 *
 * Aqui no hay que evitar parpadeo: hay que decir la verdad de una vez.
 */
const resincronizar = () => {
  if ($q.screen.width >= 1024 || mainStore.isExternal) return;
  if (document.body.classList.contains('q-body--prevent-scroll')) return;

  const y = window.scrollY || document.documentElement.scrollTop || 0;
  const debeEstarCompacta = y > SUBIR;

  if (fichaCompacta.value !== debeEstarCompacta) {
    fichaCompacta.value = debeEstarCompacta;
  }
};

const irDesdeIndice = (id) => {
  categoriaPendiente.value = id;
  indiceAbierto.value = false;
};

const alCerrarIndice = () => {
  if (categoriaPendiente.value === null) return;
  const id = categoriaPendiente.value;
  categoriaPendiente.value = null;
  goToCategory(id);
};

function goToCategory(id) {
  // Misma acción que usa el deep-link ?cat= del iframe: fija el tab, bloquea el
  // scroll-spy mientras dura el movimiento y mide los tabs en vivo. Fijar el tab
  // dispara el watcher de arriba, que es quien acomoda la tira: el click y el scroll
  // llegan por el mismo camino.
  mainStore.goToCategory(id, $q.screen.width <= 1023);
}
</script>

<style lang="scss" scoped>
@keyframes mcTotalPulse {
  0% { transform: scale(1); }
  40% { transform: scale(1.14); }
  100% { transform: scale(1); }
}

.mc-total-price {
  display: inline-block;
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 800;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  animation: mcTotalPulse 0.35s ease;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

/* ===== La ficha compacta =====
   Al bajar, la portada se encoge y desaparece todo lo que no hace falta mientras uno
   busca de comer: el chip de abierto, la direccion y el proximo horario. Se queda el
   logo y el nombre, que es lo que dice en donde estas.

   Las categorias no se tocan: van dentro del mismo bloque fijo, asi que suben pegadas
   a la ficha mientras esta se encoge. */
.mc-sidebar-establishment {
  transition: none;

  .mc-restaurant-cover,
  .mc-restaurant-info {
    transition: height var(--transition-normal), opacity var(--transition-fast),
      padding var(--transition-normal), margin var(--transition-normal);
  }
}

.mc-sidebar-establishment--compacta {
  .mc-restaurant-cover {
    height: 64px;
  }

  /* El logo y el nombre se centran en la barra.
     Con la ficha abierta el bloque cuelga del borde de abajo de la portada, que es lo
     que se quiere ahi. Al encogerse, ese mismo anclaje dejaba el logo 8 px por debajo
     del borde -medido en produccion- y la portada lo recortaba: se veia un circulo
     partido. Ocupando la barra entera, se centra y no hay nada que recortar. */
  .mc-restaurant-cover .mc-restaurant-cover__identity {
    position: absolute;
    inset: 0;
    padding: 0 var(--space-md);
  }

  /* El logo encoge con la barra, en el mismo movimiento. QAvatar saca su tamaño del
     font-size, y lo trae en linea, de ahi el !important. */
  .mc-restaurant-avatar {
    font-size: 44px !important;
  }

  /* El nombre NO cambia de tamaño: encogerlo se notaba como un brinco de la letra a
     media pasada, porque el font-size no se puede animar junto con lo demas. Lo que si
     cambia es que se queda en un renglon, que es lo que cabe en la barra. */
  .mc-restaurant-cover__name {
    -webkit-line-clamp: 1;
  }

  .mc-restaurant-info {
    height: 0;
    opacity: 0;
    overflow: hidden;
    padding-top: 0;
    padding-bottom: 0;
    margin: 0;
  }

  /* Sin esto quedaba una franja blanca de 17 px entre la barra del negocio y las
     categorias: el relleno de la ficha seguia ahi aunque su contenido ya no. Se veia
     como una costura y era justo lo que se notaba al bajar. */
  padding-bottom: 0;

  /* El aviso del negocio si se queda: es lo que el dueño quiso decir. */
  .mc-establishment-banner {
    padding: 5px var(--space-md);
    font-size: var(--text-xs);
  }
}

@media screen and (min-width: 1024px) {
  /* En escritorio la ficha no se contrae: ahi no compite por la pantalla. */
  .mc-sidebar-establishment--compacta {
    .mc-restaurant-cover { height: 132px; }
    .mc-restaurant-info { height: auto; opacity: 1; overflow: visible; }

    /* Y tampoco encoge el logo ni sube el nombre: por si se estira la ventana de
       celular a escritorio con la ficha ya encogida. */
    .mc-restaurant-avatar { font-size: 62px !important; }

    .mc-restaurant-cover .mc-restaurant-cover__identity {
      inset: auto 0 0 0;
      padding: var(--space-md);
    }
  }
}

/* ===== El indice de categorias ===== */

/* La tira y el boton comparten renglon. El boton NO va dentro de la tira: ahi se
   deslizaria con las pestañas y no estaria cuando hace falta. */
.mc-tabs-fila {
  display: flex;
  align-items: stretch;
  min-width: 0;
}

.mc-tabs-fila .mc-sidebar-tabs {
  min-width: 0;
  flex: 1;
}

.mc-indice-btn {
  appearance: none;
  border: 0;
  border-left: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  flex: 0 0 44px;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.mc-indice {
  width: 100%;
  max-width: 100%;
  background: var(--color-surface);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding: var(--space-md) var(--space-md) calc(var(--space-md) + env(safe-area-inset-bottom, 0px));
}

.mc-indice__tit {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 700;
  margin-bottom: var(--space-sm);

  span {
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--color-text-tertiary);
  }
}

/* Con 13 categorias la lista no cabe en media pantalla: se desliza ella, no la hoja. */
.mc-indice__lista {
  max-height: 52vh;
  overflow-y: auto;
  /* Al llegar al final de la lista, el deslizamiento NO pasa a la pagina de atras.
     Sin esto, seguir arrastrando arrastra el menu que esta debajo del menu emergente. */
  overscroll-behavior: contain;
  margin: 0 calc(-1 * var(--space-md));
  padding: 0 var(--space-md);
}

.mc-indice__fila {
  appearance: none;
  border: 0;
  width: 100%;
  background: none;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 2px;
  cursor: pointer;
  text-align: left;
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border-subtle);

  &:last-child { border-bottom: 0; }
  &:active { background: var(--color-surface-variant); }

  /* Donde esta parado ahora mismo: el indice tambien sirve para ubicarse. */
  &--on {
    color: var(--q-primary);
    font-weight: 700;
  }
}

.mc-indice__nom {
  font-size: var(--text-base);
  font-weight: 500;
}

.mc-indice__n {
  flex-shrink: 0;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  font-variant-numeric: tabular-nums;
}

.mc-indice__cerrar {
  appearance: none;
  border: 0;
  width: 100%;
  margin-top: var(--space-sm);
  padding: 13px;
  border-radius: var(--radius-md);
  background: var(--color-surface-variant);
  font-family: inherit;
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text-primary);
  cursor: pointer;
}

.mc-restaurant-cover {
  position: relative;
  // Sangra el padding del contenedor (var(--space-md)) para llegar a los bordes
  margin: calc(-1 * var(--space-md)) calc(-1 * var(--space-md)) 0;
  height: 132px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;

  &--placeholder {
    // Sin banner: el cover se ajusta al logo+nombre (no reservar altura vacía)
    height: auto;
    background: linear-gradient(
      135deg,
      var(--q-primary) 0%,
      color-mix(in srgb, var(--q-primary) 60%, #000 40%) 100%
    );

    .mc-restaurant-cover__scrim {
      display: none;
    }

    .mc-restaurant-cover__identity {
      position: static;
    }
  }

  &__scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.05) 0%,
      rgba(0, 0, 0, 0.15) 45%,
      rgba(0, 0, 0, 0.62) 100%
    );
  }

  &__identity {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-md);
  }

  &__name {
    font-family: var(--font-display);
    font-size: 1.35rem;
    font-weight: 800;
    line-height: 1.15;
    color: #fff;
    margin: 0;
    letter-spacing: -0.01em;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.mc-restaurant-avatar {
  border: 3px solid #fff;
  transition: font-size var(--transition-normal);
  flex-shrink: 0;
  box-shadow: var(--shadow-md);
  background: #fff;
}

.mc-restaurant-info {
  padding: var(--space-sm) var(--space-md);

  @media screen and (min-width: 1024px) {
    text-align: center;
  }
}

.mc-restaurant-details {
  width: 100%;
}

.mc-restaurant-details {
  flex: 1;
}

.mc-restaurant-meta {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-top: var(--space-xs);

  @media screen and (min-width: 1024px) {
    justify-content: center;
  }
}

.mc-hours-btn {
  transition: var(--transition-fast);

  // Horario, compartir y reseñas son la misma clase de acción y van al mismo tamaño.
  // Se pone aquí y no icono por icono porque los tres ya comparten esta clase.
  :deep(.q-icon) {
    font-size: var(--icono-sm);
  }

  &:hover {
    background: var(--color-surface-variant);
  }
}

@keyframes mcCartBounce {
  0% { transform: scale(1); }
  35% { transform: scale(1.25); }
  60% { transform: scale(0.92); }
  100% { transform: scale(1); }
}

.mc-cart-bar-spacer {
  height: 84px;
  flex: none;
}

// La barra va por encima del contenido y de los marginales de Quasar (header/footer,
// z 2000), pero SIEMPRE por debajo de los drawers (z 3000) y de su backdrop (z 2999).
// Si empata en 3000 con el drawer, gana la barra por orden del DOM (el q-page-container
// se pinta después de <add-cart-drawer/>) y se come el click del botón "Agregar".
// En móvil web esto no se notaba porque .mc-sidebar (position:relative; z-index:2) crea
// un contexto de apilamiento que encierra a la barra; en embebido .mc-sidebar-external
// es position:static, así que el z-index sube hasta la raíz y sí compite con el drawer.
$mc-cart-bar-z: 2500;

// Posición de la barra del carrito del sidebar por CSS (no por JS), para que sea
// correcta desde el primer render (antes fallaba en móvil al recargar con carrito).
// Escritorio: anclada al fondo de la columna del sidebar.
.mc-sidebar-cart-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
}

// Móvil/tablet: SIEMPRE pegada (sticky) al fondo del viewport.
@media (max-width: 1024px) {
  .mc-sidebar-cart-bar {
    position: fixed;
    z-index: $mc-cart-bar-z;
    margin-bottom: 0;
  }
  .mc-cart-bar-spacer {
    display: none; // en móvil la barra es fixed y no ocupa flujo
  }
}

// Modo embebido (iframe): también fija aunque el ancho sea grande.
.mc-sidebar-cart-bar--external {
  position: fixed;
  z-index: $mc-cart-bar-z;
}

.mc-cart-bar-left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  animation: mcCartBounce 0.4s ease;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

.mc-cart-bar-right {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

// Quasar mueve la tira asignando scrollLeft: un brinco de un frame. Con esto ese
// brinco arranca una animación, y el scrollTo del watcher la reapunta al centro antes
// del primer repintado, así que se ve un solo deslizamiento.
.mc-sidebar-tabs :deep(.q-tabs__content) {
  scroll-behavior: smooth;

  @media (prefers-reduced-motion: reduce) {
    scroll-behavior: auto;
  }
}

// El lado derecho como <a>: sobre el degradado de la barra, el azul y el subrayado
// de un enlace se ven como un error. Hereda el blanco de .mc-cart-bar.
.mc-cart-bar-link {
  color: inherit;
  text-decoration: none;
}

.mc-cart-bar-label {
  font-weight: 600;
  font-size: var(--text-base);
}

.mc-hours-dialog {
  border-radius: var(--radius-xl);
  min-width: 320px;
  max-width: 400px;

  @media screen and (max-width: 400px) {
    min-width: 280px;
    max-width: calc(100vw - 32px);
  }
}

.mc-hours-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 700;
}

.mc-hour-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--color-border-subtle);
  transition: background var(--transition-fast);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--color-surface-variant);
    border-radius: var(--radius-sm);
  }

  &--closed {
    opacity: 0.5;
  }
}

.mc-hour-day {
  text-transform: capitalize;
  font-weight: 500;
  font-size: var(--text-base);
}

.mc-hour-time {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.mc-address {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  margin-top: var(--space-xs);
  cursor: pointer;
  line-height: 1.4;

  &:hover {
    color: var(--q-primary);
  }

  @media screen and (min-width: 1024px) {
    justify-content: center;
    text-align: center;
  }
}

.mc-next-open {
  display: flex;
  align-items: center;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  margin-top: var(--space-xs);

  @media screen and (min-width: 1024px) {
    justify-content: center;
  }
}

.mc-history-btn-wrapper {
  padding: 0 var(--space-sm);
  margin-bottom: var(--space-xs);
}

.mc-history-btn {
  display: flex;
  align-items: center;
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast);

  &:hover {
    background: var(--color-surface-variant);
  }

  &__label {
    text-align: left;
  }

  &__count {
    margin-left: var(--space-xs);
  }

  &__chevron {
    margin-left: auto;
    color: var(--color-text-tertiary);
  }
}

.mc-reservation-btn-wrapper {
  padding: 0 var(--space-sm);
  margin-bottom: var(--space-xs);
}

.mc-reservation-btn {
  border-radius: var(--radius-md);
  font-weight: 600;
}

.mc-rating-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  transition: background var(--transition-fast);

  &:hover {
    background: color-mix(in srgb, #ffb300 15%, transparent);
  }

  &__score {
    font-weight: 700;
    font-size: var(--text-xs);
    color: var(--color-text-primary);
  }

  &__count {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }
}

.mc-tab-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  width: 100%;
}

.mc-tab-count {
  font-size: var(--text-xs);
  font-weight: 700;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-variant);
  color: var(--color-text-secondary);
}

// En el tab activo (fondo primary), el contador se adapta
.q-tab--active .mc-tab-count {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
}

.mc-establishment-banner {
  background: var(--q-primary);
  color: white;
  padding: 8px 16px;
  text-align: center;
  font-size: 13px;
  font-weight: 500;
}

</style>
