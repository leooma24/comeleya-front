<template>
  <div class="mc-guia-meta">
<div class="mc-guide__note">
      <q-icon name="info" size="20px" color="primary" />
      <div>
        <strong>El Píxel y el Messenger son función premium.</strong>
        Los campos de configuración aparecen en tu panel en
        <em>Crecimiento → Meta</em> si tu plan los incluye. El <strong>catálogo es gratis</strong>
        para todos.
      </div>
    </div>

    <!-- Píxel -->
    <section class="mc-guide__card">
      <div class="mc-guide__cardhead">
        <span class="mc-badge">Premium</span>
        <h2>1. Píxel de Meta</h2>
      </div>
      <p class="mc-guide__desc">Mide las visitas a tu menú y tus pedidos para potenciar tus anuncios.</p>
      <p class="mc-guide__step-label">Cómo obtener tu Pixel ID</p>
      <ol class="mc-guide__steps">
        <li>Entra a <a href="https://business.facebook.com/events_manager2" target="_blank" rel="noopener">Meta Events Manager</a>.</li>
        <li>Si no tienes uno, créalo con <strong>Conectar orígenes de datos → Web</strong>.</li>
        <li>Selecciona el píxel: el <strong>número</strong> bajo el nombre es tu Pixel ID (solo dígitos).</li>
      </ol>
      <div class="mc-guide__paste">
        <strong>En tu panel:</strong> Meta → sección <em>Configuración</em> → campo <strong>Pixel ID</strong> → activa el toggle y <strong>Guarda</strong>.
      </div>
    </section>

    <!-- Catálogo -->
    <section class="mc-guide__card">
      <div class="mc-guide__cardhead">
        <span class="mc-badge mc-badge--free">Gratis</span>
        <h2>2. Catálogo (tu menú en Meta)</h2>
      </div>
      <p class="mc-guide__desc">Publica tu menú como catálogo. Lo cargas una sola vez y de ahí sale para Facebook, Instagram y WhatsApp; Meta lo vuelve a leer solo y mantiene tus precios al día.</p>
      <p class="mc-guide__step-label">Conectar el feed en el administrador de ventas</p>
      <ol class="mc-guide__steps">
        <li>En tu panel, en el tab Meta, copia la <strong>URL del catálogo</strong>.</li>
        <li>
          Entra al <a href="https://business.facebook.com/commerce" target="_blank" rel="noopener">administrador de ventas de Meta</a>
          —antes se llamaba Commerce Manager— y elige o crea un catálogo.
        </li>
        <li>Abre tu catálogo y ve a <strong>Orígenes de datos</strong> → botón <strong>Agregar artículos</strong>. Si te pregunta cuántos, elige <em>Agregar varios artículos</em>.</li>
        <li>Elige <strong>Lista de datos</strong> → <strong>Siguiente</strong>, y ahí escoge <strong>Lista programada</strong>.</li>
        <li>En el campo <strong>Ingresar URL</strong>, pega la URL que copiaste del panel.</li>
        <li>En <strong>Programar actualizaciones</strong> elige frecuencia <strong>diaria</strong> y deja prendido <strong>Agregar actualizaciones automáticas</strong>. Así tus precios se actualizan solos.</li>
        <li>Ponle un nombre al origen de datos, elige la divisa <strong>MXN</strong> y dale <strong>Subir</strong>.</li>
        <li>Ya cargado, conecta el catálogo con tu página de Facebook desde la configuración del propio catálogo.</li>
      </ol>
      <div class="mc-guide__tip">
        Meta le mueve a estos menús seguido y no todas las cuentas ven lo mismo. Si algún nombre no te
        coincide, <a href="https://es-la.facebook.com/business/help/125074381480892" target="_blank" rel="noopener">la ayuda oficial de Meta sobre listas de datos</a>
        siempre trae la versión del momento.
      </div>
    </section>

    <!-- Messenger -->
    <section class="mc-guide__card">
      <div class="mc-guide__cardhead">
        <span class="mc-badge">Premium</span>
        <h2>3. Chat de Messenger</h2>
      </div>
      <p class="mc-guide__desc">Agrega un botón de chat flotante en tu menú, conectado a tu página de Facebook.</p>
      <p class="mc-guide__step-label">Obtener el Page ID y autorizar el dominio</p>
      <ol class="mc-guide__steps">
        <li>
          En Facebook: tu <strong>foto de perfil</strong> (arriba a la derecha) → <em>Ver todos los perfiles</em> → elige tu página →
          clic en el <strong>nombre de tu página</strong> debajo de la foto de portada → <strong>Transparencia y política de privacidad</strong>.
          Ahí aparece el identificador de tu página.
          <div class="mc-guide__tip">
            <strong>¿No lo encuentras?</strong> Facebook cambia estos menús seguido y no todas las cuentas ven lo mismo.
            Dos atajos que no dependen de eso:
            <ul>
              <li>Si la dirección de tu página es <em>facebook.com/profile.php?id=<strong>123456789</strong></em>, ese número ya es tu Page ID.</li>
              <li>O búscalo en <a href="https://www.facebook.com/help/1503421039731588" target="_blank" rel="noopener">la ayuda oficial de Facebook</a>, que siempre trae la ruta del momento.</li>
            </ul>
          </div>
        </li>
        <li>
          Autoriza el dominio, o el chat no aparece nunca: en la configuración de mensajes de tu página busca el
          <strong>plugin de chat</strong> y agrega <strong>comeleya.com</strong> a los dominios permitidos.
          <div class="mc-guide__tip">
            Este es el paso que Meta ha movido de lugar varias veces, y cambia según cómo tengas configurada tu
            página. La ruta exacta y actualizada viene en
            <a href="https://es-la.facebook.com/business/help/1524587524402327" target="_blank" rel="noopener">la ayuda oficial de Meta sobre el plugin de chat</a>.
          </div>
        </li>
      </ol>
      <div class="mc-guide__paste">
        <strong>En tu panel:</strong> Meta → campo <strong>Page ID</strong> → <strong>Guarda</strong>. El chat aparece en tu menú público.
      </div>
    </section>

    <!-- Instagram -->
    <section class="mc-guide__card">
      <div class="mc-guide__cardhead">
        <span class="mc-badge mc-badge--free">Gratis</span>
        <h2>4. Instagram</h2>
      </div>
      <p class="mc-guide__desc">
        Es el <strong>mismo catálogo</strong> del paso 2: no se sube otra vez, solo se conecta.
      </p>

      <p class="mc-guide__step-label">Son dos cosas distintas, y conviene no confundirlas</p>
      <ul class="mc-guide__steps">
        <li>
          <strong>Anuncios con tus platillos.</strong> Ya te funciona: los anuncios de catálogo se
          muestran en Facebook <em>y</em> en Instagram con el mismo catálogo y el mismo píxel. No hay
          nada extra que pedir ni que aprobar.
        </li>
        <li>
          <strong>Tienda en Instagram</strong>, para etiquetar platillos en tus publicaciones. Esta sí
          pasa por una <strong>revisión de Meta</strong> que tarda de 1 a 5 días hábiles, y no todas las
          cuentas la pasan.
        </li>
      </ul>

      <p class="mc-guide__step-label">Conectar tu cuenta</p>
      <ol class="mc-guide__steps">
        <li>Tu Instagram tiene que ser <strong>cuenta profesional</strong>: en Instagram, <em>Configuración → Cuenta → Cambiar a cuenta profesional</em>.</li>
        <li>Vincúlala con la <strong>página de Facebook</strong> del negocio. Sin esa liga, lo demás no aparece.</li>
        <li>En el <a href="https://business.facebook.com/commerce" target="_blank" rel="noopener">administrador de ventas</a>, conecta el catálogo con tu cuenta de Instagram.</li>
        <li>Si quieres la tienda, manda la cuenta a revisión desde ahí mismo.</li>
      </ol>

      <div class="mc-guide__tip">
        Antes de mandarla a revisión, revisa que tu perfil tenga la dirección de tu menú, la categoría del
        negocio y datos de contacto: los perfiles a medias son los que más rechazan. Los requisitos
        completos están en
        <a href="https://es-la.facebook.com/help/instagram/1627591223954487" target="_blank" rel="noopener">los requisitos comerciales de Instagram</a>.
      </div>
    </section>

    <!-- WhatsApp -->
    <section class="mc-guide__card">
      <div class="mc-guide__cardhead">
        <span class="mc-badge mc-badge--free">Gratis</span>
        <h2>5. WhatsApp</h2>
      </div>
      <p class="mc-guide__desc">
        Tus platillos aparecen en el perfil de tu WhatsApp Business, para que el cliente los vea sin
        salirse del chat. Otra vez es el mismo catálogo del paso 2.
      </p>
      <p class="mc-guide__step-label">Conectar el catálogo a tu número</p>
      <ol class="mc-guide__steps">
        <li>Necesitas la app <strong>WhatsApp Business</strong> con el número del negocio. La app normal de WhatsApp no sirve para esto.</li>
        <li>
          Revisa que tengas los permisos <strong>Administrar página</strong> en tu página de Facebook y
          <strong>Administrar catálogo</strong> en el catálogo. Sin esos dos, el botón de conectar no te deja.
        </li>
        <li>En el <a href="https://business.facebook.com/commerce" target="_blank" rel="noopener">administrador de ventas</a>, conecta el catálogo con tu cuenta de WhatsApp Business.</li>
      </ol>

      <div class="mc-guide__tip">
        <strong>Si ya tenías productos cargados a mano</strong> en tu WhatsApp Business, fíjate cómo queda
        el catálogo después de conectar, para no acabar con la lista duplicada o cambiada sin querer.
        Los pasos exactos y al día están en
        <a href="https://es-la.facebook.com/business/help/158662536425974" target="_blank" rel="noopener">la ayuda oficial de Meta</a>.
      </div>
    </section>

    <!-- Checklist -->
    <section class="mc-guide__checklist">
      <h2>Checklist</h2>
      <ul>
        <li><q-icon name="check_circle" color="positive" size="20px" /> Plan con la función de Meta activa (si usarás Píxel o Messenger).</li>
        <li><q-icon name="check_circle" color="positive" size="20px" /> Pixel ID capturado y guardado, con el toggle activado.</li>
        <li><q-icon name="check_circle" color="positive" size="20px" /> Feed del catálogo conectado como lista programada en el administrador de ventas.</li>
        <li><q-icon name="check_circle" color="positive" size="20px" /> Page ID capturado y dominio comeleya.com autorizado en el plugin de chat.</li>
        <li><q-icon name="check_circle" color="positive" size="20px" /> Cuenta de Instagram profesional, ligada a tu página y conectada al catálogo.</li>
        <li><q-icon name="check_circle" color="positive" size="20px" /> Catálogo conectado a tu número de WhatsApp Business.</li>
      </ul>
    </section>
  </div>
