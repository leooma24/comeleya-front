import { describe, it, expect } from "vitest";
import {
  ctaIsCustom,
  ctaLabelOf,
  ctaUrlOf,
  ETIQUETA_POR_DEFECTO,
} from "src/utils/cardCta.js";

// Atajo: un negocio con la configuración de tema que se le pase.
const negocio = (theme_config) => ({ name: "Kazuki", theme_config });

describe("cardCta", () => {
  // Es configuración de UN negocio. Los otros trece no deben notar nada, y estas
  // son las pruebas que lo garantizan.
  describe("un negocio sin configurar queda igual que siempre", () => {
    it("dice 'Ver más' y no navega a ningún lado", () => {
      const e = negocio(null);
      expect(ctaLabelOf(e)).toBe("Ver más");
      expect(ctaLabelOf(e)).toBe(ETIQUETA_POR_DEFECTO);
      expect(ctaUrlOf(e)).toBeNull();
    });

    it("tampoco cambia con un theme_config que trae otras cosas", () => {
      const e = negocio({ primary_color: "#F00", banner_text: "Hola", show_banner: true });
      expect(ctaLabelOf(e)).toBe("Ver más");
      expect(ctaUrlOf(e)).toBeNull();
    });
  });

  describe("el texto", () => {
    it("usa el que capturó el dueño", () => {
      expect(ctaLabelOf(negocio({ card_cta_label: "Seguir comprando" }))).toBe("Seguir comprando");
    });

    it("le quita los espacios de los extremos", () => {
      expect(ctaLabelOf(negocio({ card_cta_label: "  Seguir comprando  " }))).toBe("Seguir comprando");
    });

    // Un botón en blanco no se puede tocar ni se entiende: mejor el de siempre.
    it("un texto vacío o de solo espacios cae al de siempre", () => {
      expect(ctaLabelOf(negocio({ card_cta_label: "" }))).toBe("Ver más");
      expect(ctaLabelOf(negocio({ card_cta_label: "   " }))).toBe("Ver más");
      expect(ctaLabelOf(negocio({ card_cta_label: null }))).toBe("Ver más");
    });
  });

  describe("la URL", () => {
    it("acepta http y https", () => {
      expect(ctaUrlOf(negocio({ card_cta_url: "https://kazuki.com/categorias" })))
        .toBe("https://kazuki.com/categorias");
      expect(ctaUrlOf(negocio({ card_cta_url: "http://kazuki.com/categorias" })))
        .toBe("http://kazuki.com/categorias");
    });

    it("conserva la dirección tal cual la capturaron", () => {
      // Nada de normalizar: el dueño tiene que reconocer en el menú lo que escribió
      // en el panel, con su query y todo.
      const url = "https://kazuki.com/menu?cat=skinny-menu&utm=qr";
      expect(ctaUrlOf(negocio({ card_cta_url: url }))).toBe(url);
    });

    it("le quita los espacios de los extremos", () => {
      expect(ctaUrlOf(negocio({ card_cta_url: "  https://kazuki.com  " })))
        .toBe("https://kazuki.com");
    });

    it("vacía o solo espacios es como no tenerla", () => {
      expect(ctaUrlOf(negocio({ card_cta_url: "" }))).toBeNull();
      expect(ctaUrlOf(negocio({ card_cta_url: "   " }))).toBeNull();
    });

    // ESTA es la que impide que el campo se convierta en una forma de meter código
    // en el menú de un cliente.
    it("rechaza todo lo que no sea http o https", () => {
      const peligrosas = [
        "javascript:alert(1)",
        "JavaScript:alert(1)",
        "data:text/html,<script>alert(1)</script>",
        "vbscript:msgbox(1)",
        "file:///C:/Windows",
      ];
      peligrosas.forEach((url) => {
        expect(ctaUrlOf(negocio({ card_cta_url: url }))).toBeNull();
      });
    });

    // "//otro-sitio.com" se ve inofensivo al capturarlo y se lleva al comensal fuera.
    it("rechaza las que no traen el protocolo escrito", () => {
      expect(ctaUrlOf(negocio({ card_cta_url: "//otro-sitio.com" }))).toBeNull();
      expect(ctaUrlOf(negocio({ card_cta_url: "kazuki.com" }))).toBeNull();
      expect(ctaUrlOf(negocio({ card_cta_url: "/categorias" }))).toBeNull();
      expect(ctaUrlOf(negocio({ card_cta_url: "esto no es una url" }))).toBeNull();
    });
  });

  // La vista de LISTA es una fila angosta que nunca tuvo texto, solo una flecha.
  // Ahí la etiqueta solo aparece si el dueño capturó algo; a los demás no se les
  // quita espacio del nombre del platillo.
  describe("¿configuró algo el negocio?", () => {
    it("sin configurar, no", () => {
      expect(ctaIsCustom(negocio(null))).toBe(false);
      expect(ctaIsCustom(negocio({ primary_color: "#F00" }))).toBe(false);
      expect(ctaIsCustom(negocio({ card_cta_label: "  ", card_cta_url: "" }))).toBe(false);
    });

    it("con etiqueta propia, sí", () => {
      expect(ctaIsCustom(negocio({ card_cta_label: "Seguir ordenando" }))).toBe(true);
    });

    it("con enlace, sí aunque no haya etiqueta", () => {
      expect(ctaIsCustom(negocio({ card_cta_url: "https://kazuki.com" }))).toBe(true);
    });

    // Una URL que no sirve no cuenta como configuración: el botón no la usaría.
    it("con un enlace inválido, no", () => {
      expect(ctaIsCustom(negocio({ card_cta_url: "javascript:alert(1)" }))).toBe(false);
      expect(ctaIsCustom(negocio({ card_cta_url: "kazuki.com" }))).toBe(false);
    });

    it("con nulos no revienta", () => {
      expect(ctaIsCustom(null)).toBe(false);
      expect(ctaIsCustom(undefined)).toBe(false);
    });
  });

  // El caso real que destapó el hueco: Sushi Express lo capturó, se guardó bien, y
  // en la vista de lista no se veía nada porque el botón solo existía en cuadrícula.
  describe("el caso de Sushi Express", () => {
    const sushi = negocio({
      card_cta_label: "Seguir ordenando",
      card_cta_url: "https://www.sushiexpresslosmochis.com/",
    });

    it("las dos vistas leen lo mismo", () => {
      expect(ctaLabelOf(sushi)).toBe("Seguir ordenando");
      expect(ctaUrlOf(sushi)).toBe("https://www.sushiexpresslosmochis.com/");
      expect(ctaIsCustom(sushi)).toBe(true);
    });
  });

  describe("entradas basura", () => {
    it("no revienta con nulos ni con tipos raros", () => {
      [null, undefined, {}, { theme_config: "{}" }, { theme_config: [] }, { theme_config: 7 }]
        .forEach((e) => {
          expect(() => ctaLabelOf(e)).not.toThrow();
          expect(ctaLabelOf(e)).toBe("Ver más");
          expect(ctaUrlOf(e)).toBeNull();
        });
    });

    it("un texto o una url que no son cadenas se ignoran", () => {
      expect(ctaLabelOf(negocio({ card_cta_label: 42 }))).toBe("Ver más");
      expect(ctaUrlOf(negocio({ card_cta_url: 42 }))).toBeNull();
    });
  });
});
