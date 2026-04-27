import { Section, Block } from '../components/Section';
import { Code, CodeBlock } from '../components/Code';
import { Formula } from '../components/Formula';
import { SoftmaxDemo } from '../widgets/SoftmaxDemo';
import { AttentionMatrix } from '../widgets/AttentionMatrix';

export function Softmax() {
  return (
    <Section
      id="softmax"
      eyebrow="II · Один transformer-блок"
      title="Softmax: превращаем числа в вероятности"
      number="11"
    >
      <Block kind="intro">
        <p>
          Сырые scores могут быть любыми (положительными, отрицательными). Чтобы
          использовать их как «вероятности внимания», нужно их превратить в набор
          неотрицательных чисел, суммирующихся в 1. Этим занимается <b>softmax</b>.
          Это та же функция, что и в финале модели — там она превращает logits
          в вероятности следующего токена.
        </p>
      </Block>

      <Block kind="formula">
        <p>Softmax от вектора <Code>z</Code> длины <Code>n</Code>:</p>
        <Formula tex={`\\text{softmax}(z)_i = \\frac{e^{z_i}}{\\sum_{j=0}^{n-1} e^{z_j}}`} />
        <p>Расшифровка:</p>
        <ul>
          <li><span className="glyph"><span className="glyph__symbol">e</span><span className="glyph__name"> (экспонента, e ≈ 2.718)</span></span> — основание натурального логарифма.</li>
          <li><span className="glyph"><span className="glyph__symbol">e^z</span><span className="glyph__name"> (е в степени z)</span></span> — экспонента от <Code>z</Code>.</li>
          <li><span className="glyph"><span className="glyph__symbol">Σ</span><span className="glyph__name"> (сигма)</span></span> — сумма. <Code>Σ от j=0 до n-1</Code> — пройти по всем элементам.</li>
        </ul>
        <p>В контексте attention применяется построчно — для каждой пары (head, q):</p>
        <Formula tex={`\\mathrm{attn}_{h,q,k} = \\text{softmax}_k(s_{h,q,\\cdot})`} />
      </Block>

      <Block kind="pseudo">
        <CodeBlock lang="python">
{`def softmax(z):
    # численно стабильная реализация: вычитаем max
    z = z - np.max(z, axis=-1, keepdims=True)
    e = np.exp(z)
    return e / np.sum(e, axis=-1, keepdims=True)

# attention веса: shape (16, 4, 4)
attn = softmax(scores)  # softmax по последней оси (k)`}
        </CodeBlock>
      </Block>

      <Block kind="words">
        <h4>Что софтмакс делает с числами</h4>
        <ol>
          <li>
            <Code>e^z</Code> — превращаем все числа в строго положительные.
            Большие <Code>z</Code> становятся очень большими положительными,
            маленькие или отрицательные — близкими к нулю.
          </li>
          <li>
            Делим каждое <Code>e^z_i</Code> на сумму всех <Code>e^z_j</Code>.
            Получаем числа в (0, 1), которые в сумме дают ровно 1 — то есть
            корректное распределение вероятностей.
          </li>
        </ol>
        <h4>Почему именно экспонента</h4>
        <p>
          Экспонента — единственная (с точностью до константы) функция, удовлетворяющая
          нескольким хорошим свойствам сразу: всегда положительна, монотонна
          (порядок чисел сохраняется), её производная — она сама (что упрощает
          градиенты при обучении), и работает аддитивно в логарифмах.
        </p>
        <h4>Почему вычитают max</h4>
        <p>
          В реальном коде делают <Code>e^(z − max(z))</Code> вместо <Code>e^z</Code>.
          Это математически идентично (и в числителе, и в знаменателе появляется
          одинаковый множитель <Code>e^(−max)</Code>, который сокращается), но
          избегает <i>переполнения</i>: <Code>e^1000</Code> = ∞ в float32, а после
          вычитания max самое большое значение становится <Code>e^0 = 1</Code>.
        </p>
        <h4>Что значит «softmax после причинной маски»</h4>
        <p>
          Замаскированные клетки (k &gt; q) у нас имели −∞. <Code>e^(−∞) = 0</Code>, и
          они дают строго нулевой вклад в сумму и в результат. Это корректно
          обращает «внимание» только на разрешённые позиции.
        </p>
        <h4>Что было бы без softmax</h4>
        <p>
          Если бы мы умножали V на сырые scores (без softmax), то «вес внимания»
          мог бы быть отрицательным или гигантским — V перестал бы вести себя как
          взвешенное среднее. Потерялась бы интерпретация «доля интереса». Кроме
          того, во время обучения модель не смогла бы стабильно учиться на больших
          значениях scores.
        </p>
        <h4>Температура</h4>
        <p>
          Иногда softmax модифицируют — делят <Code>z</Code> на температуру{' '}
          <span className="glyph"><span className="glyph__symbol">τ</span><span className="glyph__name"> (тау)</span></span>{' '}
          перед взятием экспоненты. При τ → 0 распределение становится «острее» (всё
          в самом большом), при τ → ∞ — стремится к равномерному. Внутри attention
          температура обычно не используется (фиксирована в 1), но <b>при выборе
          следующего токена</b> на самом конце модели температура — это популярный
          способ управлять «креативностью» генерации.
        </p>
      </Block>

      <Block kind="demo">
        <SoftmaxDemo />
        <AttentionMatrix />
      </Block>

      <Block kind="real">
        <p>
          В нашем репо <Code>attention_weights.bin</Code> содержит <i>уже посчитанные</i>{' '}
          attention-веса (после softmax) для всех 36 слоёв и 16 голов: тензор
          формы [36, 16, 4, 4]. Виджет выше показывает их как есть. Несколько
          интересных наблюдений:
        </p>
        <ul>
          <li>Каждая строка матрицы суммируется в 1 (с учётом замаскированных нулей).</li>
          <li>На L = 0 многие головы делают почти равномерное внимание — модель ещё «не разобралась».</li>
          <li>На поздних слоях (L = 25–35) хорошо видно, что разные головы делают разные вещи: одни концентрируются на последнем токене, другие на самом первом, третьи равномерно.</li>
        </ul>
      </Block>
    </Section>
  );
}
