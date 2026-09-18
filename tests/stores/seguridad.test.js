import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { setActivePinia, createPinia } from "pinia";
import { api } from "boot/axios";
import { useUserStore } from "stores/user-store";

/**
 * Lo que cerró una revisión de seguridad (18 sep 2026).
 *
 * Cada prueba de aquí corresponde a un agujero encontrado leyendo el código. Están
 * juntas a propósito: si alguien vuelve a abrir uno, esto lo dice por su nombre.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const leer = (ruta) => readFileSync(resolve(AQUI, "../..", ruta), "utf8");

describe("el JSON-LD del menú no puede cerrar su propio script", () => {
  // metadata.php pinta el <head> de TODAS las páginas de comeleya.com, y el token del
  // panel vive en el localStorage de ese origen. Un "</script>" en el nombre de un
  // platillo ejecutaba JavaScript de quien lo publicó.
  const src = leer("metadata.php");

  it("codifica los signos de menor y mayor", () => {
    expect(src).toMatch(/json_encode\(\$jsonLd,[^)]*JSON_HEX_TAG/);
  });

  it("ya no desescapa las diagonales, que eran la segunda red", () => {
    const llamada = src.match(/json_encode\(\$jsonLd,[^)]*\)/)[0];
    expect(llamada).not.toMatch(/JSON_UNESCAPED_SLASHES/);
  });
});

describe("el corte de caja se imprime escapado", () => {
  // El método de pago lo escribe el comensal: un valor desconocido se guarda tal cual
  // para no perder el pedido, y de ahí llegaba crudo a un document.write con la sesión
  // del panel abierta.
  const src = leer("src/components/admin/CorteDeCaja.vue");

  it("usa el mismo esc del ticket", () => {
    expect(src).toMatch(/import \{ esc \} from "src\/utils\/orderTicket"/);
  });

  it("escapa el método de pago, el nombre del negocio y el del local", () => {
    expect(src).toMatch(/esc\(metodo\(m\.method\)\)/);
    expect(src).toMatch(/esc\(adminStore\.company\?\.name/);
    expect(src).toMatch(/esc\(c\.local\.nombre\)/);
  });

  it("lo que se interpola ya viene escapado de su asignación", () => {
    const impresion = src.slice(src.indexOf("const imprimir"));
    // ${nombre} sí aparece, pero la variable se armó con esc(); lo que no debe quedar
    // es una llamada cruda dentro de la plantilla.
    expect(impresion).not.toMatch(/\$\{metodo\(/);
    expect(impresion).toMatch(/const nombre = esc\(/);
  });
});

describe("cerrar sesión", () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    store = useUserStore();
    store.token = "un-token";
    store.user = { name: "Ana" };
  });

  it("le pide al servidor que invalide el token", async () => {
    api.post.mockResolvedValue({ data: {} });

    await store.cerrarSesion();

    expect(api.post).toHaveBeenCalledWith("/logout", null, {
      headers: { Authorization: "Bearer un-token" },
    });
    expect(store.token).toBeNull();
    expect(store.user).toBeNull();
  });

  it("sale igual si el servidor no contesta: quedarse dentro es peor", async () => {
    api.post.mockRejectedValue(new Error("sin red"));

    await store.cerrarSesion();

    expect(store.token).toBeNull();
  });

  it("sin token no molesta al servidor", async () => {
    store.token = null;

    await store.cerrarSesion();

    expect(api.post).not.toHaveBeenCalled();
  });

  it("el botón de salir del panel pasa por ahí", () => {
    expect(leer("src/stores/admin-store.js")).toMatch(/await this\.userStore\.cerrarSesion\(\)/);
  });
});
