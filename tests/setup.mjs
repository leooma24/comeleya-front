import { vi } from "vitest";
import { config } from "@vue/test-utils";

// Mock boot/axios globally
vi.mock("boot/axios", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    defaults: { headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

// Mock Quasar plugins
vi.mock("quasar", () => ({
  useQuasar: () => ({
    dialog: vi.fn(() => ({
      onOk: vi.fn((cb) => ({ onCancel: vi.fn() })),
      onCancel: vi.fn(),
    })),
    notify: vi.fn(),
    screen: { width: 1024, lt: { sm: false } },
  }),
  Notify: { create: vi.fn() },
  Dialog: { create: vi.fn() },
  QDialog: {},
  QBtn: {},
  QInput: {},
}));
