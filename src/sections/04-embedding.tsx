import { Section, Block } from '../components/Section';
import { Code, CodeBlock } from '../components/Code';
import { Formula } from '../components/Formula';
import { EmbeddingColumn } from '../widgets/EmbeddingColumn';
import { MODEL } from '../data/manifest-types';

export function Embedding() {
  return (
    <Section id="embedding" eyebrow="I · Вход" title="ID → векторы (embedding lookup)" number="3">
      <Block kind="intro">
        <p>
          У нас есть 4 ID. Теперь надо превратить их в то, что модель умеет считать —
          в <b>векторы</b> чисел фиксированной длины. Делается это очень просто:
          у модели хранится огромная таблица <b>E</b> (Embedding-matrix, эмбеддинг-матрица)
          размера {MODEL.vocab_size.toLocaleString('ru-RU')} × {MODEL.hidden_size}.
          Каждая строка — вектор длины {MODEL.hidden_size}, который представляет
          один токен из словаря. Чтобы получить эмбеддинг по ID, нужно просто взять
          строку с этим номером.
        </p>
      </Block>

      <Block kind="formula">
        <p>
          Embedding-матрица:{' '}
          <span className="glyph">
            <span className="glyph__symbol">E</span>
            <span className="glyph__name"> (матрица E)</span>
          </span>{' '}
          размера{' '}
          <span className="glyph">
            <span className="glyph__symbol">V</span>
            <span className="glyph__name"> (вэ — vocab size)</span>
          </span>{' '}
          ×{' '}
          <span className="glyph">
            <span className="glyph__symbol">d</span>
            <span className="glyph__name"> (дэ — hidden size)</span>
          </span>
          .
        </p>
        <Formula tex={`\\mathbf{E} \\in \\mathbb{R}^{V \\times d}, \\quad V = ${MODEL.vocab_size}, \\quad d = ${MODEL.hidden_size}`} />
        <p>Embedding lookup для последовательности ID:</p>
        <Formula tex={`x_i = \\mathbf{E}[\\text{id}_i, \\;:]\\quad \\text{для } i = 0, 1, 2, 3`} />
        <p>
          Запись <Code>E[id_i, :]</Code> читается «строка с номером id_i, все
          колонки» — то есть достаём целиком строку. Знак{' '}
          <span className="glyph"><span className="glyph__symbol">∈</span><span className="glyph__name"> (принадлежит)</span></span>{' '}
          и{' '}
          <span className="glyph"><span className="glyph__symbol">ℝ</span><span className="glyph__name"> (эр — действительные числа)</span></span>{' '}
          вместе означают «это массив действительных чисел такой-то размерности».
        </p>
      </Block>

      <Block kind="pseudo">
        <CodeBlock lang="python">
{`import numpy as np

E = load_weights("embed_tokens")     # shape (151_936, 2048)
ids = np.array([693, 11829, 87089, 320])

x = E[ids]                            # shape (4, 2048)

# x[0] — вектор длины 2048 для "Re"
# x[1] — вектор длины 2048 для "aching"
# x[2] — вектор длины 2048 для " ATH"
# x[3] — вектор длины 2048 для " ("`}
        </CodeBlock>
      </Block>

      <Block kind="words">
        <h4>Что значит «вектор длины 2048»</h4>
        <p>
          Это просто массив из 2048 чисел с плавающей точкой (float32). Каждое
          число — координата в каком-то из 2048 измерений «пространства слов»,
          которое модель построила во время обучения. Никаких «значений вручную»
          там нет — все 2048 чисел получились автоматически из миллиардов градиентных
          шагов на тренировочных данных.
        </p>
        <h4>Что значат сами эти числа</h4>
        <p>
          В отрыве от модели — ничего не значат. Эмбеддинг-вектор имеет смысл
          только относительно других эмбеддинг-векторов и относительно остальных
          весов модели. У близких по смыслу токенов вектора, как правило, ближе
          друг к другу (по углу в этом 2048-мерном пространстве). Например, у
          <Code> "Time"</Code> и <Code>"time"</Code> эмбеддинги почти совпадают.
        </p>
        <h4>Почему именно 2048</h4>
        <p>
          Это <i>hidden size</i> модели. У Qwen-2.5-3B он равен {MODEL.hidden_size};
          у Qwen-2.5-7B уже {MODEL.hidden_size === 2048 ? '4096' : '?'}; у GPT-3 был
          12 288. Чем больше — тем «жирнее» каждый токен, тем больше нюансов модель
          может в нём держать; но и тем больше параметров и медленнее работа.
          2048 — типичная цифра для модели на 3 миллиарда параметров.
        </p>
        <h4>Сколько весит вся E</h4>
        <p>
          {MODEL.vocab_size.toLocaleString('ru-RU')} × {MODEL.hidden_size} ={' '}
          <b>{(MODEL.vocab_size * MODEL.hidden_size).toLocaleString('ru-RU')}</b>{' '}
          чисел типа float32 (4 байта каждое) ≈{' '}
          <b>{Math.round((MODEL.vocab_size * MODEL.hidden_size * 4) / 1024 / 1024)} МБ</b>.
          В нашем браузерном объяснении мы её саму не загружаем — слишком тяжело.
          Но полученные после лукапа 4 строки лежат у нас в{' '}
          <Code>embedding.bin</Code> (4 × 2048 × 4 байта = 32 КБ) и мы их сейчас
          покажем.
        </p>
        <h4>Что было бы, если убрать эмбеддинг-матрицу</h4>
        <p>
          Если бы у модели её не было, она не знала бы как из числа-ID получить
          вектор-представление и не могла бы сделать ни одного следующего шага.
          Embedding-матрица — это «алфавит» модели в её внутреннем пространстве.
        </p>
      </Block>

      <Block kind="demo">
        <EmbeddingColumn />
      </Block>

      <Block kind="real">
        <p>
          На картинке выше — реальные числа из <Code>embedding.bin</Code> для каждого
          из 4 наших токенов. Эти 4 столбика и есть <b>вход в первый слой</b>:
          с этого момента модель забывает что было «Reaching ATH («, она работает
          только с этими 4 × 2048 числами. Текст исчезает.
        </p>
      </Block>
    </Section>
  );
}
