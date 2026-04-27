import * as THREE from 'three';
import updateFrag from './shaders/update.frag';
import fullscreenVert from './shaders/fullscreen.vert';

/**
 * GPGPU position simulator.
 *
 * - Stores particle position in an FBO ping-pong (RGBA32F).
 * - Each tick renders a fullscreen quad through `update.frag`, sampling the
 *   front buffer + a static "seed" texture and writing to the back buffer.
 * - The render side (Particles.tsx) samples the *current* (front) texture
 *   to draw the points.
 */
export interface SimulatorOptions {
  size: number;                  // texture side, particle count = size*size
  seedData: Float32Array;        // RGBA, length = size*size*4
}

export interface SimulatorUniforms {
  uPullStrength: { value: number };
  uReturnStrength: { value: number };
  uChurnStrength: { value: number };
  uDamping: { value: number };
  uTime: { value: number };
  uDt: { value: number };
  uLayerFrac: { value: number };
  uPhaseHeat: { value: number };
  uAttentionRows: { value: THREE.Matrix4 };
  uAttractors: { value: THREE.Vector3[] };
}

export class Simulator {
  readonly size: number;
  readonly seedTexture: THREE.DataTexture;
  readonly uniforms: SimulatorUniforms & {
    uPosTex: { value: THREE.Texture | null };
    uSeedPosTex: { value: THREE.Texture };
  };

  private rtA: THREE.WebGLRenderTarget;
  private rtB: THREE.WebGLRenderTarget;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;

  constructor(opts: SimulatorOptions) {
    this.size = opts.size;

    // Static "seed / rest pose" texture. Cast widens the TS 5.7 typed-array
    // generic (Float32Array<ArrayBufferLike>) to what DataTexture expects.
    this.seedTexture = new THREE.DataTexture(
      opts.seedData as unknown as Float32Array<ArrayBuffer>,
      opts.size,
      opts.size,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    this.seedTexture.needsUpdate = true;
    this.seedTexture.minFilter = THREE.NearestFilter;
    this.seedTexture.magFilter = THREE.NearestFilter;
    this.seedTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.seedTexture.wrapT = THREE.ClampToEdgeWrapping;

    const rtParams: THREE.RenderTargetOptions = {
      type: THREE.FloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
    };
    this.rtA = new THREE.WebGLRenderTarget(opts.size, opts.size, rtParams);
    this.rtB = new THREE.WebGLRenderTarget(opts.size, opts.size, rtParams);

    this.uniforms = {
      uPosTex: { value: null }, // will be set per tick
      uSeedPosTex: { value: this.seedTexture },
      uAttractors: {
        value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()],
      },
      uAttentionRows: { value: new THREE.Matrix4() },
      uPullStrength: { value: 0.9 },
      uReturnStrength: { value: 0.18 },
      uChurnStrength: { value: 0.6 },
      uDamping: { value: 0.06 },
      uTime: { value: 0 },
      uDt: { value: 1 / 60 },
      uLayerFrac: { value: 0 },
      uPhaseHeat: { value: 0 },
    };

    this.material = new THREE.ShaderMaterial({
      vertexShader: fullscreenVert,
      fragmentShader: updateFrag,
      uniforms: this.uniforms as unknown as Record<string, THREE.IUniform>,
      depthTest: false,
      depthWrite: false,
    });

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.scene.add(this.mesh);
  }

  /** Initialize both ping-pong buffers to the seed pose. */
  initialize(renderer: THREE.WebGLRenderer): void {
    const initMat = new THREE.ShaderMaterial({
      vertexShader: fullscreenVert,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D uSeedPosTex;
        void main() { gl_FragColor = texture2D(uSeedPosTex, vUv); }
      `,
      uniforms: { uSeedPosTex: { value: this.seedTexture } },
    });
    const tmp = new THREE.Mesh(this.mesh.geometry, initMat);
    const scene = new THREE.Scene();
    scene.add(tmp);
    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(this.rtA);
    renderer.render(scene, this.camera);
    renderer.setRenderTarget(this.rtB);
    renderer.render(scene, this.camera);
    renderer.setRenderTarget(prev);
    initMat.dispose();
    tmp.geometry === this.mesh.geometry || tmp.geometry.dispose();
  }

  /** Advance the simulation one tick; returns the texture holding the new state. */
  step(renderer: THREE.WebGLRenderer, dt: number, time: number): THREE.Texture {
    this.uniforms.uTime.value = time;
    this.uniforms.uDt.value = Math.min(dt, 1 / 30); // clamp to avoid blow-ups on tab focus
    this.uniforms.uPosTex.value = this.rtA.texture;
    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(this.rtB);
    renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(prev);
    // Swap.
    const tmp = this.rtA;
    this.rtA = this.rtB;
    this.rtB = tmp;
    return this.rtA.texture;
  }

  /** Currently-readable state texture (front buffer). */
  get currentTexture(): THREE.Texture {
    return this.rtA.texture;
  }

  dispose(): void {
    this.rtA.dispose();
    this.rtB.dispose();
    this.seedTexture.dispose();
    this.material.dispose();
    this.mesh.geometry.dispose();
  }
}
