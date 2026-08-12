import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * El carrusel que el negocio pega en su propio sitio (public/widget.js).
 *
 * Es la pieza con más radio de daño del proyecto: corre en la página de un cliente,
 * junto a su CSS y su JavaScript. Dos cosas tienen que ser ciertas siempre —que no
 * dibuje basura y que un error nuestro no le rompa la página— y son justo las que no
 * se ven abriendo el navegador una vez.
 *
 * No es un componente de Vue, es DOM a secas, así que se prueba corriéndolo tal cual
 * dentro de jsdom con un fetch de mentiras.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const CODIGO = readFileSync(resolve(AQUI, "../public/widget.js"), "utf8");

const platillo = (props = {}) => ({
  id: 1,
  name: "Hawaiiana",
  description: "La clásica de jamón y piña",
  photo: "https://cdn/foto.jpg",
  price: 129,
  special_price: null,
  url: "https://comeleya.com/papizzas?dish=1",
  ...props,
});

const respuesta = (items, extra = {}) => ({
  establishment: { name: "Papizzas", slug: "papizzas", color: "#09b534" },
  tipo: "destacados",
  items,
  ...extra,
});

/** Monta un contenedor, corre el widget y espera a que resuelva el fetch. */
async function correr(datos, { attrs = {}, ok = true, rechaza = false } = {}) {
  document.body.innerHTML = "";
  const host = document.createElement("div");
  host.setAttribute("data-comeleya-showcase", "");
  host.setAttribute("data-slug", "papizzas");
  Object.entries(attrs).forEach(([k, v]) => host.setAttribute(k, v));
  document.body.appendChild(host);

  global.fetch = vi.fn(() =>
    rechaza
      ? Promise.reject(new Error("sin red"))
      : Promise.resolve({ ok, json: () => Promise.resolve(datos) })
  );

  // eslint-disable-next-line no-new-func
  new Function(CODIGO)();
  await new Promise((r) => setTimeout(r, 0));

  return host;
}

const tarjetas = (host) => host.shadowRoot?.querySelectorAll(".mc__card") ?? [];
const texto = (host, sel) => host.shadowRoot?.querySelector(sel)?.textContent?.trim();

