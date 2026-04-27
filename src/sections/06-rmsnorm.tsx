import { Section, Block } from '../components/Section';
import { Code, CodeBlock } from '../components/Code';
import { Formula } from '../components/Formula';
import { RmsNormDemo } from '../widgets/RmsNormDemo';

export function RmsNormSection() {
  return (
    <Section
      id="rmsnorm"
      eyebrow="II · Один transformer-блок"
      title="RMSNorm: нормировка длины вектора"
      number="5"
    >
      <Block kind="intro">
        <p>
          С этого раздела мы залезаем внутрь одного блока. Самая первая операция
          внутри блока — это <b>RMSNorm</b> (Root-Mean-Square Norm, «среднеквадратичная
          нормировка»). Она применяется отдельно к каждому из 4 столбиков длины 2048
          и приводит их к одному масштабу — чтобы дальнейшее матричное умножение
          было численно стабильным.
        </p>
      </Block>

      <Block kind="formula">
        <p>
          Для вектора <Code>x</Code> длины <span className="glyph"><span className="glyph__symbol">d</span><span className="glyph__name"> (дэ — длина вектора, у нас 2048)</span></span>:
        </p>
        <Formula tex={`\\text{RMS}(x) = \\sqrt{\\frac{1}{d} \\sum_{i=0}^{d-1} x_i^2 + \\varepsilon}`} />
        <Formula tex={`\\text{RMSNorm}(x) = \\frac{x}{\\text{RMS}(x)} \\odot g`} />
        <p>
          Расшифровка символов:
        </p>
        <ul>
          <li><span className="glyph"><span className="glyph__symbol">Σ</span><span className="glyph__name"> (сигма)</span></span> — знак суммы; <Code>Σ x_i² от 0 до d−1</Code> означает «сложить квадраты всех 2048 чисел вектора».</li>
          <li><span className="glyph"><span className="glyph__symbol">√</span><span className="glyph__name"> (корень)</span></span> — квадратный корень от среднего.</li>
          <li><span className="glyph"><span className="glyph__symbol">ε</span><span className="glyph__name"> (эпсилон)</span></span> — крошечная константа (обычно 10⁻⁶), чтобы корень не оказался нулём, если вдруг все x_i = 0.</li>
          <li><span className="glyph"><span className="glyph__symbol">⊙</span><span className="glyph__name"> (точка в кружке — Адамаров продукт)</span></span> — поэлементное умножение векторов.</li>
          <li><span className="glyph"><span className="glyph__symbol">g</span><span className="glyph__name"> (джи — gain, обучаемый «усилитель»)</span></span> — вектор длины d, обучаемый параметр; свой на каждом RMSNorm в каждом слое.</li>
        </ul>
      </Block>

      <Block kind="pseudo">
        <CodeBlock lang="python">
{`def rms_norm(x, g, eps=1e-6):
    # x : shape (4, 2048)  — 4 наших токена
    # g : shape (2048,)    — обучаемый "усилитель" этого слоя
    rms = np.sqrt(np.mean(x ** 2, axis=-1, keepdims=True) + eps)  # (4, 1)
    return (x / rms) * g                                          # (4, 2048)`}
        </CodeBlock>
      </Block>

      <Block kind="words">
        <h4>Что эта формула делает шаг за шагом</h4>
        <ol>
          <li>Возводим каждое из 2048 чисел в квадрат — получаем 2048 неотрицательных чисел.</li>
          <li>Считаем среднее — одно число «средний квадрат».</li>
          <li>Берём корень — это <i>RMS</i>, среднеквадратичная длина вектора.</li>
          <li>Делим каждое из 2048 чисел на этот корень — теперь у вектора RMS = 1, т.е. фиксированный масштаб.</li>
          <li>Поэлементно умножаем на обучаемый <Code>g</Code> — это позволяет модели <i>усиливать</i> или <i>гасить</i> отдельные размерности относительно друг друга.</li>
        </ol>
        <h4>Чем RMSNorm отличается от LayerNorm</h4>
        <p>
          В классической LayerNorm есть ещё <i>центрирование</i> — из вектора
          сначала вычитают его среднее. RMSNorm пропускает этот шаг и обходится
          только нормировкой длины. Это быстрее и работает на современных моделях
          не хуже LayerNorm, поэтому большинство новых LLM (LLaMA, Qwen, Mistral)
          используют именно RMSNorm.
        </p>
        <h4>Зачем вообще нормировать</h4>
        <p>
          Если масштабы 4 столбиков сильно разные (один с длиной 0.1, другой с
          длиной 1000), то скалярное произведение в attention или матричное
          умножение даст числа очень разной величины — softmax будет «ломаться»
          (мы увидим в разделе про softmax). После RMSNorm все 4 столбика
          приведены к одной длине, и дальнейшая арифметика численно стабильна.
        </p>
        <h4>Pre-norm vs post-norm</h4>
        <p>
          Qwen использует <i>pre-norm</i>: RMSNorm применяется <b>перед</b> attention
          и MLP, а результат подсистемы добавляется в residual stream без нормировки.
          Это значит, что residual stream сам по себе не нормирован — он растёт со
          слоями. Pre-norm более стабильна при обучении, чем post-norm (где
          нормируют после residual add).
        </p>
        <h4>Сколько параметров</h4>
        <p>
          Только вектор <Code>g</Code> длины 2048. На один слой нужно два <Code>g</Code> —
          один для pre-attention, второй для pre-MLP. Плюс один в самом конце
          (final RMSNorm). Итого: 2 × 36 + 1 = 73 вектора по 2048 = ~150 тысяч
          параметров — это ничтожно мало по сравнению с 3 миллиардами всей
          модели.
        </p>
      </Block>

      <Block kind="demo">
        <RmsNormDemo />
      </Block>

      <Block kind="real">
        <p>
          В нашем forward-pass'е RMSNorm применяется 73 раза — два раза в каждом из
          36 блоков плюс один финальный. Сами g-векторы — это часть весов модели,
          мы их в браузер не загружаем. Но факт «вход в attention каждого слоя
          сначала нормирован» одинаково верен и для слоя 1, и для слоя 36.
        </p>
      </Block>
    </Section>
  );
}
