<template>
  <q-dialog
    v-model="mainStore.validationDialog"
    backdrop-filter="blur(8px)"
    persistent
    @hide="mainStore.clearAll"
  >
    <q-card class="success-dialog">
      <!-- ============ PASO 1: Enviar por WhatsApp ============ -->
      <template v-if="step === 1">
        <!-- Icono WhatsApp animado (NO check, para que no parezca terminado) -->
        <div class="success-dialog__icon-wrapper">
          <div class="success-dialog__icon-circle success-dialog__icon-circle--whatsapp">
            <q-icon name="img:/icons/whatsapp.svg" size="26px" />
          </div>
        </div>

        <!-- Mensaje principal -->
        <q-card-section class="success-dialog__content">
          <h3 class="success-dialog__title">¡Último paso!</h3>
          <p class="success-dialog__message">
            Para que el restaurante reciba tu pedido, <strong>debes enviarlo por WhatsApp</strong>. Presiona el botón de abajo. 👇
          </p>
        </q-card-section>

        <!-- Número de pedido destacado -->
        <q-card-section class="success-dialog__order-section">
          <p class="success-dialog__label">Número de pedido</p>
          <div class="success-dialog__code">
            {{ mainStore.orderStore.orderCode }}
          </div>
        </q-card-section>

        <!-- Botón principal de WhatsApp (ancla nativa: no la bloquea el navegador móvil) -->
        <q-card-actions class="success-dialog__actions">
          <q-btn
            type="a"
            :href="mainStore.whatsappUrl"
            target="_blank"
            rel="noopener"
            color="positive"
            unelevated
            no-caps
            size="lg"
            class="full-width success-dialog__whatsapp-btn"
            icon="img:/icons/whatsapp.svg"
            label="Enviar por WhatsApp"
            @click="goToConfirmation"
          />
        </q-card-actions>

        <!-- Salida discreta por si el navegador bloquea WhatsApp -->
        <q-card-section class="success-dialog__fallback">
          <button class="success-dialog__fallback-link" @click="goToConfirmation">
            Ya envié mi pedido
          </button>
        </q-card-section>
      </template>

      <!-- ============ PASO 2: Confirmación ============ -->
      <template v-else>
      <!-- Icono de éxito con confeti -->
      <div class="success-dialog__icon-wrapper">
        <div class="success-dialog__celebrate">
          <span
            v-for="n in 8"
            :key="n"
            class="success-dialog__confetti"
            :style="{ '--i': n }"
          ></span>
          <div class="success-dialog__icon-circle success-dialog__icon-circle--done">
            <q-icon name="check" size="36px" color="white" />
          </div>
        </div>
      </div>

      <!-- Mensaje principal -->
      <q-card-section class="success-dialog__content">
        <h3 class="success-dialog__title">¡Pedido Realizado!</h3>
        <p class="success-dialog__message">
          Tu pedido fue enviado al restaurante. En breve se pondrán en contacto para confirmarlo.
        </p>
      </q-card-section>

      <!-- Número de pedido destacado -->
      <q-card-section class="success-dialog__order-section">
        <p class="success-dialog__label">Número de pedido</p>
        <div class="success-dialog__code">
          {{ mainStore.orderStore.orderCode }}
        </div>
      </q-card-section>

      <!-- ¿No se abrió WhatsApp? Reintentar (ancla nativa) -->
      <q-card-section class="success-dialog__actions">
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="local_shipping"
          label="Seguir mi pedido"
          class="full-width q-mb-sm"
          :to="`/${mainStore.companyStore.slug}/pedido/${mainStore.orderStore.orderCode}`"
        />
        <q-btn
          type="a"
          :href="mainStore.whatsappUrl"
          target="_blank"
          rel="noopener"
          flat
          no-caps
          color="positive"
          icon="img:/icons/whatsapp.svg"
          label="Reenviar por WhatsApp"
          class="full-width"
        />
      </q-card-section>

      <!-- Resumen del pedido -->
      <q-card-section class="success-dialog__receipt">
        <div class="receipt__header">
          <q-icon name="receipt" size="16px" color="grey-6" />
          <span>Resumen del pedido</span>
        </div>

        <div class="receipt__items">
          <div
            class="receipt__item"
            v-for="(product, index) in mainStore.cart"
            :key="index"
          >
            <div class="receipt__item-main">
              <span class="receipt__item-qty">{{ product.qty }}x</span>
              <span class="receipt__item-name">{{ product.name }}</span>
              <span class="receipt__item-price">${{ (product.totalPrice * product.qty).toFixed(2) }}</span>
            </div>
            <div
              class="receipt__item-extra"
              v-for="(extra, ei) in product.extras"
              :key="ei"
            >
              <template v-for="(option, oi) in extra.options" :key="oi">
                <span v-if="option.qty > 0" class="receipt__option">
                  &nbsp;&nbsp;- {{ option.name }}
                  <span v-if="option.price > 0"> ${{ (option.price * option.qty * product.qty).toFixed(2) }}</span>
                </span>
              </template>
            </div>
            <div v-if="product.notes" class="receipt__item-note">
              &nbsp;&nbsp;Nota: {{ product.notes }}
            </div>
          </div>
        </div>

        <q-separator class="q-my-sm" />

        <div class="receipt__totals">
          <div class="receipt__total-row">
            <span>Subtotal</span>
            <span>${{ mainStore.total.toFixed(2) }}</span>
          </div>
          <div class="receipt__total-row" v-if="mainStore.deliveryCharge > 0">
            <span>Envío</span>
            <span>${{ mainStore.deliveryCharge.toFixed(2) }}</span>
          </div>
          <div class="receipt__total-row" v-if="mainStore.getTip > 0">
            <span>Propina</span>
            <span>${{ mainStore.getTip.toFixed(2) }}</span>
          </div>
          <div class="receipt__total-row receipt__total-row--discount" v-if="mainStore.coupon.applied">
            <span>Cupón ({{ mainStore.coupon.code }})</span>
            <span>-${{ mainStore.coupon.discount.toFixed(2) }}</span>
          </div>
          <div class="receipt__total-row receipt__total-row--final">
            <span>Total</span>
            <span>${{ mainStore.totalToPay.toFixed(2) }}</span>
          </div>
        </div>
      </q-card-section>

      <!-- Acciones secundarias -->
      <q-card-actions class="success-dialog__actions" vertical>
        <q-btn
          flat
          no-caps
          color="primary"
          icon="print"
          label="Imprimir pedido"
          class="full-width"
          @click="printOrder"
        />

        <q-btn
          flat
          no-caps
          color="primary"
          icon="share"
          label="Compartir resumen"
          class="full-width q-mt-xs"
          @click="shareReceipt"
        />

        <q-btn
          flat
          no-caps
          color="grey-7"
          label="Cerrar"
          class="full-width q-mt-xs"
          v-close-popup
        />
      </q-card-actions>
      </template>
    </q-card>
  </q-dialog>
