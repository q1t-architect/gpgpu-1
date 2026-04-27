/**
 * Quick capability sniff so we can fall back gracefully on devices without
 * WebGL2 or float-textures (rare on mobile but happens on locked-down
 * corporate browsers).
 */
export interface GpuCapabilities {
  webgl2: boolean;
  floatRenderable: boolean;
}

let cached: GpuCapabilities | null = null;

export function detectCapabilities(): GpuCapabilities {
  if (cached) return cached;
  if (typeof document === 'undefined') {
    cached = { webgl2: false, floatRenderable: false };
    return cached;
  }
  const c = document.createElement('canvas');
  const gl = c.getContext('webgl2', { alpha: false, antialias: false }) as
    | WebGL2RenderingContext
    | null;
  if (!gl) {
    cached = { webgl2: false, floatRenderable: false };
    return cached;
  }
  // Float color buffer is needed for our position FBO. WebGL2 advertises this
  // through EXT_color_buffer_float; without it we can't write float RTs.
  const ext = gl.getExtension('EXT_color_buffer_float');
  cached = { webgl2: true, floatRenderable: !!ext };
  return cached;
}
