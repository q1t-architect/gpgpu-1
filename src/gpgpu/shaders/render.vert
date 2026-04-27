// Particle render vertex shader.
// Each "vertex" is one particle. We look up its position in the GPGPU position
// texture using a precomputed UV per-vertex (uvParticle attribute).

precision highp float;

attribute vec2 uvParticle;     // texel coord into position texture

uniform sampler2D uPosTex;
uniform sampler2D uHiddenMagTex;   // [128 x L] R32F, magnitude per stride/layer
uniform float uLayerFrac;          // 0..L
uniform float uHiddenStrideCount;  // = 128
uniform float uLayerCount;         // = 36
uniform float uPixelSize;
uniform float uChannelOffset;      // px offset between cyan / magenta passes
uniform float uChannel;            // -1.0 = cyan pass, +1.0 = magenta pass
uniform float uPhaseHeat;
uniform vec2 uResolution;

varying float vMag;
varying float vTokenIdx;
varying float vChannel;

void main() {
  vec4 state = texture2D(uPosTex, uvParticle);
  vec3 pos = state.xyz;
  vTokenIdx = state.a;

  // Look up hidden magnitude for current layer + a per-particle stride bin.
  float strideBin = floor(uvParticle.x * uHiddenStrideCount);
  float u = (strideBin + 0.5) / uHiddenStrideCount;
  float v = clamp(uLayerFrac, 0.0, uLayerCount - 1.0);
  float vN = (v + 0.5) / uLayerCount;
  vMag = texture2D(uHiddenMagTex, vec2(u, vN)).r;

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  vec4 clip  = projectionMatrix * mvPos;

  // Channel offset in clip space — pixel-perfect on the X axis.
  float pxToClip = (2.0 / uResolution.x) * clip.w;
  clip.x += uChannel * uChannelOffset * pxToClip;

  gl_Position = clip;
  // Slightly larger size when hidden magnitude is high; floor for crispness.
  float size = uPixelSize * (1.0 + 0.6 * vMag + 0.3 * uPhaseHeat);
  gl_PointSize = max(1.0, floor(size));

  vChannel = uChannel;
}
