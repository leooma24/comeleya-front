import { describe, it, expect } from "vitest";
import { cartBarCta } from "src/utils/cartBarCta.js";

// Atajo: un negocio con la configuración de tema que se le pase.
const negocio = (theme_config) => ({ name: "Kazuki", theme_config });

// Los dos escenarios. Casi todo se prueba embebido, porque fuera del iframe la
// respuesta es siempre la misma y tiene su propio bloque.
const dentro = (e) => cartBarCta(e, { embedded: true });
const fuera = (e) => cartBarCta(e, { embedded: false });

describe("cartBarCta", () => {
  // Es configuración de un par de negocios. Los otros doce no deben notar nada, y
  // estas son las pruebas que lo garantizan.
  describe("un negocio sin configurar deja la barra como siempre", () => {
    it("sin theme_config", () => {
      expect(dentro(negocio(null))).toBeNull();
    });

    it("con un theme_config que trae otras cosas", () => {
      expect(dentro(negocio({ primary_color: "#F00", banner_text: "Hola", show_banner: true })))
        .toBeNull();
    });
  });

  // La regla que movió este botón de la tarjeta a la barra: el enlace es la vuelta a
  // la página del negocio, y eso solo existe si venimos de ella.
  describe("fuera del iframe no hay enlace", () => {
    const kazuki = negocio({
      card_cta_label: "Volver a las categorías",
      card_cta_url: "https://kazuki.com/categorias",
    });

    it("aunque esté todo configurado", () => {
      expect(fuera(kazuki)).toBeNull();
      // Y para que se vea que lo único que cambió es dónde se abrió:
      expect(dentro(kazuki)).toEqual({
        label: "Volver a las categorías",
        url: "https://kazuki.com/categorias",
      });
    });

    it("sin decir si estamos embebidos, tampoco", () => {
      expect(cartBarCta(kazuki)).toBeNull();
      expect(cartBarCta(kazuki, {})).toBeNull();
    });
  });

  // Los dos campos van juntos a propósito: un botón que dijera "Ver pedido" y se
  // fuera a otro sitio sería mentira, y uno sin texto no se entiende.
  describe("hacen falta los dos campos", () => {
    it("con enlace pero sin texto, no", () => {
      expect(dentro(negocio({ card_cta_url: "https://kazuki.com" }))).toBeNull();
      expect(dentro(negocio({ card_cta_url: "https://kazuki.com", card_cta_label: "" })))
        .toBeNull();
      expect(dentro(negocio({ card_cta_url: "https://kazuki.com", card_cta_label: "   " })))
        .toBeNull();
    });

    it("con texto pero sin enlace, no", () => {
      expect(dentro(negocio({ card_cta_label: "Volver" }))).toBeNull();
      expect(dentro(negocio({ card_cta_label: "Volver", card_cta_url: "" }))).toBeNull();
      expect(dentro(negocio({ card_cta_label: "Volver", card_cta_url: "   " }))).toBeNull();
    });
  });

  describe("el texto", () => {
    it("usa el que capturó el dueño", () => {
      expect(dentro(negocio({ card_cta_label: "Seguir comprando", card_cta_url: "https://k.com" })))
        .toEqual({ label: "Seguir comprando", url: "https://k.com" });
    });

    it("le quita los espacios de los extremos", () => {
      expect(dentro(negocio({ card_cta_label: "  Seguir comprando  ", card_cta_url: "https://k.com" })))
        .toEqual({ label: "Seguir comprando", url: "https://k.com" });
    });
  });

  describe("la URL", () => {
    const con = (card_cta_url) => dentro(negocio({ card_cta_label: "Volver", card_cta_url }));

    it("acepta http y https", () => {
      expect(con("https://kazuki.com/categorias").url).toBe("https://kazuki.com/categorias");
      expect(con("http://kazuki.com/categorias").url).toBe("http://kazuki.com/categorias");
    });

    it("conserva la dirección tal cual la capturaron", () => {
      // Nada de normalizar: el dueño tiene que reconocer en el menú lo que escribió
      // en el panel, con su query y todo.
      const url = "https://kazuki.com/menu?cat=skinny-menu&utm=qr";
      expect(con(url).url).toBe(url);
    });

    it("le quita los espacios de los extremos", () => {
      expect(con("  https://kazuki.com  ").url).toBe("https://kazuki.com");
    });

    // ESTA es la que impide que el campo se convierta en una forma de meter código
    // en el menú de un cliente.
    it("rechaza todo lo que no sea http o https", () => {
      [
        "javascript:alert(1)",
        "JavaScript:alert(1)",
        "data:text/html,<script>alert(1)</script>",
        "vbscript:msgbox(1)",
        "file:///C:/Windows",
      ].forEach((url) => {
        expect(con(url)).toBeNull();
      });
    });

    // "//otro-sitio.com" se ve inofensivo al capturarlo y se lleva al comensal fuera.
    it("rechaza las que no traen el protocolo escrito", () => {
      ["//otro-sitio.com", "kazuki.com", "/categorias", "esto no es una url"].forEach((url) => {
        expect(con(url)).toBeNull();
      });
    });
  });

  // Lo capturó cuando el botón vivía en la tarjeta. Por eso las llaves de theme_config
  // siguen diciendo card_: lo suyo tiene que seguir leyéndose en su nuevo lugar.
  describe("el caso de Sushi Express, que ya está en producción", () => {
    const sushi = negocio({
      card_cta_label: "Seguir ordenando",
      card_cta_url: "https://www.sushiexpresslosmochis.com/",
    });

    it("se lee desde las llaves de siempre", () => {
      expect(dentro(sushi)).toEqual({
        label: "Seguir ordenando",
        url: "https://www.sushiexpresslosmochis.com/",
      });
    });
  });

  describe("entradas basura", () => {
    it("no revienta con nulos ni con tipos raros", () => {
      [null, undefined, {}, { theme_config: "{}" }, { theme_config: [] }, { theme_config: 7 }]
        .forEach((e) => {
          expect(() => dentro(e)).not.toThrow();
          expect(dentro(e)).toBeNull();
        });
    });

    it("un texto o una url que no son cadenas se ignoran", () => {
      expect(dentro(negocio({ card_cta_label: 42, card_cta_url: "https://k.com" }))).toBeNull();
      expect(dentro(negocio({ card_cta_label: "Volver", card_cta_url: 42 }))).toBeNull();
    });
  });
});
