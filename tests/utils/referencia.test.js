import { describe, it, expect, beforeEach } from "vitest";
import { guardarReferencia, leerReferencia } from "src/utils/referencia.js";

/**
 * De que menu llego quien se registra.
 *
 * La liga "Menu hecho con ComeleYa" trae ?ref=<negocio>. Quien la sigue casi nunca se
 * registra en ese momento, asi que la referencia se guarda al llegar y se lee en el alta.
 */

const DIA = 24 * 60 * 60 * 1000;

describe("la referencia de quien llega desde un menu", () => {
  beforeEach(() => localStorage.clear());

  it("se guarda al llegar y se lee al registrarse", () => {
    guardarReferencia({ ref: "kazuki-sushi-delivery" });
    expect(leerReferencia()).toBe("kazuki-sushi-delivery");
  });

  it("una pagina sin ref no borra la que ya traia", () => {
    guardarReferencia({ ref: "kazuki" });
    guardarReferencia({});
    guardarReferencia(undefined);
    expect(leerReferencia()).toBe("kazuki");
  });

  it("la ultima liga que siguio es la que cuenta", () => {
    guardarReferencia({ ref: "kazuki" });
    guardarReferencia({ ref: "sushi-express" });
    expect(leerReferencia()).toBe("sushi-express");
  });

  it("a los 30 dias ya no cuenta", () => {
    const ahora = Date.now();
    guardarReferencia({ ref: "kazuki" }, ahora - 31 * DIA);
    expect(leerReferencia(ahora)).toBeNull();

    guardarReferencia({ ref: "kazuki" }, ahora - 29 * DIA);
    expect(leerReferencia(ahora)).toBe("kazuki");
  });

  it("acomoda mayusculas y espacios", () => {
    guardarReferencia({ ref: "  Kazuki " });
    expect(leerReferencia()).toBe("kazuki");
  });

  it("no guarda algo que no parece un negocio", () => {
    guardarReferencia({ ref: "<script>" });
    guardarReferencia({ ref: "../../admin" });
    guardarReferencia({ ref: "" });
    expect(leerReferencia()).toBeNull();
  });

  it("si lo guardado esta roto no truena", () => {
    localStorage.setItem("mc-ref", "{no es json");
    expect(leerReferencia()).toBeNull();
  });
});
