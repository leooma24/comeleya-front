// Ajusta la página impresa al alto real del ticket.
//
// Sin una regla @page, el navegador usa el tamaño de papel por defecto (Carta) y
// la impresora térmica alimenta la hoja completa: el ticket sale con un tramo
// largo de papel en blanco al final.
//
// OJO: `@page { size: 80mm auto }` NO sirve. Mezclar una longitud con la palabra
// `auto` es inválido en CSS, así que Chrome descarta la declaración entera y
// vuelve a Carta (medido: 215.9 x 279.4 mm, idéntico a no poner nada). La altura
// tiene que ser una medida concreta, por eso hay que medirla en tiempo de impresión.

// Ancho del ticket en el papel. El rollo mide 80mm pero la cabeza termica solo
// imprime ~72mm, centrados: lo que cae en los 4mm de cada orilla no sale. Antes el
// cuerpo media 280px + 10px de padding por lado = 79mm, y se comia la primera y la
// ultima letra de cada renglon. 70mm deja 1mm de holgura por lado.
export const TICKET_BODY_CSS = "width: 70mm; box-sizing: border-box; margin: 0 auto; padding: 2mm 1mm;";

const PX_POR_PULGADA = 96;
const MM_POR_PULGADA = 25.4;

/**
 * Inyecta `@page` con el alto exacto del contenido en el documento del ticket.
 * Debe llamarse cuando el documento ya maquetó (tras onload), no antes.
 *
 * @param {Document} doc documento del iframe/ventana de impresión
 * @param {number} anchoMm ancho del rollo; 80mm es el estándar
 */
export function fitPageToContent(doc, anchoMm = 80) {
  if (!doc || !doc.body) return;

  const alturaPx = Math.max(
    doc.body.scrollHeight,
    doc.documentElement ? doc.documentElement.scrollHeight : 0
  );
  if (!alturaPx) return;

  // +3mm de respiro para que la última línea no quede en el filo del corte.
  const alturaMm = Math.ceil((alturaPx * MM_POR_PULGADA) / PX_POR_PULGADA) + 3;

  const style = doc.createElement("style");
  style.setAttribute("data-page-size", "");
  style.textContent = `@page { size: ${anchoMm}mm ${alturaMm}mm; margin: 0; }`;
  (doc.head || doc.body).appendChild(style);
}
