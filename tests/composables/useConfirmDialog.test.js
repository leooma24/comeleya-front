import { describe, it, expect, vi, beforeEach } from "vitest";

const mockOnOk = vi.fn();
const mockDialog = vi.fn(() => ({ onOk: mockOnOk }));

vi.mock("quasar", () => ({
  useQuasar: () => ({
    dialog: mockDialog,
  }),
  Notify: { create: vi.fn() },
  Dialog: { create: vi.fn() },
  QDialog: {},
  QBtn: {},
  QInput: {},
}));

import { useConfirmDialog } from "src/composables/useConfirmDialog";

describe("useConfirmDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("confirm calls dialog with correct title and message", () => {
    const { confirm } = useConfirmDialog();
    const callback = vi.fn();
    confirm("Título", "¿Estás seguro?", callback);

    expect(mockDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Título",
        message: "¿Estás seguro?",
        persistent: true,
      })
    );
  });

  it("confirm passes ok button with primary color", () => {
    const { confirm } = useConfirmDialog();
    confirm("Title", "Message", vi.fn());

    const args = mockDialog.mock.calls[0][0];
    expect(args.ok.color).toBe("primary");
    expect(args.ok.label).toBe("Confirmar");
  });

  it("confirm passes onConfirm callback to onOk", () => {
    const { confirm } = useConfirmDialog();
    const callback = vi.fn();
    confirm("Title", "Message", callback);

    expect(mockOnOk).toHaveBeenCalledWith(callback);
  });

  it("confirmDelete uses entity name in title and message", () => {
    const { confirmDelete } = useConfirmDialog();
    confirmDelete("Producto", vi.fn());

    const args = mockDialog.mock.calls[0][0];
    expect(args.title).toBe("Eliminar Producto");
    expect(args.message).toContain("producto");
    expect(args.ok.color).toBe("negative");
    expect(args.ok.label).toBe("Eliminar");
  });

  it("confirmDelete cancel button has correct config", () => {
    const { confirmDelete } = useConfirmDialog();
    confirmDelete("Categoría", vi.fn());

    const args = mockDialog.mock.calls[0][0];
    expect(args.cancel.label).toBe("Cancelar");
    expect(args.cancel.flat).toBe(true);
    expect(args.cancel.noCaps).toBe(true);
  });

  it("confirmDelete passes onConfirm callback to onOk", () => {
    const { confirmDelete } = useConfirmDialog();
    const callback = vi.fn();
    confirmDelete("Test", callback);

    expect(mockOnOk).toHaveBeenCalledWith(callback);
  });
});
