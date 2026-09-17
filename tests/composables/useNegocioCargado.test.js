import { describe, it, expect, beforeEach, vi } from "vitest";
import { effectScope, reactive, nextTick } from "vue";
import { setActivePinia, createPinia } from "pinia";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ruta = reactive({ params: { slug: "kazuki-sushi-delivery" } });
vi.mock("vue-router", () => ({ useRoute: () => ruta }));

import { useNegocioCargado } from "src/composables/useNegocioCargado";
import { useCompanyStore } from "stores/company-store";

/**
 * Reseñas y lealtad del negocio correcto.
 *
 * El negocio se guarda entre visitas. Al abrir el menu de Kazuki, companyStore todavia
 * traia el de la visita anterior, y la barra lateral pedia las reseñas y los puntos de
 * ese otro restaurante (sushi-express) antes de que cargara Kazuki.
 */
describe("useNegocioCargado", () => {
  let company;
  let llamadas;
  let scope;

  beforeEach(() => {
    setActivePinia(createPinia());
    company = useCompanyStore();
    llamadas = [];
    ruta.params.slug = "kazuki-sushi-delivery";
    scope = effectScope();
  });

  const montar = () => scope.run(() => useNegocioCargado((slug) => llamadas.push(slug)));

  it("con el negocio de la visita anterior guardado no pide nada", async () => {
    company.company = { slug: "sushi-express" };
    montar();
    await nextTick();

    expect(llamadas).toEqual([]);
  });

  it("pide en cuanto carga el negocio de la ruta, con su slug", async () => {
    company.company = { slug: "sushi-express" };
    montar();

    company.company = { slug: "kazuki-sushi-delivery" };
    await nextTick();

    expect(llamadas).toEqual(["kazuki-sushi-delivery"]);
  });

  it("si ya estaba cargado, pide de inmediato una sola vez", async () => {
    company.company = { slug: "kazuki-sushi-delivery" };
    montar();
    await nextTick();

    expect(llamadas).toEqual(["kazuki-sushi-delivery"]);
  });

  it("sin slug en la ruta no pide", async () => {
    ruta.params.slug = undefined;
    company.company = { slug: "" };
    montar();
    await nextTick();

    expect(llamadas).toEqual([]);
  });
});

/**
 * La API en el mismo host del menu (comeleya.com/api).
 *
 * Con la API en app.comeleya.com -misma IP, certificado que cubre *.comeleya.com,
 * HTTP/2- Safari mandaba sus peticiones por la conexion de comeleya.com y Apache
 * respondia 421 sin CORS: el menu decia "sin conexion".
 */
describe("la API en comeleya.com/api", () => {
  const AQUI = dirname(fileURLToPath(import.meta.url));
  const leer = (ruta) => readFileSync(resolve(AQUI, "../..", ruta), "utf8");

  it("en produccion se pide con ruta relativa", () => {
    expect(leer("src/boot/axios.js")).toMatch(/import\.meta\.env\.PROD \? "\/api\/"/);
  });

  it("el service worker no mete la API a su cache", () => {
    const sw = leer("public/sw.js");
    expect(sw).toMatch(/url\.pathname\.startsWith\("\/api\/"\)\) return;/);
    // Y el chequeo va antes de responder con la cache de assets.
    expect(sw.indexOf('startsWith("/api/")')).toBeLessThan(sw.indexOf("caches.match(req).then"));
  });

  it("el feed de Meta lleva una direccion completa aunque la API sea relativa", () => {
    expect(leer("src/components/admin/FacebookCatalog.vue")).toMatch(/const API_PUBLICA = "https:\/\/app\.comeleya\.com\/api"/);
  });

  it("la barra lateral y la lealtad esperan al negocio de la ruta", () => {
    expect(leer("src/components/client/Sidebar.vue")).toMatch(/useNegocioCargado\(/);
    expect(leer("src/components/client/LoyaltyBanner.vue")).toMatch(/useNegocioCargado\(/);
    expect(leer("src/components/client/LoyaltyBanner.vue")).not.toMatch(/onMounted/);
  });
});
