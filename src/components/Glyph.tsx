import type { ReactNode } from 'react';

/**
 * Renders a math symbol with its Russian transcription right next to it,
 * styled small and muted: θ (тета).
 */
export function Glyph({ symbol, name, children }: { symbol?: string; name: string; children?: ReactNode }) {
  return (
    <span className="glyph">
      <span className="glyph__symbol">{symbol ?? children}</span>
      <span className="glyph__name"> ({name})</span>
    </span>
  );
}
