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
    // El menú ya validó esta URL, pero el listener de abajo no verifica origen: en la
    // página del cliente cualquier ventana puede mandar un "comeleya:cart". Un href es
    // lo primero de este mensaje que sería ejecutable, así que se revalida aquí.
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
    if (d.type === "comeleya:height") {
      resize(e.source, d.height);
      notify(e.source);
    } else if (d.type === "comeleya:cart") {
      srcWin = e.source;
      updateCart(d);
      notify(e.source);
    }
  });
})();
