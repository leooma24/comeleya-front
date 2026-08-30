<template>
  <div>
    <q-card flat class="mc-admin-card" :class="{ 'mc-seccion-app': modoApp }">
      <mc-encabezado
        v-if="modoApp"
        atras
        titulo="Comparte tu menú"
        :subtitulo="adminStore.company?.name || 'Tu negocio'"
        @atras="volverAMas"
      />

      <div class="mc-admin-card__header" v-if="!modoApp">
        <div class="mc-admin-card__title">
          <q-icon name="campaign" size="24px" color="primary" class="q-mr-sm" />
          Comparte tu menú
        </div>
      </div>

      <div class="mc-dif">
        <p class="mc-dif__intro">
          Tu menú ya recibe pedidos, pero tus clientes no lo saben hasta que se los
          dices. Aquí está tu liga y los textos listos para pegar.
        </p>

        <admin-section
          title="Tu liga"
          icon="link"
          description="Es la misma para todo: WhatsApp, Facebook, tu perfil de Instagram o el letrero de la entrada."
        >
          <div class="mc-dif__liga">
            <code>{{ liga }}</code>
            <q-btn flat dense no-caps color="primary" icon="content_copy" label="Copiar" @click="copiar(liga)" />
          </div>
          <q-btn
            outline no-caps color="primary" icon="qr_code_2"
            label="Descargar el QR para imprimir"
            class="full-width q-mt-sm"
            :loading="bajandoQr"
            @click="descargarQr('menu')"
          />
        </admin-section>

        <!-- Google no es una red donde publicas: es donde te encuentran sin buscarte.
             Por eso va aparte de los textos para copiar y pegar. -->
        <admin-section
          title="Tu menú en Google"
          icon="travel_explore"
          description="Para que quien te busque en Google o en Maps pueda pedir sin salir de ahí."
        >
          <p class="mc-dif__google">
            En tu <strong>Perfil de Negocio de Google</strong> puedes agregar un enlace de
            pedidos. Pega ahí <strong>la misma liga de arriba</strong> y a quien te encuentre
            en el buscador o en el mapa le aparecerá un botón para pedir, que lo trae directo
            a tu menú.
          </p>
          <p class="mc-dif__google">
            Es gratis, se hace una sola vez y no depende de nosotros: el enlace vive en tu
            perfil, no en ComeleYa.
          </p>
          <q-btn
            outline no-caps color="primary" icon="open_in_new"
            label="Cómo agregarlo (ayuda de Google)"
            class="full-width q-mt-sm"
            type="a"
            href="https://support.google.com/business/answer/10842217?hl=es-419"
            target="_blank"
            rel="noopener"
          />
        </admin-section>

        <!-- Las resenas de Google son lo que mueve el ranking local de un
             restaurante, y pedirlas no necesita ningun permiso: el enlace se arma
             con el Place ID y ya. -->
        <admin-section
          title="Pide reseñas en Google"
          icon="star"
          description="Las reseñas son lo que hace que Google te muestre antes que a los de al lado."
        >
          <q-input
            filled dense rounded
            v-model="placeId"
            label="Tu Place ID de Google"
            placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
            hint="Es un código, no la dirección de tu negocio en Google"
            class="q-mb-sm"
          >
            <template v-slot:prepend><q-icon name="pin_drop" /></template>
          </q-input>

          <div class="row q-col-gutter-sm q-mb-md">
            <div class="col">
              <q-btn
                unelevated no-caps color="primary" icon="save" label="Guardar"
                class="full-width" :loading="guardandoPlace" @click="guardarPlaceId"
              />
            </div>
            <div class="col">
              <q-btn
                outline no-caps color="primary" icon="help_outline" label="¿Dónde lo saco?"
                class="full-width"
                type="a"
                href="https://developers.google.com/maps/documentation/places/web-service/place-id"
                target="_blank"
                rel="noopener"
              />
            </div>
          </div>

          <!-- El enlace solo aparece cuando ya hay Place ID: uno a medias lleva a
               una pagina rota de Google, y eso impreso en la mesa no se arregla con
               un despliegue. -->
          <template v-if="urlResena">
            <div class="mc-dif__liga">
              <code>{{ urlResena }}</code>
              <q-btn flat dense no-caps color="primary" icon="content_copy" label="Copiar" @click="copiar(urlResena)" />
            </div>
            <q-btn
              outline no-caps color="primary" icon="qr_code_2"
              label="Descargar el QR de reseñas para imprimir"
              class="full-width q-mt-sm"
              :loading="bajandoQrResena"
              @click="descargarQr('resena')"
            />
          </template>
        </admin-section>

        <!-- Textos escritos para que nadie tenga que redactar nada. El que no sabe
             qué poner, no publica: ese es el paso donde se cae la difusión. -->
        <admin-section
          v-for="t in textos"
          :key="t.clave"
          :title="t.titulo"
          :icon="t.icono"
          :description="t.cuando"
        >
          <div class="mc-dif__texto">{{ t.cuerpo }}</div>
          <div class="mc-dif__acciones">
            <q-btn flat dense no-caps color="primary" icon="content_copy" label="Copiar" @click="copiar(t.cuerpo)" />
            <q-btn
              flat dense no-caps color="green-7" icon="fab fa-whatsapp" label="Mandar por WhatsApp"
              @click="porWhatsApp(t.cuerpo)"
            />
          </div>
        </admin-section>
      </div>
    </q-card>
  </div>
