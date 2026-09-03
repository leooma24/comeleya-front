/**
 * Compartir un enlace del menu: un platillo, o el menu completo.
 *
 * El boton se quedaba mudo y nadie sabia por que. Son tres puertas, y las tres se
 * pueden cerrar sin decir absolutamente nada:
 *
 * 1. `navigator.share` no existe en casi ningun escritorio. Y donde si existe se puede
 *    negar: dentro de un iframe sin `allow="web-share"` -que es como los sitios de los
 *    negocios embeben el menu- devuelve una promesa rechazada con NotAllowedError.
 *    Nadie la atrapaba, asi que el error moria en la consola del comensal.
 * 2. `window.open` a WhatsApp devuelve `null` con el bloqueador de popups, y tambien
 *    dentro de un iframe con `sandbox`.
 * 3. El portapapeles se niega fuera de https, o si el documento perdio el foco.
 *
 * Se intentan en orden y SIEMPRE se contesta en cual se quedo, para que quien llama le
 * pueda decir algo al comensal en vez de dejarlo tocando un boton muerto.
 */
import { abrirPestana, vaEmbebido } from "src/utils/abrirVentana";

/**
 * Comparte `url`. Devuelve como termino:
 *
 * - "compartido": salio la hoja del sistema y el comensal eligio a donde.
 * - "cancelado":  salio la hoja y la cerro. No hay nada que avisar.
 * - "whatsapp":   sin hoja del sistema, se abrio WhatsApp con el mensaje listo.
 * - "copiado":    no se pudo abrir nada, pero el link quedo en el portapapeles.
 * - "fallo":      no se pudo de ninguna manera. Aqui SI hay que avisarle.
 */
export async function compartirLink({ title, text, url } = {}) {
  const enlace = String(url || "").trim();
  if (!enlace) return "fallo";

  const texto = String(text || "").trim();

  const nativo = await compartirNativo({ title, text: texto, url: enlace });
  if (nativo !== "no") return nativo;

  // Plan B: WhatsApp, que es por donde se comparte casi todo aqui.
  const mensaje = texto ? `${texto} ${enlace}` : enlace;
  const wa = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
  if (await abrirWhatsApp(wa)) return "whatsapp";

  // Plan C: que al menos se lo lleve pegado.
  return (await copiar(enlace)) ? "copiado" : "fallo";
}

/**
 * La hoja de compartir del sistema. Contesta "no" cuando no se pudo, para que quien
 * llama siga con el plan B; "cancelado" cuando el comensal la cerro, que no es lo mismo
 * y no debe disparar ningun respaldo.
 */
async function compartirNativo(datos) {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return "no";
  }

  // canShare avisa ANTES de intentar: hay navegadores donde `share` existe pero no
  // acepta lo que se le manda, y ahi tambien conviene irse al plan B.
  try {
    if (typeof navigator.canShare === "function" && !navigator.canShare(datos)) {
      return "no";
    }
  } catch {
    return "no";
  }

  try {
    await navigator.share(datos);
    return "compartido";
  } catch (e) {
    // AbortError = cerro la hoja a proposito. Abrirle WhatsApp encima seria peor.
    if (e?.name === "AbortError") return "cancelado";

    // NotAllowedError es el caso del iframe sin permiso, y el que traia mudo al boton.
    return "no";
  }
}

/**
 * `abrirPestana` contesta `true` en cuanto le paso el enlace a la pagina contenedora,
 * pero ese camino puede fallar despues: el sitio del negocio puede embeber el menu sin
 * `embed.js` y entonces nadie abre nada. Por eso aqui se espera su respuesta antes de
 * dar el link por compartido.
 */
function abrirWhatsApp(url) {
  return new Promise((resolve) => {
    const enCamino = abrirPestana(url, { alFallar: () => resolve(false) });
    if (!enCamino) return resolve(false);

    // Se abrio aqui mismo, sin intermediarios.
    if (!vaEmbebido()) return resolve(true);

    // Va por la pagina de arriba: `abrirPestana` avisa a los 900ms si no contesto.
    setTimeout(() => resolve(true), 1000);
  });
}

async function copiar(texto) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // Sin https, sin permiso, o el documento perdio el foco.
  }

  // Viejo y feo, pero es lo unico que queda dentro de un iframe en iOS.
  try {
    const area = document.createElement("textarea");
    area.value = texto;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none;";
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, texto.length);
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}
