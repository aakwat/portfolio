# Portfolio

Aung Koko Lwin's portfolio at `https://me.aungkokolwin.workers.dev`. Astro, static output, small client scripts only. A pnpm workspace: the site is `apps/portfolio`, the glass is `packages/liquid-glass`.

- `apps/portfolio/src/pages/`: one file per route; `404.astro` is served for unknown paths
- `apps/portfolio/src/components/Head.astro`: title, description, canonical, Open Graph and JSON-LD for every page
- `apps/portfolio/src/lib/profile.ts`: name, role and links; copy must match `apps/portfolio/assets/resume.pdf`
- `apps/portfolio/assets/`: served as-is (Astro `publicDir`), including `resume.pdf`
- `apps/portfolio/assets/robots.txt`, `apps/portfolio/assets/sitemap.xml`: add every new page to the sitemap
- `packages/liquid-glass/`: liquid glass, used by the site; see its README for markup and knobs
- `apps/portfolio/assets/.well-known/security.txt`: renew `Expires` before 2027-11-03, or scanners treat it as invalid

## Security headers

`apps/portfolio/assets/_headers` sets the CSP and the other headers for every response; `apps/portfolio/assets/.assetsignore`
keeps the file itself unpublished. The CSP has no `unsafe-inline`: no inline `<script>`, no
`style="..."`, and Astro is set to never inline stylesheets.

## Commands

```fish
nix develop    # then, from the repo root:
pnpm dev       # http://localhost:4321
pnpm build
pnpm preview   # serves dist/; does not apply _headers
pnpm run deploy  # build, then wrangler deploy; plain `pnpm deploy` is a pnpm built-in
pnpm test      # every workspace package
```

`wrangler` comes from the Nix shell, not npm: npm's `workerd` binary does not run on NixOS.

