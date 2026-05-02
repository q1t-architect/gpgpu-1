// Lightweight async loader for the seeded tensors. Each asset is independently
// fetchable so demos can lazy-load only what they need (the embedding viewer
// doesn't need the 1.2 MB hidden_states bundle, for example).

import { MODEL } from './manifest-types';

const BASE = `${import.meta.env.BASE_URL}data/tensors/`;

interface CacheEntry<T> {
  promise: Promise<T>;
}

const cache = new Map<string, CacheEntry<unknown>>();

function once<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit) return hit.promise;
  const promise = fn();
  cache.set(key, { promise });
  return promise;
}

async function fetchFloat32(file: string): Promise<Float32Array> {
  const res = await fetch(BASE + file);
  if (!res.ok) throw new Error(`Failed to load ${file}: ${res.status}`);
  const buf = await res.arrayBuffer();
  return new Float32Array(buf);
}

async function fetchJson<T>(file: string): Promise<T> {
  const res = await fetch(BASE + file);
  if (!res.ok) throw new Error(`Failed to load ${file}: ${res.status}`);
  return (await res.json()) as T;
}

/**
 * embedding[seq=4][hidden=2048] — the embedding-lookup output for the four
 * input tokens. This is the input to layer 0 of the residual stream.
 */
export function loadEmbedding(): Promise<Float32Array> {
  return once('embedding', () => fetchFloat32('embedding.bin'));
}

/**
 * hidden_states[L+1=37][seq=4][hidden=2048] — residual stream after each
 * transformer block. Index 0 = embedding (pre-block-0), index 36 = final
 * residual stream after all 36 blocks.
 */
export function loadHiddenStates(): Promise<Float32Array> {
  return once('hidden_states', () => fetchFloat32('hidden_states.bin'));
}

/**
 * attention_weights[L=36][heads=16][q=4][k=4] — post-softmax attention
 * weights at every layer × head, with causal mask already applied.
 */
export function loadAttentionWeights(): Promise<Float32Array> {
  return once('attention_weights', () => fetchFloat32('attention_weights.bin'));
}

/**
 * final_probs[151936] — softmax probabilities of the next token after the
 * full forward pass. Argmax is token id 2403 = "All".
 */
export function loadFinalProbs(): Promise<Float32Array> {
  return once('final_probs', () => fetchFloat32('final_probs.bin'));
}

export function loadFinalLogits(): Promise<Float32Array> {
  return once('final_logits', () => fetchFloat32('final_logits.bin'));
}

export interface LogitLensTopToken {
  id: number;
  token: string;
  prob: number;
}
export interface LogitLensLayer {
  layer: number;
  top_tokens: LogitLensTopToken[];
}
export interface LogitLens {
  prompt: string;
  first_all_layer: number;
  layers: LogitLensLayer[];
}

export function loadLogitLens(): Promise<LogitLens> {
  return once('logit_lens', () => fetchJson<LogitLens>('logit_lens.json'));
}

export interface AutoregressionStep {
  step: number;
  id: number;
  decoded: string;
}

export function loadAutoregression(): Promise<AutoregressionStep[]> {
  return once('autoregression', () => fetchJson<AutoregressionStep[]>('autoregression.json'));
}

// ----- helpers for indexing ----------------------------------------------

const { hidden_size, num_attention_heads, num_key_value_heads, head_dim } = MODEL;

/**
 * Slice a single-token embedding row from the [seq, hidden] tensor.
 */
export function embeddingRow(buf: Float32Array, position: number): Float32Array {
  return buf.subarray(position * hidden_size, (position + 1) * hidden_size);
}

/**
 * Slice the residual stream at layer ℓ for token `position`.
 * `ℓ = 0` → after embedding lookup (block input #0). `ℓ = 36` → output of last block.
 */
export function hiddenStateRow(buf: Float32Array, layer: number, position: number): Float32Array {
  const stride = hidden_size; // hidden per row
  const perLayer = 4 * stride; // 4 tokens × 2048
  const offset = layer * perLayer + position * stride;
  return buf.subarray(offset, offset + stride);
}

/**
 * Slice attention[layer][head][query][key] as a 4×4 matrix flattened row-major.
 */
export function attentionMatrix(buf: Float32Array, layer: number, head: number): Float32Array {
  const perHead = 16; // 4 q × 4 k
  const perLayer = 16 * perHead; // 16 heads
  const offset = layer * perLayer + head * perHead;
  return buf.subarray(offset, offset + perHead);
}

export const SHAPES = {
  embedding: [4, hidden_size],
  hidden_states: [37, 4, hidden_size],
  attention_weights: [36, num_attention_heads, 4, 4],
  final_probs: [151936],
  q_per_token: [num_attention_heads, head_dim],
  kv_per_token: [num_key_value_heads, head_dim],
} as const;
