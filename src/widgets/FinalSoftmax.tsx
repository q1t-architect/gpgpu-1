import { useEffect, useMemo, useState } from 'react';
import { loadFinalProbs } from '../data/loader';
import { GENERATED_TOKENS, INPUT_TOKENS, MODEL } from '../data/manifest-types';

interface TopEntry {
  id: number;
  prob: number;
  token: string;
}

// Минимальный subset словаря, который мы хотим уметь подписывать —
// это входные и сгенерированные токены, плюс несколько служебных.
const KNOWN_LABELS = new Map<number, string>([
  ...INPUT_TOKENS.map((t) => [t.id, t.decoded] as [number, string]),
  ...GENERATED_TOKENS.map((t) => [t.id, t.decoded] as [number, string]),
  [1782, 'the'],
  [264, ' a'],
  [304, ' in'],
  [220, ' '],
  [13, '.'],
  [11, ','],
  [320, ' ('],
  [21533, ' high'],
]);

export function FinalSoftmax() {
  const [probs, setProbs] = useState<Float32Array | null>(null);
  const [k, setK] = useState(8);

  useEffect(() => {
    let alive = true;
    loadFinalProbs()
      .then((d) => alive && setProbs(d))
      .catch(() => alive && setProbs(null));
    return () => {
      alive = false;
    };
  }, []);

  const top = useMemo<TopEntry[]>(() => {
    if (!probs) return [];
    // top-K через partial selection
    const indices = new Int32Array(probs.length);
    for (let i = 0; i < probs.length; i++) indices[i] = i;
    // эффективнее не сортировать всё (151k), а оставить топ-K через quickselect-подобное
    const arr = Array.from(indices);
    arr.sort((a, b) => probs[b] - probs[a]);
    return arr.slice(0, k).map((id) => ({
      id,
      prob: probs[id],
      token: KNOWN_LABELS.get(id) ?? `id ${id}`,
    }));
  }, [probs, k]);

  if (!probs) return <div className="widget__hint">Загружаем final_probs (~600 КБ)…</div>;

  return (
    <div className="widget" aria-label="Финальное распределение по словарю">
      <div className="widget__title">
        Распределение вероятностей по {MODEL.vocab_size.toLocaleString('ru-RU')} токенам
      </div>
      <div className="widget__btn-row" role="tablist">
        {[5, 8, 15, 25].map((n) => (
          <button
            key={n}
            type="button"
            className="widget__btn"
            aria-pressed={k === n}
            onClick={() => setK(n)}
          >
            top {n}
          </button>
        ))}
      </div>
      <div className="softmax">
        {top.map((e, idx) => (
          <div key={e.id} className="softmax__row">
            <div className="softmax__label">
              #{idx + 1}: <code>{visualize(e.token)}</code>{' '}
              <span className="muted small">id {e.id}</span>
            </div>
            <div className="softmax__bar">
              <div
                className="softmax__bar-fill"
                style={{ width: `${e.prob * 100}%` }}
              />
            </div>
            <div className="softmax__val">{(e.prob * 100).toFixed(2)}%</div>
          </div>
        ))}
      </div>
      <div className="widget__hint">
        Это настоящие вероятности из <code>final_probs.bin</code>. Сумма всех
        151 936 вероятностей = 1.0. Top-1 — это <code>"All"</code> с вероятностью
        ≈ 49%. Дальше идут <code>"the"</code>, <code>"·a"</code> и т.д. — модель
        не сильно сомневается, но и не на 100% уверена.
      </div>
    </div>
  );
}

function visualize(s: string): string {
  return s.replace(/^ /, '·').replace(/\n/g, '⏎').replace(/\t/g, '⇥');
}
