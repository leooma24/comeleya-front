import { onMounted, onBeforeUnmount } from "vue";
import { useAdminStore } from "src/stores/admin-store";

// Alerta GLOBAL de pedidos nuevos: suena/notifica sin importar en qué pestaña
// esté el operador. Se monta una sola vez (en AdminPage) y sondea los pendientes.
export function useOrderAlerts(getSlug) {
  const adminStore = useAdminStore();
  let audioCtx = null;
  let timer = null;
  let stopped = false;

  const ensureAudio = () => {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      // Los navegadores lo crean "suspended" hasta que hay gesto del usuario
      if (audioCtx.state === "suspended") audioCtx.resume();
    } catch {
      // audio no soportado
    }
  };

  const beep = () => {
    ensureAudio();
    if (!audioCtx) return;
    const tone = (freq, start, dur) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + start + dur);
      osc.start(audioCtx.currentTime + start);
      osc.stop(audioCtx.currentTime + start + dur);
    };
    try {
      tone(880, 0, 0.5);
      tone(1100, 0.2, 0.5);
    } catch {
      // ignore
    }
  };

  const notify = (count) => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    const n = new Notification("Nuevo pedido", {
      body: `Tienes ${count} nuevo${count > 1 ? "s" : ""} pedido${count > 1 ? "s" : ""} pendiente${count > 1 ? "s" : ""}`,
      icon: "/icons/favicon-128x128.png",
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  };

  const poll = async () => {
    if (stopped) return;
    const slug = getSlug();
    if (slug) {
      try {
        const { newCount } = await adminStore.orderStore.refreshPending(slug);
        if (newCount > 0) {
          beep();
          notify(newCount);
        }
      } catch {
        // fallo de red: reintenta en el próximo ciclo
      }
    }
    timer = setTimeout(poll, 15000);
  };

  onMounted(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    // Desbloquea el audio en el primer gesto del usuario (click/tap)
    window.addEventListener("pointerdown", ensureAudio, { once: true });
    poll();
  });

  onBeforeUnmount(() => {
    stopped = true;
    if (timer) clearTimeout(timer);
    window.removeEventListener("pointerdown", ensureAudio);
  });
}
