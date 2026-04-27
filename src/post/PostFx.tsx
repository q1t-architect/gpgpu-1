import { useMemo } from 'react';
import { EffectComposer } from '@react-three/postprocessing';
import { wrapEffect } from '@react-three/postprocessing';
import { RisoEffect } from './RisoEffect';

const Riso = wrapEffect(RisoEffect);

interface Props {
  grain?: number;
  chromaPx?: number;
  vignette?: number;
}

/**
 * Single-pass post chain (chromatic aberration → Bayer dither → grain →
 * vignette). No bloom anywhere by design.
 */
export function PostFx({ grain = 0.05, chromaPx = 0.4, vignette = 0.85 }: Props) {
  const effect = useMemo(() => ({ grain, chromaPx, vignette }), [grain, chromaPx, vignette]);
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Riso {...effect} />
    </EffectComposer>
  );
}
