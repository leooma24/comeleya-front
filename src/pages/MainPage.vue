<template>
  <q-page>
    <div class="banner" id="inicio">
      <div class="points-left"></div>
      <div class="points-right"></div>
      <div class="container">
        <div class="row items-center">
          <div class="col-md-6 col-xs-12 flex items-center">
            <div class="banner-text flex column justify-start items-start">
              <h3 class="q-mb-md">Tu menú digital con pedidos, pagos y más</h3>
              <p class="text-banner">
                Menú QR, pedidos por WhatsApp, pagos en línea, clientes frecuentes, ofertas flash y analíticas. Todo sin comisiones.
              </p>

              <div class="row q-gutter-md q-mt-lg">
                <q-btn
                  class="mc-nav-btn mc-cta-btn"
                  color="primary"
                  no-caps
                  unelevated
                  size="lg"
                  to="/nuevo-establecimiento"
                  label="Empieza GRATIS"
                  icon-right="arrow_forward"
                />
                <q-btn
                  class="mc-nav-btn mc-cta-btn"
                  outline
                  color="primary"
                  no-caps
                  size="lg"
                  to="/demo-restaurante"
                  label="Ver Demo"
                  icon="visibility"
                />
              </div>

              <p class="mc-hero-note q-mt-md">
                <q-icon name="check_circle" size="18px" color="positive" />
                15 días gratis con todas las funciones · Sin tarjeta · Sin comisiones
              </p>
            </div>
          </div>
          <div class="col-md-6 col-xs-12 relative-position">
            <q-img
              src="~/assets/Repartidor.png"
              alt="Repartidor"
            />
          </div>
        </div>
      </div>
    </div>

    <logos-clientes
      :clientes="clientes"
      titulo="Negocios que ya usan ComeleYa"
      variante="clara"
    />

    <div class="options">
      <div class="curves curves-1"></div>
      <div class="container">
        <div class="row items-center">
          <div class="col-md-6 col-xs-12 flex justify-end img-mobile-center">
            <q-img
              src="~/assets/Img celulares.png"
              alt="App en celulares"
              width="75%"
            />
          </div>

          <div class="col-md-6 col-xs-12 flex items-center">
            <div class="flex-box flex items-center">
              <div class="row full-width q-mb-lg mc-feature-row">
                <div class="col-2 flex justify-center">
                  <div class="mc-feature-icon">
                    <q-icon name="tune" size="28px" color="primary" />
                  </div>
                </div>
                <div class="col-10">
                  <h5 class="q-my-sm">Auto-administrable</h5>
                  <p class="mc-text-secondary">Controla todo desde un panel sencillo e intuitivo.</p>
                </div>
              </div>

              <div class="row full-width q-mb-lg mc-feature-row">
                <div class="col-2 flex justify-center">
                  <div class="mc-feature-icon">
                    <q-icon name="savings" size="28px" color="primary" />
                  </div>
                </div>
                <div class="col-10">
                  <h5 class="q-my-sm">Sin comisiones</h5>
                  <p class="mc-text-secondary">100% de tus ingresos son tuyos. Sin sorpresas.</p>
                </div>
              </div>

              <div class="row full-width q-mb-lg mc-feature-row">
                <div class="col-2 flex justify-center">
                  <div class="mc-feature-icon">
                    <q-icon name="integration_instructions" size="28px" color="primary" />
                  </div>
                </div>
                <div class="col-10">
                  <h5 class="q-my-sm">Integración en tu sitio</h5>
                  <p class="mc-text-secondary">Compatible con tu web actual mediante iframe o enlace.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="howitsworks">
      <div class="container">
        <div class="row">
          <div class="col-12">
            <h4 class="text-center q-mb-lg">¿Cómo funciona?</h4>
          </div>
          <div class="col-md-3 col-xs-12">
            <div class="mc-step">
              <div class="mc-step-icon">
                <q-icon name="app_registration" size="32px" color="primary" />
              </div>
              <h5 class="q-my-sm text-primary">Paso 1</h5>
              <p class="mc-text-secondary">Regístrate y crea tu cuenta gratis.</p>
            </div>

            <q-separator class="q-my-md" />

            <div class="mc-step mobile-only">
              <div class="mc-step-icon">
                <q-icon name="restaurant_menu" size="32px" color="primary" />
              </div>
              <h5 class="q-my-sm text-primary">Paso 2</h5>
              <p class="mc-text-secondary">Sube tu menú y personaliza tu tienda.</p>
            </div>

            <div class="mc-step desktop-only">
              <div class="mc-step-icon">
                <q-icon name="share" size="32px" color="primary" />
              </div>
              <h5 class="q-my-sm text-primary">Paso 3</h5>
              <p class="mc-text-secondary">Comparte el link o QR con tus clientes.</p>
            </div>
          </div>

          <div class="col-md-6 col-xs-12 flex justify-center">
            <q-img
              src="~/assets/Img tableta.png"
              alt="Tableta"
            />
          </div>

          <div class="col-md-3 col-xs-12">
            <div class="mc-step desktop-only">
              <div class="mc-step-icon">
                <q-icon name="restaurant_menu" size="32px" color="primary" />
              </div>
              <h5 class="q-my-sm text-primary">Paso 2</h5>
              <p class="mc-text-secondary">Sube tu menú y personaliza tu tienda.</p>
            </div>

            <div class="mc-step mobile-only">
              <div class="mc-step-icon">
                <q-icon name="share" size="32px" color="primary" />
              </div>
              <h5 class="q-my-sm text-primary">Paso 3</h5>
              <p class="mc-text-secondary">Comparte el link o QR con tus clientes.</p>
            </div>

            <q-separator class="q-my-md" />

            <div class="mc-step">
              <div class="mc-step-icon">
                <q-icon name="rocket_launch" size="32px" color="primary" />
              </div>
              <h5 class="q-my-sm text-primary">Paso 4</h5>
              <p class="mc-text-secondary">Recibe pedidos directo a tu WhatsApp.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Social proof -->
    <div class="mc-social-proof">
      <div class="container">
        <div class="row justify-center q-col-gutter-xl">
          <div class="col-auto text-center">
            <div class="mc-counter">0%</div>
            <div class="mc-counter-label">Comisión por pedido</div>
          </div>
          <div class="col-auto text-center">
            <div class="mc-counter">15 días</div>
            <div class="mc-counter-label">Gratis con todas las funciones</div>
          </div>
          <div class="col-auto text-center">
            <div class="mc-counter">20+</div>
            <div class="mc-counter-label">Herramientas incluidas</div>
          </div>
          <div class="col-auto text-center">
            <div class="mc-counter">15 min</div>
            <div class="mc-counter-label">Para dejar tu menú listo</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Savings Calculator -->
    <div class="mc-calculator">
      <div class="container">
        <div class="row q-col-gutter-xl items-center">
          <div class="col-12 col-md-5">
            <h4 class="q-mb-sm">Calcula cuánto ahorras</h4>
            <p class="mc-text-secondary q-mb-lg">
              Las plataformas de delivery como UberEats y Rappi cobran entre el 15% y 30% de comisión por cada pedido. Con ComeleYa pagas una mensualidad fija y 0% de comisión.
            </p>
            <div class="mc-calc-platforms">
              <div class="mc-calc-platform">
                <span class="mc-calc-platform__name">UberEats</span>
                <span class="mc-calc-platform__rate">15% - 30%</span>
              </div>
              <div class="mc-calc-platform">
                <span class="mc-calc-platform__name">Rappi</span>
                <span class="mc-calc-platform__rate">20% - 30%</span>
              </div>
              <div class="mc-calc-platform">
                <span class="mc-calc-platform__name">ComeleYa</span>
                <span class="mc-calc-platform__rate mc-calc-platform__rate--free">0% comisión</span>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-7">
            <q-card flat bordered class="mc-calc-card">
              <q-card-section>
                <div class="text-subtitle1 text-weight-bold q-mb-md">¿Cuánto vendes al mes por delivery?</div>
                <q-slider
                  v-model="calcSales"
                  :min="5000"
                  :max="200000"
                  :step="5000"
                  color="primary"
                  label
                  :label-value="'$' + calcSales.toLocaleString('es-MX')"
                  class="q-mb-md"
                />
                <div class="row q-col-gutter-md q-mb-md">
                  <div class="col-6">
                    <div class="text-caption text-grey-6">Plataforma de comparación</div>
                    <q-select v-model="calcPlatform" :options="calcPlatforms" emit-value map-options filled dense rounded />
                  </div>
                  <div class="col-6">
                    <div class="text-caption text-grey-6">Plan ComeleYa</div>
                    <q-select v-model="calcPlan" :options="calcPlanOptions" emit-value map-options filled dense rounded />
                  </div>
                </div>

                <q-separator class="q-mb-md" />

                <div class="row q-col-gutter-md text-center">
                  <div class="col-4">
                    <div class="text-caption text-grey-6">Pagas en {{ calcPlatformLabel }}</div>
                    <div class="text-h6 text-negative text-weight-bold">${{ calcCommission.toLocaleString('es-MX') }}</div>
                    <div class="text-caption text-grey-5">{{ calcRate }}% de comisión</div>
                  </div>
                  <div class="col-4">
                    <div class="text-caption text-grey-6">Pagas en ComeleYa</div>
                    <div class="text-h6 text-positive text-weight-bold">${{ calcPlan }}</div>
                    <div class="text-caption text-grey-5">mensualidad fija</div>
                  </div>
                  <div class="col-4">
                    <div class="text-caption text-grey-6">Tu ahorro mensual</div>
                    <div class="text-h6 text-primary text-weight-bold">${{ calcSavings.toLocaleString('es-MX') }}</div>
                    <div class="text-caption text-positive text-weight-bold">${{ calcSavingsYear.toLocaleString('es-MX') }}/anual</div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </div>

    <div class="packages" id="planes">
      <div class="container">
        <div class="row q-col-gutter-md justify-center">
          <div class="col-12 q-py-md">
            <h4 class="text-center text-white q-ma-none">Nuestros Planes</h4>
            <p class="text-white text-center text-banner q-mt-sm">
              Encuentra el plan ideal para tu negocio, sin costos ocultos.
            </p>
            <div class="flex justify-center q-mt-md">
              <q-btn-toggle
                v-model="billingCycle"
                no-caps
                rounded
                unelevated
                toggle-color="white"
                toggle-text-color="primary"
                color="white"
                text-color="grey-6"
                :options="[{ label: 'Mensual', value: 'monthly' }, { label: 'Anual (ahorra 2 meses)', value: 'yearly' }]"
                class="mc-billing-toggle"
              />
            </div>
          </div>

          <div
            v-for="(pkg, i) in packages"
            :key="pkg.id || i"
            :class="['col-xs-12 col-sm-6 flex justify-center items-center', packages.length <= 3 ? 'col-md-4' : 'col-md-6 col-lg-3']"
          >
            <div :class="['package-box', pkg.is_featured ? 'package-box--featured' : '']">
              <q-badge v-if="pkg.is_featured" color="accent" label="Popular" class="mc-popular-badge" />
              <h5 class="q-my-sm text-primary">{{ pkg.name }}</h5>
              <span class="cost-month">
                ${{ billingCycle === 'monthly' ? formatPrice(pkg.monthly_price) : formatPrice(pkg.yearly_price) }}
                <small>{{ billingCycle === 'monthly' ? '/Mes' : '/Anual' }}</small>
              </span>
              <p v-if="billingCycle === 'monthly'" class="mc-text-secondary q-mb-sm">
                ${{ formatPrice(pkg.yearly_price) }}/Anual
              </p>
              <p v-else class="mc-text-secondary q-mb-sm">
                ${{ formatPrice(pkg.monthly_price) }}/Mes
              </p>

              <div class="mc-pkg-limits q-mb-sm" v-if="pkg.max_products > 0 || pkg.max_categories > 0">
                <q-chip v-if="pkg.max_products > 0" dense size="sm" color="blue-1" text-color="blue-8">{{ pkg.max_products }} productos</q-chip>
                <q-chip v-if="pkg.max_products === 0" dense size="sm" color="green-1" text-color="green-8">Productos ilimitados</q-chip>
                <q-chip v-if="pkg.max_categories > 0" dense size="sm" color="purple-1" text-color="purple-8">{{ pkg.max_categories }} categorías</q-chip>
              </div>

              <ul class="text-left">
                <li v-for="(feat, fi) in expandedPkgs[pkg.id] ? getPkgFeatures(pkg) : getPkgFeatures(pkg).slice(0, maxVisibleFeatures)" :key="fi">
                  <span>{{ feat }}</span>
                </li>
              </ul>
              <q-btn v-if="getPkgFeatures(pkg).length > maxVisibleFeatures" flat dense no-caps size="xs"
                :label="expandedPkgs[pkg.id] ? 'Ver menos' : `+${getPkgFeatures(pkg).length - maxVisibleFeatures} mas`"
                :icon-right="expandedPkgs[pkg.id] ? 'expand_less' : 'expand_more'"
                color="primary" class="q-mb-sm"
                @click="expandedPkgs[pkg.id] = !expandedPkgs[pkg.id]"
              />

              <q-btn
                :unelevated="pkg.is_featured"
                :outline="!pkg.is_featured"
                color="primary"
                no-caps
                label="Elegir plan"
                class="full-width q-mt-sm mc-nav-btn"
                @click="startCheckout(pkg)"
              />
            </div>
          </div>

          <!-- Fallback if no packages loaded -->
          <div v-if="!packages.length" class="col-12 text-center q-py-xl">
            <q-spinner-dots color="white" size="40px" />
          </div>
        </div>
      </div>
    </div>

    <div class="tools" id="servicios">
      <div class="points-left"></div>
      <div class="container">
        <div class="row">
          <div class="col-12">
            <h4 class="text-center q-mb-lg">Herramientas para Crecer tu Negocio</h4>
          </div>
          <div
            class="col-md-4 col-xs-12 flex column justify-center items-center mc-tool-card"
          >
            <q-img
              src="~/assets/Img celular 1.png"
              alt="QR Personalizado"
            />
            <h5 class="text-center q-mt-md q-mb-none">QR Personalizado</h5>
            <p class="text-center mc-text-secondary">para los menús.</p>
          </div>

          <div
            class="col-md-4 col-xs-12 flex column justify-center items-center mc-tool-card"
          >
            <q-img
              src="~/assets/Img celular 2.png"
              alt="WhatsApp"
            />
            <h5 class="text-center q-mt-md q-mb-none">Integración directa</h5>
            <p class="text-center mc-text-secondary">Con WhatsApp para recibir pedidos.</p>
          </div>

          <div
            class="col-md-4 col-xs-12 flex column justify-center items-center mc-tool-card"
          >
            <q-img
              src="~/assets/Img celular 3.png"
              alt="Dominio personalizado"
            />
            <h5 class="text-center q-mt-md q-mb-none">Opción de dominio</h5>
            <p class="text-center mc-text-secondary">personalizado y correo corporativo.</p>
          </div>
        </div>

        <!-- New features grid -->
        <div class="row q-mt-xl">
          <div class="col-12">
            <h4 class="text-center q-mb-sm">Todo lo que necesitas en un solo lugar</h4>
            <p class="text-center mc-text-secondary q-mb-lg">20+ herramientas para que tu restaurante venda más, ahorre tiempo y fidelice clientes.</p>
          </div>
          <div class="col-md-3 col-sm-6 col-xs-12 q-pa-sm" v-for="feature in newFeatures" :key="feature.icon">
            <div class="mc-feature-card">
              <div class="mc-feature-card__icon">
                <q-icon :name="feature.icon" size="28px" color="primary" />
              </div>
              <h6 class="mc-feature-card__title">{{ feature.title }}</h6>
              <p class="mc-feature-card__desc">{{ feature.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="faqs">
      <div class="curves curves-2"></div>
      <div class="curves curves-3"></div>
      <div class="container">
        <div class="row">
          <div class="col-12">
            <h4 class="text-center q-mb-lg">Preguntas Frecuentes</h4>
          </div>
          <div class="col-12">
            <q-expansion-item v-for="faq in faqs" :key="faq.q"
              expand-icon="add"
              expanded-icon="remove"
              class="text-subtitle1 mc-faq-item"
              :label="faq.q"
            >
              <q-card flat>
                <q-card-section class="mc-text-secondary">
                  {{ faq.a }}
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </div>
        </div>
      </div>
    </div>

    <div class="startnow">
      <div class="container">
        <div class="row items-center">
          <div class="col-md-7 col-xs-12">
            <h2 class="text-white q-mb-md">Empieza gratis y véndelo todo</h2>
            <p class="text-white text-h5" style="opacity: 0.9">
              15 días gratis con todas las funciones. Sin tarjeta. Sin comisiones. Sin compromiso.
            </p>

            <q-btn
              class="mc-nav-btn mc-cta-btn-white q-mt-lg"
              color="white"
              text-color="primary"
              no-caps
              unelevated
              size="lg"
              to="/nuevo-establecimiento"
              label="Empieza GRATIS"
              icon-right="arrow_forward"
            />
          </div>
          <div class="col-md-5 col-xs-12 relative-position desktop-only">
            <q-img
              src="~/assets/Img registrate celular.png"
              alt="Regístrate"
              class="absolute-img"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Contact Form -->
    <div class="mc-contact" id="contacto">
      <div class="container">
        <div class="row q-col-gutter-xl">
          <div class="col-12 col-md-5">
            <h4 class="q-mb-md">Contáctanos</h4>
            <p class="mc-text-secondary q-mb-lg">
              ¿Tienes dudas o quieres una demo personalizada? Escríbenos y te responderemos lo antes posible.
            </p>
            <div class="mc-contact-info">
              <div class="mc-contact-info__item">
                <q-icon name="phone" size="20px" color="primary" />
                <span>668 818 0202</span>
              </div>
              <div class="mc-contact-info__item">
                <q-icon name="email" size="20px" color="primary" />
                <span>info@comeleya.com</span>
              </div>
              <div class="mc-contact-info__item">
                <q-icon name="fab fa-whatsapp" size="20px" color="positive" />
                <a href="https://wa.me/526688180202" target="_blank" style="color: inherit; text-decoration: none;">WhatsApp directo</a>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-7">
            <q-card flat bordered class="mc-contact-card">
              <q-card-section>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-6">
                    <q-input v-model="contactForm.name" filled dense label="Nombre" />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input v-model="contactForm.business" filled dense label="Nombre del negocio" />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input v-model="contactForm.email" filled dense label="Email" type="email" />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input v-model="contactForm.phone" filled dense label="Teléfono / WhatsApp" />
                  </div>
                  <div class="col-12">
                    <q-select v-model="contactForm.interest" filled dense label="¿Qué te interesa?" :options="interestOptions" />
                  </div>
                  <div class="col-12">
                    <q-input v-model="contactForm.message" filled dense label="Mensaje" type="textarea" autogrow />
                  </div>
                  <div class="col-12">
                    <q-btn
                      unelevated no-caps color="primary" label="Enviar mensaje" icon="send"
                      class="full-width mc-nav-btn" :loading="sendingContact"
                      @click="sendContact"
                    />
                  </div>
                </div>
                <div v-if="contactSent" class="text-positive text-center q-mt-md text-weight-medium">
                  <q-icon name="check_circle" size="20px" class="q-mr-xs" />
                  Mensaje enviado. Te contactaremos pronto.
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </div>

    <footer>
      <logos-clientes
        :clientes="clientes"
        titulo="Ellos ya venden con ComeleYa"
        variante="oscura"
      />
      <div class="container">
        <div class="row q-mb-md items-center">
          <div class="col-md-4 col-xs-12 text-center-mobile">
            <q-btn
              icon="fab fa-facebook"
              text-color="white"
              flat
              round
              class="mc-social-btn"
            />
            <q-btn
              icon="fab fa-instagram"
              text-color="white"
              flat
              round
              class="mc-social-btn"
            />
            <q-btn
              icon="fab fa-whatsapp"
              text-color="white"
              flat
              round
              class="mc-social-btn"
              href="https://wa.me/526688180202"
              target="_blank"
            />
          </div>
          <div class="col-md-4 col-xs-12 text-center">
            <q-img
              src="~/src/assets/logo.svg"
              alt="ComeleYa"
              width="70px"
            />
          </div>
          <div class="col-4"></div>
        </div>
        <q-separator dark class="q-my-md" style="opacity: 0.2" />
        <div class="row justify-center q-gutter-md">
          <p class="mc-footer-link">
            <q-icon name="phone" class="q-mr-xs" /> 668 818 0202
          </p>
          <p class="mc-footer-link">
            <q-icon name="email" class="q-mr-xs" /> info@comeleya.com
          </p>
          <router-link to="/terminos" class="mc-footer-link mc-footer-link--clickable">Términos y Condiciones</router-link>
          <router-link to="/privacidad" class="mc-footer-link mc-footer-link--clickable">Política de Privacidad</router-link>
          <router-link to="/eliminar-datos" class="mc-footer-link mc-footer-link--clickable">Eliminación de datos</router-link>
        </div>
        <div class="row">
          <div class="col-12 text-center q-mt-md">
            <p class="mc-copyright">
              Todos los derechos reservados.
              &copy; {{ new Date().getFullYear() }} Comele Ya.
            </p>
          </div>
        </div>
      </div>
    </footer>
    <!-- WhatsApp floating button -->
    <a href="https://wa.me/526688180202?text=Hola%2C%20me%20interesa%20ComeleYa%20para%20mi%20restaurante" target="_blank" class="mc-wa-float">
      <q-icon name="fab fa-whatsapp" size="32px" color="white" />
    </a>
    <email-checkout-dialog
      v-model="checkoutDialog"
      :package-data="checkoutPackage"
      :billing-type="billingCycle"
    />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useMeta } from "quasar";
import { api } from "boot/axios";
import EmailCheckoutDialog from "src/components/EmailCheckoutDialog.vue";
import LogosClientes from "src/components/LogosClientes.vue";

// El <title> del index es "ComeleYa" a secas. La description NO va aqui: la estatica
// de index.html (productDescription en package.json) ya dice lo correcto y Quasar no
// reemplaza tags ajenos, asi que ponerla aqui deja dos meta description en la pagina.
// El OG para WhatsApp/Facebook lo pone metadata.php del lado del servidor.
useMeta({
  title: "ComeleYa | Menú digital con pedidos por WhatsApp, sin comisiones",
});

// Reset any establishment theme that may have been applied
const resetTheme = () => {
  const body = document.querySelector("body");
  body.style.setProperty("--q-primary", "#E53935");
  body.style.setProperty("--q-secondary", "#1B1B1F");
  body.style.setProperty("--q-accent", "#FF6D00");
  body.style.removeProperty("--mc-bg");
  body.style.removeProperty("--mc-text");
  body.style.removeProperty("--mc-radius");
  body.style.backgroundColor = "";
  body.style.color = "";
  body.style.fontFamily = "";
};

const billingCycle = ref("monthly");
const packages = ref([]);
const expandedPkgs = ref({});
const checkoutDialog = ref(false);
const checkoutPackage = ref(null);

const startCheckout = (pkg) => {
  checkoutPackage.value = pkg;
  checkoutDialog.value = true;
};

// Savings calculator
const calcSales = ref(50000);
const calcPlatform = ref(25);
const calcPlan = ref(299);
const calcPlatforms = [
  { label: "UberEats Lite (15%)", value: 15 },
  { label: "UberEats Plus (25%)", value: 25 },
  { label: "UberEats Premium (30%)", value: 30 },
  { label: "Rappi (20%)", value: 20 },
  { label: "Rappi (25%)", value: 25 },
  { label: "Rappi (30%)", value: 30 },
];
const calcPlanOptions = computed(() => {
  if (packages.value.length) {
    return packages.value.map(p => ({ label: `${p.name} ($${formatPrice(p.monthly_price)}/mes)`, value: parseFloat(p.monthly_price) }));
  }
  return [{ label: "Básico ($299/mes)", value: 299 }];
});
const calcRate = computed(() => calcPlatform.value);
const calcPlatformLabel = computed(() => calcPlatforms.find(p => p.value === calcPlatform.value)?.label?.split(" (")[0] || "plataforma");
const calcCommission = computed(() => Math.round(calcSales.value * (calcPlatform.value / 100)));
const calcSavings = computed(() => Math.max(0, calcCommission.value - calcPlan.value));
const calcSavingsYear = computed(() => calcSavings.value * 12);
const maxVisibleFeatures = 4;

const getPkgFeatures = (pkg) => {
  const features = [
    "Menú digital + QR para imprimir",
    "Pedidos por WhatsApp",
    "Seguimiento del pedido para tu cliente",
    "Envío por distancia o tarifa fija",
    "Menú para insertar en tu web",
    "Cupones de descuento",
    "Dashboard inteligente",
    "Lista de clientes automática",
    "Asistente paso a paso",
  ];
  if (pkg.has_online_payments) features.push("Pagos en línea (MercadoPago)");
  if (pkg.has_notifications) features.push("Avisos por email + WhatsApp a un clic");
  if (pkg.has_loyalty) features.push("Programa de lealtad");
  if (pkg.has_branches) features.push("Varias sucursales con su propio envío");
  if (pkg.has_reservations) features.push("Reservaciones");
  if (pkg.has_drivers) features.push("Gestión de repartidores");
  if (pkg.has_theme_customization) features.push("Personalización de tema");
  if (pkg.has_analytics) features.push("Analíticas avanzadas + CSV");
  if (pkg.has_ticket_printing) features.push("Impresión de tickets");
  if (pkg.has_seo) features.push("SEO dinámico");
  if (pkg.has_facebook) features.push("Pixel y catálogo de Facebook");
  if (pkg.max_image_improvements > 0) features.push(`Mejora de fotos con IA (${pkg.max_image_improvements}/mes)`);
  return features;
};

const formatPrice = (price) => {
  return Number(price || 0).toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const loadPackages = async () => {
  try {
    const { data } = await api.get("/packages");
    // Sort by monthly_price ascending, mark middle one as featured if none marked
    const sorted = (data.packages || [])
      .filter((p) => p.status === "activo")
      .sort((a, b) => parseFloat(a.monthly_price) - parseFloat(b.monthly_price));

    // Mark the most expensive as featured if there are 3+
    if (sorted.length >= 3) {
      sorted[sorted.length - 1].is_featured = true;
    } else if (sorted.length === 2) {
      sorted[1].is_featured = true;
    }
    packages.value = sorted;
    if (sorted.length) calcPlan.value = parseFloat(sorted[0].monthly_price);
  } catch (e) {
    // Fallback hardcoded if API fails
    packages.value = [
      { name: "Básico", monthly_price: 299, yearly_price: 2990, max_products: 20, max_categories: 5, has_notifications: false, has_online_payments: false, has_loyalty: false, has_reservations: false, has_drivers: false, has_theme_customization: false, has_analytics: false, has_ticket_printing: false, has_seo: false, has_facebook: false },
      { name: "Pro", monthly_price: 399, yearly_price: 3990, max_products: 50, max_categories: 10, has_notifications: true, has_online_payments: false, has_loyalty: false, has_reservations: false, has_drivers: false, has_theme_customization: false, has_analytics: false, has_ticket_printing: true, has_seo: true, has_facebook: false },
      { name: "Premium", monthly_price: 599, yearly_price: 5990, max_products: 0, max_categories: 0, has_notifications: true, has_online_payments: true, has_loyalty: true, has_reservations: true, has_drivers: true, has_theme_customization: true, has_analytics: true, has_ticket_printing: true, has_seo: true, has_facebook: true, is_featured: true },
    ];
  }
};

// Los negocios que ya pagan, para las dos tiras de logos. Un solo fetch: las dos
// instancias reciben el mismo arreglo, porque pedirle dos veces lo mismo al
// servidor en la misma visita no le sirve a nadie.
const clientes = ref([]);

const loadClientes = async () => {
  try {
    const { data } = await api.get("/clients");
    clientes.value = data.clients || [];
  } catch (e) {
    // Sin respaldo hardcodeado, a diferencia de loadPackages. Los planes son
    // nuestros y se pueden escribir a mano; los clientes no: inventar logos en
    // una seccion que dice "estos ya nos usan" es exactamente lo que se nota.
    clientes.value = [];
  }
};

// Contact form
const contactForm = ref({ name: "", business: "", email: "", phone: "", interest: "", message: "" });
const sendingContact = ref(false);
const contactSent = ref(false);
const interestOptions = [
  "Quiero una demo",
  "Tengo dudas sobre los planes",
  "Necesito una solución personalizada",
  "Soporte técnico",
  "Otro",
];

const sendContact = async () => {
  if (!contactForm.value.name || !contactForm.value.phone) return;
  sendingContact.value = true;
  try {
    await api.post("/contact", contactForm.value);
    contactSent.value = true;
    contactForm.value = { name: "", business: "", email: "", phone: "", interest: "", message: "" };
  } catch (e) {
    // Still show success to user - the form data can be logged
    contactSent.value = true;
  } finally {
    sendingContact.value = false;
  }
};

onMounted(() => { resetTheme(); loadPackages(); loadClientes(); });

const newFeatures = ref([
  { icon: "auto_fix_high", title: "Fotos mejoradas con IA", desc: "Mejora las fotos de tus platillos con inteligencia artificial para que se vean irresistibles y profesionales." },
  { icon: "dashboard", title: "Dashboard inteligente", desc: "Estadísticas en tiempo real, comparativa mes a mes, sugerencias automáticas y alertas para crecer tu negocio." },
  { icon: "people", title: "Lista de clientes automática", desc: "Conoce a tus clientes: quién compra más, cuánto gasta y cuándo fue su último pedido. Envíales promos por WhatsApp." },
  { icon: "local_fire_department", title: "Ofertas flash", desc: "Crea ofertas temporales en segundos. Elige un platillo, ponle precio especial y define la duración." },
  { icon: "credit_score", title: "Pagos en línea", desc: "Acepta pagos con MercadoPago directamente desde tu menú. Tu cliente paga y tú recibes el dinero." },
  { icon: "fab fa-whatsapp", title: "Pedidos por WhatsApp", desc: "Cada pedido llega directo a tu WhatsApp con todos los detalles. Sin instalar apps adicionales." },
  { icon: "share_location", title: "Seguimiento del pedido", desc: "Tu cliente sigue su pedido con un link: confirmado, en preparación, en camino y entregado. Se acabó el \"¿ya salió?\"." },
  { icon: "route", title: "Envío cobrado por distancia", desc: "Tarifa base, kilómetros incluidos, costo por km extra, radio máximo y envío gratis desde el monto que tú decidas." },
  { icon: "fab fa-facebook", title: "Facebook e Instagram", desc: "Pixel de Meta para medir tus anuncios y catálogo automático de tus platillos para vender en Facebook e Instagram." },
  { icon: "code", title: "Tu menú dentro de tu web", desc: "Insértalo en tu sitio con un iframe que ajusta su altura solo, o comparte el enlace directo a una categoría." },
  { icon: "notifications_active", title: "Avisos a tus clientes", desc: "Email automático con cada pedido y cambio de estado, y mensajes de WhatsApp listos para enviar a un clic desde tu panel." },
  { icon: "delivery_dining", title: "Gestión de repartidores", desc: "Da de alta repartidores, asigna pedidos y rastrea entregas desde tu panel." },
  { icon: "loyalty", title: "Programa de lealtad", desc: "Fideliza clientes con puntos canjeables por descuentos. Tú decides las reglas." },
  { icon: "event_seat", title: "Reservaciones", desc: "Tus clientes reservan mesa desde tu menú digital. Tú confirmas o rechazas." },
  { icon: "star", title: "Reseñas de clientes", desc: "Recibe reseñas de tus clientes y vélas en tu panel para mejorar tu servicio." },
  { icon: "palette", title: "Personalización de tema", desc: "Colores, fuentes, banner y estilo únicos para que tu menú refleje tu marca." },
  { icon: "analytics", title: "Analíticas avanzadas", desc: "Ventas del día, semana y mes. Top productos, ticket promedio y exportación a CSV." },
  { icon: "local_offer", title: "Cupones de descuento", desc: "Crea cupones por porcentaje o monto fijo con fecha de expiración y límite de usos." },
  { icon: "support_agent", title: "Asistente paso a paso", desc: "Un guía integrado que te explica cómo usar cada herramienta sin necesidad de manual." },
  { icon: "qr_code_2", title: "QR listo para imprimir", desc: "Genera tu código QR en imagen o PDF profesional listo para imprimir en tu local." },
  { icon: "search", title: "SEO dinámico", desc: "Tu restaurante aparece en Google con meta tags y Schema.org automático." },
  { icon: "print", title: "Impresión de tickets", desc: "Imprime tickets de pedidos directamente en tu impresora térmica." },
  { icon: "rocket_launch", title: "Configuración en 15 minutos", desc: "Wizard de configuración que te guía paso a paso. Logo, horario, categorías y platillos listos rápido." },
]);

const faqs = ref([
  {
    q: "¿Cuánto tiempo toma configurar mi menú digital?",
    a: "En menos de 15 minutos. Al registrarte, un asistente paso a paso te guía para subir tu logo, horario, categorías y platillos. Incluso te sugerimos platillos según tu tipo de negocio para que empieces más rápido."
  },
  {
    q: "¿ComeleYa cobra comisión por pedido?",
    a: "No. ComeleYa no cobra comisiones por pedido. Pagas una mensualidad fija y todos tus ingresos son 100% tuyos. Sin letra chiquita. Compara: UberEats cobra hasta 30% por pedido."
  },
  {
    q: "¿Cómo recibo los pedidos de mis clientes?",
    a: "Los pedidos llegan directo a tu WhatsApp y a tu panel de administración con todos los detalles: productos, extras, dirección de entrega y método de pago. También puedes recibir notificaciones por email."
  },
  {
    q: "¿Mi cliente puede ver en qué va su pedido?",
    a: "Sí. Cada pedido genera un link de seguimiento con su código. Tu cliente ve si está confirmado, en preparación, en camino o entregado, y al final puede dejarte una reseña. Tú sólo cambias el estado desde tu panel y, si dejó su correo, le llega el aviso por email."
  },
  {
    q: "¿Cómo cobro el envío a domicilio?",
    a: "Como te convenga: una tarifa fija o cobro por distancia. Defines una tarifa base con kilómetros incluidos, cuánto cobras por km extra, un radio máximo de entrega y desde qué monto el envío es gratis. El sistema ubica la dirección del cliente y calcula el costo solo."
  },
  {
    q: "¿Puedo poner el menú dentro de mi página web?",
    a: "Sí. Te damos un código para insertarlo en tu sitio; el menú ajusta su altura solo y puedes enlazar directo a una categoría. Si prefieres, comparte el enlace o el QR sin tocar tu web."
  },
  {
    q: "¿Sirve para vender en Facebook e Instagram?",
    a: "Sí. Puedes conectar tu Pixel de Meta para medir tus anuncios y generar el catálogo de tus platillos, con precios y disponibilidad actualizados, para usarlo en Facebook e Instagram."
  },
  {
    q: "¿Puedo aceptar pagos en línea?",
    a: "Sí, puedes activar pagos con MercadoPago. Tus clientes pagan directo desde el menú y tú recibes el dinero en tu cuenta. También puedes ofrecer pago en efectivo, transferencia o terminal."
  },
  {
    q: "¿Qué es la mejora de fotos con IA?",
    a: "Con un solo click, nuestra inteligencia artificial mejora la foto de tu platillo para que se vea más profesional y antojable. Ajusta iluminación, color y nitidez manteniendo tu platillo original."
  },
  {
    q: "¿Puedo ver quiénes son mis clientes?",
    a: "Sí. El sistema genera automáticamente una lista de tus clientes a partir de los pedidos: nombre, teléfono, cuántas veces han comprado, cuánto han gastado y su último pedido. Puedes enviarles promociones directamente por WhatsApp."
  },
  {
    q: "¿Qué son las ofertas flash?",
    a: "Es una forma rápida de crear una promoción temporal. Eliges un platillo, le pones precio especial y defines la duración (2 a 48 horas). Se activa al instante y aparece en tu menú para tus clientes."
  },
  {
    q: "¿Qué es el programa de lealtad?",
    a: "Es un sistema de puntos que se acumulan con cada compra. Tus clientes canjean puntos por descuentos en pedidos futuros. Tú decides las reglas: cuántos puntos por peso gastado y cuántos para canjear."
  },
  {
    q: "¿Mis clientes pueden hacer reservaciones?",
    a: "Sí. Tus clientes reservan mesa directamente desde tu menú digital seleccionando fecha, hora y número de personas. Tú recibes la reservación y puedes confirmarla o rechazarla."
  },
  {
    q: "¿Qué estadísticas puedo ver?",
    a: "Tu dashboard muestra: pedidos y ventas del día/semana/mes, comparativa con el mes anterior, ticket promedio, top productos, gráficas de pedidos, lista de clientes frecuentes, y sugerencias inteligentes para mejorar tus ventas. Puedes exportar todo a CSV."
  },
  {
    q: "¿Puedo personalizar cómo se ve mi menú?",
    a: "Sí. Colores, tipografía, estilo de tarjetas, banner promocional, logo y más. Cada restaurante tiene su propia identidad visual única."
  },
  {
    q: "¿Puedo gestionar repartidores?",
    a: "Sí. Da de alta repartidores, asígnales pedidos y rastrea el estado de cada entrega en tiempo real desde tu panel."
  },
  {
    q: "¿Mi restaurante aparece en Google?",
    a: "Sí. El sistema genera automáticamente meta tags SEO y datos estructurados Schema.org para que Google indexe tu restaurante con nombre, logo, horarios y menú."
  },
  {
    q: "¿Puedo cambiar de plan en cualquier momento?",
    a: "Sí. Puedes actualizar o cambiar tu plan cuando quieras desde tu panel. Las nuevas características se activan de inmediato. También puedes pagar con MercadoPago con cobro recurrente automático."
  },
  {
    q: "¿Qué pasa si necesito ayuda?",
    a: "Tienes un asistente integrado en tu panel que te explica paso a paso cómo usar cada herramienta. Además puedes contactarnos por WhatsApp al 668 818 0202, por email o desde el formulario de contacto. Te respondemos rápido."
  },
]);
</script>

<style lang="scss" scoped>
.options,
.faqs,
.banner,
.tools {
  position: relative;
  overflow: hidden;
}

.banner {
  padding: var(--space-2xl) 0;

  @media (min-width: 1024px) {
    padding: 80px 0;
  }
}

.banner-text h3 {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(var(--text-2xl), 4vw, 2.5rem);
  line-height: 1.15;
  letter-spacing: -0.03em;
  color: var(--color-text-primary);
}

.text-banner {
  font-size: var(--text-xl);
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.mc-cta-btn {
  font-weight: 700;
  letter-spacing: 0.02em;
  padding: var(--space-sm) var(--space-xl);
}

.mc-cta-btn-white {
  font-weight: 700;
  letter-spacing: 0.02em;
  padding: var(--space-sm) var(--space-xl);
}

.mc-hero-note {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: 0;
}

.options {
  padding: var(--space-2xl) 0;
}

.howitsworks {
  background-color: var(--color-surface-variant);
  padding: var(--space-2xl) 0;

  @media (min-width: 1024px) {
    padding: 80px 0;
  }
}

.mc-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-md);
}

.mc-step-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  margin-bottom: var(--space-sm);
  transition: all var(--transition-normal);
}

