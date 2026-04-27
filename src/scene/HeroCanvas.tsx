import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useState } from 'react';
import { Particles } from './Particles';
import type { TensorBundle } from '../tensors/types';
import { frame } from '../state/store';

interface Props {
  bundle: TensorBundle;
}

function detectMobile(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window.innerWidth;
  const touch = 'ontouchstart' in window;
  return touch && w < 900;
}

export function HeroCanvas({ bundle }: Props) {
  const [isMobile, setIsMobile] = useState(detectMobile());

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    frame.reducedMotion = mq.matches;
    const onChange = () => {
      frame.reducedMotion = mq.matches;
    };
    mq.addEventListener('change', onChange);
    const onResize = () => setIsMobile(detectMobile());
    window.addEventListener('resize', onResize);
    return () => {
      mq.removeEventListener('change', onChange);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    frame.isMobile = isMobile;
  }, [isMobile]);

  const textureSize = isMobile ? 128 : 256;
  const dprMax = isMobile ? 1.25 : 1.75;

  return (
    <Canvas
      className="hero-canvas"
      dpr={[1, dprMax]}
      gl={{
        antialias: false,
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
        depth: true,
      }}
      camera={{ position: [0, 0, 5.4], fov: 38, near: 0.1, far: 50 }}
      onCreated={({ gl }) => {
        gl.setClearColor('#0c0e12', 1);
      }}
    >
      <Suspense fallback={null}>
        <Particles bundle={bundle} textureSize={textureSize} />
      </Suspense>
    </Canvas>
  );
}
