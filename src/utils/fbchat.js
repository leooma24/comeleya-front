// Chat de Messenger (Facebook Chat Plugin) por establecimiento. Se activa solo si el
// restaurante configuró su page_id (premium). NO carga su propio SDK: reutiliza el
// único SDK de Facebook que ya carga index.html (xfbml.customerchat.js), para no tener
// dos SDK compitiendo en la misma página. Todo va en try/catch: si algo falla o el
// cliente bloquea Meta, el menú sigue funcionando normal.
let currentPage = null;

export function initMessenger(pageId) {
  if (typeof window === "undefined" || !pageId) return;
  // Evita renderizar el widget dos veces (p. ej. al re-montar el menú).
  if (currentPage === pageId) return;
  currentPage = pageId;

  try {
    // Contenedores requeridos por el plugin.
    if (!document.getElementById("fb-root")) {
      const root = document.createElement("div");
      root.id = "fb-root";
      document.body.appendChild(root);
    }
    let chatbox = document.getElementById("fb-customer-chat");
    if (!chatbox) {
      chatbox = document.createElement("div");
      chatbox.id = "fb-customer-chat";
      chatbox.className = "fb-customerchat";
      document.body.appendChild(chatbox);
    }
    chatbox.setAttribute("page_id", pageId);
    chatbox.setAttribute("attribution", "biz_inbox");

    const render = () => {
      try {
        window.FB.init({ xfbml: true, version: "v21.0" });
        if (window.FB.XFBML) window.FB.XFBML.parse();
      } catch {
        // sin SDK utilizable: no pasa nada
      }
    };

    if (window.FB) {
      // El SDK ya cargó: renderizamos directo.
      render();
    } else {
      // Aún no carga: encadenamos su callback sin pisar otro fbAsyncInit existente.
      const prev = window.fbAsyncInit;
      window.fbAsyncInit = function () {
        if (typeof prev === "function") {
          try {
            prev();
          } catch {
            // noop
          }
        }
        render();
      };
    }
  } catch {
    // sin chat: el menú sigue igual
  }
}
