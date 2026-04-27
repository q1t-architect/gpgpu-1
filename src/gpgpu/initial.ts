import type { TensorBundle } from '../tensors/types';

/**
 * Splitmix64-style deterministic uniform RNG seeded once.
 * We need reproducible random projection vectors; Math.random is not.
 */
export function makeRng(seed: number): () => number {
  let state = (seed >>> 0) || 1;
  return () => {
    // Mulberry32
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box–Muller standard normal sample given two uniform samples. */
function gauss(u1: number, u2: number): number {
  const r = Math.sqrt(-2 * Math.log(Math.max(u1, 1e-9)));
  return r * Math.cos(2 * Math.PI * u2);
}

/**
 * Build a 3 × hidden Gaussian projection matrix, normalized so that the
 * resulting projected vectors stay roughly in [-1.5, 1.5].
 */
export function buildProjection(hidden: number, seed = 42): Float32Array {
  const rng = makeRng(seed);
  const M = new Float32Array(3 * hidden);
  const scale = 1 / Math.sqrt(hidden);
  for (let i = 0; i < M.length; i += 2) {
    const u1 = rng();
    const u2 = rng();
    M[i] = gauss(u1, u2) * scale;
    if (i + 1 < M.length) M[i + 1] = gauss(rng(), rng()) * scale;
  }
  return M;
}

/** Project one [hidden]-dim vector to R^3 using a precomputed [3, hidden] matrix. */
export function project(M: Float32Array, vec: Float32Array): [number, number, number] {
  const hidden = vec.length;
  let x = 0,
    y = 0,
    z = 0;
  for (let i = 0; i < hidden; i++) {
    const v = vec[i];
    x += M[i] * v;
    y += M[hidden + i] * v;
    z += M[2 * hidden + i] * v;
  }
  return [x, y, z];
}

export interface InitialPositions {
  /** RGBA flat data: x, y, z, sourceTokenIndex (0..seqLen-1). length = P*4 */
  data: Float32Array;
  /** P = textureSize * textureSize */
  textureSize: number;
  /** Per-token attractor centroids (mean of seed positions for that token). */
  attractors: Float32Array; // length seqLen*3
}

/**
 * Compute initial particle positions: every particle p ∈ [0..P) is born from
 * one input token and gets a 3D position = projection(embedding[token]) plus a
 * tiny per-particle Gaussian offset (so 65k particles aren't stacked on 4 dots).
 */
export function buildInitialPositions(
  bundle: TensorBundle,
  textureSize: number,
  cloudSpread = 0.55,
): InitialPositions {
  const { embedding, hiddenSize, seqLen } = bundle;
  const P = textureSize * textureSize;
  const data = new Float32Array(P * 4);
  const M = buildProjection(hiddenSize, 42);

  // Project the hiddenSize-dim embedding of each token to a token-center in R^3.
  const centers = new Float32Array(seqLen * 3);
  for (let t = 0; t < seqLen; t++) {
    const row = embedding.subarray(t * hiddenSize, (t + 1) * hiddenSize);
    const [cx, cy, cz] = project(M, row);
    centers[t * 3 + 0] = cx;
    centers[t * 3 + 1] = cy;
    centers[t * 3 + 2] = cz;
  }

  // Per-token RNG so the cloud around each center is reproducible.
  const rngs: Array<() => number> = [];
  for (let t = 0; t < seqLen; t++) rngs.push(makeRng(1000 + t));

  for (let p = 0; p < P; p++) {
    const t = Math.floor((p / P) * seqLen);
    const rng = rngs[t];
    const ox = gauss(rng(), rng()) * cloudSpread;
    const oy = gauss(rng(), rng()) * cloudSpread;
    const oz = gauss(rng(), rng()) * cloudSpread * 0.7; // flatter cloud reads as a "card"
    const cx = centers[t * 3 + 0];
    const cy = centers[t * 3 + 1];
    const cz = centers[t * 3 + 2];
    const i = p * 4;
    data[i + 0] = cx + ox;
    data[i + 1] = cy + oy;
    data[i + 2] = cz + oz;
    data[i + 3] = t; // source-token index in alpha channel
  }

  // Recompute centroids from the actual seeded positions, so attractors line up.
  const sums = new Float32Array(seqLen * 3);
  const counts = new Int32Array(seqLen);
  for (let p = 0; p < P; p++) {
    const i = p * 4;
    const t = data[i + 3];
    sums[t * 3 + 0] += data[i + 0];
    sums[t * 3 + 1] += data[i + 1];
    sums[t * 3 + 2] += data[i + 2];
    counts[t]++;
  }
  const attractors = new Float32Array(seqLen * 3);
  for (let t = 0; t < seqLen; t++) {
    const c = Math.max(counts[t], 1);
    attractors[t * 3 + 0] = sums[t * 3 + 0] / c;
    attractors[t * 3 + 1] = sums[t * 3 + 1] / c;
    attractors[t * 3 + 2] = sums[t * 3 + 2] / c;
  }

  return { data, textureSize, attractors };
}

/**
 * Build a [128 x L] R32F texture-data Float32Array of normalized magnitudes
 * of hidden_states[ℓ, lastToken, ::stride]. Used by render.vert to color
 * particles by current-layer activation.
 *
 * Returns a length-(128*L) Float32Array stored row-major (row=layer, col=stride bin).
 */
export function buildHiddenMagData(
  bundle: TensorBundle,
  binCount = 128,
): { data: Float32Array; cols: number; rows: number } {
  const { hiddenStates, hiddenSize, seqLen, numLayers } = bundle;
  // hiddenStates layout: [L+1, seq, hidden]. We use layers 0..L (inclusive of L).
  const rows = numLayers + 1;
  const cols = binCount;
  const data = new Float32Array(rows * cols);
  const stride = Math.floor(hiddenSize / binCount);
  const lastToken = seqLen - 1;

  for (let l = 0; l < rows; l++) {
    const baseLayer = l * seqLen * hiddenSize;
    const baseRow = baseLayer + lastToken * hiddenSize;
    let max = 0;
    const tmp = new Float32Array(cols);
    for (let b = 0; b < cols; b++) {
      const idx = baseRow + b * stride;
      const v = Math.abs(hiddenStates[idx]);
      tmp[b] = v;
      if (v > max) max = v;
    }
    const inv = max > 0 ? 1 / max : 1;
    for (let b = 0; b < cols; b++) data[l * cols + b] = tmp[b] * inv;
  }

  return { data, cols, rows };
}

/**
 * Precompute attention "max over heads" per layer as 4×4 matrices.
 * Returns a Float32Array of length L*16 (row-major 4×4 per layer).
 */
export function buildAttentionMaxPerLayer(bundle: TensorBundle): Float32Array {
  const { attentionWeights, numLayers, numHeads, seqLen } = bundle;
  const out = new Float32Array(numLayers * seqLen * seqLen);
  const perLayer = numHeads * seqLen * seqLen;
  const perHead = seqLen * seqLen;
  for (let l = 0; l < numLayers; l++) {
    for (let h = 0; h < numHeads; h++) {
      const base = l * perLayer + h * perHead;
      for (let i = 0; i < seqLen * seqLen; i++) {
        const v = attentionWeights[base + i];
        const o = l * seqLen * seqLen + i;
        if (v > out[o]) out[o] = v;
      }
    }
  }
  return out;
}
