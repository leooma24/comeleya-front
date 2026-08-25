<template>
  <div class="mc-prueba">
    <div class="mc-prueba__tit">¿Nunca has recibido un pedido aquí?</div>
    <p class="mc-prueba__txt">
      Mándate uno de prueba a tu propio WhatsApp y ve exactamente lo que le llega a tu
      cocina cuando alguien pide desde el menú.
    </p>

    <div class="mc-prueba__destino" v-if="numero">
      Se enviará al <strong>{{ numeroBonito }}</strong>
      <span v-if="!adminStore.company?.whatsapp"> (tu teléfono, porque no tienes un WhatsApp aparte)</span>
    </div>
    <div class="mc-prueba__destino mc-prueba__destino--falta" v-else>
      Todavía no tienes un número donde recibir pedidos.
    </div>

    <q-btn
      unelevated
      no-caps
      color="green-7"
      icon="fab fa-whatsapp"
      label="Mandarme un pedido de prueba"
      class="mc-prueba__btn"
      :disable="!numero"
      @click="enviar"
    />

    <button type="button" class="mc-prueba__liga" @click="verMenu">
      O abre tu menú como lo ve un cliente
    </button>
  </div>
</template>

<script setup>
defineOptions({ name: "PruebaDePedido" });

import { computed } from "vue";
import { useAdminStore } from "src/stores/admin-store";

/**
 * "Mándate un pedido de prueba".
 *
 * La mayoría de los negocios llegaron aquí cuando esto solo mostraba el menú, así que
 * nunca han visto entrar un pedido y no tienen por qué creer que funciona. Explicarles
 * el flujo no convence; verlo caer en su propio teléfono, sí.
 *
 * De paso resuelve la duda que de verdad importa: si ese número recibe WhatsApp. En
 * México un fijo y un celular se ven igual -diez dígitos- y 58 de los 106 negocios
 * traen un teléfono que nadie ha confirmado. Si la prueba llega, el número sirve.
 */
const adminStore = useAdminStore();

const numero = computed(() =>
  ((adminStore.company?.whatsapp || adminStore.company?.phone || "") + "").replace(/\D/g, "")
);

const numeroBonito = computed(() => {
  const n = numero.value;
  return n.length === 10 ? `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}` : n;
});

const verMenu = () => window.open(`/${adminStore.slug}`, "_blank");

/**
 * El mensaje imita al de un pedido real -mismo formato, mismos renglones- pero dice
 * en la primera línea que es una prueba: si esto llegara a caerle a un empleado, no
 * debe ponerse a cocinar.
 */
const enviar = () => {
  const n = numero.value;
  if (!n) return;
  const conLada = n.length === 10 ? "52" + n : n;

  const negocio = adminStore.company?.name || "tu negocio";
  const lineas = [
    `*PEDIDO DE PRUEBA* — no lo prepares`,
    ``,
    `Así se ve un pedido de ${negocio} cuando un cliente lo manda desde tu menú:`,
    ``,
    `- - - - - - - - - - - - - -`,
    `*Orden #PRUEBA*`,
    `*2x Ejemplo de platillo* — $240.00`,
    `  + Extra de ejemplo — $20.00`,
    `*1x Otro platillo* — $95.00`,
    `- - - - - - - - - - - - - -`,
    `Subtotal: $355.00`,
    `Envio: $35.00`,
    `*Total: $390.00*`,
    ``,
    `*Pago*: Efectivo (paga con $500)`,
    `*Contacto*: 668 123 4567`,
    `*Direccion*: Calle de ejemplo #123, Centro`,
    ``,
    `_Este mensaje lo enviaste tú desde tu panel para probar que tus pedidos llegan._`,
  ];

  window.open(
    `https://wa.me/${conLada}?text=${encodeURIComponent(lineas.join("\n"))}`,
    "_blank"
  );
};
</script>

<style lang="scss" scoped>
.mc-prueba {
  max-width: 420px;
  margin: 0 auto;
  padding: 20px 16px 8px;
  text-align: center;
}

.mc-prueba__tit {
  font-size: 15px;
  font-weight: 660;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
}

.mc-prueba__txt {
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--color-text-secondary);
  margin: 6px 0 12px;
}

.mc-prueba__destino {
  font-size: 11.5px;
  color: var(--color-text-secondary);
  background: var(--color-surface-variant);
  border-radius: 10px;
  padding: 8px 10px;
  margin-bottom: 12px;

  &--falta {
    color: #8a5300;
    background: var(--color-warning-bg);
  }
}

.mc-prueba__btn {
  width: 100%;
  border-radius: 12px;
  font-weight: 620;
}

.mc-prueba__liga {
  appearance: none;
  border: 0;
  background: none;
  margin-top: 10px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 560;
  color: var(--q-primary);
  cursor: pointer;
  text-decoration: underline;
}
</style>
