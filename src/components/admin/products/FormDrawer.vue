<template>
  <BaseFormDrawer
    v-model="adminStore.productFormDrawer"
    :form-data="adminStore.productForm"
    :uploading="adminStore.uploadingImage"
    :title="(adminStore.productForm.id ? 'Editar' : 'Nuevo') + ' platillo'"
    save-label="Guardar platillo"
    :loading="adminStore.loading || adminStore.uploadingImage"
    @save="adminStore.saveProduct"
  >
    <!-- Cuatro grupos y no una lista de catorce campos: el formulario contesta cuatro
         preguntas distintas -como se ve, que es, cuando se vende y a que precio- y
         puestas en fila no se distinguian entre si. La caja con titulo es la misma que
         ya usan Configuracion y Tema, no una convencion nueva. -->
    <admin-section
      title="Foto del platillo"
      icon="photo_camera"
      description="Es lo primero que decide si lo piden."
    >
    <!-- Product image -->
    <div class="mc-image-upload" v-if="displayedPhoto">
      <q-img
        :src="displayedPhoto"
        :ratio="16 / 9"
        class="mc-image-upload__preview"
        @click="triggerFileInput"
      >
        <div
          v-if="adminStore.uploadingImage"
          class="absolute-full flex flex-center"
          style="background: rgba(0,0,0,0.45)"
        >
          <q-spinner color="white" size="32px" />
        </div>
      </q-img>
      <q-btn
        v-if="adminStore.productForm.id && displayedPhoto"
        round
        :color="imgBtnColor"
        icon="auto_fix_high"
        size="sm"
        class="mc-image-upload__refresh"
        :loading="adminStore.loading"
        :disable="imgFeatureEnabled && imgUsage.remaining <= 0"
        @click.stop="triggerImproveImage"
      >
        <!-- Candado cuando el plan no incluye la función -->
        <q-badge v-if="!imgFeatureEnabled" floating color="amber-8" rounded class="mc-image-upload__lock">
          <q-icon name="lock" size="11px" color="white" />
        </q-badge>
        <q-tooltip>
          {{ imgTooltip }}
        </q-tooltip>
      </q-btn>
    </div>

    <q-btn
      outline
      color="primary"
      icon="camera_alt"
      no-caps
      :label="displayedPhoto ? 'Cambiar imagen' : 'Agregar imagen'"
      :dense="modoApp"
      class="full-width q-mb-lg mc-upload-btn"
      @click="triggerFileInput"
    />
    <input
      type="file"
      ref="fileInput"
      @change="onFileSelected"
      style="display: none"
      accept="image/*"
    />

    <!-- Guía para subir la foto -->
    <div class="mc-photo-guide" @click="showGuide = true">
      <q-img src="/guia.png" :ratio="16 / 9" class="mc-photo-guide__thumb" />
      <div class="mc-photo-guide__text">
        <q-icon name="help_outline" size="18px" color="primary" />
        <span>¿Cómo subir una buena foto? <strong>Ver guía</strong></span>
      </div>
    </div>

    <!-- Diálogo con la guía ampliada -->
    <q-dialog v-model="showGuide">
      <q-card class="mc-photo-guide-dialog">
        <q-img src="/guia.png" fit="contain" />
        <q-card-actions align="right">
          <q-btn flat no-caps color="primary" label="Entendido" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    </admin-section>

    <admin-section
      title="Lo básico"
      icon="restaurant_menu"
      description="Lo que el cliente lee en el menú. La descripción es la que convence."
    >
    <q-input
      v-model="adminStore.productForm.name"
      label="Nombre del producto"
      filled
      dense
      class="q-mb-md"
    />

    <q-select
      v-model="adminStore.productForm.dish_category"
      label="Categoría"
      filled
      dense
      option-value="id"
      option-label="name"
      :options="adminStore.categories"
      class="q-mb-md"
    />

    <q-input
      v-model="adminStore.productForm.price"
      label="Precio"
      filled
      dense
      type="number"
      prefix="$"
      class="q-mb-md"
    />

    <q-input
      v-model="adminStore.productForm.description"
      type="textarea"
      label="Descripción"
      filled
      dense
      autogrow
      class="q-mb-md"
    />

    </admin-section>

    <admin-section
      title="Cuándo se vende"
      icon="schedule"
      description="Inactivo lo esconde del menú. Los días y las horas lo muestran solo en su momento."
    >
    <q-select
      v-model="adminStore.productForm.status"
      label="Estado"
      filled
      dense
      class="q-mb-md"
      :options="['Activo', 'Inactivo']"
    />

    <!-- Disponibilidad por día y horario (ej. desayunos entre semana 07:00–12:00).
         Los días extienden esta tarjeta en vez de estrenar una: su pie ya dice
         "déjalo vacío para que esté disponible siempre", que es exactamente la
         regla de los días. No hay concepto nuevo que explicarle al dueño.

         Y son los que hacen posible la promo como producto: un "Ceviche 3x2"
         marcado solo en lunes aparece y desaparece solo. -->
    <div class="mc-availability">
      <div class="mc-availability__sub">Disponible solo en</div>
      <div class="mc-days">
        <q-btn
          v-for="dia in DIAS_LUNES_PRIMERO"
          :key="dia.valor"
          :label="dia.corto"
          :color="availDays.includes(dia.valor) ? 'primary' : 'grey-4'"
          :text-color="availDays.includes(dia.valor) ? 'white' : 'grey-8'"
          unelevated
          dense
          no-caps
          class="mc-days__btn"
          @click="toggleAvailDay(dia.valor)"
        >
          <q-tooltip>{{ dia.nombre }}</q-tooltip>
        </q-btn>
      </div>
      <div class="row q-col-gutter-sm">
        <q-input class="col-6" v-model="availFrom" type="time" filled dense label="Desde" />
        <q-input class="col-6" v-model="availUntil" type="time" filled dense label="Hasta" />
      </div>
      <p class="mc-availability__hint">Déjalo vacío para que esté disponible siempre.</p>

      <!-- El platillo que ES la promoción. Vive aquí, pegado a los días y horas,
           porque es la misma conversación: "esto es la promo del lunes". La Oferta
           de abajo es otra cosa -rebajar un platillo normal- y mezclarlas fue lo que
           llevó a que en producción se guardara un 4x3 con special_price igual al
           precio: un descuento de cero para poder salir arriba. -->
      <q-toggle
        v-model="adminStore.productForm.is_promo"
        color="primary"
        class="q-mt-sm"
        label="Es una promoción"
      />
      <p class="mc-availability__hint">
        Sube al bloque <strong>Ofertas del día</strong> en los días y horas de aquí
        arriba. El precio que pusiste ya es el de la promoción.
      </p>
    </div>
    </admin-section>

    <!-- Oferta.
         Estaba SOLO en el menú de los tres puntitos del renglón, y por eso nadie la
         usaba: de 25 negocios revisados en producción, cero tenían una oferta puesta,
         asi que el bloque "Ofertas del día" del menú no le aparecía a ningún cliente.
         Aquí es donde el dueño ya está parado cuando piensa en el precio.

         El botón abre el MISMO diálogo del renglón, no un formulario nuevo: la oferta
         se guarda por su propio endpoint y el platillo por otro, así que meterla en
         este "Guardar" seria una peticion que puede fallar a la mitad y dejar el
         platillo y su oferta en desacuerdo. -->
    <admin-section
      v-if="adminStore.productForm.id"
      title="Oferta"
      icon="local_offer"
      description="Rebajar este platillo unos días. Sube al bloque de arriba del menú con su precio anterior tachado."
    >
    <div class="mc-offer">

      <p class="mc-offer__estado" v-if="tieneOferta">
        Con oferta a <strong>${{ adminStore.productForm.special_price }}</strong>
        <span v-if="textoVigencia"> · {{ textoVigencia }}</span>
      </p>

      <!-- Una oferta guardada NO es una oferta que se ve. El menú la calla si ya
           venció, si hoy no es uno de sus días, o si no es más barata que el precio
           normal, y desde aquí eso era invisible: el cajón decía "Con oferta a $330"
           mientras el cliente no veía nada. -->
      <p class="mc-offer__alerta" v-if="motivoOculta">
        <q-icon name="warning" size="16px" class="q-mr-xs" />
        {{ motivoOculta }}
      </p>
      <p class="mc-offer__estado" v-else>
        Sin oferta. Al ponerle una, el platillo sube al bloque
        <strong>Ofertas del día</strong>, hasta arriba del menú, con su precio anterior
        tachado.
      </p>

      <q-btn
        unelevated
        no-caps
        size="sm"
        :color="tieneOferta ? 'grey-7' : 'primary'"
        :icon="tieneOferta ? 'edit' : 'local_offer'"
        :label="tieneOferta ? 'Editar oferta' : 'Crear oferta'"
        @click="$emit('offer', adminStore.productForm)"
      />
    </div>
    </admin-section>
  </BaseFormDrawer>
