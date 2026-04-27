// Particle render fragment.
// Square-ish point with subtle anti-alias. Two passes (cyan / magenta) are
// drawn separately and the canvas blends them additively → riso overprint.

precision highp float;

uniform vec3 uColorCyan;
uniform vec3 uColorMagenta;
uniform float uOpacity;
uniform float uPhaseHeat;

varying float vMag;
varying float vChannel;
varying float vTokenIdx;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  // Square footprint with very slight corner softening.
  float d = max(abs(c.x), abs(c.y));
  float a = smoothstep(0.5, 0.42, d);
  if (a < 0.02) discard;

  vec3 base = (vChannel < 0.0) ? uColorCyan : uColorMagenta;

  // Token tint: shift magenta on token 2 (" ATH"), shift cyan on token 0 ("Re").
  float tokenShift = (vTokenIdx - 1.5) * 0.06;
  base = clamp(base + tokenShift, 0.0, 1.0);

  // Brighten with hidden magnitude + climax heat.
  float intensity = mix(0.55, 1.0, clamp(vMag * 1.6 + uPhaseHeat * 0.5, 0.0, 1.0));

  gl_FragColor = vec4(base * intensity, a * uOpacity);
}
