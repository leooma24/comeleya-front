import { onMounted, onBeforeUnmount } from "vue";
import { useAdminStore } from "src/stores/admin-store";

// --- Tonos de alerta seleccionables (sin archivos, generados con Web Audio) ---
// Onda cuadrada + ganancia alta = mucho más fuerte que el "sine" 0.3 anterior.
export const ALERT_TONES = [
  { value: "timbre", label: "Timbre (doble)" },
  { value: "campana", label: "Campana" },
  { value: "alarma", label: "Alarma" },
  { value: "trino", label: "Trino" },
];

// Cada patrón: onda, notas [freq, inicio(s), duración(s)], repeticiones y separación.
const PATTERNS = {
  timbre: { wave: "square", gain: 0.6, reps: 2, gap: 0.85, notes: [[880, 0, 0.45], [1100, 0.22, 0.45]] },
  campana: { wave: "triangle", gain: 0.7, reps: 2, gap: 1.1, notes: [[1318, 0, 0.9], [1568, 0.04, 0.9]] },
  alarma: { wave: "sawtooth", gain: 0.55, reps: 3, gap: 0.95, notes: [[700, 0, 0.18], [950, 0.22, 0.18], [700, 0.44, 0.18], [950, 0.66, 0.18]] },
  trino: { wave: "square", gain: 0.6, reps: 2, gap: 0.7, notes: [[1046, 0, 0.12], [1318, 0.13, 0.12], [1568, 0.26, 0.22]] },
};

export function getAlertTone() {
  try {
    return localStorage.getItem("mc-alert-tone") || "timbre";
  } catch {
    return "timbre";
  }
}
export function setAlertTone(key) {
  try {
    localStorage.setItem("mc-alert-tone", key);
  } catch {
    // ignore
  }
}

function playPattern(ctx, key) {
  const p = PATTERNS[key] || PATTERNS.timbre;
  const base = ctx.currentTime + 0.02;
  for (let r = 0; r < (p.reps || 1); r++) {
    const off = r * (p.gap || 1);
    for (const [freq, start, dur] of p.notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = p.wave || "square";
      osc.frequency.value = freq;
      const t = base + off + start;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(p.gain || 0.6, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.start(t);
      osc.stop(t + dur + 0.03);
    }
  }
}

// Reproduce un tono para PREVISUALIZAR (desde el selector de ajustes).
let previewCtx = null;
export function previewTone(key) {
  try {
    previewCtx = previewCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (previewCtx.state === "suspended") previewCtx.resume();
    playPattern(previewCtx, key);
  } catch {
    // audio no soportado
  }
}

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
    try {
      playPattern(audioCtx, getAlertTone());
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