</template>

<script setup>
defineOptions({ name: "AdminDifusion" });

import { ref, computed, onMounted } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";
import { useModoApp } from "src/composables/useModoApp";
import AdminSection from "./AdminSection.vue";
import McEncabezado from "./movil/Encabezado.vue";

/**
 * El kit para anunciar el menú.
 *
 * La mayoría de los negocios entraron cuando esto solo enseñaba la carta, así que sus
 * clientes tampoco saben que ahora se puede pedir. Publicar la liga es el paso que
 * convierte "tengo menú en línea" en "me llegan pedidos", y es justo donde se atora:
 * no por flojera, sino porque nadie sabe qué escribir.
 *
 * Por eso los textos vienen hechos y no como sugerencia de qué decir.
 */
const adminStore = useAdminStore();
const { modoApp } = useModoApp();
const bajandoQr = ref(false);

const negocio = computed(() => adminStore.company?.name || "nuestro restaurante");
const liga = computed(() => `https://comeleya.com/${adminStore.slug}`);

const volverAMas = () => { adminStore.tab = "mc_mas"; };

const textos = computed(() => [
  {
    clave: "estado",
    titulo: "Para tu estado de WhatsApp",
    icono: "chat",
    cuando: "Lo ven los clientes que ya te tienen guardado. Es el que más pedidos trae al principio.",
    cuerpo:
      `📲 Ya puedes pedir de ${negocio.value} desde tu celular.\n\n` +
      `Ves el menú con fotos, armas tu pedido y nos llega directo por WhatsApp.\n\n` +
      `${liga.value}`,
  },
  {
    clave: "facebook",
    titulo: "Para Facebook",
    icono: "public",
    cuando: "Publícalo una vez y déjalo fijado en tu página.",
    cuerpo:
      `¡Ya tenemos menú en línea! 🎉\n\n` +
      `En ${negocio.value} ahora puedes ver todos nuestros platillos con foto y precio, ` +
      `armar tu pedido y mandárnoslo sin llamar.\n\n` +
      `👉 ${liga.value}\n\n` +
      `Guárdalo, es la misma liga siempre.`,
  },
  {
    clave: "clientes",
    titulo: "Para mandarle a un cliente",
    icono: "person",
    cuando: "Cuando alguien te escribe a preguntar qué tienes o cuánto cuesta.",
    cuerpo:
      `¡Claro! Aquí está nuestro menú completo con precios: ${liga.value}\n\n` +
      `Desde ahí mismo puedes armar tu pedido y me llega directo.`,
  },
  {
    clave: "letrero",
    titulo: "Para el letrero o la mesa",
    icono: "storefront",
    cuando: "Junto al QR, para que quien ya está en el local se lo lleve a casa.",
    cuerpo:
      `Escanea y pide desde tu celular.\n` +
      `Menú completo de ${negocio.value} con fotos y precios.\n` +
      `${liga.value}`,
  },
]);

