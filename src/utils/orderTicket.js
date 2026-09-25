// El ticket impreso de un pedido.
//
// Vivia dentro de Orders.vue. Se saco porque el Historial tambien reimprime, y segun
// CLAUDE.md esta impresion YA esta duplicada en ValidationDialog.vue, Orders.vue y
// Analytics.vue: pegar una cuarta copia era garantizar que el dia que cambie el ticket
// cambie en tres lugares y se olvide el cuarto.
//
// Aqui se saco la de Orders.vue y la comparten ella y el Historial. Las otras dos
// siguen con la suya; se migran cuando se toquen.
//
// No conoce stores a proposito: recibe el negocio y a donde avisar si falla, asi que
// lo puede llamar cualquier pantalla —o una prueba— sin montar Pinia.

import { etiquetaPago } from "src/utils/metodosPago.js";

import { fitPageToContent, TICKET_BODY_CSS } from "src/utils/ticketPageSize";
import { amountToWords } from "src/utils/numberToWords";
import { orderTotals } from "src/utils/orderTotals";
import { origenDelPedido } from "src/utils/sucursales";

const ticketStyles = `
  /* El alto de @page lo inyecta fitPageToContent() al imprimir, medido del contenido.
     Ver src/utils/ticketPageSize.js: sin eso sale una hoja Carta con papel en blanco. */
  html, body { margin: 0; padding: 0; }
  body { font-family: 'Consolas', 'DejaVu Sans Mono', 'Liberation Mono', Menlo, 'Courier New', monospace; font-size: 12px; font-weight: 700; ${TICKET_BODY_CSS} color: #000; line-height: 1.35; }
  .item, .row, .cols, .addr, .info div, .letras, .thead, .section-title, .biz span { font-weight: 700; }
  .c-desc, .price, .total, .biz strong { font-weight: 800; }
  .sep { text-align: center; margin: 5px 0; letter-spacing: 1px; }
  .biz { text-align: center; margin-bottom: 4px; }
  .biz strong { font-size: 14px; display: block; }
  .biz span { display: block; font-size: 11px; }
  .cols { display: flex; justify-content: space-between; gap: 8px; }
  .cols .col { font-size: 11px; }
  .cols .col.r { text-align: right; flex: 0 0 auto; white-space: nowrap; }
  .cols .col div { padding: 1px 0; }
  .addr { font-size: 11px; margin-top: 4px; }
  .addr .lbl { font-weight: bold; }
  .thead, .item { display: flex; font-size: 11px; }
  .thead { font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 2px; }
  .item { padding: 2px 0; }
  .c-cant { width: 28px; flex: 0 0 28px; }
  .c-desc { flex: 1 1 auto; padding: 0 4px; word-break: break-word; }
  .c-imp { width: 60px; flex: 0 0 60px; text-align: right; }
  .extra { font-size: 10px; padding-left: 32px; }
  .item-note { font-size: 11px; padding-left: 32px; font-weight: 800; }
  .row { display: flex; justify-content: space-between; padding: 1px 0; font-size: 12px; }
  .total { font-weight: bold; font-size: 16px; border-top: 1px solid #000; margin-top: 3px; padding-top: 3px; }
  .letras { font-size: 10px; text-align: center; margin: 4px 0; text-transform: uppercase; }
  .section-title { font-weight: bold; font-size: 11px; text-transform: uppercase; margin-top: 4px; margin-bottom: 2px; }
  .info div { padding: 1px 0; font-size: 11px; }
  .footer { text-align: center; margin-top: 6px; font-size: 9px; line-height: 1.3; }
`;
const SEP = '<div class="sep">- - - - - - - - - - - - - -</div>';

// Escapa datos provistos por el cliente para no romper el ticket ni inyectar HTML.
// Se exporta porque el corte de caja imprime igual, en una ventana con la sesion del
// panel abierta: lo que se imprime sin escapar ahi corre con el token a la mano.
export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));

