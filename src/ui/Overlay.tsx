import { useSyncExternalStore } from 'react';
import { getSub, subscribeSub } from '../state/store';
import type { TensorBundle } from '../tensors/types';

interface Props {
  bundle: TensorBundle;
}

const PHASE_LABEL: Record<string, string> = {
  confusion: 'C O N F U S I O N',
  recognition: 'R E C O G N I T I O N',
  acronym_lock: 'A C R O N Y M   L O C K',
  cross_lingual: 'C R O S S — L I N G U A L',
  english_search: 'E N G L I S H   S E A R C H',
  crystallization: 'C R Y S T A L L I Z A T I O N',
};

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function Overlay({ bundle }: Props) {
  const sub = useSyncExternalStore(subscribeSub, getSub, getSub);
  const layerStr = pad2(sub.layerInt);
  const probPct = (sub.topProb * 100).toFixed(1);

  return (
    <div className="overlay" aria-hidden="true">
      {/* Top-left: model + prompt */}
      <header className="overlay__corner overlay__corner--tl">
        <div className="overlay__line overlay__line--mono">qwen-2.5-3b · forward pass · seq 4</div>
        <div className="overlay__line overlay__line--mono">prompt: <em>"{bundle.manifest.prompt}"</em></div>
      </header>

      {/* Top-right: live readout */}
      <div className="overlay__corner overlay__corner--tr">
        <div className="overlay__readout">
          <div className="overlay__row">
            <span className="overlay__k">layer</span>
            <span className="overlay__v overlay__v--big">L{layerStr}<span className="overlay__sub">/{bundle.numLayers}</span></span>
          </div>
          <div className="overlay__row">
            <span className="overlay__k">top·1</span>
            <span className="overlay__v">{sub.topToken || '—'}</span>
          </div>
          <div className="overlay__row">
            <span className="overlay__k">prob</span>
            <span className="overlay__v">{probPct}%</span>
          </div>
        </div>
      </div>

      {/* Bottom-left: phase */}
      <div className="overlay__corner overlay__corner--bl">
        <div className="overlay__phase">{PHASE_LABEL[sub.phase] ?? sub.phase}</div>
        <div className="overlay__hint">scroll →</div>
      </div>

      {/* Bottom-right: scroll % */}
      <div className="overlay__corner overlay__corner--br">
        <div className="overlay__line overlay__line--mono overlay__steel">
          {(sub.brandRevealStage > 0 ? 'reveal' : 'observe').padStart(7, ' ')}
        </div>
      </div>

      {/* Brand reveal: text exists from the start as negative-space, becomes
          legible only when contrast crosses threshold. We modulate font-weight
          + letter-spacing + color via brandRevealStage. */}
      <BrandReveal stage={sub.brandRevealStage} />
    </div>
  );
}

function BrandReveal({ stage }: { stage: number }) {
  // Stage 0: paper-on-paper, ghost. Stage 1: full ink contrast.
  const opacity = 0.08 + stage * 0.92;
  const tracking = (1.6 - stage * 1.4).toFixed(2);
  const weight = 200 + Math.round(stage * 600);
  const colorMix = `color-mix(in oklab, var(--paper) ${stage * 100}%, var(--ink))`;
  return (
    <div className="brand-reveal">
      <div
        className="brand-reveal__line brand-reveal__line--display"
        style={{
          opacity,
          letterSpacing: `${tracking}em`,
          fontWeight: weight,
          color: colorMix,
        }}
      >
        All&nbsp;Time&nbsp;High
      </div>
      <div
        className="brand-reveal__line brand-reveal__line--mono"
        style={{
          opacity: 0.2 + stage * 0.7,
          letterSpacing: `${(0.6 - stage * 0.4).toFixed(2)}em`,
        }}
      >
        T E C H N O L O G I E S
      </div>
    </div>
  );
}
