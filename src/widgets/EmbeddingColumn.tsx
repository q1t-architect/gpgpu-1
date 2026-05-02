import { useEffect, useState } from 'react';
import { INPUT_TOKENS, MODEL } from '../data/manifest-types';
import { embeddingRow, loadEmbedding } from '../data/loader';

interface EmbeddingColumnProps {
  rows?: number; // how many of the 2048 dims to show as bars (subsampled)
}

export function EmbeddingColumn({ rows = 96 }: EmbeddingColumnProps) {
  const [data, setData] = useState<Float32Array | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadEmbedding()
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, []);

  if (error) return <div className="widget__hint">Не удалось загрузить эмбеддинги: {error}</div>;
  if (!data) return <div className="widget__hint">Загружаем эмбеддинги (32 КБ)…</div>;

  return (
    <div className="widget" aria-label="4 столбика эмбеддингов">
      <div className="widget__title">
        4 эмбеддинга: каждый — реальный вектор длины {MODEL.hidden_size}
      </div>
      <div className="cluster" style={{ alignItems: 'flex-end', gap: '1.4rem' }}>
        {INPUT_TOKENS.map((tok) => {
          const row = embeddingRow(data, tok.position);
          // subsample to `rows` strips uniformly across 2048 dims
          const stride = Math.floor(MODEL.hidden_size / rows);
          const samples: number[] = [];
          for (let i = 0; i < rows; i++) samples.push(row[i * stride]);
          // normalize for color mapping by overall absolute max in the slice
          const maxAbs = Math.max(...samples.map((v) => Math.abs(v))) || 1;
          return (
            <div key={tok.position} style={{ textAlign: 'center' }}>
              <div className="veccol">
                {samples.map((v, idx) => {
                  const t = v / maxAbs; // -1..1
                  const positive = t >= 0;
                  const intensity = Math.min(1, Math.abs(t));
                  const bg = positive
                    ? `color-mix(in srgb, var(--accent) ${Math.round(intensity * 100)}%, var(--bg-soft))`
                    : `color-mix(in srgb, var(--warn) ${Math.round(intensity * 100)}%, var(--bg-soft))`;
                  return <div key={idx} className="veccol__cell" style={{ background: bg }} />;
                })}
              </div>
              <div className="veccol__label">
                pos {tok.position}
                <br />
                <span className="muted">{tok.decoded.replace(/^ /, '·')}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="widget__hint">
        Каждый столбик — это {MODEL.hidden_size} реальных чисел из{' '}
        <code>embedding.bin</code>. Здесь показано {rows} равномерно отобранных
        ячеек (на телефоне 2048 полосок не поместятся). Голубой = положительное
        число, малиновый = отрицательное; яркость = по модулю.
      </div>
    </div>
  );
}