/**
 * Abre el dialogo de impresion con el ticket de un pedido.
 *
 * @param order    El pedido con sus items, extras y opciones cargados.
 * @param company  El establecimiento (nombre, telefono, address, ticket_config).
 * @param onError  Se llama si el navegador no deja imprimir.
 */
export function printOrderTicket(order, { company = {}, onError } = {}) {
  const f = (n) => Number(n || 0).toFixed(2);

  // ---- Datos del negocio (encabezado) ----
  // `company` llega por parametro.
  const tc = company.ticket_config || {};
  const bizName = esc(company.name || "");
  const legalName = esc(tc.business_legal_name || "");
  const rfc = esc(tc.rfc || "");
  const bizPhone = esc(company.whatsapp || company.phone || "");
  const addr = company.address || {};
  const showBizAddr = tc.show_business_address !== false;
  const bizAddrLine = [
    [addr.street, addr.exterior_number].filter(Boolean).join(" "),
    addr.town,
    addr.postal_code ? `CP ${addr.postal_code}` : "",
    [addr.city, addr.state].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .map(esc)
    .join(" · ");

  // ---- Artículos (CANT. | DESCRIPCION | IMPORTE) ----
  const items = (order.items || [])
    .map((item) => {
      const name = esc(item.dish?.name ?? "Producto");
      const lineImport = Number(item.total || 0);
      let html = `<div class="item"><span class="c-cant">${item.quantity}</span><span class="c-desc">${name}</span><span class="c-imp">$${f(lineImport)}</span></div>`;
      (item.extras || []).forEach((extra) => {
        (extra.options || []).forEach((o) => {
          const optName = esc(o.name);
          let text = o.quantity > 1 ? `${o.quantity * item.quantity}x ${optName}` : optName;
          if (o.price > 0) text += ` (+$${f(o.price * o.quantity * item.quantity)})`;
          html += `<div class="extra">- ${text}</div>`;
        });
      });
      // La nota va bajo su platillo y en negrita: es lo que la cocina tiene que
      // ver de un vistazo, no una línea más de detalle.
      if (item.notes) {
        html += `<div class="item-note">** ${esc(item.notes)}</div>`;
      }
      return html;
    })
    .join("");

  // `order.total` es solo el subtotal de platillos; el total a cobrar suma
  // propina y envío y resta el descuento (ver src/utils/orderTotals.js).
  const { subtotal, discount, tip, deliveryCharge, grandTotal } = orderTotals(order);

  const d = order.created_at ? new Date(order.created_at) : new Date();
  const fecha = d.toLocaleDateString("es-MX");
  const hora = d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const payment = etiquetaPago(order.payment_method);
  const driverName = order.delivery_assignment?.driver?.name || "";

  // ---- Bloque de entrega ----
  let deliveryBlock = "";
  if (order.delivery === "Envio") {
    let a = order.delivery_address ? `<div><span class="lbl">Dir.:</span> ${esc(order.delivery_address)}</div>` : "";
    if (order.delivery_references) a += `<div><span class="lbl">Entre/Ref.:</span> ${esc(order.delivery_references)}</div>`;
    if (driverName) a += `<div><span class="lbl">REPARTIDOR:</span> ${esc(driverName)}</div>`;
    deliveryBlock = a ? `<div class="addr">${a}</div>` : "";
  } else if (order.delivery === "Recoger") {
    deliveryBlock = `<div class="addr"><strong>PASO A RECOGER</strong></div>`;
  } else if (order.table) {
    deliveryBlock = `<div class="addr"><span class="lbl">Mesa:</span> ${esc(order.table)}</div>`;
  }

  // ---- Encabezado del negocio ----
  // En un negocio con varios locales, la comanda dice de cual es -una sucursal o la
  // Matriz- y da el telefono de ese local: es la cocina que lo arma y el numero al que
  // va a llamar el cliente. La direccion fiscal sigue siendo la del negocio.
  const origen = origenDelPedido(order, company);
  const headerPhone = esc(order.branch?.phone || "") || bizPhone;
  const bizHeader = `
    <div class="biz">
      ${bizName ? `<strong>${bizName}</strong>` : ""}
      ${origen ? `<span>SUCURSAL ${esc(origen)}</span>` : ""}
      ${legalName ? `<span>${legalName}</span>` : ""}
      ${rfc ? `<span>RFC: ${rfc}</span>` : ""}
      ${showBizAddr && bizAddrLine ? `<span>${bizAddrLine}</span>` : ""}
      ${headerPhone ? `<span>Tel. ${headerPhone}</span>` : ""}
    </div>`;

  // ---- Pie legal configurable ----
  const footerText = esc(tc.footer_text || "");
  const suggestionsEmail = esc(tc.suggestions_email || "");
  const footer =
    footerText || suggestionsEmail
      ? `${SEP}<div class="footer">${footerText}${
          suggestionsEmail ? `${footerText ? "<br>" : ""}Sugerencias: ${suggestionsEmail}` : ""
        }</div>`
      : "";

  const html = `
    <html><head><title>Pedido #${esc(order.order_code)}</title>
    <style>${ticketStyles}</style></head><body>
      ${bizName || bizAddrLine ? bizHeader : ""}
      ${SEP}
      <div class="cols">
        <div class="col">
          <div>Tel.: ${esc(order.phone || "")}</div>
          <div>${esc(order.customer_name || "")}</div>
        </div>
        <div class="col r">
          <div>FOLIO NO. ${esc(order.id ?? "")}</div>
          <div>${esc(fecha)}</div>
          <div>${esc(hora)}</div>
          <div>ORDEN NO. ${esc(order.order_code ?? "")}</div>
        </div>
      </div>
      ${deliveryBlock}
      ${SEP}
      <div class="thead"><span class="c-cant">CANT</span><span class="c-desc">DESCRIPCION</span><span class="c-imp">IMPORTE</span></div>
      ${items}
      ${order.delivery_estimated ? `<div class="addr"><strong>** ENVIO ESTIMADO - REVISAR DISTANCIA **</strong></div>` : ""}
      ${SEP}
      <div class="row"><span>SUBTOTAL:</span><span>$${f(subtotal)}</span></div>
      ${discount > 0 ? `<div class="row"><span>DESCUENTO:</span><span>-$${f(discount)}</span></div>` : ""}
      ${deliveryCharge > 0 ? `<div class="row"><span>ENVIO:</span><span>$${f(deliveryCharge)}</span></div>` : ""}
      ${tip > 0 ? `<div class="row"><span>PROPINA:</span><span>$${f(tip)}</span></div>` : ""}
      <div class="row total"><span>TOTAL:</span><span>$${f(grandTotal)}</span></div>
      <div class="letras">${esc(amountToWords(grandTotal))}</div>
      ${payment ? `<div class="row"><span>PAGO:</span><span>${esc(payment)}</span></div>` : ""}
      ${order.comments ? `${SEP}<div class="section-title">Comentarios</div><div class="info"><div>${esc(order.comments)}</div></div>` : ""}
      ${footer}
    </body></html>
  `;

  // Imprime en un iframe oculto: window.open queda bloqueado en móvil/in-app.
  const prev = document.getElementById("mc-admin-print-frame");
  if (prev) prev.remove();
  const iframe = document.createElement("iframe");
  iframe.id = "mc-admin-print-frame";
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
  });
  document.body.appendChild(iframe);

  let printed = false;
  const triggerPrint = () => {
    if (printed) return;
    printed = true;
    try {
      // Acota la hoja al alto del ticket antes de mandar a imprimir.
      fitPageToContent(iframe.contentWindow.document);
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch {
      onError?.(
        "Este navegador no permite imprimir. Ábrelo en Chrome o conecta una impresora."
      );
    }
  };

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  iframe.onload = () => setTimeout(triggerPrint, 200);
  setTimeout(triggerPrint, 700);
}
