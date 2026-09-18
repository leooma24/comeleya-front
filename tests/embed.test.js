import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * La barra del pedido que se dibuja FUERA del iframe (public/embed.js).
 *
 * Corre en la página del negocio, no en la nuestra, así que no se ve abriendo el
 * navegador una vez: hay que montar el escenario completo —el sitio contenedor, el
 * iframe y los postMessage entre los dos— y eso es justo lo que hace jsdom.
 *
 * Lo que se prueba aquí es el reparto del click: con enlace configurado el lado
 * derecho navega al sitio del negocio y NO abre el carrito; sin enlace, todo el ancho
 * de la barra sigue abriendo el pedido, como siempre.
 *
 * No es un componente de Vue, es DOM a secas, así que se corre tal cual.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const CODIGO = readFileSync(resolve(AQUI, "../public/embed.js"), "utf8");

const carrito = (extra = {}) => ({
  type: "comeleya:cart",
  count: 3,
  total: 867,
  hasItems: true,
  color: "#1976D2",
  cartImage: "",
  label: "Ver pedido",
  ctaUrl: "",
  ...extra,
});

/** El iframe del menú: lo único que nos importa de él es que recibe mensajes. */
// close() existe porque jsdom la llama en cada ventana hija al terminar la prueba.
const menu = () => ({ postMessage: vi.fn(), close: vi.fn() });

/**
 * Pone el iframe del menú en la página y devuelve su "ventana".
 *
 * El script solo atiende mensajes que vengan de un iframe suyo, así que la ventana
 * falsa tiene que estar colgada de un `<iframe data-comeleya>` de verdad: es como
 * llega en el sitio del negocio.
 */
function incrustarMenu() {
  const el = document.createElement("iframe");
  // Sin src: el selector del script lo reconoce por data-comeleya, y una URL de
  // verdad hace que jsdom intente navegarlo.
  el.setAttribute("data-comeleya", "");
  document.body.appendChild(el);

  const ventana = menu();
  Object.defineProperty(el, "contentWindow", { value: ventana, configurable: true });

  return ventana;
}

/** Monta el script en una página limpia y devuelve las piezas de la barra. */
function montar() {
  document.body.innerHTML = "";
  // eslint-disable-next-line no-new-func
  new Function(CODIGO)();

  const iframe = incrustarMenu();
  return { iframe };
}

/** Un postMessage del menú al sitio contenedor. `source` es la ventana del iframe. */
function mandar(data, source) {
  const ev = new MessageEvent("message", { data });
  // jsdom no deja pasar un objeto cualquiera como `source` en el constructor.
  if (source) Object.defineProperty(ev, "source", { value: source });
  window.dispatchEvent(ev);
}

const barra = () => document.body.querySelector("div[style*='position: fixed']");
/** El lado derecho: el que dice "Ver pedido →". */
const derecha = () => barra().children[2];

function click(el) {
  // jsdom no sabe navegar y lo grita en consola; aquí solo importa quién atendió
  // el click, no a dónde habría llegado.
  el.addEventListener("click", (e) => e.preventDefault());
  el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
}

const pidioAbrirCarrito = (iframe) =>
  iframe.postMessage.mock.calls.some(([m]) => m && m.type === "comeleya:openCart");

