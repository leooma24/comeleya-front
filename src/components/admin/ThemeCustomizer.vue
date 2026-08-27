<template>
  <q-card flat class="mc-admin-card">
    <div class="mc-admin-card__header">
      <div class="mc-admin-card__title">
        <q-icon name="palette" size="24px" color="primary" class="q-mr-sm" />
        Personalización de Tema
      </div>
      <q-btn unelevated no-caps color="primary" label="Guardar" icon="save" size="sm" @click="saveTheme" :loading="saving" />
    </div>

    <div v-if="loading" class="mc-loading">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <template v-else>
      <div class="mc-theme-sections">
        <!-- Colors -->
        <admin-section
          icon="palette"
          title="Colores"
          description="El principal es el que más se ve: pinta los botones, la barra del pedido y los precios. Los otros tres casi nunca hace falta moverlos."
        >
          <div class="mc-color-grid">
            <div class="mc-color-field" v-for="(label, key) in colorLabels" :key="key">
              <label>{{ label }}</label>
              <div class="mc-color-picker">
                <input type="color" v-model="theme[key]" />
                <q-input filled dense rounded v-model="theme[key]" class="mc-color-input" />
              </div>
            </div>
          </div>
        </admin-section>

        <admin-section
          icon="menu"
          title="Navegación del menú"
          description="En un celular solo se alcanzan a ver tres categorías de la tira de arriba. El índice es una lista con todas, que el cliente abre con un toque."
        >
          <q-select
            filled dense rounded
            v-model="theme.category_index"
            :options="opcionesIndice"
            label="Índice de categorías"
            emit-value
            map-options
          />
        </admin-section>

        <!-- Typography -->
        <admin-section
          icon="text_fields"
          title="Tipografía"
          description="La letra de todo tu menú. Las redondeadas se sienten informales y las rectas más serias; si dudas, déjala como está."
        >
          <q-select
            filled dense rounded
            v-model="theme.font_family"
            :options="fontOptions"
            label="Fuente principal"
            emit-value
            map-options
          />
        </admin-section>

        <!-- Layout -->
        <admin-section
          icon="dashboard"
          title="Diseño"
          description="Qué tan redondeadas y con cuánta sombra se ven las tarjetas de tus platillos."
        >
          <div class="row q-gutter-md">
            <q-select
              filled dense rounded
              v-model="theme.border_radius"
              :options="radiusOptions"
              label="Bordes redondeados"
              emit-value
              map-options
              class="col"
            />
            <q-select
              filled dense rounded
              v-model="theme.card_style"
              :options="cardOptions"
              label="Estilo de tarjetas"
              emit-value
              map-options
              class="col"
            />
          </div>
        </admin-section>

        <!-- Banner -->
        <admin-section
          icon="campaign"
          title="Banner"
          description="Una franja de aviso hasta arriba del menú, para lo del día: una promoción, que hoy cierras temprano o que no hay servicio a domicilio."
        >
          <q-toggle v-model="theme.show_banner" label="Mostrar banner en menú" />
          <q-input
            v-if="theme.show_banner"
            filled dense rounded
            v-model="theme.banner_text"
            label="Texto del banner"
          />
        </admin-section>

        <!-- Salida de regreso al sitio del negocio, para quien tiene el menú embebido.
             Las llaves siguen diciendo card_ porque así se guardaron cuando este botón
             vivía en la tarjeta del platillo; renombrarlas borraría lo capturado. -->
        <admin-section icon="call_made" title="Botón de la barra del pedido">
          <template v-slot:description>
            Es el lado derecho de la barra azul que aparece abajo cuando el cliente ya
            tiene platillos: el que dice <strong>Ver pedido</strong>. Puedes cambiarlo
            por un enlace a tu propia página; el resto de la barra sigue abriendo el
            pedido. <strong>Solo funciona con el menú insertado en tu sitio web</strong>,
            porque abierto en comeleya.com no hay página tuya a la cual volver.
          </template>
          <q-input
            filled dense rounded
            v-model="theme.card_cta_label"
            label="Texto del botón"
            maxlength="40"
            counter
            placeholder="Volver a las categorías"
          />
          <q-input
            filled dense rounded
            v-model="theme.card_cta_url"
            label="Enlace del botón"
            placeholder="https://tusitio.com/categorias"
          >
            <template v-slot:hint>
              Se necesitan los dos campos: si dejas uno vacío, la barra se queda como
              está. Debe empezar con https://
            </template>
          </q-input>
        </admin-section>

        <!-- Ícono del carrito -->
        <admin-section
          icon="shopping_cart"
          title="Ícono del carrito"
          description="Cambia el carrito de compras por tu logo o por un ícono tuyo. Si no subes nada se usa el de siempre."
        >
          <div class="mc-cart-uploader">
            <div class="mc-cart-preview">
              <img v-if="theme.cart_image" :src="theme.cart_image" alt="" />
              <q-icon v-else name="shopping_cart" size="28px" color="grey-6" />
            </div>
            <div class="mc-cart-actions">
              <q-file
                v-model="cartFile"
                accept="image/*"
                dense
                filled
                label="Subir imagen"
                style="max-width: 220px"
                :loading="uploadingCart"
                @update:model-value="onCartFile"
              >
                <template v-slot:prepend><q-icon name="upload" /></template>
              </q-file>
              <q-btn
                v-if="theme.cart_image"
                flat
                dense
                no-caps
                color="negative"
                icon="delete"
                label="Quitar"
                @click="removeCartImage"
              />
            </div>
          </div>
        </admin-section>

        <!-- Preview -->
        <admin-section
          icon="visibility"
          title="Vista previa"
          description="Así le va a quedar a tu cliente. Se actualiza solo conforme cambias lo de arriba, pero nada se aplica de verdad hasta que le des Guardar."
        >
          <div class="mc-theme-preview" :style="previewStyles">
            <div class="mc-preview-header" :style="{ background: theme.primary_color, color: '#fff' }">
              {{ adminStore.company.name || 'Mi Restaurante' }}
            </div>
            <div class="mc-preview-body">
              <div class="mc-preview-card" :style="{ borderRadius: theme.border_radius || '12px' }">
                <div class="mc-preview-card__name">Platillo ejemplo</div>
                <div class="mc-preview-card__price" :style="{ color: theme.primary_color }">$99.00</div>
              </div>
              <div class="mc-preview-btn" :style="{ background: theme.primary_color, borderRadius: theme.border_radius || '12px' }">
                Agregar al carrito
              </div>
            </div>
          </div>
        </admin-section>
      </div>
    </template>
  </q-card>
