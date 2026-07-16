import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.mjs"],
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, "./src"),
      boot: path.resolve(__dirname, "./src/boot"),
      stores: path.resolve(__dirname, "./src/stores"),
      layouts: path.resolve(__dirname, "./src/layouts"),
      pages: path.resolve(__dirname, "./src/pages"),
    },
  },
});
