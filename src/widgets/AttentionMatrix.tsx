import { useEffect, useState } from 'react';
import { INPUT_TOKENS, MODEL } from '../data/manifest-types';
import { attentionMatrix, loadAttentionWeights } from '../data/loader';

export function AttentionMatrix() {
  const [data, setData] = useState<Float32Array | null>(null);
  const [layer, setLayer] = useState(0);
  const [head, setHead] = useState(0);
  const [hover, setHover] = useState<{ q: number; k: number } | null>(null);

  useEffect(() => {
    let alive = true;
    loadAttentionWeights()
      .then((d) => alive && setData(d))
      .catch(() => alive && setData(new Float32Array(0)));
    return () => {
      alive = false;
    };
  }, []);

  if (!data || data.length === 0) {
    return <div className="widget__hint">Загружаем веса внимания…</div>;
  }

  const mat = attentionMatrix(data, layer, head);
  // mat — flat 16 = 4 q × 4 k row-major
  return (
    <div className="widget" aria-label="Attention 4×4 для слоя и головы">
      <div className="widget__title">
        Реальные attention-веса слоя ℓ = {layer}, головы h = {head}
      </div>
      <div className="widget__row">
        <label style={{ flex: 1, minWidth: 200 }}>
          <div className="widget__slider-label">
            <span>слой ℓ</span>
            <span>{layer} / 35</span>
          </div>
          <input
            type="range"
            min={0}
            max={MODEL.num_hidden_layers - 1}
            step={1}
            value={layer}
            onChange={(e) => setLayer(Number(e.target.value))}
          />
        </label>
        <label style={{ flex: 1, minWidth: 200 }}>
          <div className="widget__slider-label">
            <span>голова h</span>
            <span>{head} / 15</span>
          </div>
          <input
            type="range"
            min={0}
            max={MODEL.num_attention_heads - 1}
            step={1}
            value={head}
            onChange={(e) => setHead(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="attmat" role="grid">
        <div className="attmat__corner">q ↓ / k →</div>
        {INPUT_TOKENS.map((t) => (
          <div key={`hcol-${t.position}`} className="attmat__head">
            {t.decoded.replace(/^ /, '·')}
            <br />
            <span className="muted">k = {t.position}</span>
          </div>
        ))}
        {INPUT_TOKENS.map((q) => (
          <Row
            key={`row-${q.position}`}
            qPos={q.position}
            qLabel={q.decoded.replace(/^ /, '·')}
            row={Array.from({ length: 4 }, (_, k) => mat[q.position * 4 + k])}
            hover={hover}
            setHover={setHover}
          />
        ))}
      </div>
      <div className="widget__hint">
        Числа — это вероятности (после softmax) того, на какой токен (k) <i>смотрит</i>{' '}
        запрашивающий токен (q). Серой штриховкой обозначены клетки, закрытые{' '}
        <b>causal mask</b> (запрашивающий не может смотреть в будущее) — сумма по
        строке всегда даёт 1. Наведи мышью или коснись клетки чтобы её подсветить.
      </div>
    </div>
  );
}

function Row({
  qPos,
  qLabel,
  row,
  hover,
  setHover,
}: {
  qPos: number;
  qLabel: string;
  row: number[];
  hover: { q: number; k: number } | null;
  setHover: (h: { q: number; k: number } | null) => void;
}) {
  return (
    <>
      <div className="attmat__rowlabel">
        q = {qPos}
        <br />
        <span className="muted">{qLabel}</span>
      </div>
      {row.map((v, k) => {
        const masked = k > qPos;
        const pct = Math.round(v * 100);
        const intensity = Math.min(1, v * 1.6);
        const bg = masked
          ? undefined
          : `color-mix(in srgb, var(--accent) ${Math.round(intensity * 100)}%, var(--bg-elev))`;
        const active = hover?.q === qPos && hover?.k === k;
        return (
          <div
            key={k}
            className={`attmat__cell${masked ? ' attmat__cell--masked' : ''}${active ? ' attmat__cell--active' : ''}`}
            style={{ background: bg, color: intensity > 0.5 ? 'white' : 'var(--fg)' }}
            onMouseEnter={() => setHover({ q: qPos, k })}
            onMouseLeave={() => setHover(null)}
            onTouchStart={() => setHover({ q: qPos, k })}
            title={masked ? 'masked (causal)' : `${pct}%`}
          >
            {masked ? '—' : `${pct}%`}
          </div>
        );
      })}
    </>
  );
}
