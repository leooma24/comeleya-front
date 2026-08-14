import { describe, it, expect } from "vitest";
import { describeRequestError } from "src/utils/requestError.js";

// Errores como los arma axios.
const conRespuesta = (status) => ({ response: { status } });
const sinRespuesta = (code, message = "") => ({ code, message });

describe("describeRequestError", () => {
  // ESTA es la razon de que el archivo exista. El bug de la zona horaria devolvia 500
  // y la pantalla decia "Revisa tu conexion": el comensal revisaba su wifi mientras el
  // problema estaba de este lado.
  describe("si el servidor contesto, la culpa es nuestra", () => {
    [500, 502, 503].forEach((status) => {
      it(`${status} no manda a revisar la conexion`, () => {
        const r = describeRequestError(conRespuesta(status));
        expect(r.nuestra).toBe(true);
        expect(r.mensaje).not.toMatch(/conexi[oó]n/i);
        expect(r.codigo).toBe(`error ${status}`);
      });
    });

    it("un 4xx tambien es nuestro: sale de como esta configurado esto", () => {
      expect(describeRequestError(conRespuesta(404)).nuestra).toBe(true);
      expect(describeRequestError(conRespuesta(429)).nuestra).toBe(true);
      expect(describeRequestError(conRespuesta(422)).nuestra).toBe(true);
    });
  });

  // El orden del arreglo decide, y 404 y 429 son 4xx: si la regla general les ganara,
  // los dos dirian "No pudimos completar la solicitud" y se perderia el motivo.
  describe("los casos especificos le ganan a la regla general", () => {
    it("404 dice que no existe el restaurante", () => {
      const r = describeRequestError(conRespuesta(404));
      expect(r.codigo).toBe("no encontrado");
      expect(r.mensaje).toMatch(/no encontramos/i);
    });

    it("429 dice que espere, no que reintente de inmediato", () => {
      const r = describeRequestError(conRespuesta(429));
      expect(r.codigo).toBe("demasiadas peticiones");
      expect(r.mensaje).toMatch(/espera/i);
    });

    it("otro 4xx cae a la general", () => {
      expect(describeRequestError(conRespuesta(422)).codigo).toBe("error 422");
    });
  });

  describe("sin respuesta si puede ser la conexion, y ahi si se dice", () => {
    it("timeout", () => {
      const r = describeRequestError(sinRespuesta("ECONNABORTED", "timeout of 20000ms exceeded"));
      expect(r.nuestra).toBe(false);
      expect(r.status).toBeNull();
      expect(r.codigo).toBe("tardó demasiado");
    });

    it("timeout detectado por el mensaje, sin el code", () => {
      expect(describeRequestError(sinRespuesta(undefined, "timeout exceeded")).codigo)
        .toBe("tardó demasiado");
    });

    it("red caida", () => {
      const r = describeRequestError(sinRespuesta("ERR_NETWORK"));
      expect(r.nuestra).toBe(false);
      expect(r.codigo).toBe("sin conexión");
      expect(r.mensaje).toMatch(/conexi[oó]n/i);
    });

    it("cualquier otra cosa", () => {
      expect(describeRequestError(sinRespuesta("LO_QUE_SEA")).codigo).toBe("sin respuesta");
    });
  });

  // Corre dentro de un catch: si revienta aqui, se lleva el manejo del error tambien.
  describe("entradas basura", () => {
    it("no revienta con nulos ni con formas raras", () => {
      [null, undefined, {}, { response: {} }, { response: { status: "quinientos" } }, "texto", 7]
        .forEach((e) => {
          expect(() => describeRequestError(e)).not.toThrow();
          const r = describeRequestError(e);
          expect(typeof r.mensaje).toBe("string");
          expect(r.mensaje.length).toBeGreaterThan(0);
          expect(typeof r.codigo).toBe("string");
        });
    });

    it("un status que no es numero cuenta como sin respuesta", () => {
      const r = describeRequestError({ response: { status: "quinientos" } });
      expect(r.status).toBeNull();
      expect(r.nuestra).toBe(false);
    });
  });

  it("siempre trae las cuatro llaves", () => {
    [conRespuesta(500), conRespuesta(404), sinRespuesta("ERR_NETWORK"), null].forEach((e) => {
      const r = describeRequestError(e);
      expect(Object.keys(r).sort()).toEqual(["codigo", "mensaje", "nuestra", "status"]);
    });
  });
});
