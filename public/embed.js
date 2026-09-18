/* ComeleYa embed.js — barra del carrito FUERA del iframe + auto-alto.
   El menú (iframe con ?isExternal=true) publica mensajes por postMessage:
     - { type:"comeleya:cart", count, total, hasItems, color, cartImage, label, ctaUrl }
     - { type:"comeleya:height", height }
   Este script, incluido en la pagina contenedora, dibuja una barra sticky pegada
   al viewport real del visitante y, al tocarla, le pide al iframe abrir el carrito.
   Sin dependencias. */
(function () {
  "use strict";

  var bar, elImg, elIcon, elCount, elTotal, elRight, srcWin;

  function fmt(n) {
    n = Number(n) || 0;
    return "$" + (Number.isInteger(n) ? n : n.toFixed(2));
  }

  function comeleyaIframes() {
    return document.querySelectorAll("iframe[data-comeleya], iframe[src*='comeleya']");
  }

  /* De quien aceptamos mensajes.
     Este script vive en el sitio del negocio, donde cualquier ventana o iframe puede
     mandar un "comeleya:cart" y controlar el href del boton "Ver pedido". No se
     compara contra un dominio fijo -el negocio incrusta el iframe con el dominio que
     quiera- sino contra los iframes que este script ya reconoce como suyos. */
  function esNuestro(source) {
    if (!source) return false;
    var fs = comeleyaIframes();
    for (var i = 0; i < fs.length; i++) {
      if (fs[i].contentWindow === source) return true;
    }
    return false;
  }

  function setColor(c) {
    if (bar) bar.style.background = c || "#1976D2";
  }

  function build(color) {
    bar = document.createElement("div");
    bar.style.cssText = [
      "position:fixed", "left:0", "right:0", "bottom:0",
      "z-index:2147483000", "display:none", "box-sizing:border-box",
      "align-items:center", "justify-content:space-between", "gap:12px",
      "max-width:680px", "margin:0 auto",
      "padding:14px 20px",
      "padding-bottom:calc(14px + env(safe-area-inset-bottom,0px))",
      "font-family:'Helvetica Neue',Arial,sans-serif", "color:#fff",
      "cursor:pointer", "border-radius:16px 16px 0 0",
      "box-shadow:0 -6px 24px rgba(0,0,0,.22)", "user-select:none"
    ].join(";");

    var left = document.createElement("div");
    left.style.cssText = "display:flex;align-items:center;gap:10px;";

    elImg = document.createElement("img");
    elImg.alt = "";
    elImg.style.cssText =
      "width:32px;height:32px;border-radius:50%;object-fit:contain;background:#fff;padding:4px;box-sizing:border-box;display:none;";

    elIcon = document.createElement("span");
    elIcon.textContent = "🛒"; // 🛒
    elIcon.style.cssText = "font-size:22px;line-height:1;";

    elCount = document.createElement("span");
    elCount.style.cssText =
      "background:#fff;color:#111;border-radius:999px;min-width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;padding:0 6px;";

    left.appendChild(elImg);
    left.appendChild(elIcon);
    left.appendChild(elCount);

    elTotal = document.createElement("span");
    elTotal.style.cssText = "font-weight:700;font-size:18px;white-space:nowrap;";

    // <a> y no <span>: con enlace configurado por el negocio, este lado deja de decir
    // "Ver pedido" y se vuelve la salida a su sitio. color/text-decoration heredados
    // para que no se pinte azul y subrayado sobre la barra.
    elRight = document.createElement("a");
    elRight.textContent = "Ver pedido →";
    elRight.target = "_top";
    elRight.rel = "noopener noreferrer";
    elRight.style.cssText =
      "font-weight:600;white-space:nowrap;color:inherit;text-decoration:none;";

    bar.appendChild(left);
    bar.appendChild(elTotal);
    bar.appendChild(elRight);

    // Con href, este lado navega y NADA más: sin detenerlo, el click seguiría hasta la
    // barra y abriría además el carrito dentro del iframe. Sin href se deja subir, que
    // es el comportamiento de siempre.
    elRight.addEventListener("click", function (e) {
      if (elRight.getAttribute("href")) e.stopPropagation();
    });

    bar.addEventListener("click", function () {
      if (srcWin) srcWin.postMessage({ type: "comeleya:openCart" }, "*");
    });

    (document.body || document.documentElement).appendChild(bar);
    setColor(color);
  }

  function updateCart(d) {
    if (!bar) build(d.color);
    setColor(d.color);
    if (!d.hasItems) {
      bar.style.display = "none";
      return;
    }
    if (d.cartImage) {
      elImg.src = d.cartImage;
      elImg.style.display = "block";
      elIcon.style.display = "none";
    } else {
      elImg.style.display = "none";
      elIcon.style.display = "inline-block";
    }
    elCount.textContent = d.count;
    elTotal.textContent = fmt(d.total);
    if (d.label) elRight.textContent = d.label + " →";
    // El listener ya descarta los mensajes que no vienen del menú incrustado. Esto se
    // queda como segunda red: un href es lo primero de este mensaje que sería
    // ejecutable, y no cuesta nada revalidarlo aquí.
    if (d.ctaUrl && /^https?:\/\//i.test(d.ctaUrl)) {
      elRight.setAttribute("href", d.ctaUrl);
    } else {
      elRight.removeAttribute("href");
    }
    bar.style.display = "flex";
  }

  function resize(source, h) {
    if (!h) return;
    var fs = comeleyaIframes();
    for (var i = 0; i < fs.length; i++) {
      if (fs[i].contentWindow === source) {
        fs[i].style.height = h + "px";
        break;
      }
    }
  }

  /* Pasa al iframe el platillo y la categoria que traiga la pagina de arriba.

     El enlace del catalogo de Meta puede apuntar al sitio del negocio en vez de a
     comeleya.com, pero el ?dish= lo lee el menu, que aqui vive DENTRO del iframe: si
     nadie se lo pasa, quien toco un platillo en un anuncio cae en el menu completo y
     tiene que buscar otra vez lo que ya habia visto.

     Solo dish y cat. Este script corre en el sitio del negocio y no tiene por que
     reenviar cualquier cosa que traiga la direccion; el fbclid y los utm de un anuncio
     no le sirven de nada al menu. Y no se pisa lo que el negocio ya haya puesto en su
     iframe: si el fijo una categoria en su codigo de insercion, esa manda. */
  function pasarParametros() {
    var dePagina = new URLSearchParams(window.location.search);
    var iframes = comeleyaIframes();

    for (var i = 0; i < iframes.length; i++) {
      var src = iframes[i].getAttribute("src");
      if (!src) continue;

      var partes = src.split("?");
      var query = new URLSearchParams(partes[1] || "");
      var cambio = false;

      ["dish", "cat"].forEach(function (llave) {
        if (dePagina.has(llave) && !query.has(llave)) {
          query.set(llave, dePagina.get(llave));
          cambio = true;
        }
      });

      // Solo si hubo cambio: reasignar el src recarga el iframe, y hacerlo sin
      // necesidad haria parpadear el menu del negocio cada vez que alguien entra.
      if (cambio) iframes[i].setAttribute("src", partes[0] + "?" + query.toString());
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", pasarParametros);
  } else {
    pasarParametros();
  }

  // Le avisa al iframe (una vez) que este script está activo, para que oculte su
  // barra interna y deje que esta la reemplace por fuera.
  var notified = [];
  function notify(win) {
    if (!win || notified.indexOf(win) !== -1) return;
    notified.push(win);
    win.postMessage({ type: "comeleya:embed" }, "*");
  }

  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || typeof d !== "object") return;
    if (!esNuestro(e.source)) return;
    if (d.type === "comeleya:height") {
      resize(e.source, d.height);
      notify(e.source);
    } else if (d.type === "comeleya:cart") {
      srcWin = e.source;
      updateCart(d);
      notify(e.source);
    } else if (d.type === "comeleya:abrir") {
      /* Abrir un enlace por cuenta del menu.
         Dentro de un iframe con sandbox, el menu no puede abrir una pestaña nueva:
         window.open le devuelve null y el boton se queda mudo. Esta pagina no esta
         dentro del sandbox, asi que lo abre ella y contesta para que el menu sepa que
         si se pudo. Lista corta a proposito -mapas de Google y compartir por WhatsApp-:
         este script vive en el sitio del negocio y no tiene por que abrir cualquier
         cosa que le pidan. */
      var u = typeof d.url === "string" ? d.url : "";
      var permitidos = [
        "https://www.google.com/maps",
        "https://maps.google.com/",
        "https://wa.me/",
        "https://api.whatsapp.com/"
      ];
      var permitido = false;
      for (var p = 0; p < permitidos.length; p++) {
        if (u.indexOf(permitidos[p]) === 0) { permitido = true; break; }
      }
      if (permitido) {
        var w = window.open(u, "_blank", "noopener");
        if (w && e.source) e.source.postMessage({ type: "comeleya:abierto" }, "*");
      }
    }
  });
})();
