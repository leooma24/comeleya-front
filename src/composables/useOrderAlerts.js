import { onMounted, onBeforeUnmount } from "vue";
import { useAdminStore } from "src/stores/admin-store";

// Alerta GLOBAL de pedidos nuevos: suena/notifica sin importar en qué pestaña
// esté el operador. Se monta una sola vez (en AdminPage) y sondea los pendientes.
// Refuerzo: mientras la pestaña esté en segundo plano y haya un pedido nuevo sin
// atender, la alarma se REPITE (sonido + parpadeo del título + vibración) hasta
// que el operador vuelve a la pestaña.
export function useOrderAlerts(getSlug) {
  const adminStore = useAdminStore();
  let audioCtx = null;
  let timer = null;
  let stopped = false;

  // Alarma persistente
  let alarmTimer = null;
  let titleTimer = null;
  let alerting = false;
  const originalTitle = document.title;

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

  const vibrate = () => {
    try {
      navigator.vibrate?.([250, 120, 250]);
    } catch {
      // no soportado
    }
  };

  const notify = (count) => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    const n = new Notification("Nuevo pedido", {
      body: `Tienes ${count} nuevo${count > 1 ? "s" : ""} pedido${count > 1 ? "s" : ""} pendiente${count > 1 ? "s" : ""}`,
      icon: "/icons/favicon-128x128.png",
      requireInteraction: true, // no se auto-oculta: queda hasta que la cierren
      tag: "nuevo-pedido",
      renotify: true,
    });
    n.onclick = () => {
      window.focus();
      stopAlarm();
      n.close();
    };
  };

  // Arranca la alarma persistente (mientras la pestaña esté oculta).
  const startAlarm = () => {
    if (alerting) return;
    alerting = true;
    alarmTimer = setInterval(() => {
      if (document.hidden) {
        beep();
        vibrate();
      }
    }, 4000);
    let on = false;
    titleTimer = setInterval(() => {
      on = !on;
      document.title = on ? "🔴 ¡Nuevo pedido!" : originalTitle;
    }, 1000);
  };

  const stopAlarm = () => {
    alerting = false;
    if (alarmTimer) {
      clearInterval(alarmTimer);
      alarmTimer = null;
    }
    if (titleTimer) {
      clearInterval(titleTimer);
      titleTimer = null;
    }
    document.title = originalTitle;
  };

  // Cuando el operador vuelve a la pestaña, asumimos que ya vio el pedido.
  const onVisibility = () => {
    if (!document.hidden) stopAlarm();
  };

  const poll = async () => {
    if (stopped) return;
    const slug = getSlug();
    if (slug) {
      try {
        const { newCount } = await adminStore.orderStore.refreshPending(slug);
        if (newCount > 0) {
          beep();
          vibrate();
          notify(newCount);
          startAlarm(); // seguirá sonando en segundo plano hasta que vuelvan
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
    // Desbloquea el audio y (si hace falta) pide permiso en el primer gesto.
    const firstGesture = () => {
      ensureAudio();
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    };
    window.addEventListener("pointerdown", firstGesture, { once: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", stopAlarm);
    poll();
  });

  onBeforeUnmount(() => {
    stopped = true;
    if (timer) clearTimeout(timer);
    stopAlarm();
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("focus", stopAlarm);
  });
}