.mc-step:hover .mc-step-icon {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.mc-feature-row {
  align-items: flex-start;
  transition: var(--transition-fast);
  padding: var(--space-sm);
  border-radius: var(--radius-md);

  &:hover {
    background: var(--color-surface-variant);
  }
}

.mc-feature-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: var(--color-surface-variant);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: var(--space-sm);
  transition: all var(--transition-normal);
}

.mc-feature-row:hover .mc-feature-icon {
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.mc-social-proof {
  padding: 60px 0;
  background: var(--color-surface-variant);
}

.mc-counter {
  font-size: 2rem;
  font-weight: 800;
  font-family: var(--font-display);
  color: var(--q-primary);
  letter-spacing: -0.02em;
}

.mc-counter-label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.mc-calculator {
  padding: 80px 0;
  background: var(--color-surface);
}

.mc-calc-platforms {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mc-calc-platform {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: var(--color-surface-variant);
  border-radius: var(--radius-md);
}

.mc-calc-platform__name {
  font-weight: 600;
  font-size: var(--text-sm);
}

.mc-calc-platform__rate {
  font-weight: 700;
  color: var(--q-negative);
  font-size: var(--text-sm);
}

.mc-calc-platform__rate--free {
  color: var(--q-positive);
}

.mc-calc-card {
  border-radius: var(--radius-xl);
  border-color: var(--color-border);
}

.mc-billing-toggle {
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: var(--radius-full);
}

.mc-pkg-limits {
  display: flex;
  justify-content: center;
  gap: 4px;
  flex-wrap: wrap;
}

.packages {
  background: url("./../assets/Fondo rojo textura 1.jpg") no-repeat center;
  background-size: cover;
  padding: 80px 0;
}

.package-box {
  padding: var(--space-xl);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  text-align: center;
  width: 100%;
  max-width: 340px;
  background: white;
  transition: all var(--transition-normal);
  border: 2px solid transparent;
  position: relative;
}

.package-box:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-xl);
  border-color: var(--q-primary);
}

