import { Section, Block } from '../components/Section';
import { Code, CodeBlock } from '../components/Code';
import { Formula } from '../components/Formula';

export function OutputProj() {
  return (
    <Section
      id="output-proj"
      eyebrow="II · Один transformer-блок"
      title="W_O и первый residual add"
      number="13"
    >
      <Block kind="intro">
        <p>
          Out от attention имеет форму (4, 16, 128). Мы reshape'им его обратно в
          плоский (4, 2048), затем умножаем на ещё одну обучаемую матрицу{' '}
          <b>W_O</b> (output projection, выходная проекция) — это финальное
          смешивание голов между собой. После этого результат прибавляется в
          residual stream — это <i>первый</i> residual add блока.
        </p>
      </Block>

      <Block kind="formula">
        <Formula tex={`\\text{concat\\_heads}(out) \\in \\mathbb{R}^{4 \\times 2048}`} />
        <Formula tex={`\\Delta\\text{Attn} = \\text{concat\\_heads}(out) \\cdot W_O, \\quad W_O \\in \\mathbb{R}^{2048 \\times 2048}`} />
        <p>Residual add (первый из двух в блоке):</p>
        <Formula tex={`h_{\\ell}^{\\text{mid}} = h_\\ell + \\Delta\\text{Attn}`} />
        <p>
          Здесь <Code>h_ℓ^mid</Code> — промежуточное состояние блока после attention,
          но <i>до</i> MLP.
        </p>
      </Block>

      <Block kind="pseudo">
        <CodeBlock lang="python">
{`# out : (4, 16, 128)
out_flat = out.reshape(4, 16 * 128)        # (4, 2048)
W_O = layer.weights["o_proj"]              # (2048, 2048)

delta_attn = out_flat @ W_O                # (4, 2048)

h_mid = h + delta_attn                     # ← residual add #1`}
        </CodeBlock>
      </Block>

      <Block kind="words">
        <h4>Что делает reshape «обратно»</h4>
        <p>
          Это та же операция бесплатной переинтерпретации памяти, что и при
          разбиении на головы — только в обратную сторону. Был массив (4, 16, 128)
          из 8192 чисел; теперь это (4, 2048) — те же 8192 чисел, расположенные
          подряд.
        </p>
        <h4>Зачем нужна W_O</h4>
        <p>
          После concat у нас 16 голов, поставленных рядом. Если бы мы просто
          подавали результат дальше, MLP получил бы «слипшиеся» головы — каждая
          голова занимает свои 128 размерностей и не пересекается с другими.
          W_O — это смешивание: каждое из 2048 выходных чисел — взвешенная сумма
          всех 2048 входных чисел. Это позволяет голове 0 «поговорить» с головой 5
          и выдать совместный сигнал.
        </p>
        <h4>Что было бы без W_O</h4>
        <p>
          Каждая голова работала бы изолированно. Это сильно ограничило бы
          способность модели объединять разные «виды внимания» в общую
          интерпретацию. Эмпирически модели без W_O работают значительно хуже.
        </p>
        <h4>Почему «первый» residual add</h4>
        <p>
          Внутри одного блока два residual add'а. Первый — после attention, второй —
          после MLP. Между ними состояние называется <Code>h_mid</Code>. На вход
          MLP пойдёт нормированная версия именно этого <Code>h_mid</Code>.
        </p>
        <h4>Сколько параметров в W_O</h4>
        <p>
          W_O — 2048 × 2048 = 4.2 М параметров на слой. За 36 слоёв это около
          150 М. Большая, но не самая большая часть модели — самая большая это
          MLP (см. раздел 16).
        </p>
        <h4>Структура attention-подсистемы целиком (для запоминания)</h4>
        <ol>
          <li>RMSNorm</li>
          <li>x · W_Q → reshape → RoPE → Q (4, 16, 128)</li>
          <li>x · W_K → reshape → RoPE → K (4, 2, 128)</li>
          <li>x · W_V → reshape → V (4, 2, 128)</li>
          <li>scores = Q · Kᵀ / √128 + causal mask</li>
          <li>attn = softmax(scores)</li>
          <li>out = attn · V → reshape (4, 2048)</li>
          <li>delta_attn = out · W_O</li>
          <li>h_mid = h + delta_attn ← <b>сюда мы пришли</b></li>
        </ol>
      </Block>

      <Block kind="real">
        <p>
          В <Code>hidden_states.bin</Code> лежит residual stream <i>в начале</i>{' '}
          каждого блока (h_ℓ) и в самом конце (h_36). Промежуточный h_mid не
          сохраняется — его можно восстановить, зная h_ℓ, веса слоя и применив
          attention-подсистему, но мы его не используем в наших визуализациях.
        </p>
      </Block>
    </Section>
  );
}
