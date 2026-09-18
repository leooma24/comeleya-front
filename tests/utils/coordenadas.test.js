import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { coordenadasDeTexto, pareceLiga } from "src/utils/coordenadas";

/**
 * De una liga de Google Maps a las coordenadas del local.
 *
 * Caso real (18 sep 2026): la sucursal Alameda de Sushi Express quedó sin ubicación, y
 * en el formulario aparecía 25.797238,-108.994033 — la ubicación del teléfono de quien
 * tocó "usar mi ubicación" desde su oficina, a 2.7 km del local. Sin coordenadas, esa
 * sucursal cobra la tarifa fija en vez del envío por distancia.
 *
 * El dueño no sabe las coordenadas de su local, pero sí lo tiene en Google Maps.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const leer = (ruta) => readFileSync(resolve(AQUI, "../..", ruta), "utf8");

// La liga que mandó el cliente, tal cual.
const LIGA_ALAMEDA =
  "https://www.google.com/maps/place/Sushi+Express+Alameda+%7C+Restaurante/@25.7738147,-109.0168714,1064m/data=!3m1!1e3!4m15!1m8!3m7!1s0x86ba2592e673e181:0xbf58d3eab5bfabf3!2sSushi+Express+Alameda+%7C+Restaurante!8m2!3d25.7738148!4d-109.0120005!10e1!16s%2Fg%2F11cjkrxn78!3m5!1s0x86ba2592e673e181:0xbf58d3eab5bfabf3!8m2!3d25.7738148!4d-109.0120005!16s%2Fg%2F11cjkrxn78?entry=ttu";

describe("coordenadasDeTexto", () => {
  it("de la liga saca el LUGAR, no dónde estaba la cámara", () => {
    // @25.7738147,-109.0168714 es el encuadre: queda a ~500 m del local.
    // !3d25.7738148!4d-109.0120005 es el negocio. Ese es el que sirve.
    // Se guarda con seis decimales, que son ~10 cm: el ultimo digito de Google sobra.
    expect(coordenadasDeTexto(LIGA_ALAMEDA)).toBe("25.773815,-109.012000");
  });

  it("lee una liga de búsqueda", () => {
    expect(coordenadasDeTexto("https://www.google.com/maps?q=25.797238,-108.994033")).toBe(
      "25.797238,-108.994033"
    );
    expect(coordenadasDeTexto("https://maps.google.com/?query=25.77,-109.01")).toBe(
      "25.770000,-109.010000"
    );
  });

  it("lee la coma escapada, que es como llega pegada de algunos navegadores", () => {
    expect(coordenadasDeTexto("https://www.google.com/maps?q=25.7738%2C-109.0120")).toBe(
      "25.773800,-109.012000"
    );
  });

  it("si solo trae la cámara, la usa: es mejor que nada", () => {
    expect(coordenadasDeTexto("https://www.google.com/maps/@25.7738147,-109.0168714,17z")).toBe(
      "25.773815,-109.016871"
    );
  });

  it("acepta coordenadas escritas a mano, con o sin espacios", () => {
    expect(coordenadasDeTexto("25.7925,-108.9807")).toBe("25.792500,-108.980700");
    expect(coordenadasDeTexto(" 25.7925 , -108.9807 ")).toBe("25.792500,-108.980700");
  });

  it("no inventa nada cuando ahí no hay un punto", () => {
    expect(coordenadasDeTexto("")).toBeNull();
    expect(coordenadasDeTexto(null)).toBeNull();
    expect(coordenadasDeTexto("Blvd Rosales 120")).toBeNull();
    expect(coordenadasDeTexto("https://maps.app.goo.gl/abc123")).toBeNull();
  });

  it("descarta lo que no es una ubicación de este mundo", () => {
    expect(coordenadasDeTexto("95.5,-108.98")).toBeNull();
    expect(coordenadasDeTexto("25.79,-200.1")).toBeNull();
    // 0,0 es el Golfo de Guinea: es un campo a medio llenar, no un local.
    expect(coordenadasDeTexto("0,0")).toBeNull();
  });
});

describe("pareceLiga", () => {
  it("distingue una liga de unas coordenadas", () => {
    expect(pareceLiga(LIGA_ALAMEDA)).toBe(true);
    expect(pareceLiga("https://maps.app.goo.gl/abc")).toBe(true);
    expect(pareceLiga("25.7925,-108.9807")).toBe(false);
    expect(pareceLiga("")).toBe(false);
  });
});

describe("el formulario de sucursales", () => {
  const src = leer("src/components/admin/Sucursales.vue");

  it("traduce la liga al pegarla y al salir del campo", () => {
    expect(src).toMatch(/@paste="alPegarUbicacion"/);
    expect(src).toMatch(/@blur="traducirLiga"/);
  });

  it("puede ubicar por la dirección ya capturada", () => {
    expect(src).toMatch(/\/establishment\/\$\{adminStore\.slug\}\/geocode/);
    expect(src).toMatch(/label="Ubicar por la dirección"/);
  });

  it("el 'Ver en el mapa' usa las coordenadas ya traducidas, no la liga pegada", () => {
    expect(src).toMatch(/v-if="coordenadasListas"/);
    expect(src).toMatch(/'https:\/\/maps\.google\.com\/\?q=' \+ coordenadasListas/);
  });

  it("guardar traduce la liga aunque nunca se haya salido del campo", () => {
    // Pegar y darle Guardar es lo normal, y el evento de salida no siempre corre.
    const guardar = src.slice(src.indexOf("const guardar = "), src.indexOf("const alternar = "));
    expect(guardar).toMatch(/coordenadasDeTexto\(forma\.value\.coordinates\)/);
    // Y si no se entiende, no se manda una URL entera a la columna de coordenadas.
    expect(guardar).toMatch(/Esa ubicación no se entiende/);
  });

  it("el C.P. va antes que la calle: de él salen colonia, ciudad y estado", () => {
    const direccion = src.slice(src.indexOf('title="Dirección"'), src.indexOf('title="Ubicación en el mapa"'));
    expect(direccion.indexOf('label="C.P."')).toBeLessThan(direccion.indexOf('label="Calle"'));
  });
});