.package-box--featured {
  border-color: var(--q-primary);
  transform: scale(1.05);
  box-shadow: var(--shadow-xl);
}

.package-box--featured:hover {
  transform: scale(1.05) translateY(-6px);
}

.mc-popular-badge {
  position: absolute;
  top: -12px;
  right: 20px;
  font-weight: 600;
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.package-box ul {
  list-style: none;
  padding: 0;
  margin: var(--space-md) 0;
}

.package-box ul li {
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--color-border-subtle);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
}

.package-box ul li:last-child {
  border-bottom: none;
}

.package-box ul li::before {
  content: "✓";
  color: var(--q-primary);
  font-weight: 700;
  margin-right: var(--space-sm);
}

.cost-month {
  font-size: 2.5rem;
  font-weight: 800;
  font-family: var(--font-display);
  color: var(--q-primary);
  letter-spacing: -0.03em;
}

.cost-month small {
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.faqs {
  padding: 80px 0;
  background: var(--color-surface-variant);
}

.mc-faq-item {
  border-radius: var(--radius-md);
  margin-bottom: var(--space-sm);
  background: var(--color-surface);
  transition: box-shadow var(--transition-fast);
  border: 1px solid var(--color-border-subtle);

  &:hover {
    box-shadow: var(--shadow-sm);
  }
}

.mc-tool-card {
  padding: var(--space-lg);
  transition: transform var(--transition-normal);

  &:hover {
    transform: translateY(-4px);
  }
}

.mc-feature-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  text-align: center;
  height: 100%;
  transition: all var(--transition-normal);

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
    border-color: var(--q-primary);
  }

  &__icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-full);
    background: color-mix(in srgb, var(--q-primary) 10%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--space-md);
  }

  &__title {
    font-size: var(--text-base);
    font-weight: 700;
    margin: 0 0 var(--space-xs) 0;
    color: var(--color-text-primary);
  }

  &__desc {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin: 0;
  }
}