</template>

<script setup>
/**
 * Los pasos para conectar el restaurante con Meta: Pixel, catalogo, Messenger,
 * Instagram y WhatsApp.
 *
 * Vive aparte porque lo pintan DOS lugares: la pagina publica /guia-facebook, que
 * es la que se comparte por WhatsApp, y el tab "Guia" dentro de Crecimiento - Meta,
 * para que el negocio no tenga que salirse del panel.
 *
 * Y sobre todo, porque ya nos costo: estas mismas instrucciones estaban escritas
 * dos veces -aqui y en el panel-, un cliente reporto que no las podia seguir, y se
 * corrigio solo una de las dos copias. El que leia el panel siguio atorado.
 */
defineOptions({ name: "GuiaMeta" });
</script>

<style lang="scss" scoped>
.mc-guia-meta {
  color: var(--color-text-primary, #1b1b1f);
  line-height: 1.65;
}

.mc-guide-page {
  background: var(--color-surface-variant, #f4f1ec);
  padding: 28px 0 64px;
}
.mc-guide, .mc-guia-meta {
  max-width: 780px;
  color: var(--color-text-primary, #1b1b1f);
  line-height: 1.65;

  &__head {
    display: flex; gap: 14px; align-items: flex-start; margin-bottom: 20px;
  }
  &__title { font-size: 1.7rem; letter-spacing: -0.02em; margin: 0 0 4px; }
  &__sub { color: var(--color-text-secondary, #6b7280); margin: 0; }

  &__note {
    display: flex; gap: 10px; align-items: flex-start;
    background: color-mix(in srgb, var(--q-primary) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--q-primary) 22%, var(--color-border));
    border-radius: 12px; padding: 14px 16px; margin-bottom: 24px; font-size: 0.92rem;
    strong { color: var(--color-text-primary); }
  }

  &__card {
    background: var(--color-surface, #fff);
    border: 1px solid var(--color-border, #e7e2da);
    border-radius: 14px; padding: 20px 22px; margin-bottom: 18px;
  }
  &__cardhead {
    display: flex; align-items: center; gap: 10px; margin-bottom: 6px; flex-wrap: wrap;
    h2 { font-size: 1.2rem; margin: 0; letter-spacing: -0.01em; }
  }
  &__desc { color: var(--color-text-secondary, #6b7280); margin: 4px 0 14px; }
  &__step-label {
    font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em;
    color: var(--color-text-secondary, #6b7280); font-weight: 700; margin: 12px 0 8px;
  }
  &__steps {
    margin: 0; padding-left: 22px;
    li { margin-bottom: 6px; }
  }
  &__paste {
    margin-top: 14px; padding: 12px 14px; border-radius: 10px;
    background: var(--color-surface-variant, #f4f1ec);
    border: 1px dashed color-mix(in srgb, var(--q-primary) 40%, var(--color-border));
    font-size: 0.9rem;
    strong { color: var(--q-primary); }
  }

  // La salida cuando la ruta de Facebook no coincide con lo que el negocio ve en
  // pantalla. Va mas apagada que __paste: es el plan B, no el paso.
  &__tip {
    margin-top: 10px; padding: 10px 12px; border-radius: 10px;
    background: var(--color-surface-variant, #f4f1ec);
    border-left: 3px solid var(--color-text-tertiary, #9aa0a6);
    font-size: 0.85rem;
    color: var(--color-text-secondary, #5f6368);

    ul { margin: 6px 0 0; padding-left: 18px; }
    li { margin-bottom: 4px; }
  }

  &__checklist {
    background: var(--color-surface, #fff);
    border: 1px solid var(--color-border, #e7e2da);
    border-radius: 14px; padding: 20px 22px; margin-bottom: 18px;
    h2 { font-size: 1.15rem; margin: 0 0 12px; }
    ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
    li { display: flex; gap: 10px; align-items: flex-start; font-size: 0.94rem; }
  }

  .mc-badge {
    font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--q-primary); background: color-mix(in srgb, var(--q-primary) 12%, transparent);
    padding: 3px 8px; border-radius: 6px;
    &--free { color: #1f9d63; background: color-mix(in srgb, #1f9d63 12%, transparent); }
  }

  a { color: var(--q-primary); text-decoration: none; &:hover { text-decoration: underline; } }

  &__back { margin-top: 20px; }
}
</style>
