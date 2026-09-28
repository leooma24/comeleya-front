import { ref, onMounted } from "vue";
import { api } from "boot/axios";

const SCRIPT = "https://accounts.google.com/gsi/client";
let scriptPromise = null;

// El script de Google una sola vez por visita, aunque se entre y salga del login.
function cargarScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.async = true;
    s.defer = true;
    s.onload = resolve;
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("No cargó el script de Google"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/**
 * El boton "Continuar con Google".
 *
 * El Client ID lo da el servidor (/login/google/config), no el .env del front: asi hay
 * uno solo que mantener y, mientras no este puesto, el boton simplemente no aparece
 * en vez de salir uno que falla al tocarlo.
 *
 * Google pinta su propio boton (sus reglas de marca no dejan hacer uno a mano con
 * One Tap / GIS), asi que aqui solo se le da el contenedor.
 *
 * @param {import("vue").Ref<HTMLElement|null>} contenedor donde se pinta el boton
 * @param {(credential: string) => void} alEntrar recibe el ID token de Google
 */
export function useGoogleLogin(contenedor, alEntrar) {
  const disponible = ref(false);

  onMounted(async () => {
    try {
      const { data } = await api.get("/login/google/config");
      if (!data?.client_id) return;
      await cargarScript();
      if (!contenedor.value) return;

      window.google.accounts.id.initialize({
        client_id: data.client_id,
        callback: (respuesta) => {
          if (respuesta?.credential) alEntrar(respuesta.credential);
        },
        ux_mode: "popup",
        // Solo el boton: el recuadro flotante de One Tap tapaba el formulario.
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      window.google.accounts.id.renderButton(contenedor.value, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "center",
        locale: "es",
        width: Math.min(contenedor.value.clientWidth || 360, 400),
      });
      disponible.value = true;
    } catch {
      // Sin Google (bloqueado, sin red, sin configurar): quedan correo y Facebook.
      disponible.value = false;
    }
  });

  return { disponible };
}