</template>

<script setup>
defineOptions({
  name: "ProductFormDrawer",
});
import { ref, reactive, watch, computed } from "vue";
import { useQuasar } from "quasar";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";
import BaseFormDrawer from "../BaseFormDrawer.vue";
import AdminSection from "../AdminSection.vue";
import { useModoApp } from "src/composables/useModoApp";
import { DIAS_LUNES_PRIMERO, aplicaHoy, diasValidos, textoDeDias } from "src/utils/weekDays";

// La oferta la abre el padre (Products.vue), que ya tiene ese diálogo montado.
defineEmits(["offer"]);

const adminStore = useAdminStore();
const $q = useQuasar();
const { modoApp } = useModoApp();

// --- Oferta ---
const tieneOferta = computed(() => Number(adminStore.productForm.special_price) > 0);

/**
 * Por qué la oferta guardada no le aparece al cliente, o vacío si sí le aparece.
 *
 * Se revisa en el mismo orden en que el menú descarta: primero la fecha, luego los
 * días, y al final el descuento -que el menú sí muestra, pero como un tachado de
 * $330 a $330 que no le dice nada a nadie-.
 */
const motivoOculta = computed(() => {
  if (!tieneOferta.value) return "";

  const hasta = adminStore.productForm.special_until;
  if (hasta) {
    const fecha = new Date(hasta);
    if (!Number.isNaN(fecha.getTime()) && fecha <= new Date()) {
      return `Esta oferta venció el ${fecha.toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
      })} y el menú ya no la muestra. Edítala con una fecha futura para revivirla.`;
    }
  }

  if (!aplicaHoy(adminStore.productForm.special_days)) {
    return `Hoy no aplica: corre ${textoDeDias(adminStore.productForm.special_days)}. El resto de los días el menú cobra el precio normal.`;
  }

  const oferta = Number(adminStore.productForm.special_price);
  const normal = Number(adminStore.productForm.price);
  if (normal > 0 && oferta >= normal) {
    return `El precio de oferta no es menor al normal ($${normal}), así que no hay descuento que anunciar.`;
  }

  return "";
});

