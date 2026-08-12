/* ComeleYa widget.js — carrusel de platillos para el sitio del propio negocio.

   El dueno pega esto donde quiera que salga:

     <div data-comeleya-showcase data-slug="tacos-jaime" data-tipo="destacados"></div>
     <script src="https://comeleya.com/widget.js" defer></script>

   data-tipo: destacados | populares | ofertas | categoria
   data-cat:  id o nombre de la categoria (solo con tipo="categoria")
   data-limit, data-titulo, data-api: opcionales.

   Cada tarjeta lleva a comeleya.com/{slug}?dish=<id>, que abre el platillo listo
   para pedir. Sin dependencias y sin build, igual que embed.js.

   TODO se dibuja dentro de un shadow root. No es adorno: esto aterriza en el
   WordPress del cliente, con su CSS encima. Sin la barrera, su hoja de estilos nos
   deforma las tarjetas y la nuestra le descuadra la pagina. */
(function () {
  "use strict";

  var API_POR_DEFECTO = "https://app.comeleya.com/api";
  var TITULOS = {
    destacados: "Nuestros favoritos",
    populares: "Los más pedidos",
    ofertas: "Promociones",
    categoria: "Nuestro menú",
  };

  function dinero(n) {
    n = Number(n) || 0;
    return "$" + (Number.isInteger(n) ? n : n.toFixed(2));
  }

  function zonaHoraria() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch (e) {
      return "UTC";
    }
  }

  /* El shadow root nos aisla del CSS del sitio, y eso corta en los dos sentidos: el
     dueno tampoco puede alcanzarnos con su hoja de estilos. Para que SI pueda, todo
     lo que vale la pena tocar sale por dos puertas que si atraviesan la barrera:

       1. Variables CSS (--cy-*), que se heredan hacia adentro del shadow root:

            [data-comeleya-showcase] {
              --cy-color: #c8102e;
              --cy-radius: 4px;
              --cy-card-width: 300px;
            }

       2. ::part(), para lo que una variable no alcanza:

            [data-comeleya-showcase]::part(btn) { text-transform: uppercase; }

     La diferencia con quitar el aislamiento es que aqui el dueno cambia lo que
     QUISO cambiar; sin barrera, su `div { border: 3px solid }` nos desarma el
     carrusel sin que nadie lo haya pedido.

     La tipografia se hereda por default (--cy-font: inherit) para que el carrusel
     se vea parte de su pagina y no un recuadro pegado. */
  function estilos(color) {
    return [
      // `all:initial` no toca las variables --cy-*, asi que siguen entrando.
      ":host{all:initial;display:block;",
      "--cy-color:" + color + ";",
      "--cy-btn-text:#fff;",
      "--cy-card-bg:#fff;",
      "--cy-text:#1f2328;",
      "--cy-muted:#5f6368;",
      "--cy-oferta:#d93025;",
      "--cy-radius:14px;",
      "--cy-btn-radius:10px;",
      "--cy-shadow:0 2px 12px rgba(0,0,0,.10);",
      "--cy-card-width:260px;",
      "--cy-gap:16px;",
      "--cy-font:inherit;",
      "--cy-title-size:22px;",
      "--cy-title-align:center}",
      "*{box-sizing:border-box;margin:0;padding:0}",
      ".mc{font-family:var(--cy-font);color:var(--cy-text)}",
      ".mc__titulo{font-size:var(--cy-title-size);font-weight:800;",
      "text-align:var(--cy-title-align);margin-bottom:18px;color:inherit}",
      ".mc__viewport{position:relative}",
      // scroll-snap y no una libreria de carrusel: el deslizamiento con el dedo lo
      // resuelve el navegador, y es lo que mejor se porta en un sitio ajeno.
      ".mc__pista{display:flex;gap:var(--cy-gap);overflow-x:auto;scroll-snap-type:x mandatory;",
      "scrollbar-width:none;-webkit-overflow-scrolling:touch;padding:4px}",
      ".mc__pista::-webkit-scrollbar{display:none}",
      ".mc__card{flex:0 0 var(--cy-card-width);scroll-snap-align:start;",
      "background:var(--cy-card-bg);border-radius:var(--cy-radius);",
      "overflow:hidden;box-shadow:var(--cy-shadow);display:flex;flex-direction:column;",
      "text-decoration:none;color:inherit}",
      ".mc__foto{width:100%;aspect-ratio:4/3;object-fit:cover;display:block;background:#eef0f2}",
      ".mc__sinfoto{width:100%;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;",
      "background:#eef0f2;color:#9aa0a6;font-size:13px}",
      ".mc__cuerpo{padding:14px;display:flex;flex-direction:column;gap:6px;flex:1}",
      ".mc__nombre{font-size:15px;font-weight:700;line-height:1.3}",
      ".mc__desc{font-size:13px;line-height:1.45;color:var(--cy-muted);display:-webkit-box;",
      "-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
      ".mc__precio{font-size:17px;font-weight:800;margin-top:auto;font-variant-numeric:tabular-nums}",
      ".mc__antes{text-decoration:line-through;opacity:.5;font-size:14px;font-weight:600;margin-right:6px}",
      ".mc__oferta{color:var(--cy-oferta)}",
      ".mc__btn{display:block;text-align:center;padding:10px 14px;",
      "border-radius:var(--cy-btn-radius);background:var(--cy-color);",
      "color:var(--cy-btn-text);font-weight:700;font-size:14px;margin-top:4px}",
      ".mc__flecha{position:absolute;top:50%;transform:translateY(-50%);width:38px;height:38px;",
      "border-radius:50%;border:0;background:var(--cy-card-bg);box-shadow:0 2px 10px rgba(0,0,0,.18);",
      "cursor:pointer;font-size:18px;line-height:1;color:var(--cy-text);display:none}",
      ".mc__flecha[disabled]{opacity:.35;cursor:default}",
      ".mc__flecha--prev{left:-6px}",
      ".mc__flecha--next{right:-6px}",
      "@media(hover:hover) and (min-width:700px){.mc__flecha{display:block}}",
      ".mc__puntos{display:flex;gap:7px;justify-content:center;margin-top:14px}",
      ".mc__punto{width:9px;height:9px;border-radius:50%;border:1.5px solid var(--cy-color);",
      "background:transparent;padding:0;cursor:pointer}",
      ".mc__punto[aria-current='true']{background:var(--cy-color)}",
      "@media(prefers-reduced-motion:reduce){.mc__pista{scroll-behavior:auto}}",
    ].join("");
  }

  /** Marca un elemento para que el sitio pueda alcanzarlo con ::part(). */
  function parte(el, nombre) {
    el.setAttribute("part", nombre);
    return el;
  }

  function tarjeta(doc, item) {
    var a = parte(doc.createElement("a"), "card");
    a.className = "mc__card";
    a.href = item.url;
    // _top y no _blank: si el negocio metio esto dentro de un iframe, el menu tiene
    // que abrirse en la ventana completa y no dentro del marco.
    a.target = "_top";
    a.rel = "noopener";

    if (item.photo) {
      var img = parte(doc.createElement("img"), "foto");
      img.className = "mc__foto";
      img.src = item.photo;
      img.alt = item.name || "";
      img.loading = "lazy";
      a.appendChild(img);
    } else {
      var hueco = doc.createElement("div");
      hueco.className = "mc__sinfoto";
      hueco.textContent = "Sin foto";
      a.appendChild(hueco);
    }

    var cuerpo = doc.createElement("div");
    cuerpo.className = "mc__cuerpo";

    var nombre = parte(doc.createElement("div"), "nombre");
    nombre.className = "mc__nombre";
    nombre.textContent = item.name || "";
    cuerpo.appendChild(nombre);

    if (item.description) {
      var desc = parte(doc.createElement("p"), "desc");
      desc.className = "mc__desc";
      desc.textContent = item.description;
      cuerpo.appendChild(desc);
    }

    var precio = parte(doc.createElement("div"), "precio");
    precio.className = "mc__precio";
    // El servidor manda special_price en null cuando no hay oferta vigente, asi que
    // aqui no se vuelve a decidir que es una oferta: solo se dibuja.
    if (item.special_price != null) {
      var antes = doc.createElement("span");
      antes.className = "mc__antes";
      antes.textContent = dinero(item.price);
      precio.appendChild(antes);
      var ahora = doc.createElement("span");
      ahora.className = "mc__oferta";
      ahora.textContent = dinero(item.special_price);
      precio.appendChild(ahora);
    } else {
      precio.textContent = dinero(item.price);
    }
    cuerpo.appendChild(precio);

    var btn = parte(doc.createElement("span"), "btn");
    btn.className = "mc__btn";
    btn.textContent = "Pedir ahora";
    cuerpo.appendChild(btn);

    a.appendChild(cuerpo);
    return a;
  }

  function dibujar(host, datos, opciones) {
    var items = (datos && datos.items) || [];
    // Sin platillos no se dibuja NADA. Un carrusel vacio en la portada de un cliente
    // se ve peor que un hueco.
    if (!items.length) return;

    var doc = host.ownerDocument;
    var color = (datos.establishment && datos.establishment.color) || "#1976D2";
    var raiz = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;

    var style = doc.createElement("style");
    style.textContent = estilos(color);
    raiz.appendChild(style);

    var caja = doc.createElement("div");
    caja.className = "mc";

    var titulo = opciones.titulo || TITULOS[datos.tipo] || TITULOS.destacados;
    if (titulo !== "-") {
      var h = parte(doc.createElement("div"), "titulo");
      h.className = "mc__titulo";
      h.textContent = titulo;
      caja.appendChild(h);
    }

    var viewport = doc.createElement("div");
    viewport.className = "mc__viewport";

    var pista = parte(doc.createElement("div"), "pista");
    pista.className = "mc__pista";
    items.forEach(function (item) {
      pista.appendChild(tarjeta(doc, item));
    });
    viewport.appendChild(pista);

    var prev = parte(doc.createElement("button"), "flecha");
    prev.className = "mc__flecha mc__flecha--prev";
    prev.setAttribute("aria-label", "Anterior");
    prev.textContent = "‹";

    var next = parte(doc.createElement("button"), "flecha");
    next.className = "mc__flecha mc__flecha--next";
    next.setAttribute("aria-label", "Siguiente");
    next.textContent = "›";

    viewport.appendChild(prev);
    viewport.appendChild(next);
    caja.appendChild(viewport);

    var puntos = parte(doc.createElement("div"), "puntos");
    puntos.className = "mc__puntos";
    caja.appendChild(puntos);

    raiz.appendChild(caja);

    conectarCarrusel(doc, pista, puntos, prev, next, items.length);
  }

  /** Puntos y flechas. Todo se calcula midiendo la pista, nunca con anchos fijos. */
  function conectarCarrusel(doc, pista, puntos, prev, next, total) {
    function porPagina() {
      var tarjeta = pista.firstElementChild;
      if (!tarjeta) return 1;
      var ancho = tarjeta.getBoundingClientRect().width + 16; // + gap
      return Math.max(1, Math.round(pista.clientWidth / ancho));
    }

    function paginas() {
      return Math.max(1, Math.ceil(total / porPagina()));
    }

    function paginaActual() {
      var tarjeta = pista.firstElementChild;
      if (!tarjeta) return 0;
      var ancho = tarjeta.getBoundingClientRect().width + 16;
      return Math.round(pista.scrollLeft / (ancho * porPagina()));
    }

    function irA(pagina) {
      var tarjeta = pista.firstElementChild;
      if (!tarjeta) return;
      var ancho = tarjeta.getBoundingClientRect().width + 16;
      pista.scrollTo({ left: pagina * ancho * porPagina(), behavior: "smooth" });
    }

    function pintarPuntos() {
      var n = paginas();
      // Con todo a la vista los puntos no informan nada: se van.
      if (n <= 1) {
        puntos.textContent = "";
        prev.style.display = "none";
        next.style.display = "none";
        return;
      }
      prev.style.display = "";
      next.style.display = "";

      if (puntos.childElementCount !== n) {
        puntos.textContent = "";
        for (var i = 0; i < n; i++) {
          (function (indice) {
            var b = parte(doc.createElement("button"), "punto");
            b.className = "mc__punto";
            b.setAttribute("aria-label", "Ir al grupo " + (indice + 1));
            b.addEventListener("click", function () { irA(indice); });
            puntos.appendChild(b);
          })(i);
        }
      }

      var actual = paginaActual();
      Array.prototype.forEach.call(puntos.children, function (b, i) {
        b.setAttribute("aria-current", i === actual ? "true" : "false");
      });
      prev.disabled = actual <= 0;
      next.disabled = actual >= n - 1;
    }

    prev.addEventListener("click", function () { irA(paginaActual() - 1); });
    next.addEventListener("click", function () { irA(paginaActual() + 1); });
    pista.addEventListener("scroll", pintarPuntos, { passive: true });
    if (window.ResizeObserver) new ResizeObserver(pintarPuntos).observe(pista);

    pintarPuntos();
  }

  function montar(host) {
    if (host.getAttribute("data-comeleya-listo")) return;
    host.setAttribute("data-comeleya-listo", "1");

    var slug = host.getAttribute("data-slug");
    if (!slug) return;

    var api = (host.getAttribute("data-api") || API_POR_DEFECTO).replace(/\/+$/, "");
    var params = [
      "tipo=" + encodeURIComponent(host.getAttribute("data-tipo") || "destacados"),
      "limit=" + encodeURIComponent(host.getAttribute("data-limit") || 6),
    ];
    var cat = host.getAttribute("data-cat");
    if (cat) params.push("cat=" + encodeURIComponent(cat));

    fetch(api + "/establishment/" + encodeURIComponent(slug) + "/showcase?" + params.join("&"), {
      // La disponibilidad por horario la resuelve el servidor, y necesita saber en
      // que zona esta parado el visitante.
      headers: { "X-Timezone": zonaHoraria() },
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (datos) {
        if (datos) dibujar(host, datos, { titulo: host.getAttribute("data-titulo") });
      })
      .catch(function () {
        // Un error nuestro no puede romper la pagina del cliente: no se dibuja nada.
      });
  }

  function montarTodos() {
    var hosts = document.querySelectorAll("[data-comeleya-showcase]");
    Array.prototype.forEach.call(hosts, montar);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", montarTodos);
  } else {
    montarTodos();
  }

  // Por si el sitio inserta el contenedor despues (constructores tipo Elementor).
  window.ComeleYaShowcase = { montar: montarTodos };
})();
