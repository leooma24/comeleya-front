import { ref, computed } from "vue";
import { useCompanyStore } from "src/stores/company-store";
import { opcionesDeLocal, tieneSucursales, nombreDelLocal } from "src/utils/sucursales";

/**
 * Un selector de local propio de una pantalla de numeros: el Dashboard, Analiticas.
 *
 * No es el de Pedidos (adminStore.localVisto) a proposito. Ese lo recuerda el aparato
 * porque la tableta de la cocina se queda en su local. Aqui el dueño revisa ventas:
 * cada vez que entra ve todo el negocio, y mirar Centro un momento no le cambia lo que
 * ve en Pedidos ni lo que vera mañana.
 */
export function useFiltroDeLocal() {
  const companyStore = useCompanyStore();

  // null = todo el negocio. Se escribe igual que en el servidor (LocalDePedidos).
  const local = ref(null);

  const hayLocales = computed(() => tieneSucursales(companyStore.company));
  const opciones = computed(() => opcionesDeLocal(companyStore.company));
  const nombre = computed(() =>
    local.value ? nombreDelLocal(local.value, companyStore.company) : null
  );
  const params = computed(() => (local.value ? { local: local.value } : {}));

  const elegir = (valor) => {
    local.value = valor ? String(valor) : null;
  };

  return { local, hayLocales, opciones, nombre, params, elegir };
}
