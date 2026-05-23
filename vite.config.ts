import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  plugins: mode === "test" ? [react()] : [react(), cloudflare()],
  build: {
    outDir: "dist/client",
    sourcemap: true
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.ts"]
  }
}));
