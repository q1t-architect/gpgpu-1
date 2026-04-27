# DECISIONS

This file is the trace of visual / technical choices made during the autonomous
build of the ATH GPGPU hero. It is meant to be read in order and updated as
work progresses.

## Визуальные референсы

Researched via WebSearch on 2026-04-27 (awwwards collections, Codrops 2025–26
articles, Lusion / 14islands / activetheory portfolios, Shadertoy classics).

1. **[Lusion — Particle Love](https://v2.lusion.co/work/particle-love/)** — 
   GPU particles whose individual identities matter (not a noise wash). I take
   the idea that each particle is a *named* unit, not anonymous fog.
2. **[Lusion — My Little Storybook](https://v2.lusion.co/work/my-little-storybook/)** —
   Hard, illustrative shapes over depth blur. Reference for the *no-bloom*
   discipline: silhouettes over haze.
3. **[Codrops — Particles, Progress, and Perseverance (WebGPU fluids, Jan 2025)](https://tympanus.net/codrops/2025/01/29/particles-progress-and-perseverance-a-journey-into-webgpu-fluids/)** —
   Reference for FBO ping-pong velocity/position split and how to keep the
   buffer state human-readable while iterating.
4. **[Codrops — Building a Real-Time Dithering Shader (Jun 2025)](https://tympanus.net/codrops/2025/06/04/building-a-real-time-dithering-shader/)** —
   Source for the ordered-dither matrix used in the post chain.
5. **[Codrops — Interactive WebGL Backgrounds: Bayer Dithering (Jul 2025)](https://tympanus.net/codrops/2025/07/30/interactive-webgl-backgrounds-a-quick-guide-to-bayer-dithering/)** —
   Bayer 4×4 lookup approach used in `dither.frag`.
6. **[Codrops — Efecto: Real-Time ASCII + Dithering (Jan 2026)](https://tympanus.net/codrops/2026/01/04/efecto-building-real-time-ascii-and-dithering-effects-with-webgl-shaders/)** —
   Reference for keeping print-style aesthetics readable on screens.
7. **[Codrops — Stefan Vitasović Portfolio Case Study (Mar 2025)](https://tympanus.net/codrops/2025/03/05/case-study-stefan-vitasovic-portfolio-2025/)** —
   Reference for the "instrument readout" overlay typography style — small
   numerals reporting live state on top of a quiet visual.
8. **[Codrops — 14islands People-First Vision (Nov 2025)](https://tympanus.net/codrops/2025/11/24/building-a-different-kind-of-agency-inside-14islands-people-first-creative-vision/)** —
   Reference for restraint: a single confident move per section instead of
   stacking effects.
9. **[Shadertoy — field, flow and particles (DttSRB)](https://www.shadertoy.com/view/DttSRB)** —
   Approach to encoding particle state in textures and reading neighbours
   during the velocity update.
10. **[Shadertoy — Flow fields (ssV3Dw, 2021)](https://www.shadertoy.com/view/ssV3Dw)** —
    Curl-noise-free flow construction; we reuse the integrator pattern but
    drive it from real attention weights, not procedural noise.
11. **[Shadertoy — Interactive Particles (McXXzH)](https://www.shadertoy.com/view/McXXzH)** —
    Reference for keeping particles individually addressable while drawing
    them as a single mesh.
12. **[Awwwards collection — WebGL Shaders + Code](https://www.awwwards.com/awwwards/collections/webgl-shaders-code/)** —
    General taste calibration: what currently passes for "studio level" and
    what already feels generic.

## Палитра

Не warm-dark + gold. Не bauhaus primaries. Выбрано **risograph-print** —
overprint двух signal-цветов поверх ink-чёрного на тёплой бумаге. Это даёт
ощущение лабораторного отчёта, напечатанного на ризографе, а не «AI premium».

| Role            | HEX       | Purpose                                                                |
| --------------- | --------- | ---------------------------------------------------------------------- |
| `--ink`         | `#0C0E12` | Background. Cold near-black, *not* warm. Reads like printer ink.       |
| `--paper`       | `#ECE7DD` | Foreground text on dark, also fallback particle color. Warm off-white. |
| `--riso-cyan`   | `#1E8FFF` | Particle channel A. Signal blue, more saturated than print cyan.       |
| `--riso-magenta`| `#FF1F6A` | Particle channel B. Hot magenta, used for climax / acronym lock.       |
| `--steel`       | `#6E7480` | Mid grey, UI lines, axis labels.                                       |
| `--alert`       | `#FFC857` | Tiny accent for `(` / `)` punctuation glyphs in overlay only.          |

Обоснование: цвета подобраны так, что cyan и magenta при overprint в
постпроцессе дают тонкий чёрный (через subtractive-mix приближение в
shader), а на бумаге — глубокий фиолетовый. Это работает и как метафора
attention-смешивания (две головы внимания, два канала).

## Шрифты

Ban list: JetBrains Mono, Inter, Geist. Все три выбранных шрифта — бесплатные
и self-hosted через CDN провайдеров.

| Slot     | Font           | Source                                          | License     | Why                                                                     |
| -------- | -------------- | ----------------------------------------------- | ----------- | ----------------------------------------------------------------------- |
| Display  | **Zodiak**     | [Fontshare](https://www.fontshare.com/fonts/zodiak) | Free / OFL  | Variable serif with strong wedges; brand reveal needs editorial weight, not tech-sans. Pairs with risograph aesthetic. |
| Sans     | **Switzer**    | [Fontshare](https://www.fontshare.com/fonts/switzer) | Free / OFL  | The chosen Inter-alternative; neutral but with a touch of humanist warmth. |
| Mono     | **Fragment Mono** | [Google Fonts](https://fonts.google.com/specimen/Fragment+Mono) | OFL | Monospace with terminal personality but unusual ink trap details — distinct from JetBrains. Used for live tensor readouts and layer counter. |

Все шрифты подгружаются через `<link>` в index.html; `font-display: swap`.

## Стиль рендера частиц

Выбран **риsograph-overprint** — две прямоугольных точки 1–2 px,
смещённые на ±0.5 px по X в каналах cyan / magenta. Без glow, без bloom.

Отвергнуты:
- *generic round glow points* — клише AI-hero;
- *ASCII glyphs* — слишком много визуальной плотности на 262 144 точек, теряется силуэт;
- *line trails* — красиво, но прячут реальную мгновенную позицию частицы (а у нас она несёт смысл — это projection эмбеддинга);
- *halftone-dotted* — слишком близко к reference Codrops Efecto, нечего сказать сверху;
- *CRT scanlines* — переходит в эстетику ретро-arcade, конфликтует с premium-полем «технологий».

## Постпроцессинг

Цепочка (НЕ Bloom-only):

1. **Bayer 4×4 dithering** на финальном фрейме с порогом, зависящим от
   яркости. Превращает сглаженный градиент в типографские «мухи».
2. **Film grain** ~3% монохромный, связан с `time`.
3. **Subtle chromatic aberration** ±0.3 px на углах кадра, усиливается до
   ±1.5 px на climax-битах (L13 / L29 / L36) — это даёт визуальный «всплеск»
   без банального bloom.
4. **Vignette** очень мягкий, тёмно-синий не чёрный.

Bloom не используется ни на одном этапе.

## Маппинг тензоров на симуляцию

Все формулы детерминированы (фиксированный seed) и вычисляются один раз на
загрузке.

```
P             = 262_144                                  // particle count, 512×512
seq           = 4                                        // tokens
hidden        = 2048
L             = 36                                       // layers (residual stream has L+1 entries)

// 1) Initial position from embedding[token=lastToken, :].
//    Each particle p picks token t = floor(p / (P/seq)) and a random
//    projection vector r_p ∈ R^hidden drawn once from N(0, I/√hidden).
//    pos0[p] = (E[t, :] · Rx_p,  E[t, :] · Ry_p,  E[t, :] · Rz_p) * scale
//
//    Rx, Ry, Rz are the 3 rows of a fixed Gaussian projection matrix
//    R ∈ R^{3 × hidden} with seed=42. Stored once in a Float32Array, used to
//    fill the initial position FBO texture.

// 2) Per-frame target field driven by attention.
//    For currentLayer ℓ ∈ [0, L) compute A_max[ℓ, q, k] = max over heads h of
//    attention[ℓ, h, q, k]. (precomputed for all 36 layers → 4×4 matrix each.)
//    Each token t has a 3D attractor center C_t = mean of pos for particles
//    born from token t. The velocity nudge for particle p (born from token tₚ)
//    becomes:
//        v += sum_{k} A_max[ℓ, tₚ, k] * normalize(C_k - pos[p]) * forceGain
//    On climax layers a curl-component is added (curl of A_max projected to
//    3D via the same R) so particles visibly *churn* instead of just sliding.

// 3) Color from hidden state magnitude.
//    Take h[ℓ, lastToken, :], stride 16 → 128 floats. Each particle p reads
//    one of those 128 floats based on (p mod 128). Map magnitude through
//    a sigmoid to a mix factor between cyan and magenta channels.

// 4) Scroll → layer fraction with non-linear holds.
//    layerFrac(scroll) = piecewise-linear remap of [0..1] → [0..L] with
//    plateaus around L=13 (recognition), L=29 (acronym lock), L=36
//    (crystallization). Each plateau holds the fraction for ~8% of total
//    scroll so the climax beat is visually parseable.

// 5) Phase derivation from logit_lens.
//    For each layer ℓ compute:
//      top1 = logitLens.layers[ℓ].top_tokens[0]
//      dominance = top1.prob
//      isCJK = /[一-鿿]/.test(top1.token)
//      isLatin = /[A-Za-z]/.test(top1.token)
//      stableTop1 = same top1.id as previous layer
//    Phase resolution priority:
//      crystallization     if ℓ == L && dominance > 0.7
//      cross-lingual       if isCJK
//      english_search      if !isCJK && was_CJK && isLatin
//      acronym_lock        if dominance > 0.3
//      recognition         if stableTop1 holds 2+ layers
//      confusion           otherwise
//    NB: derived from data, not hardcoded enum positions.
```

## Trade-offs и компромиссы

To be filled progressively as compromises are made.

## TODO следующая сессия

To be populated by `RUN_REPORT.md` at the end of this run.
