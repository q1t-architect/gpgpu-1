/**
 * Tiny imperative store of per-frame state that React components feed into the
 * R3F render loop without re-rendering the React tree.
 *
 * Anything touched on every animation frame (scroll, layer fraction, phase
 * heat) lives here as plain refs.  Things that change rarely (current phase
 * label, brand-reveal stage) go through `useSyncExternalStore`.
 */

export type NarrativePhase =
  | 'confusion'
  | 'recognition'
  | 'acronym_lock'
  | 'cross_lingual'
  | 'english_search'
  | 'crystallization';

export interface FrameState {
  scrollProgress: number;  // 0..1
  layerFrac: number;       // 0..L (fractional)
  phaseHeat: number;       // 0..1, climax intensity
  reducedMotion: boolean;
  isMobile: boolean;
}

export const frame: FrameState = {
  scrollProgress: 0,
  layerFrac: 0,
  phaseHeat: 0,
  reducedMotion: false,
  isMobile: false,
};

interface SubState {
  phase: NarrativePhase;
  layerInt: number;          // floor(layerFrac), clamped to L
  topToken: string;
  topProb: number;
  brandRevealStage: number;  // 0..1, drives DOM brand reveal
}

let sub: SubState = {
  phase: 'confusion',
  layerInt: 0,
  topToken: '',
  topProb: 0,
  brandRevealStage: 0,
};

const listeners = new Set<() => void>();

export function getSub(): SubState {
  return sub;
}

export function setSub(next: Partial<SubState>): void {
  let dirty = false;
  for (const k of Object.keys(next) as (keyof SubState)[]) {
    if (sub[k] !== next[k]) {
      dirty = true;
      break;
    }
  }
  if (!dirty) return;
  sub = { ...sub, ...next };
  for (const l of listeners) l();
}

export function subscribeSub(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
