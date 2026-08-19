import { computed } from "vue";
import { useMainStore } from "src/stores/main-store";
import { isSpecialActive } from "src/utils/dishPrice";

// Lógica compartida por CardDish y ListDish (una sola fuente de verdad).
// `item` debe ser un ref (usa toRef(props, "item") en el componente).
export function useDish(item) {
  const mainStore = useMainStore();

  // Misma regla que el carrito y que el servidor (src/utils/dishPrice.js). Antes
  // aquí una oferta SIN fecha de fin se pintaba como vigente, pero el servidor no
  // la aplicaba: se anunciaba un descuento que nunca se cobraba.
  const hasSpecialPrice = computed(() => isSpecialActive(item.value));

  // "Nuevo" = creado en los últimos 14 días
  const isNew = computed(() => {
    if (!item.value?.created_at) return false;
    const created = new Date(item.value.created_at);
    if (isNaN(created)) return false;
    return (Date.now() - created.getTime()) / 86400000 <= 14;
  });

  const seeProduct = () => {
    const clone = JSON.parse(JSON.stringify(item.value));
    mainStore.seeProduct(clone);
  };

  const shareProduct = () => {
    const i = item.value;
    // Link directo al platillo (?dish=<id>): así WhatsApp/Facebook muestran la foto
    // y los datos del platillo en la vista previa (los genera metadata.php en el server).
    const slug = window.location.pathname.split("/").filter(Boolean)[0] || "";
    const url = `${window.location.origin}/${slug}?dish=${i.id}`;
    const text = `${i.name} - $${i.price} en ${mainStore.company.name}`;

    if (navigator.share) {
      navigator.share({ title: i.name, text, url });
    } else {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
      window.open(waUrl, "_blank");
    }
  };

  return { hasSpecialPrice, isNew, seeProduct, shareProduct };
}