describe("embed.js — la barra del pedido fuera del iframe", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("sin enlace configurado (los doce negocios de siempre)", () => {
    it("dibuja la barra con el conteo, el total y 'Ver pedido'", () => {
      const { iframe } = montar();
      mandar(carrito(), iframe);

      expect(barra().style.display).toBe("flex");
      expect(derecha().textContent).toBe("Ver pedido →");
    });

    it("el lado derecho no es un enlace a ningún lado", () => {
      const { iframe } = montar();
      mandar(carrito(), iframe);

      expect(derecha().hasAttribute("href")).toBe(false);
    });

    it("tocar el lado derecho abre el pedido", () => {
      const { iframe } = montar();
      mandar(carrito(), iframe);

      click(derecha());
      expect(pidioAbrirCarrito(iframe)).toBe(true);
    });

    it("sin platillos la barra se esconde", () => {
      const { iframe } = montar();
      mandar(carrito({ hasItems: false }), iframe);

      expect(barra().style.display).toBe("none");
    });
  });

  describe("con enlace configurado", () => {
    const kazuki = carrito({
      label: "Volver a las categorías",
      ctaUrl: "https://kazuki.com/categorias",
    });

    it("el lado derecho lleva el texto y el enlace del negocio", () => {
      const { iframe } = montar();
      mandar(kazuki, iframe);

      expect(derecha().textContent).toBe("Volver a las categorías →");
      expect(derecha().getAttribute("href")).toBe("https://kazuki.com/categorias");
      // _top: si no, el sitio del negocio se cargaría dentro de su propio iframe.
      expect(derecha().getAttribute("target")).toBe("_top");
    });

    // El click vive en la barra ENTERA. Sin el stopPropagation pasarían las dos cosas
    // a la vez: navegaría y además abriría el carrito dentro del marco.
    it("tocar el lado derecho NO abre el pedido", () => {
      const { iframe } = montar();
      mandar(kazuki, iframe);

      click(derecha());
      expect(pidioAbrirCarrito(iframe)).toBe(false);
    });

    it("el resto de la barra sigue abriendo el pedido", () => {
      const { iframe } = montar();
      mandar(kazuki, iframe);

      click(barra().children[1]); // el total
      expect(pidioAbrirCarrito(iframe)).toBe(true);
    });

    it("si el negocio lo quita, el enlace se va con él", () => {
      const { iframe } = montar();
      mandar(kazuki, iframe);
      mandar(carrito(), iframe);

      expect(derecha().hasAttribute("href")).toBe(false);
      click(derecha());
      expect(pidioAbrirCarrito(iframe)).toBe(true);
    });
  });

  // El listener de mensajes no verifica origen —es de antes de este cambio— así que
  // en la página del cliente cualquier ventana puede mandar un "comeleya:cart". El
  // href es lo primero de ese mensaje que sería ejecutable.
  describe("una URL que no debería llegar", () => {
    it("no se convierte en href", () => {
      const { iframe } = montar();

      [
        "javascript:alert(1)",
        "data:text/html,<script>alert(1)</script>",
        "vbscript:msgbox(1)",
        "//otro-sitio.com",
      ].forEach((ctaUrl) => {
        mandar(carrito({ ctaUrl }), iframe);
        expect(derecha().hasAttribute("href")).toBe(false);
      });
    });
  });

  describe("el aviso de vuelta al menú", () => {
    it("le dice que esta barra está activa, para que apague la interna", () => {
      const { iframe } = montar();
      mandar(carrito(), iframe);

      expect(iframe.postMessage.mock.calls.some(([m]) => m && m.type === "comeleya:embed"))
        .toBe(true);
    });
  });
});

/**
 * El enlace del catálogo de Meta lleva a la página del NEGOCIO, no a comeleya.com,
 * cuando el negocio configuró la suya. Pero el `?dish=` que trae ese enlace lo lee
 * nuestro menú, que ahí vive dentro de un iframe: si nadie se lo pasa, el cliente
 * que tocó un platillo en un anuncio cae en el menú completo y tiene que buscar
 * otra vez lo que ya había visto.
 *
 * Esto prueba el puente: lo que viene en la dirección de la página de arriba entra
 * al iframe.
 */
describe("embed.js — pasa el platillo y la categoría al iframe", () => {
  const conIframe = (src) => {
    document.body.innerHTML = `<iframe data-comeleya src="${src}"></iframe>`;
    return document.querySelector("iframe");
  };

  const irA = (busqueda) => {
    window.history.replaceState({}, "", "/menu" + busqueda);
  };

  const arrancar = () => {
    // eslint-disable-next-line no-new-func
    new Function(CODIGO)();
    document.dispatchEvent(new Event("DOMContentLoaded"));
  };

  beforeEach(() => {
    document.body.innerHTML = "";
    window.history.replaceState({}, "", "/menu");
  });

  it("copia el dish de la página al iframe", () => {
    const iframe = conIframe("https://comeleya.com/kazuki?isExternal=true");
    irA("?dish=2100");
    arrancar();

    expect(iframe.getAttribute("src")).toContain("dish=2100");
    expect(iframe.getAttribute("src")).toContain("isExternal=true");
  });

  it("copia también la categoría", () => {
    const iframe = conIframe("https://comeleya.com/kazuki?isExternal=true");
    irA("?cat=7");
    arrancar();

    expect(iframe.getAttribute("src")).toContain("cat=7");
  });

  // Sin parámetros no hay por qué recargar el iframe: cambiar el src lo hace empezar
  // de cero y el negocio veria su menu parpadear al entrar.
  it("no toca el iframe si la página no trae nada", () => {
    const iframe = conIframe("https://comeleya.com/kazuki?isExternal=true");
    const antes = iframe.getAttribute("src");
    arrancar();

    expect(iframe.getAttribute("src")).toBe(antes);
  });

  // Lo que ya venía en el iframe manda: si el negocio fijó una categoría en su
  // codigo de insercion, no se la pisamos con la de la direccion.
  it("no pisa lo que el negocio ya puso en el iframe", () => {
    const iframe = conIframe("https://comeleya.com/kazuki?isExternal=true&cat=3");
    irA("?cat=7");
    arrancar();

    expect(iframe.getAttribute("src")).toContain("cat=3");
    expect(iframe.getAttribute("src")).not.toContain("cat=7");
  });

  it("ignora cualquier otro parámetro de la página", () => {
    const iframe = conIframe("https://comeleya.com/kazuki?isExternal=true");
    irA("?fbclid=abc123&utm_source=facebook");
    arrancar();

    expect(iframe.getAttribute("src")).not.toContain("fbclid");
    expect(iframe.getAttribute("src")).not.toContain("utm_source");
  });
});

