// La tira de logos de la portada: los negocios que ya pagan ComeleYa.
//
// La logica vive aqui y no dentro del .vue porque todo esto se puede probar sin
// DOM: que un cliente sin slug no genere un enlace a /undefined, y que la pista
// lleve las copias exactas que la marquesina de CSS necesita.

const texto = (v) => (typeof v === "string" ? v.trim() : "");

// Abajo de esto la marquesina se apaga. Dos o tres logos dando vueltas se ven
// peor que dos o tres logos quietos: parece que falta contenido, que es justo lo
// contrario de lo que la seccion viene a decir.
const MINIMO_PARA_ANIMAR = 4;

// Cuadros que se buscan en pantalla antes de dejar de repetir. Con menos, una
// lista de cuatro logos dejaria la pista mas corta que el monitor y el bucle se
// notaria a simple vista.
const CUADROS_DESEADOS = 16;

/**
 * `[{ name, slug, logo }]` con lo que sirve. Descarta al que venga sin nombre o
 * sin slug: esto llega de la red, y un objeto a medias termina en un enlace roto
 * dentro de la portada.
 */
export function normalizaClientes(lista) {
  if (!Array.isArray(lista)) return [];

  return lista.reduce((acc, cliente) => {
    const name = texto(cliente?.name);
    const slug = texto(cliente?.slug);
    if (!name || !slug) return acc;

    acc.push({ name, slug, logo: texto(cliente?.logo) || null });
    return acc;
  }, []);
}

/** Si la tira se desliza, o se queda centrada y quieta. */
export function debeAnimar(cantidad) {
  return cantidad >= MINIMO_PARA_ANIMAR;
}

/**
 * Cuantas veces se repite la lista dentro de la pista.
 *
 * El keyframe recorre `-50%`, asi que las dos mitades de la pista tienen que ser
 * identicas: cuando anima, el resultado es SIEMPRE par.
 */
export function repeticiones(cantidad) {
  if (cantidad <= 0) return 0;
  if (!debeAnimar(cantidad)) return 1;

  const mitad = Math.max(1, Math.ceil(CUADROS_DESEADOS / cantidad));
  return mitad * 2;
}

/** Un logo tarda mas o menos lo mismo en cruzar, sin importar cuantos haya. */
export function duracionSegundos(cantidad) {
  return Math.max(20, cantidad * 4);
}
