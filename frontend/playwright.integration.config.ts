import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "income-reality.e2e.ts",
  workers: 1,
  reporter: "line",
  use: {
    headless: true,
  },
});
