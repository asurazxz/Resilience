import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["resilience-icon.svg"],
      manifest: {
        name: "Resilience",
        short_name: "Resilience",
        description: "A transparent resilience planner for Singapore platform workers.",
        theme_color: "#4f36d6",
        background_color: "#f7f7fc",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/resilience-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        navigateFallback: "/index.html",
        runtimeCaching: []
      }
    })
  ],
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true
      },
      "/scenario-simulator/simulate": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true
      }
    }
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    maxWorkers: 1,
    pool: "threads",
    setupFiles: "./src/test/setup.ts"
  }
});
