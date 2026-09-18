import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { setActivePinia, createPinia } from "pinia";
import { useMainStore } from "stores/main-store";
import { matrizDe } from "src/utils/sucursales";

/**
 * El envío de cada sucursal.
 *
 * El costo y el radio eran del negocio entero. Ahora una sucursal puede cobrar distinto
 * —reparte más lejos, o en una zona donde el reparto cuesta más— y mientras no lo
 * prenda usa el del negocio.
 *
 * La herencia la resuelve el SERVIDOR y manda cada local con su `delivery` ya resuelto:
 * el número que ve el comensal antes de mandar y el que cobra el servidor salen de la
 * misma cuenta. Si aquí se volviera a resolver, tarde o temprano dirían cosas distintas.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const leer = (ruta) => readFileSync(resolve(AQUI, "../..", ruta), "utf8");

const POR_DISTANCIA = {
  delivery_mode: "distance",
  delivery_charge: 0,
  delivery_base_fee: 35,
  delivery_base_km: 2,
  delivery_per_km: 5,
  delivery_max_km: 15,
  delivery_free_from: 0,
};

describe("el costo que ve el comensal", () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useMainStore();
    store.companyStore.company = {
      coordinates: "25.7925,-108.9807",
      isOpen: true,
      ...POR_DISTANCIA,
      active_branches: [
        {
          id: 7,
          name: "Norte",
          coordinates: "25.8465,-108.9807",
          is_open: true,
          hours: [],
          // Norte cobra tarifa fija de $60, distinta a la del negocio.
          delivery: { ...POR_DISTANCIA, delivery_mode: "flat", delivery_charge: 60 },
        },
        {
          id: 2,
          name: "Sur",
          coordinates: "25.75,-108.98",
          is_open: true,
          hours: [],
          // Sur hereda: el servidor manda la del negocio tal cual.
          delivery: { ...POR_DISTANCIA },
        },
      ],
    };
    store.userStore.data.delivery = "Envio";
    store.userStore.data.distance = 6;
  });

  it("cobra la tarifa propia de la sucursal elegida", () => {
    store.elegirSucursal(7);

    expect(store.deliveryCharge).toBe(60);
  });

  it("la que hereda cobra con la cuenta del negocio", () => {
    store.elegirSucursal(2);

    // 35 de base (2 km incluidos) + 4 km extra x 5 = 55
    expect(store.deliveryCharge).toBe(55);
  });

  it("la Matriz usa la del negocio", () => {
    store.elegirSucursal("matriz");

    expect(store.deliveryCharge).toBe(55);
  });

  it("el radio propio decide si está cubierto", () => {
    const norte = store.companyStore.company.active_branches[0];
    norte.delivery = { ...POR_DISTANCIA, delivery_max_km: 3 };
    store.elegirSucursal(7);

    // El cliente está a 6 km: fuera del radio de Norte, dentro del del negocio.
    expect(store.deliveryCovered).toBe(false);

    store.elegirSucursal(2);
    expect(store.deliveryCovered).toBe(true);
  });

  it("en un negocio de un solo local nada cambia", () => {
    store.companyStore.company.active_branches = [];

    expect(store.deliveryCharge).toBe(55);
    expect(store.deliveryCovered).toBe(true);
  });

  it("sin distancia, el envío queda marcado como estimado", () => {
    store.userStore.data.distance = null;
    store.elegirSucursal(2);

    expect(store.deliveryEstimated).toBe(true);
    // Sin tarifa fija configurada cae a la base, no a cero.
    expect(store.deliveryCharge).toBe(35);
  });
});

describe("la Matriz", () => {
  it("lleva el envío del negocio con la misma forma que una sucursal", () => {
    const matriz = matrizDe({ ...POR_DISTANCIA, coordinates: "25.79,-108.98" });

    expect(matriz.delivery.delivery_mode).toBe("distance");
    expect(matriz.delivery.delivery_base_fee).toBe(35);
  });

  it("un negocio sin envío configurado no se queda con campos indefinidos", () => {
    const matriz = matrizDe({});

    expect(matriz.delivery.delivery_mode).toBe("flat");
    expect(matriz.delivery.delivery_charge).toBe(0);
  });
});

describe("el formulario de la sucursal", () => {
  const src = leer("src/components/admin/Sucursales.vue");

  it("tiene el interruptor de envío propio, apagado por omisión", () => {
    expect(src).toMatch(/v-model="forma\.delivery_own"/);
    expect(src).toMatch(/delivery_own: false/);
  });

  it("los campos solo aparecen con el interruptor prendido", () => {
    expect(src).toMatch(/v-if="forma\.delivery_own"/);
  });

  it("avisa que sin ubicación no se puede cobrar por distancia", () => {
    expect(src).toMatch(/Para cobrar por distancia, esta sucursal necesita su ubicación/);
  });
});

describe("el cálculo del envío", () => {
  const src = leer("src/stores/main-store.js");

  it("sale de la config del local, no de la del negocio", () => {
    expect(src).toMatch(/configDeEnvio\(\) \{/);
    expect(src).toMatch(/this\.sucursalElegida\?\.delivery \?\? this\.establishment/);
  });

  it("no vuelve a resolver la herencia en el navegador", () => {
    // Si el navegador decidiera por su cuenta cuándo hereda, tarde o temprano diría un
    // número distinto al que cobra el servidor.
    const calculo = src.slice(src.indexOf("deliveryCharge() {"), src.indexOf("deliveryEstimated()"));
    expect(calculo).not.toMatch(/delivery_own/);
  });
});
