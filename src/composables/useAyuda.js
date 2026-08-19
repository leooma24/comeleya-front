import { ref } from "vue";

/**
 * El asistente de ayuda, abierto desde fuera.
 *
 * En escritorio se abre con la rueda flotante y con eso basta. En celular esa rueda
 * queda encima de la lista y tapa justo el botón de la última fila —el WhatsApp del
 * cliente, el interruptor de agotado—, así que ahí se quita y la ayuda se abre desde
 * "Más", como cualquier otra sección.
 *
 * El estado vive fuera del componente porque quien abre (Más) y quien muestra
 * (HelpAssistant) están en ramas distintas del árbol.
 */
const abierta = ref(false);

export function useAyuda() {
  return {
    ayudaAbierta: abierta,
    abrirAyuda: () => (abierta.value = true),
  };
}
