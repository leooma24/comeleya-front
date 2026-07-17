import { computed } from "vue";
import { useMainStore } from "src/stores/main-store";

// Lógica compartida por CardDish y ListDish (una sola fuente de verdad).
// `item` debe ser un ref (usa toRef(props, "item") en el componente).
export function useDish(item) {
  const mainStore = useMainStore();

  const hasSpecialPrice = computed(() => {
    const i = item.value;
    return (
      i?.special_price &&
      (!i.special_until || new Date(i.special_until) > new Date())
    );
  });

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
    const url = window.location.href;
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
