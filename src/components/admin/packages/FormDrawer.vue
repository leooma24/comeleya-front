<template>
  <BaseFormDrawer
    v-model="adminStore.packageFormDrawer"
    :form-data="adminStore.packageForm"
    :title="(adminStore.packageForm.id ? 'Editar' : 'Nuevo') + ' Paquete'"
    save-label="Guardar Paquete"
    :loading="adminStore.loading"
    @save="adminStore.savePackage"
  >
    <q-input
      v-model="adminStore.packageForm.name"
      label="Nombre del paquete"
      filled
      dense
      class="q-mb-md"
    />

    <q-input
      v-model="adminStore.packageForm.description"
      type="textarea"
      label="Descripción"
      filled
      dense
      autogrow
      class="q-mb-md"
    />

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-6">
        <q-input
          v-model="adminStore.packageForm.monthly_price"
          type="number"
          label="Precio mensual"
          filled
          dense
          prefix="$"
        />
      </div>
      <div class="col-6">
        <q-input
          v-model="adminStore.packageForm.yearly_price"
          type="number"
          label="Precio anual"
          filled
          dense
          prefix="$"
        />
      </div>
    </div>

    <q-select
      v-model="adminStore.packageForm.status"
      label="Estado"
      filled
      dense
      :options="['Activa', 'Inactiva']"
      class="q-mb-lg"
    />

    <q-separator class="q-mb-md" />
    <div class="text-subtitle2 text-weight-bold q-mb-sm">Límites</div>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-4">
        <q-input
          v-model.number="adminStore.packageForm.max_products"
          type="number"
          label="Máx. productos"
          filled
          dense
          hint="0 = Ilimitado"
          :rules="[val => val >= 0 || 'Debe ser 0 o mayor']"
        />
      </div>
      <div class="col-4">
        <q-input
          v-model.number="adminStore.packageForm.max_categories"
          type="number"
          label="Máx. categorías"
          filled
          dense
          hint="0 = Ilimitado"
          :rules="[val => val >= 0 || 'Debe ser 0 o mayor']"
        />
      </div>
      <div class="col-4">
        <q-input
          v-model.number="adminStore.packageForm.max_orders_per_month"
          type="number"
          label="Máx. pedidos/mes"
          filled
          dense
          hint="0 = Ilimitado"
          :rules="[val => val >= 0 || 'Debe ser 0 o mayor']"
        />
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-4">
        <q-input
          v-model.number="adminStore.packageForm.max_image_improvements"
          type="number"
          label="Mejoras imagen/mes"
          filled
          dense
          hint="0 = No disponible"
          :rules="[val => val >= 0 || 'Debe ser 0 o mayor']"
        />
      </div>
    </div>

    <q-separator class="q-mb-md" />
    <div class="text-subtitle2 text-weight-bold q-mb-sm">Features incluidas</div>

    <div class="q-gutter-sm">
      <q-toggle
        v-for="feature in features"
        :key="feature.field"
        v-model="adminStore.packageForm[feature.field]"
        :label="feature.label"
        dense
        color="primary"
        class="full-width"
      />
    </div>
  </BaseFormDrawer>
</template>

<script setup>
defineOptions({
  name: "PackageFormDrawer",
});

import { useAdminStore } from "src/stores/admin-store";
import BaseFormDrawer from "../BaseFormDrawer.vue";
const adminStore = useAdminStore();

const features = [
  { field: "has_analytics", label: "Analíticas" },
  { field: "has_loyalty", label: "Programa de lealtad" },
  { field: "has_reservations", label: "Reservaciones" },
  { field: "has_drivers", label: "Repartidores" },
  { field: "has_online_payments", label: "Pagos en línea" },
  { field: "has_notifications", label: "Notificaciones (email/WhatsApp)" },
  { field: "has_ticket_printing", label: "Impresión de tickets" },
  { field: "has_seo", label: "SEO avanzado" },
  { field: "has_theme_customization", label: "Personalización de tema" },
  { field: "has_google_business", label: "Google Business" },
  { field: "has_facebook", label: "Facebook (Píxel/Messenger)" },
  { field: "has_branches", label: "Sucursales" },
];
</script>
