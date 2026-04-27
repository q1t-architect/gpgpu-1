import { useMemo, useState } from 'react';

const RAW: { label: string; values: number[] }[] = [
  { label: 'почти равны', values: [2.1, 1.8, 2.0, 1.9] },
  { label: 'один лидер', values: [4.5, 1.2, 0.8, 1.0] },
  { label: 'острый пик', values: [12.0, 1.0, 0.5, 1.5] },
];

export function SoftmaxDemo() {
  const [presetIdx, setPresetIdx] = useState(1);
  const [temperature, setTemperature] = useState(1.0);

  const result = useMemo(() => {
    const x = RAW[presetIdx].values;
    const scaled = x.map((v) => v / temperature);
    const max = Math.max(...scaled);
    const ex = scaled.map((v) => Math.exp(v - max));
    const sum = ex.reduce((a, b) => a + b, 0);
    return ex.map((v) => v / sum);
  }, [presetIdx, temperature]);

  const x = RAW[presetIdx].values;

  return (
    <div className="widget" aria-label="Softmax: интерактивная демонстрация">
      <div className="widget__title">Softmax с температурой τ</div>
      <div className="widget__btn-row">
        {RAW.map((p, i) => (
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
      <div className="widget__slider-label">
        <span>температура τ</span>
        <span>{temperature.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={0.1}
        max={3}
        step={0.05}
        value={temperature}
        onChange={(e) => setTemperature(Number(e.target.value))}
      />

      <div className="softmax">
        {x.map((raw, i) => (
          <div key={i} className="softmax__row">
            <div className="softmax__label">x[{i}] = {raw.toFixed(2)}</div>
            <div className="softmax__bar">
              <div
                className="softmax__bar-fill"
                style={{ width: `${result[i] * 100}%` }}
              />
            </div>
            <div className="softmax__val">{(result[i] * 100).toFixed(1)}%</div>
          </div>
        ))}
      </div>
      <div className="widget__hint">
        При τ → 0 softmax вырождается в argmax (всё в одном победителе). При τ → ∞
        — в равномерное распределение. τ = 1 — стандартный softmax. Двигай слайдер
        и смотри как «острота» предсказания меняется.
      </div>
    </div>
  );
}
