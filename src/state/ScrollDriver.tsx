import { useEffect, useMemo } from 'react';
import Lenis from 'lenis';
import { frame, setSub } from './store';
import { buildScrollMap, derivePhases } from './narrative';
import type { TensorBundle } from '../tensors/types';

interface Props {
  bundle: TensorBundle;
  /** Total scroll page height as multiples of viewport height. */
  scrollVh?: number;
}

/**
 * Mounts the smooth-scroll driver and translates scroll progress into:
 *   - frame.scrollProgress (0..1)
 *   - frame.layerFrac (0..L)
 *   - frame.phaseHeat (0..1)
 *   - sub.phase / sub.layerInt / sub.topToken / sub.topProb / sub.brandRevealStage
 *
 * Renders no DOM itself — the actual scrollable spacer is rendered by Overlay.
 */
export function ScrollDriver({ bundle, scrollVh = 6 }: Props) {
  const phases = useMemo(() => derivePhases(bundle), [bundle]);
  const scrollMap = useMemo(() => buildScrollMap(bundle.numLayers), [bundle.numLayers]);

  useEffect(() => {
    // prefers-reduced-motion: render a static snapshot at the climax (full
    // brand reveal, frozen sim — the simulator's own useFrame skips its
    // step when frame.reducedMotion is true).
    if (frame.reducedMotion) {
      frame.scrollProgress = 0.97;
      frame.layerFrac = bundle.numLayers;
      frame.phaseHeat = 1;
      const lastPhase = phases[phases.length - 1];
      setSub({
        layerInt: bundle.numLayers,
        phase: lastPhase.phase,
        topToken: lastPhase.topToken,
        topProb: lastPhase.topProb,
        brandRevealStage: 1,
      });
      return;
    }

    document.documentElement.style.setProperty('--scroll-vh', `${scrollVh}`);
    document.body.style.minHeight = `${scrollVh * 100}vh`;

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      lerp: 0.08,
    });

    let raf = 0;
    const tick = (time: number) => {
      lenis.raf(time);

      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const scroll = Math.min(1, Math.max(0, window.scrollY / max));
      frame.scrollProgress = scroll;

      const layerFrac = scrollMap.toLayer(scroll);
      frame.layerFrac = layerFrac;
      frame.phaseHeat = scrollMap.phaseHeat(scroll);

      const layerInt = Math.min(bundle.numLayers, Math.floor(layerFrac));
      const sample = phases[Math.min(layerInt, phases.length - 1)];

      // brand reveal aligns with the L36 plateau (last 10% of scroll).
      const brand = Math.max(0, Math.min(1, (scroll - 0.9) / 0.08));

      setSub({
        layerInt,
        phase: sample.phase,
        topToken: sample.topToken,
        topProb: sample.topProb,
        brandRevealStage: brand,
      });

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      document.body.style.minHeight = '';
    };
  }, [bundle.numLayers, phases, scrollMap, scrollVh]);

  return null;
}
