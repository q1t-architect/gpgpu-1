// Runtime type aliases used across the state layer.  Kept separate from
// `store.ts` so that loaders / derivation modules can import these types
// without pulling in the imperative store module.

import type { LogitLens as LL } from '../tensors/types';

export type LogitLens = LL;

export type NarrativePhase =
  | 'confusion'
  | 'recognition'
  | 'acronym_lock'
  | 'cross_lingual'
  | 'english_search'
  | 'crystallization';
