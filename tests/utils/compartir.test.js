import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { compartirLink } from "src/utils/compartir";

/**
 * El boton de compartir. Cada prueba de aqui es una de las formas en las que se
 * quedaba mudo: el comensal tocaba y no pasaba nada, ni ventana ni aviso.
 */
describe("compartir un enlace del menu", () => {
  let abrir;

  const conShare = (impl) => {
    Object.defineProperty(navigator, "share", {
      value: vi.fn(impl),
      configurable: true,
      writable: true,
    });
    return navigator.share;
  };

  const sinShare = () => {
    delete navigator.share;
    delete navigator.canShare;
  };

  const conPortapapeles = (impl) => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn(impl) },
      configurable: true,
      writable: true,
    });
    return navigator.clipboard.writeText;
  };

  const sinPortapapeles = () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
      writable: true,
    });
  };

  beforeEach(() => {
    abrir = vi.spyOn(window, "open").mockReturnValue({});
    sinShare();
    sinPortapapeles();
    document.execCommand = vi.fn(() => false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    sinShare();
  });

  it("sin enlace no intenta nada", async () => {
    await expect(compartirLink({ text: "hola" })).resolves.toBe("fallo");
    expect(abrir).not.toHaveBeenCalled();
  });

  it("usa la hoja del sistema cuando el navegador la trae", async () => {
    const share = conShare(() => Promise.resolve());

    const fin = await compartirLink({
      title: "Maguro Roll",
      text: "Maguro Roll - $120 en Kazuki",
      url: "https://comeleya.com/kazuki/maguro-roll",
    });

    expect(fin).toBe("compartido");
    expect(share).toHaveBeenCalledWith({
      title: "Maguro Roll",
      text: "Maguro Roll - $120 en Kazuki",
      url: "https://comeleya.com/kazuki/maguro-roll",
    });
    expect(abrir).not.toHaveBeenCalled();
  });

  it("si el comensal cierra la hoja, no se le abre WhatsApp encima", async () => {
    conShare(() => Promise.reject(Object.assign(new Error("cerrada"), { name: "AbortError" })));

    const fin = await compartirLink({ text: "Mira", url: "https://comeleya.com/kazuki" });

    expect(fin).toBe("cancelado");
    expect(abrir).not.toHaveBeenCalled();
  });

  it("dentro de un iframe sin permiso, se va a WhatsApp en vez de quedarse mudo", async () => {
    // NotAllowedError es lo que devuelve un iframe sin allow="web-share": el caso que
    // traia el boton muerto en los menus embebidos en el sitio del negocio.
    conShare(() =>
      Promise.reject(Object.assign(new Error("denegado"), { name: "NotAllowedError" }))
    );

    const fin = await compartirLink({
      text: "Maguro Roll - $120 en Kazuki",
      url: "https://comeleya.com/kazuki/maguro-roll",
    });

    expect(fin).toBe("whatsapp");
    expect(abrir).toHaveBeenCalledTimes(1);
    const [url] = abrir.mock.calls[0];
    expect(decodeURIComponent(url)).toContain(
      "Maguro Roll - $120 en Kazuki https://comeleya.com/kazuki/maguro-roll"
    );
  });

  it("si el navegador dice que no puede compartir eso, ni lo intenta", async () => {
    const share = conShare(() => Promise.resolve());
    navigator.canShare = vi.fn(() => false);

    const fin = await compartirLink({ text: "Mira", url: "https://comeleya.com/kazuki" });

    expect(share).not.toHaveBeenCalled();
    expect(fin).toBe("whatsapp");
  });

  it("sin hoja del sistema -el escritorio de siempre- abre WhatsApp", async () => {
    const fin = await compartirLink({ text: "Mira", url: "https://comeleya.com/kazuki" });

    expect(fin).toBe("whatsapp");
    expect(abrir.mock.calls[0][0]).toContain("https://wa.me/?text=");
  });

  it("con el popup bloqueado, al menos deja el link copiado", async () => {
    abrir.mockReturnValue(null);
    const copiar = conPortapapeles(() => Promise.resolve());

    const fin = await compartirLink({ text: "Mira", url: "https://comeleya.com/kazuki" });

    expect(fin).toBe("copiado");
    expect(copiar).toHaveBeenCalledWith("https://comeleya.com/kazuki");
  });

  it("si el portapapeles moderno se niega, prueba el viejo", async () => {
    abrir.mockReturnValue(null);
    conPortapapeles(() => Promise.reject(new Error("sin permiso")));
    document.execCommand = vi.fn(() => true);

    const fin = await compartirLink({ text: "Mira", url: "https://comeleya.com/kazuki" });

    expect(fin).toBe("copiado");
    expect(document.execCommand).toHaveBeenCalledWith("copy");
  });

  it("cuando de plano no se puede, lo dice y no se queda callado", async () => {
    abrir.mockReturnValue(null);

    const fin = await compartirLink({ text: "Mira", url: "https://comeleya.com/kazuki" });

    expect(fin).toBe("fallo");
  });

  it("embebido: le pide a la pagina de arriba que abra WhatsApp", async () => {
    vi.useFakeTimers();
    abrir.mockReturnValue(null);
    // Contesta como lo hace public/embed.js cuando si pudo abrirlo.
    const padre = {
      postMessage: vi.fn(() =>
        window.dispatchEvent(
          Object.assign(new Event("message"), { data: { type: "comeleya:abierto" } })
        )
      ),
    };
    vi.spyOn(window, "parent", "get").mockReturnValue(padre);

    const promesa = compartirLink({ text: "Mira", url: "https://comeleya.com/kazuki" });
    await vi.advanceTimersByTimeAsync(1500);

    expect(padre.postMessage).toHaveBeenCalledWith(
      { type: "comeleya:abrir", url: expect.stringContaining("https://wa.me/?text=") },
      "*"
    );
    await expect(promesa).resolves.toBe("whatsapp");
  });

  it("embebido y sin embed.js arriba: nadie abre nada, asi que se copia", async () => {
    vi.useFakeTimers();
    abrir.mockReturnValue(null);
    vi.spyOn(window, "parent", "get").mockReturnValue({ postMessage: vi.fn() });
    conPortapapeles(() => Promise.resolve());

    const promesa = compartirLink({ text: "Mira", url: "https://comeleya.com/kazuki" });
    await vi.advanceTimersByTimeAsync(1500);

    await expect(promesa).resolves.toBe("copiado");
  });
});
