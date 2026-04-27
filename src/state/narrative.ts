import type { LogitLens, NarrativePhase } from './types-runtime';
import type { TensorBundle } from '../tensors/types';

export interface PhaseSample {
  layer: number;
  topToken: string;
  topId: number;
  topProb: number;
  phase: NarrativePhase;
}

const CJK_RE = /[一-鿿]/;
const LATIN_RE = /[A-Za-z]/;

/**
 * Derive a phase per layer from logit_lens.json. Conditions are evaluated in
 * priority order so that, e.g., a CJK top1 always wins over `acronym_lock`
 * even if it has prob > 0.3.
 */
export function derivePhases(bundle: TensorBundle): PhaseSample[] {
  const lens: LogitLens = bundle.logitLens;
  const L = bundle.numLayers;
  const samples: PhaseSample[] = [];

  let lastTopId: number | null = null;
  let stableCount = 0;
  let sawCJK = false;

  for (const ll of lens.layers) {
    const layer = ll.layer;
    const top = ll.top_tokens[0];
    const topId = top.id;
    const topToken = top.token;
    const topProb = top.prob;

    const isCJK = CJK_RE.test(topToken);
    const isLatin = LATIN_RE.test(topToken);
    if (lastTopId === topId) {
      stableCount += 1;
    } else {
      stableCount = 1;
      lastTopId = topId;
    }

    let phase: NarrativePhase;
    if (layer === L && topProb > 0.7) phase = 'crystallization';
    else if (isCJK) {
      phase = 'cross_lingual';
      sawCJK = true;
    } else if (sawCJK && isLatin) phase = 'english_search';
    else if (topProb > 0.3) phase = 'acronym_lock';
    else if (stableCount >= 2) phase = 'recognition';
    else phase = 'confusion';

    samples.push({ layer, topToken, topId, topProb, phase });
  }
  return samples;
}

/* ---------------------------------------------------------------------- *
 *  Scroll → layer fraction with non-linear holds at L13, L29, L36.       *
 *  Holds are implemented as plateaus in a piecewise-linear remap so that *
 *  the scroll spends more time around climax beats than ramp segments.   *
 * ---------------------------------------------------------------------- */

interface HoldSpec {
  layer: number;
  width: number; // fraction of total scroll the plateau occupies
}

const DEFAULT_HOLDS: HoldSpec[] = [
  { layer: 13, width: 0.08 },
  { layer: 29, width: 0.08 },
  { layer: 36, width: 0.10 },
];

/** Build a (layerFrac, scroll) lookup spline. Pure function of L and holds. */
export interface ScrollMap {
  toLayer(scroll01: number): number;
  fromLayer(layerFrac: number): number;
  /** 0..1 climax-heat: 1.0 inside a hold plateau, 0 outside, smooth edges. */
  phaseHeat(scroll01: number): number;
}

export function buildScrollMap(L: number, holds: HoldSpec[] = DEFAULT_HOLDS): ScrollMap {
  // Total scroll is partitioned into:
  //   - holds: sum(holds.width)
  //   - ramps: 1 - sum(holds.width), distributed proportionally between
  //     consecutive layer anchors (0, hold layers ..., L).
  const totalHold = holds.reduce((a, b) => a + b.width, 0);
  const rampBudget = Math.max(1e-3, 1 - totalHold);

  const anchors = [0, ...holds.map((h) => h.layer), L];
  const segLens: number[] = [];
  for (let i = 0; i < anchors.length - 1; i++) {
    segLens.push(anchors[i + 1] - anchors[i]);
  }
  const totalLayerSpan = segLens.reduce((a, b) => a + b, 0);
  const rampScrollPer = segLens.map((s) => (s / totalLayerSpan) * rampBudget);

  // Build keyframes: each layer anchor maps to a [scrollStart, scrollEnd]
  // pair. For the start anchor, end = start (zero hold); for hold anchors,
  // end = start + holdWidth.
  interface KF {
    layer: number;
    sStart: number;
    sEnd: number;
  }
  const kfs: KF[] = [];
  let s = 0;
  for (let i = 0; i < anchors.length; i++) {
    const layer = anchors[i];
    const isHold = i > 0 && i <= holds.length;
    const holdWidth = isHold ? holds[i - 1].width : 0;
    kfs.push({ layer, sStart: s, sEnd: s + holdWidth });
    s += holdWidth;
    if (i < segLens.length) s += rampScrollPer[i];
  }

  function toLayer(scroll01: number): number {
    const x = Math.min(1, Math.max(0, scroll01));
    for (let i = 0; i < kfs.length; i++) {
      const kf = kfs[i];
      if (x <= kf.sEnd) {
        // We're inside this hold (or at the very start).
        return kf.layer;
      }
      const next = kfs[i + 1];
      if (!next) return kf.layer;
      if (x < next.sStart) {
        const t = (x - kf.sEnd) / (next.sStart - kf.sEnd);
        return kf.layer + t * (next.layer - kf.layer);
      }
    }
    return L;
  }

  function fromLayer(layerFrac: number): number {
    const lf = Math.min(L, Math.max(0, layerFrac));
    for (let i = 0; i < kfs.length - 1; i++) {
      const kf = kfs[i];
      const next = kfs[i + 1];
      if (lf <= next.layer) {
        const t = (lf - kf.layer) / Math.max(1e-6, next.layer - kf.layer);
        return kf.sEnd + t * (next.sStart - kf.sEnd);
      }
    }
    return 1;
  }

  function phaseHeat(scroll01: number): number {
    const x = Math.min(1, Math.max(0, scroll01));
    let max = 0;
    for (let i = 1; i <= holds.length; i++) {
      const kf = kfs[i];
      const inside = x >= kf.sStart && x <= kf.sEnd;
      if (inside) return 1;
      const edge = 0.04;
      const t1 = Math.max(0, 1 - Math.abs(x - kf.sStart) / edge);
      const t2 = Math.max(0, 1 - Math.abs(x - kf.sEnd) / edge);
      const e = Math.max(t1, t2);
      if (e > max) max = e;
    }
    return max;
  }

  return { toLayer, fromLayer, phaseHeat };
}
