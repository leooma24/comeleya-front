import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { paraWhatsApp, soloDigitos } from "src/utils/telefono";

/**
 * El teléfono del comensal en la tarjeta del pedido.
 *
 * Pedido de un cliente (18 sep 2026): el número ya viajaba en la respuesta y ya salía
 * impreso en el ticket, pero en la pantalla no estaba. Para llamarle —"no encuentro tu
 * casa", "ya llegué"— había que imprimir el pedido.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const leer = (ruta) => readFileSync(resolve(AQUI, "../..", ruta), "utf8");

describe("paraWhatsApp", () => {
  it("le pone la lada de México a un número de diez dígitos", () => {
    expect(paraWhatsApp("6681234567")).toBe("526681234567");
  });

  it("limpia lo que el comensal escribió a su manera", () => {
    expect(paraWhatsApp("(668) 123-4567")).toBe("526681234567");
    expect(paraWhatsApp("668 123 4567")).toBe("526681234567");
  });

  it("respeta el que ya trae lada", () => {
    expect(paraWhatsApp("526681234567")).toBe("526681234567");
    expect(paraWhatsApp("+52 668 123 4567")).toBe("526681234567");
  });

  it("no inventa lada en un número que no es de diez dígitos", () => {
    expect(paraWhatsApp("12345")).toBe("12345");
    expect(paraWhatsApp("")).toBe("");
    expect(paraWhatsApp(null)).toBe("");
  });

  it("soloDigitos deja el número como lo entiende wa.me", () => {
    expect(soloDigitos("(668) 123-4567")).toBe("6681234567");
  });
});

describe("la tarjeta del pedido", () => {
  const src = leer("src/components/admin/Orders.vue");

  it("enseña el teléfono del comensal", () => {
    expect(src).toMatch(/v-if="order\.phone"/);
    expect(src).toMatch(/\{\{ order\.phone \}\}/);
  });

  it("se puede marcar y abrir WhatsApp desde ahí", () => {
    expect(src).toMatch(/:href="`tel:\$\{order\.phone\}`"/);
    expect(src).toMatch(/paraWhatsApp\(order\.phone\)/);
  });

  it("tocar el teléfono no abre el pedido: la tarjeta entera es clicable", () => {
    const bloque = src.slice(src.indexOf('v-if="order.phone"'), src.indexOf('v-if="order.phone"') + 700);
    expect(bloque.match(/@click\.stop/g)?.length).toBeGreaterThanOrEqual(2);
  });
});
