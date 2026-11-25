# Portfolio

Aung Koko Lwin's portfolio at `https://me.aungkokolwin.workers.dev`. Astro, static output, small client scripts only.

- `src/pages/`: one file per route; `404.astro` is served for unknown paths
- `src/components/Head.astro`: title, description, canonical, Open Graph and JSON-LD for every page
- `src/lib/profile.ts`: name, role and links; copy must match `assets/resume.pdf`
- `assets/`: served as-is (Astro `publicDir`), including `resume.pdf`
- `assets/robots.txt`, `assets/sitemap.xml`: add every new page to the sitemap
- `src/scripts/glass/`: liquid glass. WebGPU refracts the hero portrait and draws the rim light; the nav bends live
  HTML through an SVG lens filter (Chromium only). Other browsers keep the CSS blur.
  Tune a pane in CSS with `--glass-tint`, `--glass-blur` and `--glass-bend` (defaults in `src/styles/global.css`).
- `assets/.well-known/security.txt`: renew `Expires` before 2027-11-03, or scanners treat it as invalid

## Security headers

`assets/_headers` sets the CSP and the other headers for every response; `assets/.assetsignore`
keeps the file itself unpublished. The CSP has no `unsafe-inline`: no inline `<script>`, no
`style="..."`, and Astro is set to never inline stylesheets.

## Commands

```fish
nix develop
pnpm dev       # http://localhost:4321
pnpm build
pnpm preview   # serves dist/; does not apply _headers
pnpm deploy    # build, then wrangler deploy
```

`wrangler` comes from the Nix shell, not npm: npm's `workerd` binary does not run on NixOS.

