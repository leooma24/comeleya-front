// Mensajes de WhatsApp del CRM, segun lo que pasa con cada prospecto.
//
// Antes el boton verde mandaba uno solo por "segmento", y le decia "creaste tu cuenta
// en ComeleYa, tu usuario es..." tambien a quien nunca se habia registrado. Ahora hay
// varios, cada uno con cuando aplica, y se sugiere el que corresponde a su etapa y a lo
// ultimo que hizo dentro de ComeleYa (los "Hito:" que anota el servidor).

const SITIO = "https://comeleya.com";

const primerNombre = (p) => (p.name || p.business_name || "").trim().split(/\s+/)[0] || "";

/** Lo ultimo que hizo en ComeleYa, segun las notas de hito del servidor. */
export function ultimoHito(p) {
  const hito = (p.activities || []).find((a) => (a.description || "").startsWith("Hito:"));
  const d = hito?.description || "";
  if (d.includes("prueba gratis vence") || d.includes("venció la prueba")) return "prueba";
  if (d.includes("primer pedido")) return "pedidos";
  if (d.includes("subió su menú")) return "menu";
  if (d.includes("sin subir platillos")) return "sin_menu";
  return null;
}

/**
 * Las plantillas que aplican a este prospecto, la sugerida primero.
 *
 * @param {object} p prospecto (con establishment y activities si los trae)
 * @param {string} vendedor nombre de quien escribe
 * @returns {{clave: string, titulo: string, texto: string, sugerida: boolean}[]}
 */
export function plantillasPara(p, vendedor = "") {
  const nombre = primerNombre(p);
  const hola = nombre ? `Hola ${nombre}` : "Hola";
  const soy = vendedor ? `, soy ${vendedor.trim().split(/\s+/)[0]} de ComeleYa` : ", te escribo de ComeleYa";
  const negocio = p.business_name || "tu negocio";
  const slug = p.establishment?.slug;
  const menu = slug ? `${SITIO}/${slug}` : "";
  const registrado = !!p.establishment_id || !!slug;

  const lista = registrado
    ? [
        {
          clave: "sin_menu",
          titulo: "Ayudarle a subir su menú",
          texto: `${hola}${soy}. Vi que creaste la cuenta de ${negocio}, ¡gracias! ¿Te ayudo a subir tu menú? Si me mandas una foto de tu menú por aquí, te lo dejo listo.`,
        },
        {
          clave: "menu",
          titulo: "Menú listo: que lo comparta",
          texto: `${hola}${soy}. ¡Tu menú ya está en línea! ${menu}\n\nPara que empiecen a llegar pedidos, pon esa liga en tu Facebook, Instagram y estado de WhatsApp, e imprime tu QR para las mesas. ¿Te ayudo con algo?`,
        },
        {
          clave: "pedidos",
          titulo: "Ya tiene pedidos: felicitarlo",
          texto: `${hola}${soy}. ¡Felicidades, ya te están llegando pedidos por tu menú! ¿Cómo te ha ido? Si quieres te platico cómo aceptar pagos en línea o armar un programa de puntos para que tus clientes regresen.`,
        },
        {
          clave: "prueba",
          titulo: "Su prueba vence: ofrecerle su plan",
          texto: `${hola}${soy}. Tu prueba gratis de ComeleYa está por terminar. Para seguir recibiendo pedidos sin interrupción, puedes elegir tu plan en ${SITIO}/admin/iniciar-sesion (sección "Mi plan"). ¿Te ayudo a escoger el que te conviene?`,
        },
        {
          clave: "reactivar",
          titulo: "Retomar (se había ido)",
          texto: `${hola}${soy}. Hace tiempo creaste tu menú en ComeleYa y queríamos saber cómo vas. Si te interesa retomarlo, te reactivo 15 días gratis con todas las funciones y te ayudo a dejarlo listo.`,
        },
      ]
    : [
        {
          clave: "registro",
          titulo: "Invitarlo a registrarse (15 días gratis)",
          texto: `${hola}${soy}. Te invito a registrar ${negocio} en ComeleYa: tienes 15 días gratis con todas las funciones del plan Premium (menú digital, pedidos por WhatsApp, pagos en línea, puntos para clientes), sin tarjeta y sin comisión por pedido.\n\nRegístrate aquí: ${SITIO}/nuevo-establecimiento\n\nSi prefieres, mándame una foto de tu menú y te ayudo a subirlo.`,
        },
        {
          clave: "presentacion",
          titulo: "Presentarle ComeleYa",
          texto: `${hola}${soy}. Ayudamos a restaurantes como ${negocio} a recibir pedidos por WhatsApp con un menú digital, sin pagar comisión por pedido. ¿Te puedo mandar un ejemplo de cómo se ve?`,
        },
        {
          clave: "demo",
          titulo: "Mandarle el ejemplo",
          texto: `${hola}, te comparto cómo se ve un menú en ComeleYa: ${SITIO}/demo-restaurante\n\nTus clientes ven fotos y precios, arman su pedido y te llega directo a tu WhatsApp. ¿Qué te parece?`,
        },
        {
          clave: "seguimiento",
          titulo: "Dar seguimiento",
          texto: `${hola}${soy}. ¿Pudiste ver la información que te mandé? Si tienes cualquier duda te la resuelvo por aquí.`,
        },
        {
          clave: "reactivar",
          titulo: "Retomar (se había enfriado)",
          texto: `${hola}${soy}. Hace un tiempo platicamos sobre tener tu menú digital. ¿Todavía te interesa? Te puedo ayudar a dejarlo listo en un día.`,
        },
      ];

  const sugerida = sugerencia(p, registrado);
  return lista
    .map((t) => ({ ...t, sugerida: t.clave === sugerida }))
    .sort((a, b) => Number(b.sugerida) - Number(a.sugerida));
}

function sugerencia(p, registrado) {
  if (p.status === "cerrado_perdido") return "reactivar";
  if (registrado) {
    return ultimoHito(p) || "sin_menu";
  }
  return {
    nuevo: "registro",
    contactado: "demo",
    demo: "registro",
    negociando: "seguimiento",
  }[p.status] || "presentacion";
}
