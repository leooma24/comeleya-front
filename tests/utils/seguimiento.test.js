import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { rutaDeSeguimiento, ligaDeSeguimiento } from "src/utils/seguimiento";

/**
 * La liga del seguimiento lleva la llave del pedido.
 *
 * El número del pedido es 1, 2, 3… por negocio: sirve para entenderse por teléfono,
 * pero como llave no vale nada. Con él solo se leían de corrido todos los pedidos de
 * cualquier restaurante. Lo que abre la página es el token, y tiene que ir en las
 * cuatro ligas que ve el cliente: el botón de "Seguir mi pedido", el mensaje de
 * WhatsApp, su historial guardado en el navegador y los correos del servidor.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const leer = (ruta) => readFileSync(resolve(AQUI, "../..", ruta), "utf8");

describe("rutaDeSeguimiento", () => {
  it("lleva el token cuando lo hay", () => {
    expect(rutaDeSeguimiento("kazuki", 84, "abc123")).toBe("/kazuki/pedido/84?t=abc123");
  });

  it("sin token se queda como antes: los pedidos viejos siguen abriéndose", () => {
    expect(rutaDeSeguimiento("kazuki", 84, null)).toBe("/kazuki/pedido/84");
    expect(rutaDeSeguimiento("kazuki", 84, undefined)).toBe("/kazuki/pedido/84");
    expect(rutaDeSeguimiento("kazuki", 84, "")).toBe("/kazuki/pedido/84");
  });

  it("escapa el token, que va en un parámetro", () => {
    expect(rutaDeSeguimiento("kazuki", 1, "a b&c")).toBe("/kazuki/pedido/1?t=a%20b%26c");
  });

  it("la absoluta le pega el origen, para el mensaje de WhatsApp", () => {
    expect(ligaDeSeguimiento("https://comeleya.com", "kazuki", 7, "tok")).toBe(
      "https://comeleya.com/kazuki/pedido/7?t=tok"
    );
  });
});

describe("las cuatro ligas del cliente", () => {
  it("el botón de 'Seguir mi pedido' la arma con el token", () => {
    expect(leer("src/components/client/ValidationDialog.vue")).toMatch(
      /rutaDeSeguimiento\(\s*mainStore\.companyStore\.slug/
    );
  });

  it("el mensaje de WhatsApp también", () => {
    const src = leer("src/stores/main-store.js");
    expect(src).toMatch(/Seguimiento: \$\{ligaDeSeguimiento\(/);
    expect(src).not.toMatch(/Seguimiento: \$\{window\.location\.origin\}/);
  });

  it("el historial del navegador guarda el token del pedido", () => {
    expect(leer("src/stores/main-store.js")).toMatch(/tracking_token: data\.tracking_token/);
    expect(leer("src/components/client/OrderHistory.vue")).toMatch(
      /rutaDeSeguimiento\(order\.establishment, order\.order_code, order\.tracking_token\)/
    );
  });

  it("la página de seguimiento le pasa el token al servidor", () => {
    const src = leer("src/pages/OrderTrackingPage.vue");
    expect(src).toMatch(/route\.query\.t/);
    expect(src).toMatch(/params: token \? \{ t: token \} : \{\}/);
  });
});