const copiar = async (texto) => {
  try {
    await navigator.clipboard.writeText(texto);
    adminStore.messageStore.success("Copiado");
  } catch (e) {
    // Sin permiso de portapapeles -pasa en algunos navegadores del telefono-, al
    // menos que pueda seleccionarlo a mano en vez de quedarse sin nada.
    adminStore.messageStore.error("No se pudo copiar. Selecciona el texto y cópialo a mano.");
  }
};

const porWhatsApp = (texto) =>
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");

// El Place ID del negocio en Google. Es lo unico de "Google Business" que se puede
// usar hoy: su API arranca en cuota cero y hay que solicitarla, pero el enlace para
// dejar una resena es solo una direccion.
const placeId = ref("");
const urlResena = ref("");
const guardandoPlace = ref(false);
const bajandoQrResena = ref(false);

const cargarGoogle = async () => {
  try {
    const { data } = await api.get(`/admin/${adminStore.slug}/google/config`);
    placeId.value = data.config?.place_id || "";
    urlResena.value = data.config?.review_url || "";
  } catch (e) {
    // Sin configurar es el caso normal: no hay nada que avisar.
  }
};

const guardarPlaceId = async () => {
  guardandoPlace.value = true;
  try {
    const { data } = await api.put(`/admin/${adminStore.slug}/google/config`, {
      place_id: placeId.value,
    });
    urlResena.value = data.config?.review_url || "";
    adminStore.messageStore.success("Guardado");
  } catch (e) {
    // El servidor explica por que no le gusto -normalmente pegaron la URL entera-.
    adminStore.messageStore.error(e.response?.data?.message || "No se pudo guardar");
  } finally {
    guardandoPlace.value = false;
  }
};

onMounted(cargarGoogle);

/** El QR del menu, o el de pedir resena en Google. Es el mismo cartel. */
const descargarQr = async (tipo = "menu") => {
  const esResena = tipo === "resena";
  const bandera = esResena ? bajandoQrResena : bajandoQr;
  bandera.value = true;
  try {
    const { data } = await api.get(`/admin/${adminStore.slug}/qr-pdf`, {
      params: esResena ? { tipo: "resena" } : {},
      responseType: "blob",
    });
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${esResena ? "resenas" : "qr"}-${adminStore.slug}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    adminStore.messageStore.error("No se pudo generar el QR");
  } finally {
    bandera.value = false;
  }
};
</script>

<style lang="scss" scoped>
.mc-dif {
  padding: var(--mc-lado, 16px);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mc-dif__intro {
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--color-text-secondary);
  margin: 0;
}

.mc-dif__google {
  margin: 0 0 8px;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.mc-dif__liga {
  display: flex;
  align-items: center;
  gap: 8px;

  code {
    flex: 1;
    min-width: 0;
    overflow-x: auto;
    white-space: nowrap;
    background: var(--color-surface-variant);
    border-radius: 8px;
    padding: 9px 10px;
    font-size: 12px;
  }
}

/* El texto se enseña tal cual se va a publicar, con sus saltos de linea: si aqui se
   ve distinto a como quedara, nadie confia en el boton de copiar. */
.mc-dif__texto {
  white-space: pre-wrap;
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--color-text-primary);
  background: var(--color-surface-variant);
  border-radius: 10px;
  padding: 11px 12px;
}

.mc-dif__acciones {
  display: flex;
  gap: 4px;
  margin-top: 6px;
  flex-wrap: wrap;
}
</style>
