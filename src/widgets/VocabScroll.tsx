import { useEffect, useMemo, useRef, useState } from 'react';
import { INPUT_TOKENS } from '../data/manifest-types';

interface FakeRow {
  id: number;
  token: string;
}

// We don't ship the full vocab. We synthesise plausible-looking entries
// around each highlighted ID so the user gets a sense of "scrolling through
// 151,936 lines and one of them lights up".

const FILLER_TOKENS = [
  ' the', ' of', ' to', ' and', ' is', ' a', ' in', ' for', ' on', ' that',
  ' with', ' as', ' at', ' by', ' from', ' or', ' an', ' be', ' this', ' it',
  'er', 'ing', 'ed', 'ly', 'tion', 'ment', 'able', 'ness', 'ize', 'al',
  ' said', ' will', ' have', ' has', ' had', ' do', ' does', ' did', ' can',
  ' make', ' made', ' time', ' year', ' day', ' way', ' man', ' know',
  ' new', ' first', ' last', ' long', ' great', ' little', ' own', ' other',
  ' old', ' right', ' big', ' high', ' small', ' large', ' next', ' early',
  '.', ',', ';', ':', '!', '?', "'", '"', '-', '/', ' (', ' )', ' [', ' ]',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
];

function buildContext(targetId: number, label: string, span = 6): FakeRow[] {
  const rows: FakeRow[] = [];
  for (let i = -span; i <= span; i++) {
    const id = targetId + i;
    if (id < 0) continue;
    if (i === 0) {
      rows.push({ id: targetId, token: label });
    } else {
      const filler = FILLER_TOKENS[(id * 31) % FILLER_TOKENS.length];
      rows.push({ id, token: filler });
    }
  }
  return rows;
}

interface VocabScrollProps {
  highlight?: number;
}

export function VocabScroll({ highlight = INPUT_TOKENS[2].id }: VocabScrollProps) {
  const target = INPUT_TOKENS.find((t) => t.id === highlight) ?? INPUT_TOKENS[2];
  const [activeId, setActiveId] = useState(target.id);
  const ref = useRef<HTMLDivElement | null>(null);

  const rows = useMemo(() => {
    const t = INPUT_TOKENS.find((x) => x.id === activeId);
    return buildContext(activeId, t ? t.decoded : '???');
  }, [activeId]);

  useEffect(() => {
    if (!ref.current) return;
    // scroll to highlighted row
    const el = ref.current.querySelector('.vocab__row--highlight');
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [activeId]);

  return (
    <div className="widget" aria-label="Поиск ID токена в словаре">
      <div className="widget__title">Найти токен в словаре на 151 936 строк</div>
      <div className="widget__btn-row" role="tablist">
        {INPUT_TOKENS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="widget__btn"
            aria-pressed={activeId === t.id}
            onClick={() => setActiveId(t.id)}
          >
            {visualize(t.decoded)} → {t.id.toLocaleString('ru-RU')}
          </button>
        ))}
      </div>
      <div className="vocab" ref={ref}>
        {rows.map((row) => (
          <div
            key={row.id}
            className={`vocab__row${row.id === activeId ? ' vocab__row--highlight' : ''}`}
          >
            <span className="vocab__id">{row.id.toLocaleString('ru-RU')}</span>
            <span className="vocab__token">{visualize(row.token)}</span>
          </div>
        ))}
      </div>
      <div className="widget__hint">
        Соседние строки — это просто иллюстрация (полный словарь модели мы в браузер
        не загружаем — это ~3 МБ). Подсвеченная строка — настоящая, она реально
        находится по этому ID.
      </div>
    </div>
  );
}

function visualize(s: string): string {
  return s.replace(/^ /, '·');
}
