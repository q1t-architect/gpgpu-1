import { useState } from 'react';
import { GENERATED_TOKENS, INPUT_TOKENS, PROMPT } from '../data/manifest-types';

const ALL_STEPS = [
  ...INPUT_TOKENS.map((t) => ({ ...t, generated: false })),
  ...GENERATED_TOKENS.map((t, i) => ({
    position: INPUT_TOKENS.length + i,
    id: t.id,
    decoded: t.decoded,
    generated: true,
  })),
];

export function AutoregressionStepper() {
  const [revealed, setRevealed] = useState(INPUT_TOKENS.length); // start with prompt revealed

  return (
    <div className="widget" aria-label="Autoregression: пошаговая генерация">
      <div className="widget__title">
        Autoregression: добавляем по одному токену за forward pass
      </div>

      <div className="widget__row">
        <button
          type="button"
          className="widget__btn"
          disabled={revealed >= ALL_STEPS.length}
          onClick={() => setRevealed((r) => Math.min(ALL_STEPS.length, r + 1))}
        >
          → следующий токен
        </button>
        <button
          type="button"
          className="widget__btn"
          onClick={() => setRevealed(INPUT_TOKENS.length)}
        >
          ⟲ сбросить
        </button>
        <button
          type="button"
          className="widget__btn"
          onClick={() => setRevealed(ALL_STEPS.length)}
        >
          ⏵⏵ до конца
        </button>
      </div>

      <div className="widget__readout" style={{ minHeight: 60, fontSize: '1.05rem' }}>
        {ALL_STEPS.slice(0, revealed).map((s, i) => (
          <span
            key={i}
            style={{
              background: s.generated
                ? 'color-mix(in srgb, var(--good) 25%, transparent)'
                : 'transparent',
              borderRadius: 3,
              padding: '0 1px',
            }}
            title={`id ${s.id}, ${s.generated ? 'сгенерирован' : 'из промпта'}`}
          >
            {s.decoded}
          </span>
        ))}
        <span className="muted" style={{ animation: 'blink 1s steps(2) infinite', opacity: revealed < ALL_STEPS.length ? 1 : 0.3 }}>
          ▌
        </span>
      </div>

      <div className="widget__hint">
        Серый текст — исходный промпт «{PROMPT}». Зелёная подсветка — токены,
        которые модель сгенерировала шаг за шагом, каждый раз прокручивая весь
        forward pass на расширенной последовательности. Реальные ID лежат в{' '}
        <code>autoregression.json</code>.
      </div>

      <table style={{ marginTop: '0.6rem' }}>
        <thead>
          <tr>
            <th>Шаг</th>
            <th>Вход (по токенам)</th>
            <th>argmax</th>
            <th>token id</th>
          </tr>
        </thead>
        <tbody>
          {ALL_STEPS.slice(INPUT_TOKENS.length, revealed).map((s, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td className="mono small">
                {ALL_STEPS.slice(0, INPUT_TOKENS.length + i)
                  .map((x) => visualize(x.decoded))
                  .join('')}
              </td>
              <td className="mono">
                <code>{visualize(s.decoded)}</code>
              </td>
              <td className="mono small muted">{s.id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function visualize(s: string): string {
  return s.replace(/^ /, '·');
}
