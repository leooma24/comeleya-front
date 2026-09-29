import { describe, it, expect } from "vitest";
import { plantillasPara, ultimoHito } from "src/utils/plantillasWhatsApp.js";

const sinRegistro = (extra = {}) => ({
  name: "Juan Pérez", business_name: "Tacos Juan", status: "nuevo", establishment_id: null, ...extra,
});
const registrado = (extra = {}) => ({
  name: "Ana", business_name: "Sushi Ana", status: "nuevo", establishment_id: 7,
  establishment: { slug: "sushi-ana" }, activities: [], ...extra,
});

describe("plantillas de WhatsApp", () => {
  it("a quien no se registró no le dice que creó su cuenta", () => {
    const todas = plantillasPara(sinRegistro()).map((t) => t.texto).join(" ");
    expect(todas).not.toMatch(/creaste/i);
    expect(todas).not.toMatch(/usuario/i);
  });

  it("sugiere presentar ComeleYa a un nuevo sin registro", () => {
    const [primera] = plantillasPara(sinRegistro());
    expect(primera.clave).toBe("presentacion");
    expect(primera.sugerida).toBe(true);
    expect(primera.texto).toContain("Hola Juan");
    expect(primera.texto).toContain("Tacos Juan");
  });

  it("la etapa cambia la sugerencia", () => {
    expect(plantillasPara(sinRegistro({ status: "contactado" }))[0].clave).toBe("demo");
    expect(plantillasPara(sinRegistro({ status: "cerrado_perdido" }))[0].clave).toBe("reactivar");
  });

  it("firma con el nombre de quien escribe", () => {
    expect(plantillasPara(sinRegistro(), "Alberto Montoya")[0].texto).toContain("soy Alberto de ComeleYa");
  });

  it("al registrado le sugiere según lo último que hizo", () => {
    const conPedido = registrado({ activities: [{ description: "Hito: recibió su primer pedido. Buen momento para hablarle." }] });
    expect(plantillasPara(conPedido)[0].clave).toBe("pedidos");

    const porVencer = registrado({ activities: [{ description: "Hito: su prueba gratis vence el 02/10. Ofrécele su plan." }] });
    expect(plantillasPara(porVencer)[0].clave).toBe("prueba");
  });

  it("registrado sin hitos: ayudarle a subir su menú", () => {
    expect(plantillasPara(registrado())[0].clave).toBe("sin_menu");
  });

  it("incluye la liga de su menú", () => {
    const menu = plantillasPara(registrado()).find((t) => t.clave === "menu");
    expect(menu.texto).toContain("https://comeleya.com/sushi-ana");
  });

  it("ultimoHito ignora las notas que no son hitos", () => {
    expect(ultimoHito({ activities: [{ description: "Le llamé" }] })).toBeNull();
  });
});
