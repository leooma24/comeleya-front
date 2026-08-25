import { api } from "boot/axios";

/**
 * Los cuatro pasos del menú: ver, agregar al carrito, empezar a pagar, pedir.
 *
 * Hasta hoy no se medía nada. La consecuencia práctica es que de un negocio sin
 * pedidos no se podía saber si no lo visitan o si lo visitan y no compran —dos
 * problemas distintos, con soluciones distintas— y por lo tanto tampoco se podía
 * saber si un cambio sirvió.
 *
 * Reglas de esto:
 * - No bloquea nada. Si el envío falla, el comensal no se entera.
 * - No identifica personas. La `visita` es un número al azar del navegador, vive en
 *   sessionStorage y muere al cerrar la pestaña. Sirve para no contar cinco veces a
 *   quien recarga, y para nada más.
 * - Cada paso se manda UNA vez por visita: el embudo cuenta gente, no clics.
 */

const CLAVE = "mc_visita";
const yaMandados = new Set();

/** El identificador de esta visita. Al azar y de esta pestaña. */
const visita = () => {
  try {
    let v = sessionStorage.getItem(CLAVE);
    if (!v) {
      v = Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
      sessionStorage.setItem(CLAVE, v);
    }
    return v;
  } catch (e) {
    // Navegador con el almacenamiento bloqueado: se cuenta como visita suelta antes
    // que perder el dato.
    return "sin-almacen";
  }
};

/**
 * Reporta un paso del embudo.
 *
 * @param {string} slug   el negocio
 * @param {string} evento menu | carrito | pago | pedido | enviado
 */
export function marcar(slug, evento) {
  if (!slug || !evento) return;

  const clave = `${slug}:${evento}`;
  if (yaMandados.has(clave)) return;
  yaMandados.add(clave);

  // Sin await a propósito: nada de lo que hace el comensal espera a esto.
  //
  // Y envuelto en try/catch además del .catch: esto se llama desde el camino feliz de
  // creatingOrder y desde setCompany, así que si `api` no se comporta como se espera
  // -o alguien lo sustituye- lo que NO puede pasar es que se caiga el pedido por no
  // haber podido contar una visita. Medir es lo primero que se sacrifica.
  try {
    const envio = api.post(`/establishment/${slug}/event`, {
      event: evento,
      visit: visita(),
    });
    if (envio && typeof envio.catch === "function") {
      envio.catch(() => {
        // Se reintenta en la siguiente visita. Al comensal no se le avisa de algo
        // que no es asunto suyo.
        yaMandados.delete(clave);
      });
    }
  } catch (e) {
    yaMandados.delete(clave);
  }
}

/** Para las pruebas: olvida lo ya reportado en esta sesión. */
export function reiniciarEmbudo() {
  yaMandados.clear();
}