/** "Lunes y martes · hasta el 20 ago", o vacío si la oferta no tiene límites. */
const textoVigencia = computed(() => {
  const partes = [];

  const dias = textoDeDias(adminStore.productForm.special_days);
  if (dias) partes.push(dias);

  const hasta = adminStore.productForm.special_until;
  if (hasta) {
    const fecha = new Date(hasta);
    if (!Number.isNaN(fecha.getTime())) {
      partes.push(
        "hasta el " + fecha.toLocaleDateString("es-MX", { day: "numeric", month: "short" })
      );
    }
  }

  return partes.join(" · ");
});

const fileInput = ref(null);
const imgUsage = reactive({ used: 0, limit: 0, remaining: 0 });
const localPreview = ref("");
const showGuide = ref(false);

// Imagen a mostrar: preview local mientras sube, o la URL ya guardada
const displayedPhoto = computed(() => localPreview.value || adminStore.productForm.photo);

// Horario de disponibilidad: el input type=time usa HH:MM; la BD puede traer HH:MM:SS.
const availFrom = computed({
  get: () => (adminStore.productForm.available_from || "").slice(0, 5),
  set: (v) => { adminStore.productForm.available_from = v || null; },
});
const availUntil = computed({
  get: () => (adminStore.productForm.available_until || "").slice(0, 5),
  set: (v) => { adminStore.productForm.available_until = v || null; },
});

// Días en que se vende el platillo. Se guarda NULL cuando no queda ninguno, no un
// arreglo vacío: así la columna dice "sin restricción" de una sola forma.
const availDays = computed(() => diasValidos(adminStore.productForm.available_days));

const toggleAvailDay = (valor) => {
  const actuales = availDays.value;
  const nuevos = actuales.includes(valor)
    ? actuales.filter((d) => d !== valor)
    : [...actuales, valor].sort((a, b) => a - b);
  adminStore.productForm.available_days = nuevos.length ? nuevos : null;
};

// ¿El plan del restaurante incluye mejoras de imagen con IA?
const imgFeatureEnabled = computed(() => imgUsage.limit > 0);

const imgBtnColor = computed(() => {
  if (!imgFeatureEnabled.value) return "amber-8"; // premium/candado
  return imgUsage.remaining > 0 ? "primary" : "grey-5"; // disponible / agotado
});

const imgTooltip = computed(() => {
  if (!imgFeatureEnabled.value) return "Mejorar imagen con IA ✨ — disponible al mejorar tu plan";
  if (imgUsage.remaining > 0)
    return `Mejorar imagen con IA (${imgUsage.used}/${imgUsage.limit} usadas)`;
  return `Límite alcanzado este mes (${imgUsage.limit}/${imgUsage.limit})`;
});

