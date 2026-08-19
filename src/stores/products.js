import { defineStore } from "pinia";
import { controlOf, priceModeOf, maxOf, maxOfOption, chosenOf } from "src/utils/extraConfig";
import { effectivePrice, isSpecialActive } from "src/utils/dishPrice";
import { aplicaHoy } from "src/utils/weekDays";

// ¿El platillo se vende ahora? Sin días ni horario => siempre.
// Soporta ventanas que cruzan medianoche (ej. 22:00–02:00).
function isAvailableNow(item) {
  // Días de la semana: un "Ceviche 3x2" que solo existe los lunes. Va antes del
  // horario porque las dos condiciones se SUMAN: martes de 8 a 12 es martes Y de
  // 8 a 12. Espejo de Dish::disponibleAhora() en el servidor.
  if (!aplicaHoy(item?.available_days)) return false;

  const from = item.available_from;
  const until = item.available_until;
  if (!from || !until) return true;
  const toMin = (t) => {
    const [h, m] = String(t).split(":");
    return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0);
  };
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const f = toMin(from);
  const u = toMin(until);
  if (f === u) return true;
  if (f < u) return cur >= f && cur <= u;
  return cur >= f || cur <= u; // cruza medianoche
}

export const useProductStore = defineStore("products", {
  state: () => ({
    product: null,
    data: {
      name: "Restaurante",
      phone: "",
      delivery: false,
    },
    editing: -1,
    items: [],
    categories: [],
    countByCategory: [],
  }),
  persist: true,
  getters: {
    featuredProducts() {
      // Una promo NO se repite aquí. Ya sale hasta arriba en Ofertas y abajo en su
      // categoría; meterla también en Recomendados la pone tres veces en la misma
      // pantalla y el menú empieza a parecer un menú de tres platillos.
      return this.items.filter(
        (item) => item.is_featured && !item.is_promo && isAvailableNow(item)
      );
    },
    specialOffers() {
      // Dos cosas distintas viven en este bloque:
      //
      //   - El platillo REBAJADO: tiene precio anterior que tachar. Misma regla que
      //     el carrito y el servidor.
      //   - El platillo que ES la promoción ("4x3 a $330"): no hay precio anterior,
      //     nace siendo la oferta. Sin esto, la unica forma de subirlo aqui era
      //     ponerle un special_price igual al precio, o sea un descuento de cero.
      //
      // Los dias y horas los sigue mandando la disponibilidad del platillo.
      return this.items.filter(
        (item) => (item.is_promo || isSpecialActive(item)) && isAvailableNow(item)
      );
    },
  },
  actions: {
    clear() {
      this.product = null;
      this.editing = -1;
      this.items = [];
      this.categories = [];
    },
    getProductsByCategoryId(categoryId, search) {
      let items = this.items.filter(
        (item) => item.dish_category_id === categoryId && isAvailableNow(item)
      );
      if (search) {
        items = items.filter((item) =>
          item.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      this.countByCategory[categoryId] = items.length;
      return items;
    },
    seeProduct(product) {
      this.product = Object.assign({}, product);
      this.product.qty = 1;
      // El precio de oferta, si está vigente. El servidor cobra con la misma regla.
      this.product.totalPrice = effectivePrice(product);
      this.product.extras = [...(product.extras || [])].sort((a, b) => a.order - b.order);
      this.product.extras.forEach((extra) => {
        // Solo el radio preselecciona: es el único donde "no elegir" no es opción.
        if (controlOf(extra) === "radio" && extra.is_required && extra.options?.length) {
          extra.options[0].qty = 1;
        }
      });
      this.updatePrice();
    },
    editProduct(product) {
      this.product = product;
    },
    increment() {
      this.product.qty++;
      this.updatePrice();
    },
    decrement() {
      this.product.qty--;
      this.updatePrice();
    },
    isDisabled(extra) {
      this.updatePrice();
      return chosenOf(extra) >= maxOf(extra, this.product?.extras);
    },
    /**
     * Recorta lo que ya no cabe tras cambiar de tamaño.
     *
     * Al pasar de 48 a 36 piezas el grupo baja de 4 rollos a 3, y además se
     * reactivan los techos por rollo, así que un tercer Norteño sobra aunque el
     * total sí cupiera. Se conserva lo elegido y solo se quita el excedente,
     * empezando por lo último que agregó.
     *
     * Devuelve qué se quitó para poder avisarle al comensal por su nombre.
     */
    enforceLimits() {
      const extras = this.product?.extras || [];
      const quitados = [];

      const anotar = (nombre, cuantos) => {
        if (cuantos <= 0) return;
        const previo = quitados.find((q) => q.name === nombre);
        if (previo) previo.count += cuantos;
        else quitados.push({ name: nombre, count: cuantos });
      };

      extras.forEach((extra) => {
        if (controlOf(extra) === "radio") return;
        const opciones = extra.options || [];

        // 1) Techos por opción (los que el tamaño no haya desactivado).
        opciones.forEach((option) => {
          const techo = maxOfOption(extra, option, extras);
          const actual = Number(option.qty) || 0;
          if (actual > techo) {
            option.qty = techo;
            anotar(option.name, actual - techo);
          }
        });

        // 2) Tope total del grupo, recortando desde el final.
        let sobra = chosenOf(extra) - maxOf(extra, extras);
        for (let i = opciones.length - 1; i >= 0 && sobra > 0; i--) {
          const option = opciones[i];
          const actual = Number(option.qty) || 0;
          if (!actual) continue;
          const quitar = Math.min(actual, sobra);
          option.qty = actual - quitar;
          sobra -= quitar;
          anotar(option.name, quitar);
        }
      });

      this.updatePrice();
      return quitados;
    },
    updatePrice() {
      // El modo de precio de cada extra sale de su configuración (ver
      // src/utils/extraConfig.js), no de adivinar por los precios de las opciones:
      //  - "replace": la opción ES el precio del platillo (variantes de tamaño,
      //    ej. Charola $425 -> opción "36 Piezas" $425 = $425).
      //  - "add": el precio base se cuenta una vez y las opciones se suman encima.
      // El servidor aplica exactamente la misma regla leyendo el mismo campo.
      const base = effectivePrice(this.product);

      if (!this.product.extras || this.product.extras.length === 0) {
        this.product.totalPrice = base;
        return;
      }

      let replaceSum = 0; // opciones absolutas (reemplazan la base)
      let hasReplace = false;
      let addSum = 0; // opciones que se suman a la base

      this.product.extras.forEach((extra) => {
        const sum = extra.options.reduce((acc, option) => {
          option.qty = option.qty ?? 0;
          option.price = option.price ?? 0;
          return acc + parseFloat(option.qty * option.price);
        }, 0);

        if (priceModeOf(extra) === "replace") {
          hasReplace = true;
          replaceSum += sum;
        } else {
          addSum += sum;
        }
      });

      this.product.totalPrice = (hasReplace ? replaceSum : base) + addSum;
    },
    setProducts(products) {
      this.items = products;
    },
    setCategories(categories) {
      this.categories = categories;
    },
    removeProduct(index) {
      this.items.splice(index, 1);
    },
  },
});
