# gpgpu-1 — ATH hero

A GPGPU particle field driven by a real Qwen-2.5-3B forward pass on the
prompt **"Reaching ATH ("**. Particles are born from the model's input
embeddings, pulled around by per-layer attention, and coloured by hidden-state
magnitude. Scrolling moves through the 36 transformer layers with non-linear
holds at the climax beats (L13 / L29 / L36).

**Live:** https://q1t-architect.github.io/gpgpu-1/

## Stack

- Vite + React 19 + TypeScript (strict)
- three / @react-three/fiber / @react-three/postprocessing
- lenis (smooth scroll)
- vite-plugin-glsl (raw `.frag` / `.vert` imports)

## Local development

```bash
npm ci
npm run dev      # http://localhost:5173/gpgpu-1/
npm run build    # → dist/
npm run preview  # serve dist/ locally
npm run typecheck
npm run lint
```

A headless smoke test (chromium) lives at `scripts/smoke.mjs`.

## Project layout

| Path                   | What lives there                                    |
| ---------------------- | --------------------------------------------------- |
| `public/data/tensors/` | The seeded Qwen-2.5-3B tensors + manifest          |
| `src/tensors/`         | Loader + types for those tensors                    |
| `src/gpgpu/`           | FBO simulator, initial-position math, shaders       |
| `src/scene/`           | R3F Canvas, particle render component, capabilities |
| `src/post/`            | Riso post-effect (dither + grain + CA + vignette)   |
| `src/state/`           | Per-frame store, scroll driver, narrative phases    |
| `src/ui/`              | DOM typography overlay + brand reveal               |
| `DECISIONS.md`         | Visual references and art-direction trace           |
| `RUN_REPORT.md`        | Final report from the autonomous build              |

## Enabling GitHub Pages (one-time, in repo Settings)

The CI workflow (`.github/workflows/deploy.yml`) builds the site and uploads
the `dist/` artifact to GitHub Pages, but the Pages source must be set to
"GitHub Actions" once by hand:

1. Open <https://github.com/q1t-architect/gpgpu-1/settings/pages>
2. Under **Build and deployment → Source** select **GitHub Actions**
3. Push to `main` (or to the working branch
   `claude/gpgpu-implementation-iHPXI`); the workflow will pick it up and
   publish to <https://q1t-architect.github.io/gpgpu-1/>.

## Bundle size

- Total gzipped JS: ~315 kB (three + r3f + app), well under the 600 kB hero
  budget called out in the brief.
- Tensor payload (loaded async, cache-forced): ~2.4 MB.
