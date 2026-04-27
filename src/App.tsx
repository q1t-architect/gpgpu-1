import { useEffect, useState } from 'react';
import { loadTensorBundle } from './tensors/loader';
import type { TensorBundle } from './tensors/types';
import { HeroCanvas } from './scene/HeroCanvas';
import { Overlay } from './ui/Overlay';
import { ScrollDriver } from './state/ScrollDriver';
import './styles/overlay.css';

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

  if (error) return <main className="hero hero--error">{error}</main>;
  if (!bundle) return <main className="hero hero--loading">…</main>;

  return (
    <>
      <HeroCanvas bundle={bundle} />
      <ScrollDriver bundle={bundle} />
      <Overlay bundle={bundle} />
      {/* This spacer creates real scroll height; the canvas is fixed. */}
      <div className="scroll-spacer" style={{ height: '600vh' }} />
    </>
  );
}
