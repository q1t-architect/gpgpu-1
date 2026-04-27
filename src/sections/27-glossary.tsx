import { Section } from '../components/Section';

interface Entry {
  symbol?: string;
  name: string; // Russian transcription / name
  meaning: string;
}

const ENTRIES: Entry[] = [
  // Греческие буквы
  { symbol: 'α', name: 'альфа', meaning: 'обычно — угол поворота. У RoPE: α = m · θ_k.' },
  { symbol: 'β', name: 'бета', meaning: 'не используется в нашем разборе, но часто встречается в LayerNorm.' },
  { symbol: 'γ', name: 'гамма', meaning: 'не используется напрямую — в RMSNorm обучаемый вектор называют g.' },
  { symbol: 'ε', name: 'эпсилон', meaning: 'крошечная константа (≈ 10⁻⁶), добавляется внутрь корня RMSNorm чтобы избежать деления на ноль.' },
  { symbol: 'θ', name: 'тета', meaning: 'частота. У RoPE θ_k — частота вращения для пары k.' },
  { symbol: 'σ', name: 'сигма (строчная)', meaning: 'sigmoid: σ(z) = 1 / (1 + e^(−z)). Используется в SiLU = z · σ(z).' },
  { symbol: 'Σ', name: 'сигма (заглавная)', meaning: 'знак суммы: Σ от i=0 до n-1 — пройти по всем элементам и сложить.' },
  { symbol: 'τ', name: 'тау', meaning: 'температура softmax: probs = softmax(z / τ).' },

  // Операторы и обозначения
  { symbol: '·', name: 'точка (умножение / dot product)', meaning: 'между скалярами — обычное умножение; между векторами — скалярное произведение Σ a_i b_i.' },
  { symbol: '⊙', name: 'точка-в-кружке (Адамаров продукт)', meaning: 'поэлементное умножение векторов или матриц одинакового размера.' },
  { symbol: '@', name: 'эт (Python: matrix multiply)', meaning: 'в коде — матричное умножение. Эквивалент np.matmul.' },
  { symbol: '√', name: 'квадратный корень', meaning: 'используется в RMS и в нормировке attention scores на √d_h = √128.' },
  { symbol: '∈', name: 'принадлежит', meaning: 'A ∈ ℝ^(n×m) — A это массив действительных чисел формы n×m.' },
  { symbol: 'ℝ', name: 'эр (real numbers)', meaning: 'множество действительных чисел.' },
  { symbol: 'argmax', name: 'аргмакс', meaning: 'индекс самого большого значения в векторе или массиве.' },

  // Размерности и величины модели
  { symbol: 'd', name: 'дэ (длина вектора)', meaning: 'обобщённое обозначение размерности; чаще всего hidden_size = 2048.' },
  { symbol: 'd_h', name: 'дэ с индексом аш (head_dim)', meaning: 'длина вектора одной головы внимания. У Qwen-2.5-3B = 128.' },
  { symbol: 'V', name: 'вэ (vocab size)', meaning: 'размер словаря. У Qwen-2.5-3B = 151 936.' },
  { symbol: 'L', name: 'эль (layers)', meaning: 'число transformer-блоков. У Qwen-2.5-3B = 36.' },
  { symbol: 'h', name: 'аш (hidden state)', meaning: 'состояние residual stream, обычно тензор (seq, hidden_size).' },
  { symbol: 'h_ℓ', name: 'аш с индексом эль', meaning: 'residual stream после слоя ℓ. h_0 — после embedding, h_36 — после всех блоков.' },
  { symbol: 'ℓ', name: 'эль (script)', meaning: 'индекс слоя 0..35.' },
  { symbol: 'm', name: 'эм', meaning: 'позиция токена в последовательности (0, 1, 2, 3 для нашего промпта).' },
  { symbol: 'k', name: 'ка', meaning: 'индекс пары координат внутри head-вектора (0..63 для head_dim=128) — или индекс ключа в attention.' },

  // Матрицы
  { symbol: 'E', name: 'и (embedding matrix)', meaning: 'таблица эмбеддингов размера V × d. Каждая строка — вектор-представление одного токена.' },
  { symbol: 'E^T', name: 'и-транспонированная', meaning: 'та же матрица, развёрнутая на 90°: размер d × V. Используется для unembedding.' },
  { symbol: 'W_Q, W_K, W_V', name: 'дабл-ю с индексами', meaning: 'обучаемые матрицы для проекции в query, key, value соответственно.' },
  { symbol: 'W_O', name: 'дабл-ю с индексом O', meaning: 'обучаемая output-матрица attention. Смешивает 16 голов в общий выход.' },
  { symbol: 'W_g, W_u, W_d', name: 'дабл-ю с индексами g, u, d', meaning: 'три обучаемые матрицы MLP: gate, up, down. Дают SwiGLU.' },

  // Концепты
  { symbol: undefined, name: 'BPE', meaning: 'Byte Pair Encoding — алгоритм токенизации. Жадно сливает наиболее часто встречающиеся пары символов в более крупные токены.' },
  { symbol: undefined, name: 'GQA', meaning: 'Grouped Query Attention — экономный вариант attention где K/V-голов меньше, чем Q-голов. У Qwen-2.5-3B 16 / 2.' },
  { symbol: undefined, name: 'RoPE', meaning: 'Rotary Position Embedding. Кодирует позицию через вращение пар координат в Q и K.' },
  { symbol: undefined, name: 'RMSNorm', meaning: 'Root Mean Square Normalization. Делит вектор на его среднеквадратичную длину и масштабирует обучаемым g.' },
  { symbol: undefined, name: 'SwiGLU', meaning: 'Swish-Gated Linear Unit. Тип MLP с двумя параллельными ветвями (gate, up) и SiLU-активацией.' },
  { symbol: undefined, name: 'Causal mask', meaning: 'Принудительная маска в attention: токен на позиции q не может смотреть на позиции k > q.' },
  { symbol: undefined, name: 'Residual stream', meaning: 'Главный «поток» состояний через все слои. Каждый блок только прибавляет к нему дельту.' },
  { symbol: undefined, name: 'Logit lens', meaning: 'Техника интерпретации: применить unembedding к промежуточному состоянию, чтобы увидеть «что модель уже думает».' },
  { symbol: undefined, name: 'Logits', meaning: 'Сырые числа на выходе сети до softmax. Для нашей модели — вектор длины 151 936.' },
  { symbol: undefined, name: 'KV-cache', meaning: 'Хранилище уже посчитанных K и V на каждом слое для прежних токенов. Нужен чтобы autoregressive-генерация была быстрой.' },
  { symbol: undefined, name: 'Argmax', meaning: 'Выбор индекса с самым большим значением. Greedy-вариант сэмплинга.' },
  { symbol: undefined, name: 'Weight tying', meaning: 'Использование одной и той же матрицы E как для embedding, так и для unembedding. Экономит параметры и связывает входное и выходное пространство.' },
];

export function Glossary() {
  return (
    <Section
      id="glossary"
      eyebrow="VI · Сводка и приложения"
      title="Глоссарий с транскрипциями"
      number="26"
    >
      <p>
        Все символы и термины, которые встречались в тексте. Где есть транскрипция —
        она показывает как читать символ голосом.
      </p>
      <table>
        <thead>
          <tr>
            <th>Символ / термин</th>
            <th>Произношение</th>
            <th>Что значит</th>
          </tr>
        </thead>
        <tbody>
          {ENTRIES.map((e, i) => (
            <tr key={i}>
              <td className="mono">{e.symbol ?? e.name}</td>
              <td className="muted small">{e.symbol ? e.name : '—'}</td>
              <td>{e.meaning}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}
