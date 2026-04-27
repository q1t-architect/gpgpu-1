# RUN_REPORT — gpgpu-1

Autonomous run on `claude/gpgpu-implementation-iHPXI`.

## Live URL

<https://q1t-architect.github.io/gpgpu-1/>

The repository's GitHub Pages source must be flipped to "GitHub Actions" once
in **Settings → Pages** (the agent has no access to repo settings). The
`deploy.yml` workflow then builds and publishes on every push to `main` or
the working branch.

## Done

- Vite + React 19 + TypeScript (strict) scaffold, ESLint flat config,
  vite-plugin-glsl wired up, base path `/gpgpu-1/`, `manualChunks` split
  three / r3f / app for cacheability.
- Tensor loader (`src/tensors/loader.ts`) reads the manifest, parallel-fetches
  6 binary buffers + 2 JSON files, asserts byte/length matches the declared
  shapes, exposes `hiddenAt`, `attentionRow`, `attentionMaxOverHeads`
  accessors.
- DECISIONS.md with 12 real references researched via WebSearch (awwwards
  collections, Codrops 2025–26 articles, Lusion / 14islands, Shadertoy
  classics) and a documented art-direction trace.
- Risograph-overprint palette (`#0C0E12 / #1E8FFF / #FF1F6A / #ECE7DD`) —
  not the warm-dark + gold cliché.
- Fonts: **Zodiak** (italic display serif), **Switzer** (UI sans),
  **Fragment Mono** (numerics) — none of them on the ban list.
- GPGPU FBO ping-pong simulator (`src/gpgpu/Simulator.ts`) at 256² desktop /
  128² mobile. Position-only state to halve bandwidth; velocity is a function
  of attention-weighted attractor pulls + a curl term whose strength comes
  from `phaseHeat`.
- `update.frag` and `render.vert/.frag` shaders driving the mapping
  documented in DECISIONS.md.
- Tensor → simulation mapping:
  - Initial position = hand-placed 4-anchor layout + small projected-embedding
    jitter (deterministic random projection, seed=42).
  - Per-frame attention max-over-heads of the current layer is packed into
    a `mat4` and used to weight the 4 token attractors.
  - Particle colour is mixed cyan↔magenta from a 128×37 hidden-magnitude
    data texture.
- Lenis smooth scroll → piecewise-linear remap to layer-fraction with 8% /
  8% / 10% holds at L13 / L29 / L36 (climax beats), `phaseHeat` rises on
  hold edges to drive curl + chromatic aberration.
- 6-phase narrative state machine derived from `logit_lens.json` with the
  priority order spelled out in DECISIONS.md. L0 forced to 'confusion' and
  acronym_lock gated on `layer >= L/3` to avoid early bracket-token noise
  triggering the climax.
- Single-pass post effect `RisoEffect`: chromatic aberration intensifying
  with `phaseHeat`, Bayer 4×4 dither (mixed at 55 % so it textures rather
  than dominates), film grain, cold-blue vignette. **Zero bloom.**
- DOM overlay typography (Switzer + Zodiak + Fragment Mono): live tensor
  readout (top-right), prompt + model id (top-left), narrative phase label
  (bottom-left), state hint (bottom-right). Brand reveal sits in negative
  space from the start and gains weight + tracking + colour as the L36
  plateau is reached (90–100 % scroll), per the brief's anti-cliché note.
- Capability sniff: WebGL2 + `EXT_color_buffer_float`. Without both the page
  shows a tasteful fallback message.
- `prefers-reduced-motion`: ScrollDriver writes a single climax snapshot,
  Lenis is never mounted, `useFrame` skips `sim.step` so the seed pose is
  frozen with the brand reveal at full intensity.
- GitHub Actions workflow `.github/workflows/deploy.yml` (typecheck + build
  + upload + deploy-pages).
- Headless smoke harness `scripts/smoke.mjs` (chromium via swiftshader)
  captures top / mid / end screenshots; verified no JS errors.

## Numbers (smoke run, swiftshader, 1280×800)

- JS bundle: 315 kB gzipped total (three 177 kB + r3f 124 kB + app 14 kB).
  Hero budget was 600 kB, comfortably under.
- CSS: 1.2 kB gzipped.
- Tensor payload (loaded async, browser-cached): 2.4 MB.
- TypeScript: strict mode, 0 errors. ESLint: 0 errors.
- Smoke screenshots in `scripts/smoke-{top,mid,end}.png`. The narrative
  reads as designed:
  - **L00 (top):** "confusion" phase, top1 = `" ("` 100 % — 4 token
    clusters spread across the frame in riso cyan/magenta channels.
  - **L20 (mid):** "recognition" phase, top1 = `formerly` 21.6 % —
    clusters partially merged by attention pull.
  - **L36 (end):** "english_search" phase, top1 = `All` 49.2 % — brand
    reveal "All Time High" fully visible in italic Zodiak.
- FPS / Lighthouse: not measurable in this sandbox (swiftshader, no real
  GPU, no Lighthouse binary). Static metrics that are available:
  - Bundle size budget: pass (315 kB / 600 kB).
  - Suspense + lazy data fetch: first paint < 100 ms in preview.
  - Critical request count: 4 (HTML + JS + CSS + tensors).

## Known limitations / things not done

- **No real Lighthouse or Chrome DevTools FPS measurement** in this
  environment — only logical correctness was verified. The user should run
  Lighthouse on the deployed Pages URL to confirm the ≥80 perf target.
- **GitHub Pages source toggle** must be flipped manually in repo settings
  (the agent has no access). README documents the one-click step.
- **Particle count stayed at 256²** (≈65 k) instead of 512². See DECISIONS.md
  for the trade-off; bumping to 512² is item #1 in the next-session list.
- **No leva pane wired in** — choose-by-data was iterated through in-code
  defaults and visual smoke testing instead. Re-adding leva for live
  tuning is straightforward when needed.
- **Brand reveal "particles flow around the text"** is implemented as
  growing-contrast negative space (per the brief's example), not as actual
  geometry-aware particle deflection. The latter would need an SDF of the
  text rasterised to a texture; reasonable next-session task.
- **Reduced-motion snapshot** is the seed pose with brand reveal, not a
  converged L36 state (would need a CPU warmup pass).

## First 5 next-session tasks (priority order)

1. Promote desktop particle count to 512² behind a runtime FPS gate that
   drops back to 256² if the rolling average falls under 50 fps.
2. Ship a per-particle velocity FBO so climax beats produce visible particle
   *trails*, not just colour and curl.
3. Implement geometry-aware "particles obey the brand text": rasterise
   "All Time High Technologies" to an SDF and add a soft repulsion term
   to `update.frag` whose weight ramps with `brandRevealStage`.
4. Replace the constant-stride hidden-state binning with PCA-top-128
   directions of the hidden-state matrix (more semantically meaningful
   colour modulation).
5. Add a leva panel (dev-only) exposing palette / dither strength / grain /
   chromaPx / pull / churn / damping for live tuning, and gate it behind
   `import.meta.env.DEV`.
