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

  it("a un nuevo sin registro le sugiere la invitación a registrarse", () => {
    const [primera] = plantillasPara(sinRegistro());
    expect(primera.clave).toBe("registro");
    expect(primera.sugerida).toBe(true);
    expect(primera.texto).toContain("Hola Juan");
    expect(primera.texto).toContain("Tacos Juan");
    expect(primera.texto).toContain("15 días gratis");
    expect(primera.texto).toContain("/nuevo-establecimiento");
  });

  it("la presentación sigue disponible para un nuevo sin registro", () => {
    expect(plantillasPara(sinRegistro()).map((t) => t.clave)).toContain("presentacion");
  });

  it("la etapa cambia la sugerencia", () => {
    expect(plantillasPara(sinRegistro({ status: "contactado" }))[0].clave).toBe("demo");
    expect(plantillasPara(sinRegistro({ status: "cerrado_perdido" }))[0].clave).toBe("reactivar");
  });

  it("retomar a un registrado incluye la liga de su menú", () => {
    const perdido = registrado({ status: "cerrado_perdido" });
    const [primera] = plantillasPara(perdido);
    expect(primera.clave).toBe("reactivar");
    expect(primera.texto).toContain("https://comeleya.com/sushi-ana");
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

  it("al invitado que terminó sus correos y sigue sin cuenta le sugiere ayudarle a registrarse", () => {
    const invitado = sinRegistro({ activities: [{ description: "Recibió los 3 correos de invitación y sigue sin registrarse. Escríbele." }] });
    const [primera] = plantillasPara(invitado);
    expect(primera.clave).toBe("ayuda_registro");
    expect(primera.texto).not.toContain("Creaste");
    expect(primera.texto).toContain("15 días gratis");
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
