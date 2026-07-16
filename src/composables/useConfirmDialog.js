import { useQuasar } from "quasar";

export function useConfirmDialog() {
  const $q = useQuasar();

  const confirm = (title, message, onConfirm) => {
    $q.dialog({
      title,
      message,
      cancel: { label: "Cancelar", flat: true, noCaps: true },
      ok: { label: "Confirmar", unelevated: true, noCaps: true, color: "primary" },
      persistent: true,
    }).onOk(onConfirm);
  };

  const confirmDelete = (entityName, onConfirm) => {
    $q.dialog({
      title: `Eliminar ${entityName}`,
      message: `¿Estás seguro de eliminar ${entityName.toLowerCase()}?`,
      cancel: { label: "Cancelar", flat: true, noCaps: true },
      ok: { label: "Eliminar", unelevated: true, noCaps: true, color: "negative" },
      persistent: true,
    }).onOk(onConfirm);
  };

  return { confirm, confirmDelete };
}
