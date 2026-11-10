import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://me.aungkokolwin.workers.dev",
  publicDir: "./assets",
  // Inline <style> would need 'unsafe-inline' in the CSP (assets/_headers).
  build: { inlineStylesheets: "never" },
  // Small scripts would be inlined too, which the CSP's script-src 'self' blocks; always emit files.
  vite: { build: { assetsInlineLimit: 0 } },
});