</template>

<script setup>
defineOptions({
  name: "ValidationDialog",
});

import { ref, watch } from "vue";
import { useMainStore } from "src/stores/main-store";
import { fitPageToContent } from "src/utils/ticketPageSize";
const mainStore = useMainStore();

// Paso interno del diálogo: 1 = enviar por WhatsApp, 2 = confirmación
const step = ref(1);

// Cada vez que el diálogo se abre, reiniciar al paso 1
watch(
  () => mainStore.validationDialog,
  (open) => {
    if (open) step.value = 1;
  }
);

// Avanza a la confirmación (lo dispara el botón de WhatsApp y el enlace de respaldo)
const goToConfirmation = () => {
  step.value = 2;
};

const ticketStyles = `
  /* El alto de @page lo inyecta fitPageToContent() al imprimir (ver ticketPageSize.js). */
  html, body { margin: 0; padding: 0; }
  body { font-family: 'Consolas', 'DejaVu Sans Mono', 'Liberation Mono', Menlo, 'Courier New', monospace; font-size: 12px; font-weight: 700; width: 280px; margin: 0 auto; padding: 10px; line-height: 1.35; }
  .item, .row, .info div { font-weight: 700; }
  .sep { text-align: center; margin: 6px 0; letter-spacing: 2px; color: #333; }
  .item { display: flex; justify-content: space-between; padding: 2px 0; }
  .extra { padding-left: 14px; font-size: 11px; color: #555; }
  .note { padding-left: 14px; font-size: 11px; font-weight: 700; }
  .row { display: flex; justify-content: space-between; padding: 2px 0; }
  .total { font-weight: bold; font-size: 14px; border-top: 1px solid #000; margin-top: 4px; padding-top: 4px; }
  .header { text-align: center; margin-bottom: 6px; }
  .header strong { font-size: 14px; display: block; margin-bottom: 2px; }
  .header span { display: block; font-size: 11px; color: #555; }
  .order { text-align: center; font-weight: bold; font-size: 13px; margin: 4px 0; }
  .section-title { font-weight: bold; font-size: 11px; text-transform: uppercase; margin-top: 4px; margin-bottom: 2px; }
  .info div { padding: 1px 0; font-size: 11px; }
  .footer { text-align: center; margin-top: 8px; font-size: 11px; }
  .footer span { display: block; }
`;
const SEP = '<div class="sep">- - - - - - - - - - - - - -</div>';

