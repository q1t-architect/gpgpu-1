export type TensorDType = 'float32' | 'int32' | 'json';

export interface TensorAsset {
  file: string;
  dtype: TensorDType;
  shape?: number[];
  bytes: number;
}

export interface ManifestTokenInfo {
  position?: number;
  step?: number;
  id: number;
  decoded: string;
}

export interface ModelConfig {
  num_hidden_layers: number;
  hidden_size: number;
  num_attention_heads: number;
  num_key_value_heads: number;
  head_dim: number;
  intermediate_size: number;
  vocab_size: number;
  rope_theta: number | null;
}

export interface Manifest {
  assets: Record<string, TensorAsset>;
  model_id: string;
  prompt: string;
  config: ModelConfig;
  input_tokens: ManifestTokenInfo[];
  generated_tokens: ManifestTokenInfo[];
  total_bytes: number;
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

export interface TensorBundle {
  manifest: Manifest;
  inputIds: Int32Array;
  embedding: Float32Array;        // [seq, hidden] flat
  hiddenStates: Float32Array;     // [L+1, seq, hidden] flat
  attentionWeights: Float32Array; // [L, n_heads, seq, seq] flat
  finalLogits: Float32Array;      // [vocab]
  finalProbs: Float32Array;       // [vocab]
  logitLens: LogitLens;
  /** Convenience: number of layers (==36) */
  numLayers: number;
  /** Hidden dim (==2048) */
  hiddenSize: number;
  /** Sequence length (==4) */
  seqLen: number;
  /** Number of attention heads (==16) */
  numHeads: number;
}
