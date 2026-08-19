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
const menu = () => ({ postMessage: vi.fn() });

/** Monta el script en una página limpia y devuelve las piezas de la barra. */
function montar() {
  document.body.innerHTML = "";
  // eslint-disable-next-line no-new-func
  new Function(CODIGO)();

  const iframe = menu();
  return { iframe };
}

/** Un postMessage del menú al sitio contenedor. `source` es la ventana del iframe. */
function mandar(data, source) {
  const ev = new MessageEvent("message", { data });
  // jsdom no deja pasar un objeto cualquiera como `source` en el constructor.
  if (source) Object.defineProperty(ev, "source", { value: source });
  window.dispatchEvent(ev);
}

const barra = () => document.body.lastElementChild;
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
