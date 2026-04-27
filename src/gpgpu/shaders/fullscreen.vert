// Fullscreen-quad vertex shader for FBO compute passes.
// The quad's UVs (0..1) become the texel coordinates we read/write in the
// fragment shader.

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
