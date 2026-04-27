// Position update for one particle.
//
// Read previous position (.xyz) + source-token index (.w) from the ping-pong
// texture, also read the *initial* position from the seed texture (so we can
// gently pull particles back to their projected-embedding rest pose).
//
// Velocity field is the sum of pulls toward 4 attractors weighted by
// max-over-heads attention of the current layer for the source token.
// On climax beats, an extra curl term is added so particles visibly churn.

precision highp float;

varying vec2 vUv;

uniform sampler2D uPosTex;        // current state (rgb = pos, a = sourceToken in 0..3)
uniform sampler2D uSeedPosTex;    // rest pose (rgb = pos, a = sourceToken)
uniform vec3 uAttractors[4];      // C_t, t in [0..3]
uniform mat4 uAttentionRows;      // rows = max-over-heads attention per source token
uniform float uPullStrength;      // base attractor pull
uniform float uReturnStrength;    // pull back toward seed/rest
uniform float uChurnStrength;     // climax curl magnitude
uniform float uDamping;           // velocity damping
uniform float uTime;
uniform float uDt;
uniform float uLayerFrac;         // 0..L, fractional current layer
uniform float uPhaseHeat;         // 0..1 from narrative phase

// Cheap deterministic hash for per-particle jitter.
float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

vec3 hash33(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}

// Cheap divergence-free curl from a 3D hash gradient.
vec3 curl3(vec3 p) {
  const float e = 0.4;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);
  vec3 px1 = hash33(p + dx);
  vec3 px0 = hash33(p - dx);
  vec3 py1 = hash33(p + dy);
  vec3 py0 = hash33(p - dy);
  vec3 pz1 = hash33(p + dz);
  vec3 pz0 = hash33(p - dz);
  vec3 cx = vec3(py1.z - py0.z, pz1.x - pz0.x, px1.y - px0.y);
  vec3 cy = vec3(pz1.y - pz0.y, px1.z - px0.z, py1.x - py0.x);
  return (cx - cy) / (2.0 * e);
}

void main() {
  vec4 state = texture2D(uPosTex, vUv);
  vec4 seed  = texture2D(uSeedPosTex, vUv);
  vec3 pos = state.xyz;
  // Source token index lives in .a (0..3); preserved verbatim.
  float tF = seed.a;
  int t = int(tF + 0.5);

  // Pull row of attention from the per-source-token mat4.
  // Columns of mat4 in GLSL are vec4 → choose row by t.
  vec4 row = uAttentionRows[0];
  if (t == 1) row = uAttentionRows[1];
  else if (t == 2) row = uAttentionRows[2];
  else if (t == 3) row = uAttentionRows[3];

  // Weighted attractor pull.
  vec3 target = vec3(0.0);
  float wsum = max(row.x + row.y + row.z + row.w, 1e-4);
  target += row.x * uAttractors[0];
  target += row.y * uAttractors[1];
  target += row.z * uAttractors[2];
  target += row.w * uAttractors[3];
  target /= wsum;

  vec3 toAttn = (target - pos) * uPullStrength;
  vec3 toRest = (seed.xyz - pos) * uReturnStrength;

  // Climax churn: scale curl with phase heat so calm phases stay calm.
  vec3 churn = curl3(pos * 0.6 + uTime * 0.07) * uChurnStrength * uPhaseHeat;

  // Tiny per-particle jitter so identical attractor weights still see motion.
  float h = hash11(vUv.x * 313.7 + vUv.y * 977.3);
  vec3 jitter = (vec3(h, hash11(h * 41.7), hash11(h * 91.1)) - 0.5) * 0.04;

  vec3 velocity = (toAttn + toRest + churn + jitter) * (1.0 - uDamping);
  pos += velocity * uDt;

  gl_FragColor = vec4(pos, tF);
}
