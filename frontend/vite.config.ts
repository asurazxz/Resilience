import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Minimal Vite config: this pass only needs the React plugin. PWA plugin
// configuration (offline caching, manifest) is Workstream 1's stretch scope.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
