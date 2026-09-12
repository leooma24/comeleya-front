// Quien puede ver que en el panel de un negocio.
//
// El rol vive en la relacion usuario-negocio (establishment_user.role), no en el
// usuario: la misma persona puede ser dueña de un negocio y cajera en otro. Por eso
// todo se pregunta con el slug del negocio que se esta viendo.
//
// Esto solo decide que se ENSEÑA. Quien impide de verdad es el servidor
// (CheckAdminOrCompanyAccess): lo que aqui se esconde, alla responde 403.
//
// No conoce stores a proposito: se prueba sin montar Pinia.

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  PROPIETARIO: "propietario",
  CAJERO: "cajero",
};

/** El rol del usuario en el negocio del slug. Null si no pertenece a ese negocio. */
export function rolEn(user, slug) {
  if (!user) return null;
  if (user.role === ROLES.SUPER_ADMIN) return ROLES.SUPER_ADMIN;

  const filas = (user.establishments ?? []).filter((e) => e.slug === slug);
  if (!filas.length) return null;

  // Sin rol guardado cuenta como dueño: es la sesion de alguien que entro antes de que
  // existieran las cajeras, cuando todos eran dueños.
  const roles = filas.map((e) => e.pivot?.role ?? ROLES.PROPIETARIO);
  // Con una fila de dueño basta. Cualquier otro valor se trata como cajera: ante un rol
  // que no conocemos, mejor enseñar de menos que de mas.
  return roles.includes(ROLES.PROPIETARIO) ? ROLES.PROPIETARIO : ROLES.CAJERO;
}

// Una cajera solo ve las pestañas de Pedidos -el Historial incluido- y el menu Mas del
// celular, que es donde estan su perfil y el boton de salir.
const SECCIONES_DEL_CAJERO = ["mc_mas"];
const CAJONES_DEL_CAJERO = ["perfil"];

export function puedeVerSeccion(rol, tab) {
  if (rol !== ROLES.CAJERO) return true;
  const seccion = String(tab ?? "");
  return seccion.startsWith("pedidos") || SECCIONES_DEL_CAJERO.includes(seccion);
}

export function puedeAbrirCajon(rol, cajon) {
  return rol !== ROLES.CAJERO || CAJONES_DEL_CAJERO.includes(cajon);
}

/** El CSV trae telefonos y montos de todos los clientes: se queda con el dueño. */
export function puedeExportarPedidos(rol) {
  return rol !== ROLES.CAJERO;
}
