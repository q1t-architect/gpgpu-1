import { Effect, BlendFunction, EffectAttribute } from 'postprocessing';
import { Uniform } from 'three';
import { frame } from '../state/store';

const fragment = /* glsl */ `
  uniform float uTime;
  uniform float uPhaseHeat;
  uniform float uGrain;
  uniform float uChromaPx;
  uniform float uVignetteAmount;
  uniform vec2  uResolution;

  // 4x4 Bayer matrix.
  float bayer4(vec2 p) {
    int x = int(mod(p.x, 4.0));
    int y = int(mod(p.y, 4.0));
    int idx = y * 4 + x;
    float m;
    if (idx == 0) m = 0.0;
    else if (idx == 1) m = 8.0;
    else if (idx == 2) m = 2.0;
    else if (idx == 3) m = 10.0;
    else if (idx == 4) m = 12.0;
    else if (idx == 5) m = 4.0;
    else if (idx == 6) m = 14.0;
    else if (idx == 7) m = 6.0;
    else if (idx == 8) m = 3.0;
    else if (idx == 9) m = 11.0;
    else if (idx == 10) m = 1.0;
    else if (idx == 11) m = 9.0;
    else if (idx == 12) m = 15.0;
    else if (idx == 13) m = 7.0;
    else if (idx == 14) m = 13.0;
    else m = 5.0;
    return (m + 0.5) / 16.0;
  }

  float hash12(vec2 p) {
    p = fract(p * vec2(443.8975, 397.2973));
    p += dot(p, p.yx + 19.19);
    return fract((p.x + p.y) * p.x);
  }

  // Quantize one channel to N levels with ordered dither.
  float dither1(float c, float threshold) {
    const float levels = 24.0; // visible banding without going full posterize
    float scaled = c * (levels - 1.0);
    float low  = floor(scaled);
    float high = low + 1.0;
    float t = scaled - low;
    float pick = step(threshold, t);
    return mix(low, high, pick) / (levels - 1.0);
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 fragPx = uv * uResolution;

    // Chromatic aberration that intensifies on climax phase (uPhaseHeat).
    vec2 toCenter = uv - 0.5;
    float r = length(toCenter);
    float caStrength = (uChromaPx + uPhaseHeat * 4.0) * (0.4 + r * 1.6);
    vec2 caOffset = normalize(toCenter + 1e-6) * caStrength / uResolution;
    vec3 ca = vec3(
      texture2D(inputBuffer, uv + caOffset).r,
      inputColor.g,
      texture2D(inputBuffer, uv - caOffset).b
    );

    // Bayer dither per channel.
    float th = bayer4(fragPx);
    vec3 dith = vec3(dither1(ca.r, th), dither1(ca.g, th), dither1(ca.b, th));

    // Film grain.
    float n = hash12(fragPx + uTime * 60.0) - 0.5;
    dith += vec3(n) * uGrain;

    // Vignette toward a deep cold blue, not pure black.
    vec3 vignetteCol = vec3(0.02, 0.04, 0.07);
    float v = smoothstep(0.45, 1.05, r);
    dith = mix(dith, vignetteCol, v * uVignetteAmount);

    outputColor = vec4(clamp(dith, 0.0, 1.0), inputColor.a);
  }
`;

interface RisoOptions {
  grain?: number;
  chromaPx?: number;
  vignette?: number;
}

export class RisoEffect extends Effect {
  constructor({ grain = 0.06, chromaPx = 0.4, vignette = 0.85 }: RisoOptions = {}) {
    super('RisoEffect', fragment, {
      blendFunction: BlendFunction.NORMAL,
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform<number | THREE_Vec2>>([
        ['uTime', new Uniform(0) as Uniform<number>],
        ['uPhaseHeat', new Uniform(0) as Uniform<number>],
        ['uGrain', new Uniform(grain) as Uniform<number>],
        ['uChromaPx', new Uniform(chromaPx) as Uniform<number>],
        ['uVignetteAmount', new Uniform(vignette) as Uniform<number>],
        ['uResolution', new Uniform({ x: 1, y: 1 }) as unknown as Uniform<THREE_Vec2>],
      ]) as Map<string, Uniform>,
    });
  }

  // Called automatically by postprocessing each frame.
  override update(
    _renderer: unknown,
    _inputBuffer: unknown,
    deltaTime?: number,
  ): void {
    const tu = this.uniforms.get('uTime');
    if (tu) (tu.value as number) += deltaTime ?? 0;
    const ph = this.uniforms.get('uPhaseHeat');
    if (ph) ph.value = frame.phaseHeat;
  }

  override setSize(width: number, height: number): void {
    const u = this.uniforms.get('uResolution');
    if (u) (u.value as THREE_Vec2) = { x: width, y: height };
  }
}

// Local minimal vec2 shape so we don't pull THREE.Vector2 typing into a
// non-React module — postprocessing accepts plain {x,y} objects for vec2.
interface THREE_Vec2 {
  x: number;
  y: number;
}
