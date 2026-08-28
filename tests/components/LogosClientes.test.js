import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import LogosClientes from "src/components/LogosClientes.vue";

const montar = (clientes, props = {}) =>
  mount(LogosClientes, { props: { clientes, titulo: "Ya usan ComeleYa", ...props } });

const cliente = (n) => ({ name: `Negocio ${n}`, slug: `negocio-${n}`, logo: `https://cdn/${n}.jpg` });
const lista = (n) => Array.from({ length: n }, (_, i) => cliente(i));

describe("LogosClientes", () => {
  // Lo mas importante de todo: sin clientes no hay seccion. Un titulo que dice
  // "ya usan ComeleYa" encima de un hueco es peor que no decir nada.
  it("sin clientes no pinta ni el titulo", () => {
    const wrapper = montar([]);
    expect(wrapper.find(".mc-logos").exists()).toBe(false);
    expect(wrapper.text()).toBe("");
  });

  it("con clientes invalidos tampoco pinta nada", () => {
    expect(montar([{ logo: "https://cdn/x.jpg" }]).find(".mc-logos").exists()).toBe(false);
  });

  it("muestra el titulo que le pasan", () => {
    expect(montar(lista(5)).text()).toContain("Ya usan ComeleYa");
  });

  it("cada logo abre el menu del negocio en otra pestana", () => {
    const enlace = montar([cliente(1)]).find("a.mc-logos__cuadro");
    expect(enlace.attributes("href")).toBe("/negocio-1");
    expect(enlace.attributes("target")).toBe("_blank");
    expect(enlace.attributes("rel")).toContain("noopener");
  });

  it("pinta la imagen del cliente con su nombre como alt", () => {
    const img = montar([cliente(1)]).find("img");
    expect(img.attributes("src")).toBe("https://cdn/1.jpg");
    expect(img.attributes("alt")).toBe("Negocio 1");
  });

  it("un cliente sin logo sale con su nombre en texto", () => {
    const wrapper = montar([{ name: "Sin Logo", slug: "sin-logo", logo: null }]);
    expect(wrapper.find("img").exists()).toBe(false);
    expect(wrapper.find(".mc-logos__nombre").text()).toBe("Sin Logo");
  });

  // Una URL muerta deja el icono gris de imagen rota justo donde queriamos
  // presumir. Cae al nombre, igual que quien nunca subio logo.
  it("si la imagen no carga, cae al nombre", async () => {
    const wrapper = montar([cliente(1)]);
    await wrapper.find("img").trigger("error");
    expect(wrapper.find("img").exists()).toBe(false);
    expect(wrapper.find(".mc-logos__nombre").text()).toBe("Negocio 1");
  });

  it("con tres o menos no anima", () => {
    const wrapper = montar(lista(3));
    expect(wrapper.find(".mc-logos__pista--anima").exists()).toBe(false);
    expect(wrapper.findAll("a.mc-logos__cuadro")).toHaveLength(3);
  });

  it("con veinte clientes anima y duplica la pista", () => {
    const wrapper = montar(lista(20));
    expect(wrapper.find(".mc-logos__pista--anima").exists()).toBe(true);
    expect(wrapper.findAll("a.mc-logos__cuadro")).toHaveLength(40);
  });

  it("la variante cambia la clase del bloque", () => {
    expect(montar(lista(5), { variante: "oscura" }).find(".mc-logos--oscura").exists()).toBe(true);
    expect(montar(lista(5)).find(".mc-logos--clara").exists()).toBe(true);
  });
});