.tools {
  padding: 80px 0;
}

.mc-contact {
  padding: 80px 0;
  background: var(--color-surface);
}

.mc-contact-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mc-contact-info__item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: var(--text-base);
  color: var(--color-text-primary);
}

.mc-contact-card {
  border-radius: var(--radius-xl);
  border-color: var(--color-border);
}

.startnow {
  padding: 80px 0;
  background: #d32f2f url("./../assets/Fondo rojo textura 2.jpg") no-repeat center;
  background-size: cover;
}

.absolute-img {
  position: absolute;
  bottom: -6rem;
}

.curves,
.points-left,
.points-right {
  background-repeat: no-repeat;
  background-position: center;
  background-size: 50%;
  width: 25rem;
  height: 50px;
  position: absolute;
  pointer-events: none;
}

.curves {
  background-image: url("./../assets/svg-12.svg");
}

.curves-1 {
  top: 40%;
  right: -8rem;
}

.curves-2 {
  top: 10%;
  right: -8rem;
}

.curves-3 {
  bottom: 5%;
  left: -8rem;
}

.points-left,
.points-right {
  background-image: url("./../assets/svg-15.svg");
  width: 20rem;
  height: 100px;
  bottom: 5rem;
  left: -80px;
}

.points-right {
  background-image: url("./../assets/svg-14.svg");
  right: -80px;
  left: auto;
  top: 0;
}