</template>

<script setup>
defineOptions({ name: "ThemeCustomizerComponent" });

import { ref, computed, onMounted } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";
import AdminSection from "./AdminSection.vue";

const adminStore = useAdminStore();
const loading = ref(true);
const saving = ref(false);

const defaultTheme = () => ({
  primary_color: "#1976D2",
  secondary_color: "#26A69A",
  accent_color: "#9C27B0",
  background_color: "#FFFFFF",
  text_color: "#333333",
  font_family: "Inter",
  border_radius: "12px",
  card_style: "elevated",
  // El circulo del boton de cerrar de los cajones. Blanco por defecto porque es lo que
  // hay hoy y porque se recorta bien sobre la foto del platillo, que es donde mas se usa.
  // La X de adentro NO se configura: se calcula para que contraste con este color.
  close_button_color: "#FFFFFF",
  // Como navega el comensal entre categorias. "auto" enseña el indice cuando hay mas
  // categorias de las que caben en la tira; es lo que sirve sin que nadie configure
  // nada, y por eso es el default.
  category_index: "auto",
  show_banner: false,
  banner_text: "",
  cart_image: "",
  // Vacíos: la barra dice "Ver pedido" y toda ella abre el pedido, como siempre.
  card_cta_label: "",
  card_cta_url: "",
});

const theme = ref(defaultTheme());

const cartFile = ref(null);
const uploadingCart = ref(false);

const onCartFile = async (file) => {
  if (!file) return;
  uploadingCart.value = true;
  try {
    const form = new FormData();
    form.append("image", file);
    form.append("type", "company");
    const { data } = await api.post(`/admin/${adminStore.slug}/uploadImage`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      // Sin límite: una foto en conexión lenta tarda más que el timeout general.
      timeout: 0,
    });
    theme.value.cart_image = data.ruta;
    adminStore.messageStore.success("Imagen subida. No olvides Guardar.");
  } catch (e) {
    adminStore.messageStore.error("Error al subir la imagen");
  } finally {
    uploadingCart.value = false;
    cartFile.value = null;
  }
};

