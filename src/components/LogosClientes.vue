<template>
  <section v-if="pista.length" class="mc-logos" :class="`mc-logos--${variante}`">
    <p class="mc-logos__titulo">{{ titulo }}</p>

    <div class="mc-logos__ventana">
      <ul
        class="mc-logos__pista"
        :class="{ 'mc-logos__pista--anima': anima }"
        :style="{ '--mc-logos-duracion': `${duracion}s` }"
      >
        <li v-for="(cliente, i) in pista" :key="`${cliente.slug}-${i}`" class="mc-logos__item">
          <a
            class="mc-logos__cuadro"
            :href="`/${cliente.slug}`"
            target="_blank"
            rel="noopener"
            :title="cliente.name"
          >
            <img
              v-if="cliente.logo && !rotos[cliente.slug]"
              :src="cliente.logo"
              :alt="cliente.name"
              loading="lazy"
              @error="rotos[cliente.slug] = true"
            />
            <span v-else class="mc-logos__nombre">{{ cliente.name }}</span>
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup>
/**
 * La tira de logos de los negocios que ya pagan ComeleYa.
 *
 * Se usa dos veces en la portada -bajo el hero y arriba del footer- y por eso
 * recibe titulo y variante: es el mismo carrusel sobre dos fondos distintos, no
 * dos componentes que hay que mantener en paralelo.
 *
 * No usa componentes de Quasar a proposito: q-img envuelve la imagen en una caja
 * con relacion de aspecto fija, justo lo que no sirve para logos de proporciones
 * distintas.
 */
import { computed, reactive } from "vue";
import {
  normalizaClientes,
  debeAnimar,
  repeticiones,
  duracionSegundos,
} from "src/utils/logosClientes.js";

const props = defineProps({
  clientes: { type: Array, default: () => [] },
  titulo: { type: String, required: true },
  variante: { type: String, default: "clara" },
});

// Los logos cuya URL ya murio. Cae al nombre en texto en lugar de dejar el icono
// gris de imagen rota en la portada.
const rotos = reactive({});

const lista = computed(() => normalizaClientes(props.clientes));
const anima = computed(() => debeAnimar(lista.value.length));
const duracion = computed(() => duracionSegundos(lista.value.length));

// La lista repetida las veces que pide el util. La marquesina recorre -50%, asi
// que las dos mitades tienen que ser iguales.
const pista = computed(() =>
  Array.from({ length: repeticiones(lista.value.length) }, () => lista.value).flat()
);
</script>

<style lang="scss" scoped>
.mc-logos {
  padding: 40px 0;
  overflow: hidden;
}

.mc-logos__titulo {
  margin: 0 0 20px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.mc-logos__ventana {
  overflow: hidden;
  // Los logos se desvanecen en las orillas en vez de cortarse a la mitad.
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
}

.mc-logos__pista {
  display: flex;
  width: max-content;
  margin: 0 auto; // centra la pista cuando es mas angosta que la pantalla
  padding: 0;
  list-style: none;
}

// El hueco va como margen del cuadro, NO como `gap`: con gap, el 50% de la pista
// no coincide con el ancho de una mitad -sobra media separacion- y el bucle da un
// brinco visible en cada vuelta.
.mc-logos__item {
  margin-right: 16px;
}

.mc-logos__pista--anima {
  animation: mc-logos-scroll var(--mc-logos-duracion, 40s) linear infinite;

  &:hover {
    animation-play-state: paused;
  }
}

@keyframes mc-logos-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

// Quien pidio menos movimiento en su sistema no deberia encontrarse una tira
// desplazandose sola: se convierte en una fila que se arrastra con el dedo.
@media (prefers-reduced-motion: reduce) {
  .mc-logos__pista--anima {
    animation: none;
  }

  .mc-logos__ventana {
    overflow-x: auto;
  }
}

.mc-logos__cuadro {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 150px;
  height: 88px;
  padding: 14px;
  border-radius: 14px;
  text-decoration: none;
  transition: transform 0.2s ease;

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  &:hover {
    transform: translateY(-2px);
  }
}

.mc-logos__nombre {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
}

.mc-logos--clara {
  background: var(--color-surface-variant);

  .mc-logos__titulo { color: var(--color-text-tertiary); }

  .mc-logos__cuadro {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
  }

  .mc-logos__nombre { color: var(--color-text-secondary); }
}

.mc-logos--oscura {
  .mc-logos__titulo { color: rgba(255, 255, 255, 0.55); }

  .mc-logos__cuadro {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .mc-logos__nombre { color: #fff; }
}

@media (max-width: 599px) {
  .mc-logos__cuadro {
    width: 116px;
    height: 70px;
    padding: 10px;
  }
}
</style>
