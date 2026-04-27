import type { Manifest, LogitLens, TensorBundle, TensorAsset } from './types';

const TENSOR_BASE = `${import.meta.env.BASE_URL}data/tensors/`;

async function fetchJson<T>(file: string): Promise<T> {
  const res = await fetch(TENSOR_BASE + file, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`Failed to fetch ${file}: ${res.status}`);
  return (await res.json()) as T;
}

async function fetchBuffer(file: string, expectedBytes: number): Promise<ArrayBuffer> {
  const res = await fetch(TENSOR_BASE + file, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`Failed to fetch ${file}: ${res.status}`);
  const buf = await res.arrayBuffer();
  if (buf.byteLength !== expectedBytes) {
    throw new Error(`Size mismatch for ${file}: got ${buf.byteLength}, expected ${expectedBytes}`);
  }
  return buf;
}

function asFloat32(buf: ArrayBuffer): Float32Array {
  return new Float32Array(buf);
}

function asInt32(buf: ArrayBuffer): Int32Array {
  return new Int32Array(buf);
}

function product(shape: number[] | undefined): number {
  if (!shape) return 0;
  return shape.reduce((a, b) => a * b, 1);
}

function expect(asset: TensorAsset | undefined, name: string): TensorAsset {
  if (!asset) throw new Error(`Manifest missing asset ${name}`);
  return asset;
}

export async function loadTensorBundle(): Promise<TensorBundle> {
  const manifest = await fetchJson<Manifest>('manifest.json');

  const aIds = expect(manifest.assets.input_ids, 'input_ids');
  const aEmb = expect(manifest.assets.embedding, 'embedding');
  const aHid = expect(manifest.assets.hidden_states, 'hidden_states');
  const aAtt = expect(manifest.assets.attention_weights, 'attention_weights');
  const aLog = expect(manifest.assets.final_logits, 'final_logits');
  const aPrb = expect(manifest.assets.final_probs, 'final_probs');

  const [
    inputIdsBuf,
    embeddingBuf,
    hiddenBuf,
    attentionBuf,
    logitsBuf,
    probsBuf,
    logitLens,
  ] = await Promise.all([
    fetchBuffer(aIds.file, aIds.bytes),
    fetchBuffer(aEmb.file, aEmb.bytes),
    fetchBuffer(aHid.file, aHid.bytes),
    fetchBuffer(aAtt.file, aAtt.bytes),
    fetchBuffer(aLog.file, aLog.bytes),
    fetchBuffer(aPrb.file, aPrb.bytes),
    fetchJson<LogitLens>('logit_lens.json'),
  ]);

  const inputIds = asInt32(inputIdsBuf);
  const embedding = asFloat32(embeddingBuf);
  const hiddenStates = asFloat32(hiddenBuf);
  const attentionWeights = asFloat32(attentionBuf);
  const finalLogits = asFloat32(logitsBuf);
  const finalProbs = asFloat32(probsBuf);

  // Sanity-check shapes against typed-array length.
  const checks: [string, Float32Array | Int32Array, number[] | undefined][] = [
    ['input_ids', inputIds, aIds.shape],
    ['embedding', embedding, aEmb.shape],
    ['hidden_states', hiddenStates, aHid.shape],
    ['attention_weights', attentionWeights, aAtt.shape],
    ['final_logits', finalLogits, aLog.shape],
    ['final_probs', finalProbs, aPrb.shape],
  ];
  for (const [name, arr, shape] of checks) {
    const expected = product(shape);
    if (expected && arr.length !== expected) {
      throw new Error(`Length mismatch for ${name}: got ${arr.length}, expected ${expected}`);
    }
  }

  const numLayers = manifest.config.num_hidden_layers;
  const hiddenSize = manifest.config.hidden_size;
  const seqLen = aIds.shape?.[0] ?? 4;
  const numHeads = manifest.config.num_attention_heads;

  return {
    manifest,
    inputIds,
    embedding,
    hiddenStates,
    attentionWeights,
    finalLogits,
    finalProbs,
    logitLens,
    numLayers,
    hiddenSize,
    seqLen,
    numHeads,
  };
}

/* ------------------------------------------------------------------ *
 *  Convenience accessors – avoid recomputing flat-index math at call  *
 *  sites in render code.                                              *
 * ------------------------------------------------------------------ */

/** Returns hidden_states[layer, token, :] view as a subarray. */
export function hiddenAt(bundle: TensorBundle, layer: number, token: number): Float32Array {
  const { hiddenStates, hiddenSize, seqLen } = bundle;
  const stride = seqLen * hiddenSize;
  const offset = layer * stride + token * hiddenSize;
  return hiddenStates.subarray(offset, offset + hiddenSize);
}

/** Returns attention_weights[layer, head, q, :] (length = seqLen). */
export function attentionRow(
  bundle: TensorBundle,
  layer: number,
  head: number,
  query: number,
): Float32Array {
  const { attentionWeights, seqLen, numHeads } = bundle;
  const perLayer = numHeads * seqLen * seqLen;
  const perHead = seqLen * seqLen;
  const offset = layer * perLayer + head * perHead + query * seqLen;
  return attentionWeights.subarray(offset, offset + seqLen);
}

/**
 * Max-over-heads aggregated attention for a layer:
 * returns a [seqLen, seqLen] flat array where each cell is max across heads.
 */
export function attentionMaxOverHeads(bundle: TensorBundle, layer: number): Float32Array {
  const { attentionWeights, seqLen, numHeads } = bundle;
  const out = new Float32Array(seqLen * seqLen);
  const perLayer = numHeads * seqLen * seqLen;
  const perHead = seqLen * seqLen;
  for (let h = 0; h < numHeads; h++) {
    const base = layer * perLayer + h * perHead;
    for (let i = 0; i < seqLen * seqLen; i++) {
      const v = attentionWeights[base + i];
      if (v > out[i]) out[i] = v;
    }
  }
  return out;
}