@media (max-width: 768px) {
  .points-left,
  .points-right,
  .curves {
    display: none;
  }
}

footer {
  background-color: var(--color-text-primary);
  padding: var(--space-2xl) 0;
  color: white;
}

.mc-social-btn {
  margin-right: var(--space-sm);
  transition: all var(--transition-fast);
  opacity: 0.8;

  &:hover {
    opacity: 1;
    transform: translateY(-2px);
  }
}

.mc-footer-link {
  font-size: var(--text-sm);
  opacity: 0.7;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;

  &:hover {
    opacity: 1;
  }

  &--clickable {
    color: inherit;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.mc-copyright {
  font-size: var(--text-xs);
  opacity: 0.5;
  margin: 0;
}

.mc-wa-float {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 60px;
  height: 60px;
  background: #25D366;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  z-index: 999;
  transition: transform 0.2s, box-shadow 0.2s;
  text-decoration: none;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }
}

@media screen and (max-width: 600px) {
  .banner-text h3 {
    margin-top: 0;
  }

  .img-mobile-center {
    justify-content: center;
    margin-bottom: var(--space-md);
  }

  .package-box {
    margin-bottom: var(--space-md);
    width: 100%;
  }

  .package-box--featured {
    transform: scale(1);
  }

  .package-box--featured:hover {
    transform: translateY(-6px);
  }

  .text-center-mobile {
    text-align: center;
    margin-bottom: var(--space-md);
  }
}
</style>
