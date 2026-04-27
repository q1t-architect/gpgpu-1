import { useMemo, useState } from 'react';

const PRESETS: { label: string; values: number[] }[] = [
  { label: 'мелкий', values: [0.05, -0.03, 0.07, -0.02, 0.04, -0.06, 0.01, -0.05] },
  { label: 'умеренный', values: [0.5, -0.3, 1.1, -0.2, 0.4, -0.6, 0.9, -1.2] },
  { label: 'разболтанный', values: [25, -8, 14, -2, 30, -5, 18, -22] },
];

export function RmsNormDemo() {
  const [presetIdx, setPresetIdx] = useState(1);
  const [eps] = useState(1e-6);
  const x = PRESETS[presetIdx].values;

  const { rms, normalized } = useMemo(() => {
    const sumSq = x.reduce((s, v) => s + v * v, 0);
    const r = Math.sqrt(sumSq / x.length + eps);
    return { rms: r, normalized: x.map((v) => v / r) };
  }, [x, eps]);

  const maxAbsRaw = Math.max(...x.map((v) => Math.abs(v))) || 1;
  const maxAbsNorm = Math.max(...normalized.map((v) => Math.abs(v))) || 1;

  return (
    <div className="widget" aria-label="RMSNorm: ручная демонстрация">
      <div className="widget__title">
        Возьмём короткий вектор (8 чисел вместо 2048) и применим RMSNorm
      </div>
      <div className="widget__btn-row">
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            type="button"
            aria-pressed={presetIdx === i}
            className="widget__btn"
            onClick={() => setPresetIdx(i)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <BarRow label="вход x" values={x} maxAbs={maxAbsRaw} />
      <div className="widget__readout">
        Σx² = {x.reduce((s, v) => s + v * v, 0).toFixed(4)} {'  →  '}
        ср. квадрат = {(x.reduce((s, v) => s + v * v, 0) / x.length).toFixed(4)} {'  →  '}
        RMS = √(ср.кв. + ε) ≈ {rms.toFixed(4)}
      </div>
      <BarRow label="x / RMS" values={normalized} maxAbs={maxAbsNorm} accent />

      <div className="widget__hint">
        Заметь: после деления на RMS общая «длина» (среднеквадратичная) вектора
        становится ровно 1. Форма распределения и относительные величины сохраняются —
        только масштаб приводится к стандартному. На демонстрации мы пропустили
        умножение на g — оно меняет относительные веса размерностей, но логика та же.
      </div>
    </div>
  );
}

function BarRow({
  label,
  values,
  maxAbs,
  accent,
}: {
  label: string;
  values: number[];
  maxAbs: number;
  accent?: boolean;
}) {
  return (
    <div style={{ margin: '0.5rem 0' }}>
      <div className="widget__slider-label">
        <span>{label}</span>
        <span>длина {values.length}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 36 }}>
        {values.map((v, i) => {
          const ratio = v / maxAbs;
          const heightPct = Math.max(2, Math.abs(ratio) * 100);
          const color = accent
            ? v >= 0
              ? 'var(--accent)'
              : 'var(--warn)'
            : v >= 0
              ? 'color-mix(in srgb, var(--accent) 60%, var(--bg-soft))'
              : 'color-mix(in srgb, var(--warn) 60%, var(--bg-soft))';
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div
                title={v.toFixed(4)}
                style={{
                  width: 28,
                  height: `${heightPct}%`,
                  background: color,
                  borderRadius: 2,
                  transform: v < 0 ? 'scaleY(-1)' : 'none',
                  transformOrigin: 'top',
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="widget__readout" style={{ marginTop: 4 }}>
        [{values.map((v) => v.toFixed(2)).join(', ')}]
      </div>
    </div>
  );
}
