import { useEffect, useState } from 'react';
import { loadTensorBundle } from './tensors/loader';
import type { TensorBundle } from './tensors/types';

export function App() {
  const [bundle, setBundle] = useState<TensorBundle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadTensorBundle()
      .then((b) => {
        if (!cancelled) setBundle(b);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="hero">
      <h1>ATH</h1>
      {error && <p style={{ color: 'tomato' }}>{error}</p>}
      {!bundle && !error && <p>Loading tensors…</p>}
      {bundle && (
        <pre style={{ textAlign: 'left', fontSize: 12 }}>
          {`prompt:        ${bundle.manifest.prompt}
layers:        ${bundle.numLayers}
hidden:        ${bundle.hiddenSize}
seq:           ${bundle.seqLen}
heads:         ${bundle.numHeads}
embedding[0]:  ${bundle.embedding[0].toFixed(4)}
hidden last:   ${bundle.hiddenStates[bundle.hiddenStates.length - 1].toFixed(4)}
logit_lens L0: ${bundle.logitLens.layers[0].top_tokens[0].token} (p=${bundle.logitLens.layers[0].top_tokens[0].prob.toFixed(3)})`}
        </pre>
      )}
    </main>
  );
}
