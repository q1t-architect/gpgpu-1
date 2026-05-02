interface TOCItem {
  id: string;
  title: string;
}
interface TOCGroup {
  label: string;
  items: TOCItem[];
}

export const TOC_GROUPS: TOCGroup[] = [
  {
    label: '0 · Введение',
    items: [
      { id: 'intro', title: 'Что мы вообще смотрим' },
      { id: 'lexicon', title: 'Базовый словарь терминов' },
    ],
  },
  {
    label: 'I · Вход',
    items: [
      { id: 'tokenize', title: 'Текст → токены (BPE)' },
      { id: 'token-ids', title: 'Токены → числа (вокабуляр)' },
      { id: 'embedding', title: 'ID → векторы (embedding lookup)' },
      { id: 'residual-stream', title: 'Residual stream — что течёт через слои' },
    ],
  },
  {
    label: 'II · Один transformer-блок',
    items: [
      { id: 'rmsnorm', title: 'RMSNorm: нормировка длины вектора' },
      { id: 'projections', title: 'Линейные проекции W_Q, W_K, W_V' },
      { id: 'gqa', title: 'GQA: 16 query-голов, 2 KV-головы' },
      { id: 'reshape-heads', title: 'Reshape в 16 × 128 голов' },
      { id: 'rope', title: 'RoPE: вращение пар, частоты θ_k' },
      { id: 'attention-scores', title: 'Attention: dot product, √d, causal mask' },
      { id: 'softmax', title: 'Softmax: превращаем числа в вероятности' },
      { id: 'attention-v', title: 'Считываем V: взвешенная сумма' },
      { id: 'output-proj', title: 'W_O и первый residual add' },
      { id: 'rmsnorm-2', title: 'Второй RMSNorm' },
      { id: 'mlp', title: 'MLP / SwiGLU: 2048 → 11008 → 2048' },
      { id: 'residual-2', title: 'Второй residual add → выход блока' },
    ],
  },
  {
    label: 'III · 36 слоёв',
    items: [
      { id: 'layer-loop', title: 'Что меняется от слоя к слою' },
      { id: 'logit-lens', title: 'Logit lens: что модель «думает» на каждом слое' },
    ],
  },
  {
    label: 'IV · Выход',
    items: [
      { id: 'final-norm', title: 'Финальный RMSNorm' },
      { id: 'unembedding', title: 'Unembedding: выстрел в словарь' },
      { id: 'final-softmax', title: 'Финальный softmax → «All»' },
      { id: 'sampling', title: 'Sampling vs argmax' },
    ],
  },
  {
    label: 'V · Autoregression',
    items: [
      { id: 'autoregression', title: 'Из «All» получаем «All Time High»' },
      { id: 'kv-cache', title: 'KV-cache: почему не считаем всё заново' },
    ],
  },
  {
    label: 'VI · Сводка и приложения',
    items: [
      { id: 'summary', title: 'Средняя сводка всего процесса' },
      { id: 'glossary', title: 'Глоссарий с транскрипциями' },
      { id: 'tensors', title: 'Что лежит в репо как реальные тензоры' },
    ],
  },
];

export function TOC() {
  return (
    <nav className="toc" aria-label="Содержание">
      <h3>Содержание</h3>
      {TOC_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="toc__group">{group.label}</div>
          <ol>
            {group.items.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`}>{item.title}</a>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </nav>
  );
}
