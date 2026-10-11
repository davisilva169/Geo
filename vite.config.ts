import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.BASE_PATH || "./",
  server: { watch: { ignored: ["**/src-tauri/**"] } },
  build: { chunkSizeWarningLimit: 650 },
});