const printOrder = () => {
  const f = (n) => Number(n || 0).toFixed(2);
  // Escapa HTML: los nombres de producto/establecimiento vienen del backend y
  // podrían contener markup; sin escapar se ejecutaría como HTML en el iframe.
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const items = mainStore.cart
    .map((p) => {
      let html = `<div class="item"><span>${p.qty}x ${esc(p.name)}</span><span>$${f(p.totalPrice * p.qty)}</span></div>`;
      (p.extras || []).forEach((extra) => {
        (extra.options || []).forEach((option) => {
          if (option.qty > 0) {
            const optTotal = option.price * option.qty * p.qty;
            let text = option.qty * p.qty > 1 ? `${option.qty * p.qty}x ${esc(option.name)}` : esc(option.name);
            if (optTotal > 0) text += ` $${f(optTotal)}`;
            html += `<div class="extra">↳ ${text}</div>`;
          }
        });
      });
      if (p.notes) {
        html += `<div class="note">** ${esc(p.notes)}</div>`;
      }
      return html;
    })
    .join("");

  const delivery = mainStore.data.delivery;
  let deliveryInfo = "";
  if (delivery === "Envio") {
    const addr = [mainStore.data.street, mainStore.data.ext_number ? `#${mainStore.data.ext_number}` : "", mainStore.data.town, mainStore.data.zip].filter(Boolean).join(", ");
    deliveryInfo = `<div><strong>Dirección:</strong> ${esc(addr)}</div>`;
    if (mainStore.data.references) deliveryInfo += `<div><strong>Referencia:</strong> ${esc(mainStore.data.references)}</div>`;
  } else if (delivery === "Recoger") {
    deliveryInfo = `<div><strong>Paso a recoger</strong></div>`;
  } else {
    deliveryInfo = `<div><strong>Mesa:</strong> ${esc(mainStore.data.table)}</div>`;
  }

  const html = `
    <html><head><title>Pedido #${mainStore.orderStore.orderCode}</title>
    <style>${ticketStyles}</style></head><body>
      <div class="header">
        <strong>${esc(mainStore.establishment.name)}</strong>
        <span>${new Date().toLocaleString()}</span>
      </div>
      <div class="order">Orden #${mainStore.orderStore.orderCode}</div>
      ${SEP}
      <div class="section-title">Productos</div>
      ${items}
      ${SEP}
      <div class="row"><span>Subtotal:</span><span>$${f(mainStore.total)}</span></div>
      ${mainStore.deliveryCharge > 0 ? `<div class="row"><span>Envío:</span><span>$${f(mainStore.deliveryCharge)}</span></div>` : ""}
      ${mainStore.getTip > 0 ? `<div class="row"><span>Propina:</span><span>$${f(mainStore.getTip)}</span></div>` : ""}
      ${mainStore.coupon.applied ? `<div class="row"><span>Cupón (${esc(mainStore.coupon.code)}):</span><span>-$${f(mainStore.coupon.discount)}</span></div>` : ""}
      <div class="row total"><span>TOTAL:</span><span>$${f(mainStore.totalToPay)}</span></div>
      ${SEP}
      <div class="section-title">Pago</div>
      <div class="row"><span>${esc(mainStore.payment.type)}</span></div>
      ${SEP}
      <div class="section-title">Cliente</div>
      <div class="info">
        <div><strong>Nombre:</strong> ${esc(mainStore.data.name)}</div>
        <div><strong>Tel:</strong> ${esc(mainStore.data.phone)}</div>
        ${deliveryInfo}
      </div>
      ${mainStore.data.comments ? `${SEP}<div class="section-title">Comentarios</div><div class="info"><div>${esc(mainStore.data.comments)}</div></div>` : ""}
      ${SEP}
      <div class="footer">
        <span>${esc(mainStore.establishment.name)}</span>
        <span>¡Gracias por su pedido!</span>
      </div>
    </body></html>
  `;

  // Imprime dentro de un iframe oculto. window.open queda bloqueado en móvil y en
  // navegadores in-app (WhatsApp/Instagram), por eso antes "no pasaba nada".
  const prev = document.getElementById("mc-print-frame");
  if (prev) prev.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "mc-print-frame";
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
      mainStore.messageStore.error(
        "Este navegador no permite imprimir. Abre el menú en Safari o Chrome."
      );
    }
  };

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  iframe.onload = () => setTimeout(triggerPrint, 200);
  // Respaldo por si onload no dispara en algunos navegadores
  setTimeout(triggerPrint, 700);
};

