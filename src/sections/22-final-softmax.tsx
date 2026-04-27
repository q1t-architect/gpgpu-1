import { Section, Block } from '../components/Section';
import { Code, CodeBlock } from '../components/Code';
import { Formula } from '../components/Formula';
import { FinalSoftmax as FinalSoftmaxWidget } from '../widgets/FinalSoftmax';

export function FinalSoftmax() {
  return (
    <Section
      id="final-softmax"
      eyebrow="IV · Выход"
      title="Финальный softmax → «All»"
      number="21"
    >
      <Block kind="intro">
        <p>
          Logits — сырые числа. Чтобы превратить их в вероятности, применяем
          softmax. Это та же операция, что и внутри attention (раздел 11), но
          теперь по гораздо более длинному вектору — все 151 936 значений сразу.
          Получаем распределение по словарю: каждое из 151 936 чисел — вероятность
          того, что именно это слово станет следующим токеном.
        </p>
      </Block>

      <Block kind="formula">
        <Formula tex={`p_i = \\frac{e^{z_i}}{\\sum_{j=0}^{151935} e^{z_j}}, \\quad i = 0, 1, \\dots, 151935`} />
      </Block>

      <Block kind="pseudo">
        <CodeBlock lang="python">
{`logits = ...                              # (151_936,)
shifted = logits - np.max(logits)         # численно стабильно
ex = np.exp(shifted)
probs = ex / np.sum(ex)                   # (151_936,) суммируется в 1.0

# argmax — самый вероятный следующий токен
next_id = np.argmax(probs)
# next_id == 2403  → "All"`}
        </CodeBlock>
      </Block>

      <Block kind="words">
        <h4>Что значит «вероятность 49% у All»</h4>
        <p>
          В ровно тех же условиях (тот же промпт, та же модель, те же веса)
          модель оценивает шанс, что следующий токен будет именно «All», в 49.2%.
          Остальные 50.8% распределены между всеми остальными 151 935 кандидатами,
          но в основном между несколькими: «the», «·a», «·1», «·an».
        </p>
        <h4>Почему не 100%</h4>
        <p>
          Промпт «Reaching ATH (» <i>не однозначно</i> требует продолжения «All
          Time High». Это могло бы быть «Reaching ATH (a)» (как пункт списка),
          «Reaching ATH (the …)», «Reaching ATH (1)» (нумерация), «Reaching ATH
          (an …)», и так далее. Модель отражает все эти возможности
          распределением, но самый вероятный продолжение — финансовая идиома
          «All Time High», поэтому «All» побеждает.
        </p>
        <h4>Что было бы если убрать softmax и работать с logits</h4>
        <p>
          Вообще-то модель уже выбрала бы то же самое: argmax от logits и
          argmax от softmax(logits) совпадают (потому что softmax — монотонная
          функция). Но мы потеряли бы интерпретацию «вероятность» — без неё
          невозможно сравнить уверенность модели в разных предсказаниях,
          невозможно сделать sampling по температуре и top-p, и невозможно
          вычислить cross-entropy loss во время обучения.
        </p>
        <h4>Финальный softmax — это та же функция, что и внутри attention</h4>
        <p>
          Алгоритмически один в один; разница только в размере вектора (4 в
          attention vs 151 936 здесь) и в назначении (там — внимание, тут —
          предсказание токена).
        </p>
      </Block>

      <Block kind="demo">
        <FinalSoftmaxWidget />
      </Block>

      <Block kind="real">
        <p>
          Файл <Code>final_probs.bin</Code> — это все 151 936 вероятностей,
          посчитанных при подготовке тензоров. Сумма = 1.0. Top-1 — id 2403 =
          «All» с p ≈ 0.492. В виджете выше этот файл загружается и сортируется
          в реальном времени.
        </p>
      </Block>
    </Section>
  );
}
