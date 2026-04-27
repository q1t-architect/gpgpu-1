import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Simulator } from '../gpgpu/Simulator';
import {
  buildAttentionMaxPerLayer,
  buildHiddenMagData,
  buildInitialPositions,
} from '../gpgpu/initial';
import renderVert from '../gpgpu/shaders/render.vert';
import renderFrag from '../gpgpu/shaders/render.frag';
import type { TensorBundle } from '../tensors/types';
import { frame } from '../state/store';

const COLOR_CYAN = new THREE.Color('#1e8fff');
const COLOR_MAGENTA = new THREE.Color('#ff1f6a');

interface Props {
  bundle: TensorBundle;
  textureSize: number; // 256 desktop, 128 mobile
  pixelSize?: number;
  channelOffset?: number;
}

export function Particles({
  bundle,
  textureSize,
  pixelSize = 2.0,
  channelOffset = 1.4,
}: Props) {
  const renderer = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);

  /* Build all GPU resources once -------------------------------------------- */
  const sim = useMemo(() => {
    const init = buildInitialPositions(bundle, textureSize);
    const s = new Simulator({ size: textureSize, seedData: init.data });
    s.uniforms.uAttractors.value = [
      new THREE.Vector3(init.attractors[0], init.attractors[1], init.attractors[2]),
      new THREE.Vector3(init.attractors[3], init.attractors[4], init.attractors[5]),
      new THREE.Vector3(init.attractors[6], init.attractors[7], init.attractors[8]),
      new THREE.Vector3(init.attractors[9], init.attractors[10], init.attractors[11]),
    ];
    return s;
  }, [bundle, textureSize]);

  // Initialize FBOs on first available renderer.
  useEffect(() => {
    sim.initialize(renderer);
    return () => sim.dispose();
  }, [sim, renderer]);

  /* Per-layer attention max + hidden magnitude data textures ---------------- */
  const attentionPerLayer = useMemo(() => buildAttentionMaxPerLayer(bundle), [bundle]);
  const hiddenMag = useMemo(() => buildHiddenMagData(bundle, 128), [bundle]);

  const hiddenMagTex = useMemo(() => {
    const tex = new THREE.DataTexture(
      hiddenMag.data as unknown as Float32Array<ArrayBuffer>,
      hiddenMag.cols,
      hiddenMag.rows,
      THREE.RedFormat,
      THREE.FloatType,
    );
    tex.needsUpdate = true;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, [hiddenMag]);

  /* Build a BufferGeometry of P points; each vertex carries its texel UV ---- */
  const pointsGeom = useMemo(() => {
    const P = textureSize * textureSize;
    const positions = new Float32Array(P * 3); // dummy positions; real ones come from texture lookup
    const uvParticle = new Float32Array(P * 2);
    for (let p = 0; p < P; p++) {
      const x = p % textureSize;
      const y = Math.floor(p / textureSize);
      uvParticle[p * 2 + 0] = (x + 0.5) / textureSize;
      uvParticle[p * 2 + 1] = (y + 0.5) / textureSize;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('uvParticle', new THREE.BufferAttribute(uvParticle, 2));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 50);
    return g;
  }, [textureSize]);

  /* Two render materials: cyan pass + magenta pass ------------------------- */
  const renderUniforms = useMemo(() => {
    return {
      uPosTex: { value: sim.currentTexture },
      uHiddenMagTex: { value: hiddenMagTex },
      uLayerFrac: { value: 0 },
      uHiddenStrideCount: { value: hiddenMag.cols },
      uLayerCount: { value: hiddenMag.rows },
      uPixelSize: { value: pixelSize * dpr },
      uChannelOffset: { value: channelOffset },
      uChannel: { value: -1 },
      uPhaseHeat: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width * dpr, size.height * dpr) },
      uColorCyan: { value: COLOR_CYAN },
      uColorMagenta: { value: COLOR_MAGENTA },
      uOpacity: { value: 0.92 },
    };
  }, [sim, hiddenMagTex, hiddenMag.cols, hiddenMag.rows, pixelSize, dpr, size, channelOffset]);

  // Update resolution + pixel size on resize.
  useEffect(() => {
    renderUniforms.uResolution.value.set(size.width * dpr, size.height * dpr);
    renderUniforms.uPixelSize.value = pixelSize * dpr;
  }, [size.width, size.height, dpr, pixelSize, renderUniforms]);

  const cyanMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: renderVert,
        fragmentShader: renderFrag,
        uniforms: { ...renderUniforms, uChannel: { value: -1 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [renderUniforms],
  );

  const magentaMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: renderVert,
        fragmentShader: renderFrag,
        uniforms: { ...renderUniforms, uChannel: { value: 1 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [renderUniforms],
  );

  // Sync shared uniforms (uPosTex / uLayerFrac / uPhaseHeat) into each material.
  useEffect(() => {
    const sync = (mat: THREE.ShaderMaterial) => {
      mat.uniforms.uPosTex = renderUniforms.uPosTex;
      mat.uniforms.uHiddenMagTex = renderUniforms.uHiddenMagTex;
      mat.uniforms.uLayerFrac = renderUniforms.uLayerFrac;
      mat.uniforms.uHiddenStrideCount = renderUniforms.uHiddenStrideCount;
      mat.uniforms.uLayerCount = renderUniforms.uLayerCount;
      mat.uniforms.uPixelSize = renderUniforms.uPixelSize;
      mat.uniforms.uChannelOffset = renderUniforms.uChannelOffset;
      mat.uniforms.uPhaseHeat = renderUniforms.uPhaseHeat;
      mat.uniforms.uResolution = renderUniforms.uResolution;
      mat.uniforms.uColorCyan = renderUniforms.uColorCyan;
      mat.uniforms.uColorMagenta = renderUniforms.uColorMagenta;
      mat.uniforms.uOpacity = renderUniforms.uOpacity;
    };
    sync(cyanMat);
    sync(magentaMat);
  }, [cyanMat, magentaMat, renderUniforms]);

  /* Per-frame: step simulation, push uniforms ------------------------------- */
  const tmpMat4 = useMemo(() => new THREE.Matrix4(), []);

  useFrame((_, dtRaw) => {
    if (frame.reducedMotion) {
      // Static frame: keep brand reveal uniform fresh, but never advance the sim.
      renderUniforms.uPhaseHeat.value = 0;
      return;
    }
    const dt = Math.min(dtRaw, 0.05);

    const layerFrac = frame.layerFrac;
    const layerInt = Math.min(Math.floor(layerFrac), bundle.numLayers - 1);

    // Pack the 4×4 attention max for current layer into a Matrix4.
    const seqLen = bundle.seqLen;
    const base = layerInt * seqLen * seqLen;
    const a = attentionPerLayer;
    tmpMat4.set(
      a[base + 0], a[base + 1], a[base + 2], a[base + 3],
      a[base + 4], a[base + 5], a[base + 6], a[base + 7],
      a[base + 8], a[base + 9], a[base + 10], a[base + 11],
      a[base + 12], a[base + 13], a[base + 14], a[base + 15],
    );
    sim.uniforms.uAttentionRows.value.copy(tmpMat4);
    sim.uniforms.uLayerFrac.value = layerFrac;
    sim.uniforms.uPhaseHeat.value = frame.phaseHeat;

    const newTex = sim.step(renderer, dt, performance.now() / 1000);
    renderUniforms.uPosTex.value = newTex;
    renderUniforms.uLayerFrac.value = layerFrac;
    renderUniforms.uPhaseHeat.value = frame.phaseHeat;
  });

  return (
    <>
      <points geometry={pointsGeom} material={cyanMat} frustumCulled={false} />
      <points geometry={pointsGeom} material={magentaMat} frustumCulled={false} />
    </>
  );
}