// Cuando la subida termina y guarda la URL real, descartar el preview base64
watch(() => adminStore.productForm.photo, (photo) => {
  if (photo && /^https?:\/\//i.test(photo)) localPreview.value = "";
});

// Load usage when drawer opens
watch(() => adminStore.productFormDrawer, async (open) => {
  localPreview.value = "";
  if (open && adminStore.slug) {
    try {
      const { data } = await api.get(`/admin/${adminStore.slug}/image-improvements/usage`);
      Object.assign(imgUsage, data);
    } catch (e) {
      Object.assign(imgUsage, { used: 0, limit: 0, remaining: 0 });
    }
  }
});

const triggerFileInput = () => {
  fileInput.value.click();
};

const triggerImproveImage = async () => {
  // Plan sin la función: no se llama a la IA, se invita a mejorar el plan.
  if (!imgFeatureEnabled.value) {
    $q.notify({
      message: "Mejorar imágenes con IA es una función premium. Actualiza tu plan para activarla.",
      color: "amber-9",
      icon: "auto_fix_high",
      position: "top",
      timeout: 3500,
    });
    return;
  }
  const ok = await adminStore.improveImage();
  // Solo descontar el cupo si la mejora tuvo éxito
  if (ok) {
    imgUsage.used++;
    imgUsage.remaining = Math.max(0, imgUsage.limit - imgUsage.used);
  }
};

const onFileSelected = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      // Preview inmediato (base64). NO se guarda en productForm.photo:
      // uploadDishImage pondrá ahí la URL real cuando termine la subida.
      localPreview.value = e.target.result;
      adminStore.uploadDishImage(file);
      event.target.value = null;
    };
    reader.readAsDataURL(file);
  }
};
</script>

<style lang="scss" scoped>
.mc-image-upload {
  position: relative;
  margin-bottom: var(--space-md);
  border-radius: var(--radius-lg);
  overflow: hidden;

  &__preview {
    cursor: pointer;
    border-radius: var(--radius-lg);
    transition: opacity var(--transition-fast);

    &:hover {
      opacity: 0.85;
    }
  }

  &__refresh {
    position: absolute;
    bottom: var(--space-sm);
    right: var(--space-sm);
    box-shadow: var(--shadow-md);
  }

  &__lock {
    padding: 2px;
    min-height: 0;
  }
}

.mc-upload-btn {
  border-radius: var(--radius-md);
  border-style: dashed;
  font-weight: 500;
}

// Sin marco propio: se lo presta la seccion que lo contiene. Antes tenia el suyo y
// quedaban dos cajas encimadas con dos titulos que decian lo mismo.
.mc-availability {
  margin-top: var(--space-md);

  &__sub {
    font-weight: 600; font-size: var(--text-xs);
    color: var(--color-text-secondary); margin-bottom: var(--space-xs);
  }
  &__hint {
    font-size: var(--text-xs); color: var(--color-text-tertiary);
    margin: var(--space-xs) 0 0;
  }
}

.mc-offer {
  &__estado {
    font-size: var(--text-xs); color: var(--color-text-tertiary);
    line-height: 1.5; margin: 0 0 var(--space-sm);
  }

  // Ambar y no rojo: no esta roto, esta guardado y callado. El rojo aqui competiria
  // con el sello de oferta del propio cajon.
  &__alerta {
    display: flex; align-items: flex-start;
    font-size: var(--text-xs); line-height: 1.5;
    margin: 0 0 var(--space-sm);
    padding: var(--space-sm);
    border-radius: var(--radius-sm);
    color: #8a5300;
    background: var(--color-warning-bg);
  }
}

// Siete botones y no un desplegable: se ven todos de un vistazo y "fin de semana"
// son dos toques. Se reparten el ancho para que quepan en el cajón del panel.
.mc-days {
  display: flex;
  gap: 4px;
  margin-bottom: var(--space-sm);

  &__btn {
    flex: 1 1 0;
    min-width: 0;
    padding: 4px 0;
    font-weight: 700;
  }
}

.mc-photo-guide {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: calc(-1 * var(--space-md));
  margin-bottom: var(--space-lg);
  padding: var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-variant);
  cursor: pointer;
  transition: border-color var(--transition-fast), background var(--transition-fast);

  &:hover {
    border-color: var(--q-primary);
    background: var(--color-primary-soft);
  }

  &__thumb {
    width: 88px;
    flex-shrink: 0;
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  &__text {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: 1.3;

    strong {
      color: var(--q-primary);
    }
  }
}

.mc-photo-guide-dialog {
  max-width: 900px;
  width: 95vw;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

/* En celular la foto sola se comia la primera pantalla entera: descripcion de tres
   renglones, imagen 16:9, boton con marco y la guia con su miniatura. El nombre del
   platillo -que es a lo que uno entra- quedaba abajo del pliegue. */
@media (max-width: 1023px) {
  .mc-upload-btn {
    margin-bottom: var(--space-sm) !important;
    font-size: 12px;
  }

  .mc-photo-guide {
    padding: 8px 10px;
    /* Era el aire que dejaba el hueco al final de la tarjeta de la foto. */
    margin-bottom: 0;

    /* La miniatura se ve igual dentro del dialogo, que es donde se lee de verdad. */
    &__thumb { display: none; }
    &__text { font-size: 12px; }
  }

  .mc-availability { margin-top: var(--space-sm); }
}
</style>