describe("widget del carrusel", () => {
  beforeEach(() => {
    // jsdom no trae ninguno de los dos y el widget los usa para las flechas.
    Element.prototype.scrollTo = vi.fn();
    global.ResizeObserver = class {
      observe() {}
      disconnect() {}
    };
  });

  describe("lo que dibuja", () => {
    it("una tarjeta por platillo, dentro de un shadow root", async () => {
      const host = await correr(respuesta([platillo({ id: 1 }), platillo({ id: 2 })]));

      // El shadow root es lo que impide que el CSS del cliente nos deforme.
      expect(host.shadowRoot).toBeTruthy();
      expect(tarjetas(host)).toHaveLength(2);
    });

    it("la tarjeta lleva nombre, descripción y precio", async () => {
      const host = await correr(respuesta([platillo()]));

      expect(texto(host, ".mc__nombre")).toBe("Hawaiiana");
      expect(texto(host, ".mc__desc")).toBe("La clásica de jamón y piña");
      expect(texto(host, ".mc__precio")).toBe("$129");
    });

    it("el enlace va al platillo y sale del iframe", async () => {
      const host = await correr(respuesta([platillo()]));
      const a = host.shadowRoot.querySelector(".mc__card");

      expect(a.getAttribute("href")).toBe("https://comeleya.com/papizzas?dish=1");
      // _top y no _blank: dentro de un iframe el menú debe abrirse completo.
      expect(a.getAttribute("target")).toBe("_top");
    });

    it("con oferta tacha el precio anterior", async () => {
      const host = await correr(respuesta([platillo({ price: 129, special_price: 99 })]));

      expect(texto(host, ".mc__antes")).toBe("$129");
      expect(texto(host, ".mc__oferta")).toBe("$99");
    });

    // El servidor manda null cuando no hay oferta vigente; el widget no vuelve a
    // decidirlo, solo dibuja. Si tachara de más, anunciaría un descuento inexistente.
    it("sin oferta no tacha nada", async () => {
      const host = await correr(respuesta([platillo({ special_price: null })]));

      expect(host.shadowRoot.querySelector(".mc__antes")).toBeNull();
      expect(texto(host, ".mc__precio")).toBe("$129");
    });

    it("un platillo sin foto no deja un hueco roto", async () => {
      const host = await correr(respuesta([platillo({ photo: null })]));

      expect(host.shadowRoot.querySelector("img")).toBeNull();
      expect(texto(host, ".mc__sinfoto")).toBe("Sin foto");
    });

    it("el título sale del tipo, y se puede cambiar", async () => {
      const porDefecto = await correr(respuesta([platillo()], { tipo: "populares" }));
      expect(texto(porDefecto, ".mc__titulo")).toBe("Los más pedidos");

      const propio = await correr(respuesta([platillo()]), {
        attrs: { "data-titulo": "Lo que más sale" },
      });
      expect(texto(propio, ".mc__titulo")).toBe("Lo que más sale");
    });
  });

  // Estas tres son la razón de ser del archivo: el widget vive en la página de otro.
  describe("nunca rompe la página del cliente", () => {
    it("sin platillos no dibuja nada", async () => {
      const host = await correr(respuesta([]));

      expect(host.shadowRoot).toBeNull();
      expect(host.innerHTML).toBe("");
    });

    it("si el servidor responde con error no dibuja nada", async () => {
      const host = await correr(null, { ok: false });

      expect(host.shadowRoot).toBeNull();
    });

    it("si no hay red tampoco truena", async () => {
      let host;
      await expect(
        (async () => {
          host = await correr(null, { rechaza: true });
        })()
      ).resolves.not.toThrow();

      expect(host.shadowRoot).toBeNull();
    });

    it("sin data-slug ni siquiera pregunta", async () => {
      document.body.innerHTML = '<div data-comeleya-showcase></div>';
      global.fetch = vi.fn();

      // eslint-disable-next-line no-new-func
      new Function(CODIGO)();
      await new Promise((r) => setTimeout(r, 0));

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  // El shadow root corta el CSS en los dos sentidos. Estas puertas son lo que hace
  // cierto que el dueño "puede manejar el CSS": sin ellas solo se ve lo que nosotros
  // decidimos, y quitarlas del todo devolvería el problema original —su hoja de
  // estilos desarmándonos el carrusel sin que nadie lo haya pedido.
  describe("lo que el sitio del cliente sí puede cambiar", () => {
    const css = (host) => host.shadowRoot.querySelector("style").textContent;

    it("el color del negocio llega como variable", async () => {
      const host = await correr(respuesta([platillo()]));

      expect(css(host)).toContain("--cy-color:#09b534");
    });

    it("sin color configurado usa uno de fábrica y no se rompe", async () => {
      const host = await correr(
        respuesta([platillo()], { establishment: { name: "X", slug: "x", color: null } })
      );

      expect(css(host)).toContain("--cy-color:#1976D2");
    });

    it("expone las variables que valen la pena tocar", async () => {
      const host = await correr(respuesta([platillo()]));
      const hoja = css(host);

      ["--cy-color", "--cy-radius", "--cy-card-width", "--cy-font", "--cy-gap", "--cy-text"]
        .forEach((v) => expect(hoja).toContain(v));
    });

    /** La tipografía se hereda para que el carrusel se vea parte de su página. */
    it("la tipografía se hereda del sitio", async () => {
      const host = await correr(respuesta([platillo()]));

      expect(css(host)).toContain("--cy-font:inherit");
    });

    it("marca las piezas con part para alcanzarlas desde fuera", async () => {
      const host = await correr(respuesta([platillo({ special_price: 99 })]));
      const partes = [...host.shadowRoot.querySelectorAll("[part]")].map((e) =>
        e.getAttribute("part")
      );

      ["titulo", "pista", "card", "foto", "nombre", "desc", "precio", "btn"].forEach((p) =>
        expect(partes).toContain(p)
      );
    });
  });

  describe("lo que le pide al servidor", () => {
    it("manda el tipo, el límite y la zona horaria", async () => {
      await correr(respuesta([platillo()]), {
        attrs: { "data-tipo": "populares", "data-limit": "4" },
      });

      const [url, opciones] = global.fetch.mock.calls[0];
      expect(url).toContain("/establishment/papizzas/showcase");
      expect(url).toContain("tipo=populares");
      expect(url).toContain("limit=4");
      // El horario de disponibilidad lo resuelve el servidor y necesita la zona.
      expect(opciones.headers["X-Timezone"]).toBeTruthy();
    });

    it("la categoría solo viaja cuando aplica", async () => {
      await correr(respuesta([platillo()]), {
        attrs: { "data-tipo": "categoria", "data-cat": "bebidas" },
      });
      expect(global.fetch.mock.calls[0][0]).toContain("cat=bebidas");

      await correr(respuesta([platillo()]), { attrs: { "data-tipo": "destacados" } });
      expect(global.fetch.mock.calls[0][0]).not.toContain("cat=");
    });

    it("no vuelve a montar el mismo contenedor dos veces", async () => {
      const host = await correr(respuesta([platillo()]));

      // eslint-disable-next-line no-new-func
      new Function(CODIGO)();
      await new Promise((r) => setTimeout(r, 0));

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(tarjetas(host)).toHaveLength(1);
    });
  });
});
