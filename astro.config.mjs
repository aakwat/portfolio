import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://me.aungkokolwin.workers.dev",
  publicDir: "./assets",
  // Inline <style> would need 'unsafe-inline' in the CSP (assets/_headers).
  build: { inlineStylesheets: "never" },
});
