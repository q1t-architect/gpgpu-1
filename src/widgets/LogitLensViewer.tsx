import { useEffect, useState } from 'react';
import { loadLogitLens, type LogitLens } from '../data/loader';
import { MODEL } from '../data/manifest-types';

export function LogitLensViewer() {
  const [lens, setLens] = useState<LogitLens | null>(null);
  const [layer, setLayer] = useState(0);

  useEffect(() => {
    let alive = true;
    loadLogitLens()
      .then((d) => alive && setLens(d))
      .catch(() => alive && setLens(null));
    return () => {
      alive = false;
    };
  }, []);

  if (!lens) return <div className="widget__hint">Загружаем logit_lens.json…</div>;

  // The logit lens we have ranges over layers 0..36 inclusive (or something close).
  const maxLayer = Math.min(MODEL.num_hidden_layers, lens.layers.length - 1);
  const safeLayer = Math.min(layer, maxLayer);
  const data = lens.layers.find((l) => l.layer === safeLayer) ?? lens.layers[lens.layers.length - 1];

  return (
    <div className="widget" aria-label="Logit lens viewer">
      <div className="widget__title">
        Logit lens — что модель «думает» после слоя ℓ
      </div>
      <div className="widget__slider-label">
        <span>слой ℓ</span>
        <span className="logitlens__layer-num">L{String(safeLayer).padStart(2, '0')}</span>
      </div>
      <input
        type="range"
        min={0}
        max={maxLayer}
        step={1}
        value={safeLayer}
        onChange={(e) => setLayer(Number(e.target.value))}
        aria-label="Слой для logit lens"
      />
      <div className="softmax">
        {data.top_tokens.slice(0, 8).map((t, i) => {
          const p = Math.max(0, Math.min(1, t.prob));
          return (
            <div key={`${t.id}-${i}`} className="softmax__row">
              <div className="softmax__label">
                {visualize(t.token)}{' '}
                <span className="muted small">id {t.id}</span>
              </div>
              <div className="softmax__bar">
                <div
                  className="softmax__bar-fill"
                  style={{ width: `${p * 100}%` }}
                />
              </div>
              <div className="softmax__val">
                {p < 0.001 ? p.toExponential(1) : `${(p * 100).toFixed(1)}%`}
              </div>
            </div>
          );
        })}
      </div>
      <div className="widget__hint">
        В каждой строке — кандидат на «следующий токен», как его видит модель,
        если бы мы остановились ровно на слое ℓ и применили unembedding к
        состоянию последнего токена. На L = 0 модель видит входной токен сам;
        на L = {maxLayer} (после всех 36 блоков) — финальное предсказание <code>"All"</code>.
      </div>
    </div>
  );
}

function visualize(s: string): string {
  return s
    .replace(/^ /, '·')
    .replace(/\n/g, '⏎')
    .replace(/\t/g, '⇥');
}
