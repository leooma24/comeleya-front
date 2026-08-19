import { useQuasar } from "quasar";

// Guard reusable de "cambios sin guardar" para drawers/formularios propios (los que
// no usan BaseFormDrawer). Uso:
//   const { snap, isDirty, confirmClose } = useUnsavedChanges();
//   watch(() => open, (v) => { if (v) snap(form); });
//   requestClose(): confirmClose(isDirty(form, uploading), onSave, onClose);
export function useUnsavedChanges() {
  const $q = useQuasar();
  let snapshot = null;

  // Toma la "foto" del formulario al abrir.
  const snap = (data) => {
    snapshot = data ? JSON.stringify(data) : null;
  };

  const isDirty = (data, uploading = false) => {
    if (uploading) return true;
    if (!data) return false;
    return snapshot !== null && snapshot !== JSON.stringify(data);
  };

  // Si hay cambios: pregunta Guardar / Descartar. Si no, cierra directo.
  const confirmClose = (dirty, onSave, onClose) => {
    if (!dirty) {
      onClose();
      return;
    }
    $q.dialog({
      title: "Cambios sin guardar",
      message: "Hiciste cambios y aún no los guardas. ¿Qué deseas hacer?",
      ok: { label: "Guardar", unelevated: true, noCaps: true, color: "primary" },
      cancel: { label: "Descartar", flat: true, noCaps: true, color: "negative" },
      persistent: true,
    })
      .onOk(onSave)
      .onCancel(onClose);
  };

  return { snap, isDirty, confirmClose };
}
