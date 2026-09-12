import { describe, it, expect } from "vitest";
import {
  ROLES,
  rolEn,
  puedeVerSeccion,
  puedeAbrirCajon,
  puedeExportarPedidos,
} from "src/utils/permisos.js";

/**
 * Que ve cada quien en el panel de un negocio.
 *
 * Una cajera solo ve Pedidos. El servidor es quien lo impide de verdad; estas reglas
 * cuidan que el panel no le enseñe botones que la mandarian a un 403.
 */

const negocio = (slug, role) => ({ slug, ...(role === undefined ? {} : { pivot: { role } }) });

describe("el rol en un negocio", () => {
  it("el super admin es super admin en cualquier negocio", () => {
    expect(rolEn({ role: "super_admin", establishments: [] }, "kazuki")).toBe(ROLES.SUPER_ADMIN);
  });

  it("sale del rol de la relacion con ESE negocio", () => {
    const user = { establishments: [negocio("kazuki", "propietario"), negocio("sushi", "cajero")] };
    expect(rolEn(user, "kazuki")).toBe(ROLES.PROPIETARIO);
    expect(rolEn(user, "sushi")).toBe(ROLES.CAJERO);
  });

  it("una sesion vieja sin rol guardado cuenta como dueño", () => {
    expect(rolEn({ establishments: [negocio("kazuki")] }, "kazuki")).toBe(ROLES.PROPIETARIO);
  });

  it("con filas repetidas, una de dueño basta", () => {
    const user = { establishments: [negocio("kazuki", "cajero"), negocio("kazuki", "propietario")] };
    expect(rolEn(user, "kazuki")).toBe(ROLES.PROPIETARIO);
  });

  it("un rol desconocido se trata como cajera: mejor enseñar de menos", () => {
    expect(rolEn({ establishments: [negocio("kazuki", "gerente")] }, "kazuki")).toBe(ROLES.CAJERO);
  });

  it("null si no pertenece al negocio o no hay usuario", () => {
    expect(rolEn({ establishments: [negocio("kazuki", "propietario")] }, "otro")).toBeNull();
    expect(rolEn(null, "kazuki")).toBeNull();
  });
});

describe("las secciones", () => {
  it("la cajera solo ve Pedidos, el Historial y el menu Mas", () => {
    for (const tab of ["pedidos_pendientes", "pedidos_historial", "mc_mas"]) {
      expect(puedeVerSeccion(ROLES.CAJERO, tab)).toBe(true);
    }
    for (const tab of ["dashboard", "productos", "sucursales", "mi_plan", "equipo", "", undefined]) {
      expect(puedeVerSeccion(ROLES.CAJERO, tab)).toBe(false);
    }
  });

  it("el dueño y el super admin lo ven todo", () => {
    expect(puedeVerSeccion(ROLES.PROPIETARIO, "mi_plan")).toBe(true);
    expect(puedeVerSeccion(ROLES.SUPER_ADMIN, "packages")).toBe(true);
    expect(puedeVerSeccion(null, "dashboard")).toBe(true);
  });
});

describe("los cajones y la exportacion", () => {
  it("la cajera solo abre su perfil", () => {
    expect(puedeAbrirCajon(ROLES.CAJERO, "perfil")).toBe(true);
    for (const cajon of ["configuracion", "direccion", "horario", "establecimiento", "ayuda"]) {
      expect(puedeAbrirCajon(ROLES.CAJERO, cajon)).toBe(false);
    }
    expect(puedeAbrirCajon(ROLES.PROPIETARIO, "configuracion")).toBe(true);
  });

  it("la cajera no exporta el CSV de pedidos", () => {
    expect(puedeExportarPedidos(ROLES.CAJERO)).toBe(false);
    expect(puedeExportarPedidos(ROLES.PROPIETARIO)).toBe(true);
  });
});
