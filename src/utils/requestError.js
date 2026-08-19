// Qué falló, en una línea que sirva para el comensal y para nosotros.
//
// Nace del bug de la zona horaria: durante quién sabe cuánto tiempo el menú respondió
// 500 para ciertos teléfonos, y la pantalla decía "Revisa tu conexión". El comensal
// revisaba su wifi, el dueño no entendía por qué se quejaban, y el error se perdía en
// un `catch` que no guardaba nada. Se encontró bajando 91 MB de log por FTP.
//
// La regla que sale de ahí: si el servidor CONTESTÓ, la culpa es nuestra y el mensaje
// no puede mandar al comensal a revisar su internet.

// El primero que empate gana, así que van del más específico al más general.
const RESPUESTAS = [
  {
    prueba: (s) => s === 404,
    codigo: () => "no encontrado",
    mensaje: "No encontramos este restaurante.",
  },
  {
    prueba: (s) => s === 429,
    codigo: () => "demasiadas peticiones",
    mensaje:
      "Hay demasiadas solicitudes en este momento. Espera unos segundos y vuelve a intentarlo.",
  },
  {
    prueba: (s) => s >= 500,
    // No dice "servidor": el comensal no tiene por qué saber que existe uno. Dice lo
    // único que le sirve —que no es culpa suya y que puede reintentar— y el código va
    // aparte, para cuando mande el screenshot.
    codigo: (s) => `error ${s}`,
    mensaje: "Tuvimos un problema de este lado. Vuelve a intentarlo en un momento.",
  },
  {
    prueba: (s) => s >= 400,
    codigo: (s) => `error ${s}`,
    mensaje: "No pudimos completar la solicitud.",
  },
];

/**
 * Traduce un error de axios a algo que se pueda mostrar y reportar.
 *
 * Devuelve:
 *   - `codigo`: token corto y técnico, para enseñarlo chiquito y para el reporte.
 *   - `mensaje`: la frase que lee el comensal.
 *   - `nuestra`: true si el servidor contestó con error. Es lo que decide si el
 *     mensaje puede o no mandarlo a revisar su conexión.
 *   - `status`: el HTTP, o null si nunca hubo respuesta.
 */
export function describeRequestError(error) {
  const status = Number(error?.response?.status) || null;

  if (status) {
    const regla = RESPUESTAS.find((r) => r.prueba(status));
    return {
      status,
      codigo: regla ? regla.codigo(status) : `error ${status}`,
      mensaje: regla ? regla.mensaje : "No pudimos completar la solicitud.",
      // Un 4xx también cuenta como nuestra: un 404 o un 429 salen de cómo tenemos
      // configurado esto, no de la red del comensal.
      nuestra: true,
    };
  }

  // Sin respuesta. Aquí SÍ puede ser su conexión, así que el mensaje lo dice.
  if (error?.code === "ECONNABORTED" || /timeout/i.test(error?.message || "")) {
    return {
      status: null,
      codigo: "tardó demasiado",
      mensaje: "La conexión está muy lenta. Revísala e inténtalo de nuevo.",
      nuestra: false,
    };
  }

  return {
    status: null,
    codigo: error?.code === "ERR_NETWORK" ? "sin conexión" : "sin respuesta",
    mensaje: "Revisa tu conexión e inténtalo de nuevo.",
    nuestra: false,
  };
}
