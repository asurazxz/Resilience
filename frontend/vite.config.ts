import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Minimal Vite config: this pass only needs the React plugin. PWA plugin
// configuration (offline caching, manifest) is Workstream 1's stretch scope.
export default defineConfig({
  plugins: [react()],
  server: {
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
});
