import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useMessageStore } from "stores/message-store";
import { Notify } from "quasar";

describe("message-store", () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useMessageStore();
  });

  it("calls Notify.create with positive color on success", () => {
    store.success("Guardado correctamente");
    expect(Notify.create).toHaveBeenCalledWith({
      message: "Guardado correctamente",
      color: "positive",
    });
  });

  it("calls Notify.create with negative color on error", () => {
    store.error("Algo salió mal");
    expect(Notify.create).toHaveBeenCalledWith({
      message: "Algo salió mal",
      color: "negative",
    });
  });

  it("handles empty message", () => {
    store.success("");
    expect(Notify.create).toHaveBeenCalledWith({
      message: "",
      color: "positive",
    });
  });

  it("handles special characters in message", () => {
    store.error("Error: campo 'email' no válido <script>");
    expect(Notify.create).toHaveBeenCalledWith({
      message: "Error: campo 'email' no válido <script>",
      color: "negative",
    });
  });
});
