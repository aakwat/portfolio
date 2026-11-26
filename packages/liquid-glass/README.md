# @aakwat/liquid-glass

Liquid glass for any element. Framework-free TypeScript and one CSS file.

```ts
import "@aakwat/liquid-glass/style.css";
import { startGlass } from "@aakwat/liquid-glass";
startGlass();
```

```html
<!-- Bends the live page behind it (Chromium), with a WebGPU rim where available -->
<header class="glass" data-glass=""><canvas class="glass-canvas" aria-hidden="true"></canvas>…</header>

<!-- Refracts one image with WebGPU; data-glass-media limits it to a media query -->
<div class="glass" data-glass="photo-id"><canvas class="glass-canvas" aria-hidden="true"></canvas>…</div>
```

Panes must be positioned (`relative`, `absolute`, `sticky`…) and should carry their own fallback look
(`backdrop-filter: blur(…)`, a border), which stays when the glass can't run: no WebGPU, Firefox or Safari for the
lens, or `prefers-reduced-transparency`.

## Knobs

Set on any pane in CSS:

| Property | Default | Effect |
|---|---|---|
| `--glass-tint` | `Canvas` at 25% | Colour over the glass |
| `--glass-blur` | `0.5px` | Softness behind a lens pane |
| `--glass-bend` | `32px` | How far a lens pane's rim pulls the page inward |

## CSP

The lens map loads as a `blob:` URL, so a strict policy needs `img-src 'self' blob:`. Nothing else is needed:
no inline scripts, no `style` attributes, no Trusted Types sinks.

## Credits

The WebGPU shader is adapted from [arya3d/liquid-glass-webgpu](https://github.com/arya3d/liquid-glass-webgpu)
(MIT, © 2026 arya3d); the rounded box distance is Inigo Quilez's.
