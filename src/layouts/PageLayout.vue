<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="mc-landing-header">
      <q-toolbar class="q-py-sm q-px-md">
        <div class="container row items-center">
          <q-img
            src="~/src/assets/logo.svg"
            alt="ComeleYa"
            class="mc-landing-logo"
            :width="$q.screen.width <= 600 ? '50px' : '70px'"
          />

          <q-space />

          <!-- Desktop nav -->
          <div class="row items-center q-gutter-sm desktop-only">
            <q-btn
              flat
              color="grey-8"
              label="Inicio"
              no-caps
              class="mc-nav-link"
              @click="scrollToSection('inicio')"
            />
            <q-btn
              flat
              color="grey-8"
              label="Servicios"
              no-caps
              class="mc-nav-link"
              @click="scrollToSection('servicios')"
            />
            <q-btn
              flat
              color="grey-8"
              label="Planes"
              no-caps
              class="mc-nav-link"
              @click="scrollToSection('planes')"
            />
            <q-btn
              flat
              color="grey-8"
              label="Contacto"
              no-caps
              class="mc-nav-link"
              @click="scrollToSection('contacto')"
            />
            <q-btn
              flat
              color="primary"
              label="Ver Demo"
              no-caps
              class="mc-nav-link"
              icon="visibility"
              to="/demo-restaurante"
            />
            <q-btn
              class="mc-nav-btn q-ml-sm"
              outline
              color="primary"
              label="Iniciar Sesión"
              to="/admin/iniciar-sesion"
              no-caps
            />
            <q-btn
              class="mc-nav-btn"
              color="primary"
              unelevated
              label="Registra tu Negocio"
              to="/nuevo-establecimiento"
              no-caps
            />
          </div>

          <!-- Mobile menu -->
          <q-btn
            flat
            round
            color="primary"
            dense
            icon="menu"
            class="mobile-only"
            @click="toggleDrawer"
          />
        </div>
      </q-toolbar>
    </q-header>

    <!-- Mobile Drawer -->
    <q-drawer v-model="drawer" side="right" overlay>
      <div class="q-pa-md">
        <div class="row justify-end">
          <q-btn
            flat
            round
            icon="close"
            color="grey-8"
            @click="drawer = false"
          />
        </div>
      </div>
      <q-list class="q-px-sm">
        <q-item clickable v-ripple class="mc-drawer-item" @click="scrollToSection('inicio')">
          <q-item-section avatar>
            <q-icon name="home" color="grey-7" />
          </q-item-section>
          <q-item-section>Inicio</q-item-section>
        </q-item>
        <q-item clickable v-ripple class="mc-drawer-item" @click="scrollToSection('servicios')">
          <q-item-section avatar>
            <q-icon name="build" color="grey-7" />
          </q-item-section>
          <q-item-section>Servicios</q-item-section>
        </q-item>
        <q-item clickable v-ripple class="mc-drawer-item" @click="scrollToSection('planes')">
          <q-item-section avatar>
            <q-icon name="local_offer" color="grey-7" />
          </q-item-section>
          <q-item-section>Planes</q-item-section>
        </q-item>
        <q-item clickable v-ripple class="mc-drawer-item" @click="scrollToSection('contacto'); drawer = false">
          <q-item-section avatar>
            <q-icon name="mail" color="grey-7" />
          </q-item-section>
          <q-item-section>Contacto</q-item-section>
        </q-item>
        <q-item clickable v-ripple class="mc-drawer-item" to="/demo-restaurante">
          <q-item-section avatar>
            <q-icon name="visibility" color="primary" />
          </q-item-section>
          <q-item-section class="text-primary text-weight-medium">Ver Demo</q-item-section>
        </q-item>
        <q-separator class="q-my-md" />
        <q-item clickable v-ripple class="mc-drawer-item" to="/admin/iniciar-sesion">
          <q-item-section avatar>
            <q-icon name="login" color="grey-7" />
          </q-item-section>
          <q-item-section>Iniciar Sesión</q-item-section>
        </q-item>
        <q-item clickable v-ripple class="mc-drawer-item mc-drawer-item--primary" to="/nuevo-establecimiento">
          <q-item-section avatar>
            <q-icon name="store" color="primary" />
          </q-item-section>
          <q-item-section class="text-primary text-weight-bold">Registra tu Negocio</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from "vue";
defineOptions({
  name: "PageLayout",
});
const drawer = ref(false);
const toggleDrawer = () => {
  drawer.value = !drawer.value;
};
const scrollToSection = (sectionId) => {
  drawer.value = false;
  const section = document.getElementById(sectionId);
  if (section) {
    const headerHeight = 60;
    const top = section.getBoundingClientRect().top + window.scrollY - headerHeight;
    window.scrollTo({ top, behavior: "smooth" });
  }
};
</script>

<style lang="scss">
:root {
  --container-max-width: 1200px;
  --container-padding: 20px;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.mc-landing-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
  box-shadow: none;
  transition: box-shadow var(--transition-normal);
}

.mc-nav-link {
  font-weight: 500;
  border-radius: var(--radius-sm) !important;
  transition: all var(--transition-fast) !important;
  position: relative;

  &:hover {
    background: var(--color-surface-variant) !important;
  }
}

.mc-nav-btn {
  font-family: var(--font-display);
  font-weight: 600;
  border-radius: var(--radius-full) !important;
  padding: var(--space-xs) var(--space-lg);
}

.mc-landing-logo {
  transition: opacity var(--transition-fast);

  &:hover {
    opacity: 0.8;
  }
}

.mc-drawer-item {
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-xs);
  font-weight: 500;
  min-height: 48px;

  &--primary {
    background: color-mix(in srgb, var(--q-primary) 8%, transparent);
  }
}

.container {
  width: 100%;
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
  box-sizing: border-box;
}

@media (max-width: 1023px) {
  .desktop-only { display: none !important; }
}
@media (min-width: 1024px) {
  .mobile-only { display: none !important; }
}
</style>