// Copia texto con varios respaldos (Clipboard API o execCommand)
const copyText = async (text) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // sigue al respaldo
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    Object.assign(ta.style, { position: "fixed", top: "0", left: "0", opacity: "0" });
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
};

const shareReceipt = async () => {
  const f = (n) => Number(n || 0).toFixed(2);
  const items = mainStore.cart
    .map((p) => `${p.qty}x ${p.name} - $${f(p.totalPrice * p.qty)}`)
    .join("\n");

  const lines = [
    `Pedido #${mainStore.orderStore.orderCode}`,
    `${mainStore.establishment.name}`,
    ``,
    items,
    ``,
    `Subtotal: $${f(mainStore.total)}`,
  ];
  if (mainStore.deliveryCharge > 0) lines.push(`Envío: $${f(mainStore.deliveryCharge)}`);
  if (mainStore.getTip > 0) lines.push(`Propina: $${f(mainStore.getTip)}`);
  if (mainStore.coupon.applied) lines.push(`Cupón (${mainStore.coupon.code}): -$${f(mainStore.coupon.discount)}`);
  lines.push(`Total: $${f(mainStore.totalToPay)}`);
  const text = lines.join("\n");

  // Compartir nativo si existe (se llama de forma síncrona dentro del gesto)
  try {
    if (navigator.share) {
      await navigator.share({
        title: `Pedido #${mainStore.orderStore.orderCode}`,
        text,
      });
      return;
    }
  } catch (e) {
    if (e?.name === "AbortError") return; // el usuario canceló
    // cualquier otro error: cae al respaldo de copiar
  }

  const ok = await copyText(text);
  if (ok) mainStore.messageStore.success("Resumen copiado al portapapeles");
  else mainStore.messageStore.error("No se pudo compartir en este navegador");
};
</script>

