import { computed } from "vue";
import { useQuasar } from "quasar";

/**
 * ¿El panel se está usando como aplicación de celular?
 *
 * De 1024 px para arriba se queda el panel de siempre, que en pantalla ancha funciona
 * bien: tablas, columnas y la barra agrupada. Abajo de ese ancho el panel deja de ser
 * un panel y pasa a ser la pantalla de la cocina —se abre con prisa, con una mano y
 * con las manos ocupadas— y ahí manda otra estructura: barra de pestañas abajo,
 * tarjetas en vez de tablas y una sola acción grande por pedido.
 *
 * El corte es el MISMO 1024 que ya usa el menú del comensal para decidir si está en
 * pantalla angosta, para no tener dos ideas distintas de "móvil" en el mismo producto.
 */
export const ANCHO_APP = 1024;

export function useModoApp() {
  const $q = useQuasar();

  const modoApp = computed(() => $q.screen.width > 0 && $q.screen.width < ANCHO_APP);

  return { modoApp };
}
