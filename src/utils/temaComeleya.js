// Devuelve la pagina a los colores de ComeleYa.
//
// El color de un negocio se pone en <body> (main-store.setPrimaryColor) y se guarda en
// el store persistido, asi que al abrir la app se vuelve a aplicar entre por la pagina
// que entre. La landing ya se limpiaba sola, pero el alta, recuperar contraseña y los
// legales no: quien habia visto un menu azul se registraba con un boton azul.
export function aplicarTemaComeleya() {
  const body = document.querySelector("body");
  if (!body) return;
  // Se QUITAN, no se ponen: los de ComeleYa ya vienen de quasar.config, y fijarlos en
  // linea le ganaba al rojo mas claro que app.scss pone en modo oscuro.
  body.style.removeProperty("--q-primary");
  body.style.removeProperty("--q-secondary");
  body.style.removeProperty("--q-accent");
  body.style.removeProperty("--mc-bg");
  body.style.removeProperty("--mc-text");
  body.style.removeProperty("--mc-radius");
  // El boton de cerrar de los cajones: sin estas, sale el blanco por defecto de app.scss.
  body.style.removeProperty("--mc-cerrar-fondo");
  body.style.removeProperty("--mc-cerrar-icono");
  body.style.backgroundColor = "";
  body.style.color = "";
  body.style.fontFamily = "";
}