<style lang="scss" scoped>
.success-dialog {
  border-radius: var(--radius-xl);
  padding: var(--space-xl) var(--space-lg);
  min-width: 320px;
  max-width: 420px;
  text-align: center;

  &__icon-wrapper {
    margin-bottom: var(--space-sm);
    display: flex;
    justify-content: center;
  }

  &__icon-circle {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-full);
    background: var(--q-positive);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    box-shadow: 0 2px 8px rgba(67, 160, 71, 0.3);

    &--whatsapp {
      width: 56px;
      height: 56px;
      background: #25D366;
      box-shadow: 0 4px 12px rgba(37, 211, 102, 0.35);
      animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
        whatsappPulse 2s ease-in-out 0.5s infinite;
    }

    &--done {
      width: 74px;
      height: 74px;
      box-shadow: 0 6px 18px rgba(67, 160, 71, 0.4);
    }
  }

  &__celebrate {
    position: relative;
    display: inline-flex;
  }

  &__confetti {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 9px;
    height: 9px;
    border-radius: 2px;
    opacity: 0;
    background: hsl(calc(var(--i) * 45deg), 85%, 58%);
    animation: mcConfetti 0.75s ease-out 0.25s forwards;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
      display: none;
    }
  }

  &__fallback {
    padding-top: var(--space-xs);
    text-align: center;
  }

  &__fallback-link {
    background: none;
    border: none;
    color: var(--color-text-tertiary);
    font-size: var(--text-xs);
    text-decoration: underline;
    cursor: pointer;
    padding: var(--space-xs);

    &:hover {
      color: var(--color-text-secondary);
    }
  }

  &__content {
    padding: 0 0 var(--space-lg) 0;
  }

  &__title {
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 var(--space-sm) 0;
  }

  &__message {
    font-size: var(--text-base);
    color: var(--color-text-secondary);
    margin: 0;
    line-height: 1.5;
  }

  &__order-section {
    border-radius: var(--radius-md);
    margin: 0 var(--space-lg) var(--space-md) var(--space-lg);
    padding: var(--space-sm) var(--space-md);
    color: white;
    background: var(--q-primary);
    box-shadow: 0 2px 8px rgba(229, 57, 53, 0.2);
  }

  &__label {
    font-size: var(--text-xs);
    opacity: 0.85;
    margin: 0 0 2px 0;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 500;
  }

  &__code {
    font-size: var(--text-xl);
    font-weight: 800;
    letter-spacing: 0.1em;
    font-variant-numeric: tabular-nums;
  }

  &__receipt {
    text-align: left;
    padding: 0 var(--space-sm);
    margin-bottom: var(--space-md);
  }

  &__actions {
    padding: 0 var(--space-lg);

    .q-btn {
      border-radius: var(--radius-md);
      font-weight: 600;
      letter-spacing: 0.02em;
    }
  }

  &__whatsapp-btn {
    background: #25D366 !important;
    box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
    animation: whatsappPulse 2s ease-in-out infinite;

    &:hover {
      background: #1EBE5A !important;
      animation: none;
    }
  }
}

.receipt {
  &__header {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-secondary);
    margin-bottom: var(--space-sm);
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__item-main {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--text-sm);
    padding: 2px 0;
  }

  &__item-qty {
    font-weight: 700;
    color: var(--q-primary);
    min-width: 24px;
  }

  &__item-name {
    flex: 1;
    color: var(--color-text-primary);
  }

  &__item-price {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--color-text-primary);
  }

  &__option {
    display: block;
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
    line-height: 1.6;
  }

  &__totals {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__total-row {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-sm);
    color: var(--color-text-secondary);

    &--discount {
      color: var(--q-positive);
      font-weight: 600;
    }

    &--final {
      font-weight: 700;
      font-size: var(--text-base);
      color: var(--color-text-primary);
      margin-top: var(--space-xs);
      padding-top: var(--space-xs);
      border-top: 1px dashed var(--color-border);
    }
  }
}

@keyframes whatsappPulse {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 6px 24px rgba(37, 211, 102, 0.5);
    transform: scale(1.02);
  }
}

@keyframes scaleIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  60% {
    opacity: 1;
    transform: scale(1.08);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

// Estalla cada confeti radialmente desde el centro del check
@keyframes mcConfetti {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(calc(var(--i) * 45deg)) translateY(0)
      scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(calc(var(--i) * 45deg))
      translateY(-64px) scale(0.4);
  }
}
</style>
