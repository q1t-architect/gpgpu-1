import { Section, Block } from '../components/Section';
import { Code, CodeBlock } from '../components/Code';
import { Formula } from '../components/Formula';

export function Mlp() {
  return (
    <Section
      id="mlp"
      eyebrow="II · Один transformer-блок"
      title="MLP / SwiGLU: 2048 → 11008 → 2048"
      number="15"
    >
      <Block kind="intro">
        <p>
          Вторая половина блока — это <b>MLP</b> (Multi-Layer Perceptron, многослойный
          перцептрон). Внутри одного блока он работает <i>независимо для каждого
          токена</i> — никакого взаимодействия между токенами здесь нет (это уже
          сделал attention). MLP в современных LLM имеет специфическую форму
          под названием <b>SwiGLU</b> — три отдельные матрицы и хитрая нелинейность.
        </p>
      </Block>

      <Block kind="formula">
        <p>Обозначения:</p>
        <ul>
          <li><span className="glyph"><span className="glyph__symbol">W_g</span><span className="glyph__name"> (дабл-ю с индексом g — gate projection)</span></span> — обучаемая матрица, форма (2048, 11008).</li>
          <li><span className="glyph"><span className="glyph__symbol">W_u</span><span className="glyph__name"> (дабл-ю с индексом u — up projection)</span></span> — обучаемая матрица, форма (2048, 11008).</li>
          <li><span className="glyph"><span className="glyph__symbol">W_d</span><span className="glyph__name"> (дабл-ю с индексом d — down projection)</span></span> — обучаемая матрица, форма (11008, 2048).</li>
          <li><span className="glyph"><span className="glyph__symbol">SiLU</span><span className="glyph__name"> (силу — Sigmoid Linear Unit)</span></span>: <Code>SiLU(z) = z · σ(z)</Code>, где σ — сигмоид.</li>
          <li><span className="glyph"><span className="glyph__symbol">σ</span><span className="glyph__name"> (сигма строчная — sigmoid)</span></span>: σ(z) = 1 / (1 + e^(−z)).</li>
          <li><span className="glyph"><span className="glyph__symbol">⊙</span><span className="glyph__name"> (точка в кружке — Адамаров продукт, поэлементное умножение)</span></span>.</li>
        </ul>
        <Formula tex={`\\text{gate} = x \\cdot W_g, \\quad \\text{up} = x \\cdot W_u`} />
        <Formula tex={`h_{\\text{mlp}} = \\text{SiLU}(\\text{gate}) \\odot \\text{up}`} />
        <Formula tex={`\\text{out}_{\\text{mlp}} = h_{\\text{mlp}} \\cdot W_d`} />
        <p>
          Промежуточное измерение — <b>11008</b>, в 5.4 раза больше hidden_size.
        </p>
      </Block>

      <Block kind="pseudo">
        <CodeBlock lang="python">
{`def silu(z):
    return z * (1 / (1 + np.exp(-z)))

# x : (4, 2048) — вход MLP (после второго RMSNorm)
W_g = layer.weights["gate_proj"]    # (2048, 11008)
W_u = layer.weights["up_proj"]      # (2048, 11008)
W_d = layer.weights["down_proj"]    # (11008, 2048)

gate = x @ W_g                      # (4, 11008)
up   = x @ W_u                      # (4, 11008)
h    = silu(gate) * up              # поэлементное умножение, (4, 11008)
out  = h @ W_d                      # (4, 2048)`}
        </CodeBlock>
      </Block>

      <Block kind="words">
        <h4>Почему «расширение → сжатие»</h4>
        <p>
          MLP сначала расширяет 2048 → 11008 (×5.4), потом сжимает обратно
          11008 → 2048. В широком пространстве модель имеет больше «кнопок» для
          выявления тонких признаков, потом дорогим down-сжатием возвращает
          нужное к hidden_size, чтобы можно было сложить с residual stream.
        </p>
        <h4>Что такое SiLU и почему её</h4>
        <p>
          SiLU(z) = z · σ(z), где σ(z) = 1/(1 + e^(−z)). Это плавная активация:
          на больших положительных z она ≈ z (линейна), на больших отрицательных
          она ≈ 0, около нуля — мягко изгибается. Альтернатива «сильным» функциям
          вроде ReLU (которая просто обрезает отрицательное).
        </p>
        <p>
          SiLU работает лучше ReLU в LLM, потому что не «убивает» градиенты в
          отрицательной области и даёт более гладкую оптимизацию.
        </p>
        <h4>Что такое gate, up и зачем поэлементное умножение</h4>
        <p>
          Это и есть SwiGLU — Swish-Gated Linear Unit. Идея: расщепить вход
          на два параллельных пути:
        </p>
        <ul>
          <li><b>gate</b> — пропускается через SiLU, потом работает как «выключатель»: каждое из 11008 чисел определяет силу сигнала, от 0 (выключено) до большого числа (усилено).</li>
          <li><b>up</b> — это сам сигнал, без активации.</li>
        </ul>
        <p>
          Их поэлементное умножение даёт «сигнал, прошедший через 11008
          независимых клапанов». Это намного выразительнее обычной MLP с одной
          активацией: модель может мультипликативно подавлять или усиливать
          конкретные размерности промежуточного представления.
        </p>
        <h4>Что было бы со старой MLP (без gate)</h4>
        <p>
          Старая GPT-2 MLP: <Code>h = ReLU(x @ W1) @ W2</Code>. Тоже работает, но
          даёт меньше способов модели «выбирать что важно». SwiGLU стал
          стандартом начиная с PaLM (2022) и затем в LLaMA, Qwen, Mistral —
          именно из-за этого мультипликативного «гейтирования».
        </p>
        <h4>Почему именно ×5.4 для intermediate</h4>
        <p>
          Точное соотношение зависит от модели. У стандартного Transformer'а оно
          было ×4 (то есть 8192 для нашего hidden 2048). У SwiGLU обычно делают
          ≈×8/3 от классического (потому что у SwiGLU две матрицы 2048→intermediate
          вместо одной), и для удобства округляют до ближайшего «красивого» числа.
          У Qwen-2.5-3B получилось 11008 ≈ 2048 × 5.4.
        </p>
        <h4>Сколько здесь параметров</h4>
        <p>
          Три матрицы. W_g и W_u по 2048 × 11008 = 22.5 М параметров каждая;
          W_d 11008 × 2048 = 22.5 М. Итого 67.5 М параметров на один слой —{' '}
          <i>это самая большая часть блока</i>. За 36 слоёв это 2.4 миллиарда
          параметров, что составляет большую часть всех 3 миллиардов модели.
        </p>
        <h4>Почему MLP не «смотрит на другие токены»</h4>
        <p>
          MLP работает <i>пер-токенно</i>: каждый из 4 токенов проходит через свои
          собственные 3 матричных умножения параллельно, не видя других токенов.
          Это место где модель «думает сама про себя» — после того как attention
          ей дал общую информацию о контексте. Сообщество называет MLP-слой
          «памятью знаний» (knowledge memory): эмпирически именно тут хранятся
          факты вроде «Эйфелева башня — в Париже».
        </p>
      </Block>

      <Block kind="real">
        <p>
          Промежуточные значения MLP мы не сохраняли. Но мы знаем что в каждом
          из 36 слоёв эта операция происходит ровно так, и что её выход
          добавляется к h_mid, давая финальный выход блока.
        </p>
      </Block>
    </Section>
  );
}
