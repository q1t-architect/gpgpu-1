// Static metadata about the seeded Qwen-2.5-3B forward-pass tensors.
// Mirrors public/data/tensors/manifest.json — exposing only what the explainer
// needs without forcing every component to re-fetch the manifest.

export interface ModelConfig {
  num_hidden_layers: number;
  hidden_size: number;
  num_attention_heads: number;
  num_key_value_heads: number;
  head_dim: number;
  intermediate_size: number;
  vocab_size: number;
}

export interface InputToken {
  position: number;
  id: number;
  decoded: string;
}

export interface GeneratedToken {
  step: number;
  id: number;
  decoded: string;
}

export const MODEL: ModelConfig = {
  num_hidden_layers: 36,
  hidden_size: 2048,
  num_attention_heads: 16,
  num_key_value_heads: 2,
  head_dim: 128,
  intermediate_size: 11008,
  vocab_size: 151936,
};

export const PROMPT = 'Reaching ATH (';

export const INPUT_TOKENS: InputToken[] = [
  { position: 0, id: 693, decoded: 'Re' },
  { position: 1, id: 11829, decoded: 'aching' },
  { position: 2, id: 87089, decoded: ' ATH' },
  { position: 3, id: 320, decoded: ' (' },
];

export const GENERATED_TOKENS: GeneratedToken[] = [
  { step: 0, id: 2403, decoded: 'All' },
  { step: 1, id: 4120, decoded: ' Time' },
  { step: 2, id: 5124, decoded: ' High' },
  { step: 3, id: 8, decoded: ')' },
  { step: 4, id: 304, decoded: ' in' },
  { step: 5, id: 279, decoded: ' the' },
  { step: 6, id: 5591, decoded: ' stock' },
  { step: 7, id: 3081, decoded: ' market' },
  { step: 8, id: 374, decoded: ' is' },
  { step: 9, id: 264, decoded: ' a' },
];