/**
 * Abrir un enlace por cuenta del menu.
 *
 * Dentro de un iframe con `sandbox` el menu no puede abrir nada: window.open le
 * devuelve null y el boton se queda mudo. Esta pagina no esta en el sandbox, asi que
 * abre ella. La lista de lo que se le permite abrir es corta a proposito: este script
 * corre en el sitio del negocio.
 */
describe("embed.js — abre enlaces por cuenta del menú", () => {
  let abrir;
  let elMenu;

  beforeEach(() => {
    document.body.innerHTML = "";
    abrir = vi.spyOn(window, "open").mockReturnValue({});
    // eslint-disable-next-line no-new-func
    new Function(CODIGO)();
    elMenu = incrustarMenu();
  });

  // Por omisión lo pide el menú incrustado, que es el único que el script atiende.
  const pedir = (url, source) => mandar({ type: "comeleya:abrir", url }, source ?? elMenu);

  it("abre el mapa del negocio", () => {
    pedir("https://www.google.com/maps/search/?api=1&query=25.79,-108.98");

    expect(abrir).toHaveBeenCalled();
  });

  // El boton de compartir un platillo: dentro del iframe, WhatsApp es su unica salida.
  it("abre WhatsApp para compartir", () => {
    pedir("https://wa.me/?text=Maguro%20Roll");

    expect(abrir).toHaveBeenCalledWith("https://wa.me/?text=Maguro%20Roll", "_blank", "noopener");
  });

  it("tambien la direccion larga de WhatsApp", () => {
    pedir("https://api.whatsapp.com/send/?text=Maguro");

    expect(abrir).toHaveBeenCalled();
  });

  it("no abre cualquier cosa que le pidan", () => {
    pedir("https://sitio-de-otro.com/lo-que-sea");
    pedir("javascript:alert(1)");
    pedir({ nada: true });

    expect(abrir).not.toHaveBeenCalled();
  });

  it("le contesta al menu que si se pudo", () => {
    pedir("https://wa.me/?text=Maguro");

    expect(elMenu.postMessage).toHaveBeenCalledWith({ type: "comeleya:abierto" }, "*");
  });

  it("si el popup tambien se bloquea aqui arriba, no contesta nada", () => {
    abrir.mockReturnValue(null);
    pedir("https://wa.me/?text=Maguro");

    expect(elMenu.postMessage).not.toHaveBeenCalledWith({ type: "comeleya:abierto" }, "*");
  });
});

/**
 * De quien acepta mensajes.
 *
 * Este script corre en el sitio del negocio, donde hay anuncios, chats y otros
 * iframes. Antes atendia un "comeleya:cart" de cualquiera: con eso se cambiaba el
 * enlace del boton "Ver pedido" y el comensal salia del sitio del restaurante con un
 * click legitimo. Ahora solo le habla el menu que el propio sitio incrusto.
 */
describe("embed.js — solo le habla el menú incrustado", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    // eslint-disable-next-line no-new-func
    new Function(CODIGO)();
    incrustarMenu();
  });

  it("un carrito de una ventana desconocida no dibuja nada", () => {
    mandar(carrito({ ctaUrl: "https://sitio-de-otro.com" }), menu());

    expect(barra()).toBeNull();
  });

  it("un mensaje sin ventana tampoco", () => {
    mandar(carrito(), null);

    expect(barra()).toBeNull();
  });

  it("y no abre enlaces por encargo de un desconocido", () => {
    const abrir = vi.spyOn(window, "open").mockReturnValue({});

    mandar({ type: "comeleya:abrir", url: "https://wa.me/?text=hola" }, menu());

    expect(abrir).not.toHaveBeenCalled();
    abrir.mockRestore();
  });
});