const removeCartImage = () => {
  theme.value.cart_image = "";
};

const colorLabels = {
  primary_color: "Color primario",
  secondary_color: "Color secundario",
  accent_color: "Color de acento",
  background_color: "Fondo",
  text_color: "Texto",
  close_button_color: "Botón de cerrar",
};

const opcionesIndice = [
  { label: "Automático — aparece si tienes muchas categorías", value: "auto" },
  { label: "Siempre visible", value: "siempre" },
  { label: "No mostrarlo", value: "nunca" },
];

const fontOptions = [
  { label: "Inter", value: "Inter" },
  { label: "Roboto", value: "Roboto" },
  { label: "Open Sans", value: "Open Sans" },
  { label: "Poppins", value: "Poppins" },
  { label: "Montserrat", value: "Montserrat" },
  { label: "Nunito", value: "Nunito" },
];

const radiusOptions = [
  { label: "Sin redondeo", value: "0px" },
  { label: "Sutil", value: "4px" },
  { label: "Moderado", value: "8px" },
  { label: "Redondeado", value: "12px" },
  { label: "Muy redondeado", value: "20px" },
];

const cardOptions = [
  { label: "Elevado", value: "elevated" },
  { label: "Plano", value: "flat" },
  { label: "Con borde", value: "bordered" },
];

const previewStyles = computed(() => ({
  fontFamily: theme.value.font_family,
  background: theme.value.background_color,
  color: theme.value.text_color,
}));

const saveTheme = async () => {
  saving.value = true;
  try {
    await api.put(`/admin/${adminStore.slug}/theme`, { theme_config: theme.value });
    adminStore.messageStore.success("Tema guardado");
  } catch (e) {
    adminStore.messageStore.error("Error al guardar tema");
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  const existing = adminStore.company?.theme_config;
  if (existing && typeof existing === "object") {
    Object.assign(theme.value, existing);
  }
  loading.value = false;
});
</script>

<style lang="scss" scoped>
.mc-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.mc-theme-sections {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  // Menos aire que antes: ahora cada grupo tiene su propia caja, y el borde ya separa.
  // Con el hueco de antes las secciones se veian sueltas unas de otras.
  gap: var(--space-lg);
}

// Aqui vivian .mc-section-title y .mc-cart-hint, que este archivo ya no usa: el titulo
// y la descripcion de cada grupo los dibuja AdminSection.

.mc-cart-uploader {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.mc-cart-preview {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-variant);
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.mc-cart-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.mc-color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-md);
}

.mc-color-field {
  label {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-text-secondary);
    margin-bottom: var(--space-xs);
    display: block;
  }
}

.mc-color-picker {
  display: flex;
  align-items: center;
  gap: var(--space-sm);

  input[type="color"] {
    width: 40px;
    height: 40px;
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    padding: 2px;

    &::-webkit-color-swatch-wrapper { padding: 0; }
    &::-webkit-color-swatch { border-radius: var(--radius-sm); border: none; }
  }
}

.mc-color-input {
  flex: 1;
  max-width: 140px;
}

.mc-theme-preview {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  max-width: 360px;
}

.mc-preview-header {
  padding: var(--space-md) var(--space-lg);
  font-weight: 700;
  font-size: var(--text-lg);
}

.mc-preview-body {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.mc-preview-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-subtle);
  padding: var(--space-md);

  &__name {
    font-weight: 600;
    font-size: var(--text-sm);
  }

  &__price {
    font-weight: 700;
    font-size: var(--text-lg);
    margin-top: var(--space-xs);
  }
}

.mc-preview-btn {
  padding: var(--space-sm) var(--space-md);
  color: white;
  text-align: center;
  font-weight: 600;
  font-size: var(--text-sm);
}

@media screen and (max-width: 600px) {
  .mc-theme-sections {
    padding: var(--space-md);
  }
  .mc-color-grid {
    grid-template-columns: 1fr;
  }
}
</style>
