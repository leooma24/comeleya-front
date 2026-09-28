import { computed } from "vue";
import { useMainStore } from "src/stores/main-store";
import { isSpecialActive } from "src/utils/dishPrice";
import { compartirLink } from "src/utils/compartir";

// Lógica compartida por CardDish y ListDish (una sola fuente de verdad).
// `item` debe ser un ref (usa toRef(props, "item") en el componente).
export function useDish(item) {
  const mainStore = useMainStore();

  // Misma regla que el carrito y que el servidor (src/utils/dishPrice.js). Antes
  // aquí una oferta SIN fecha de fin se pintaba como vigente, pero el servidor no
  // la aplicaba: se anunciaba un descuento que nunca se cobraba.
  const hasSpecialPrice = computed(() => isSpecialActive(item.value));

  // Agotado para QUIEN ESTA VIENDO: en un negocio con sucursales, lo que se acabo en
  // Centro sigue habiendo en Norte. Lo resuelve el store, que sabe de que local pide.
  const agotado = computed(() => mainStore.estaAgotado(item.value));

  // "Nuevo" = creado en los últimos 14 días
  const isNew = computed(() => {
    if (!item.value?.created_at) return false;
    const created = new Date(item.value.created_at);
    if (isNaN(created)) return false;
    return (Date.now() - created.getTime()) / 86400000 <= 14;
  });

  // Precio de $0: el platillo se cobra por sus opciones ("Orden chica / grande") o el
  // negocio no lo capturo. En los dos casos "$0.00" en la vitrina se lee como error o
  // como regalo; con opciones se invita a verlas y sin ellas no se dice nada.
  const sinPrecio = computed(
    () => !hasSpecialPrice.value && !(Number(item.value?.price) > 0)
  );
  const tieneOpciones = computed(() => (item.value?.extras?.length ?? 0) > 0);

  // La descripcion llega con HTML del editor viejo ("Orden chica: <b>$</b>"). En la
  // tarjeta va como texto: las etiquetas se veian tal cual.
  const descripcion = computed(() => textoPlano(item.value?.description));

  const seeProduct = () => {
    const clone = JSON.parse(JSON.stringify(item.value));
    mainStore.seeProduct(clone);
  };

  /**
   * La direccion del platillo para compartir.
   *
   * /kazuki-sushi-delivery/maguro-roll es la de ahora: la que Google indexa y la que
   * metadata.php usa para pintar la foto y el precio en la vista previa de WhatsApp.
   * Antes se mandaba ?dish=<id>, que le enseñaba el numero interno del platillo a
   * quien recibia el mensaje. Ese formato se queda SOLO de respaldo: los platillos
   * creados antes de la columna `slug` todavia no tienen uno, y el menu sigue sabiendo
   * abrir las dos formas.
   */
  const urlDelPlatillo = (i) => {
    const negocio =
      mainStore.company?.slug ||
      window.location.pathname.split("/").filter(Boolean)[0] ||
      "";
    const base = `${window.location.origin}/${negocio}`;

    return i.slug ? `${base}/${i.slug}` : `${base}?dish=${i.id}`;
  };

  const shareProduct = async () => {
    const i = item.value;
    const text = sinPrecio.value
      ? `${i.name} en ${mainStore.company.name}`
      : `${i.name} - ${precio(i.price)} en ${mainStore.company.name}`;

    // Las tres puertas de compartir se pueden cerrar sin decir nada -la del sistema
    // dentro de un iframe, WhatsApp con el bloqueador de popups, el portapapeles fuera
    // de https-, y asi es como este boton se quedaba mudo. Ahora contesta en cual se
    // quedo y de aqui sale el aviso.
    const comoTermino = await compartirLink({ title: i.name, text, url: urlDelPlatillo(i) });

    if (comoTermino === "copiado") {
      mainStore.messageStore.success(
        "Copiamos el link del platillo. Pegalo donde quieras compartirlo."
      );
    } else if (comoTermino === "fallo") {
      mainStore.messageStore.error(
        "Este sitio no deja compartir desde aqui. Copia la direccion de la pagina para mandarla."
      );
    }
  };

  return {
    agotado,
    hasSpecialPrice,
    isNew,
    sinPrecio,
    tieneOpciones,
    descripcion,
    seeProduct,
    shareProduct,
  };
}

// "$1,250" y "$89.50": sin los ".00" que no dicen nada y con separador de miles.
const formato = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
export function precio(valor) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return "";
  const texto = formato.format(n);
  // 89.5 -> 89.50: un centavo suelto se lee raro en un precio.
  return "$" + (/\.\d$/.test(texto) ? texto + "0" : texto);
}

export function textoPlano(html) {
  if (!html) return "";
  // DOMParser y no un div con innerHTML: el div carga las imagenes y un onerror
  // escrito en la descripcion se ejecutaria.
  const doc = new DOMParser().parseFromString(
    String(html).replace(/<br\s*\/?>/gi, " "),
    "text/html"
  );
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
}
