import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { urlDelMapa, abrirEnMapa } from "src/utils/mapa";

/**
 * El boton "Ver en Mapa". Si esto falla, el comensal que va a recoger su pedido no
 * encuentra el negocio.
 */
describe("el mapa del negocio", () => {
  describe("urlDelMapa", () => {
    it("usa las coordenadas cuando las hay", () => {
      const url = urlDelMapa({ coordenadas: "25.79,-108.98", direccion: "Calle 1" });
      expect(url).toContain("25.79%2C-108.98");
    });

    it("les quita los espacios, que es como las pegan de Google", () => {
      expect(urlDelMapa({ coordenadas: "25.79, -108.98" })).toContain("25.79%2C-108.98");
    });

    it("sin coordenadas busca por la direccion, en vez de no hacer nada", () => {
      // El caso que dejaba el boton mudo: 19 de 107 negocios en produccion no tienen
      // coordenadas, porque el campo vivia escondido dentro de "Envio a domicilio".
      const url = urlDelMapa({ direccion: "Blvd Canuto Ibarra 277, Los Mochis" });
      expect(url).toContain("Canuto");
    });

    it("limpia la direccion a medio llenar antes de buscarla", () => {
      // Tal cual sale de un negocio real: campos vacios y el numero exterior en 0.
      const url = urlDelMapa({ direccion: "Madrid  0, Los Mochis, , México" });
      expect(decodeURIComponent(url)).toContain("Madrid, Los Mochis, México");
    });

    it("no arma nada si no hay ni coordenadas ni direccion", () => {
      expect(urlDelMapa({})).toBe("");
      expect(urlDelMapa()).toBe("");
    });

    it("descarta una direccion a medio llenar", () => {
      // Al negocio le falta un campo y se arma "undefined undefined, Culiacan".
      expect(urlDelMapa({ direccion: "undefined undefined, Culiacan" })).toBe("");
    });
  });

  describe("abrirEnMapa", () => {
    let abrir;

    beforeEach(() => {
      abrir = vi.spyOn(window, "open");
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    it("abre la pestaña y no molesta a nadie mas", () => {
      abrir.mockReturnValue({});
      const alFallar = vi.fn();

      expect(abrirEnMapa("https://www.google.com/maps", { alFallar })).toBe(true);
      expect(alFallar).not.toHaveBeenCalled();
    });

    it("sin url no intenta nada", () => {
      expect(abrirEnMapa("")).toBe(false);
      expect(abrir).not.toHaveBeenCalled();
    });

    it("si el navegador la bloquea y no hay contenedor, avisa", () => {
      // window.open devuelve null: es lo que pasa en un iframe con sandbox.
      abrir.mockReturnValue(null);
      const alFallar = vi.fn();

      abrirEnMapa("https://www.google.com/maps", { alFallar });

      expect(alFallar).toHaveBeenCalled();
    });

    it("bloqueada y embebido: se lo pide a la pagina que lo contiene", () => {
      abrir.mockReturnValue(null);
      const padre = { postMessage: vi.fn() };
      vi.spyOn(window, "parent", "get").mockReturnValue(padre);

      abrirEnMapa("https://www.google.com/maps?q=1,2");

      expect(padre.postMessage).toHaveBeenCalledWith(
        { type: "comeleya:abrir", url: "https://www.google.com/maps?q=1,2" },
        "*"
      );
    });

    it("si el contenedor contesta que abrio, no se avisa de nada", () => {
      vi.useFakeTimers();
      abrir.mockReturnValue(null);
      vi.spyOn(window, "parent", "get").mockReturnValue({
        postMessage: () => window.dispatchEvent(
          Object.assign(new Event("message"), { data: { type: "comeleya:abierto" } })
        ),
      });
      const alFallar = vi.fn();

      abrirEnMapa("https://www.google.com/maps", { alFallar });
      vi.advanceTimersByTime(2000);

      expect(alFallar).not.toHaveBeenCalled();
    });

    it("si el contenedor no contesta, se avisa", () => {
      // El sitio embebe el menu sin embed.js: nadie puede abrir nada y hay que decirlo.
      vi.useFakeTimers();
      abrir.mockReturnValue(null);
      vi.spyOn(window, "parent", "get").mockReturnValue({ postMessage: vi.fn() });
      const alFallar = vi.fn();

      abrirEnMapa("https://www.google.com/maps", { alFallar });
      vi.advanceTimersByTime(2000);

      expect(alFallar).toHaveBeenCalled();
    });
  });
});
