import { Section, Block } from '../components/Section';
import { Code, CodeBlock } from '../components/Code';
import { AutoregressionStepper } from '../widgets/AutoregressionStepper';

export function Autoregression() {
  return (
    <Section
      id="autoregression"
      eyebrow="V · Autoregression"
      title="Из «All» получаем «All Time High»"
      number="23"
    >
      <Block kind="intro">
        <p>
          Один forward pass предсказывает <i>один</i> следующий токен. Чтобы
          сгенерировать целое продолжение, модель работает <b>авторегрессивно</b>:
          предсказала токен → дописала его к промпту → запустила полный
          forward pass заново → получила следующий → и так далее, пока не
          встретится особый «end of sequence» токен или не достигнем лимита
          длины.
        </p>
        <p>
          На наших данных модель не остановилась на «All». Дальше она
          предсказала «·Time», потом «·High», потом «)»; затем продолжила
          «·in ·the ·stock ·market ·is ·a». Получилось финансовое предложение
          «Reaching ATH (All Time High) in the stock market is a …».
        </p>
      </Block>

      <Block kind="pseudo">
        <CodeBlock lang="python">
{`def autoregress(prompt, max_new_tokens=10):
    ids = tokenize(prompt)              # [693, 11829, 87089, 320]
    for step in range(max_new_tokens):
        # каждый раз — полный forward pass на расширенной последовательности
        h = E[ids]
        for layer_idx in range(36):
            h = transformer_block(h, weights[layer_idx])
        h_final = rms_norm(h, weights["final_norm"])

        # logits только для последнего токена
        logits = h_final[-1] @ E.T
        next_id = np.argmax(logits)     # greedy
        ids = np.append(ids, next_id)
        if next_id == EOS_ID:
            break
    return ids`}
        </CodeBlock>
      </Block>

      <Block kind="words">
        <h4>Каждый шаг — это <i>полный</i> forward pass</h4>
        <p>
          Это важно: на 5-м шаге генерации модель не помнит «откуда пришла» —
          она получает на вход полную последовательность из промпта плюс уже
          сгенерированных токенов и считает всё с нуля. Все 36 слоёв, все
          attention-вычисления, все MLP — заново.
        </p>
        <h4>Что меняется от шага к шагу</h4>
        <p>
          Длина последовательности растёт: на шаге 0 — 4 токена; на шаге 5 — 9
          токенов; на шаге 10 — 14 токенов. Все формулы и веса те же; только
          размер тензоров увеличивается, а вместе с ним и количество вычислений
          на шаг (внутри attention растёт квадратично с длиной).
        </p>
        <h4>Почему это так дорого</h4>
        <p>
          Если бы мы каждый раз с нуля считали attention для всех предыдущих
          токенов, это была бы O(n²) сложность на токен и O(n³) на всю
          генерацию. Для n = 1000 токенов это уже миллиарды операций. Решение —{' '}
          <b>KV-cache</b>, об этом следующий раздел.
        </p>
        <h4>Когда модель останавливается</h4>
        <p>
          В реальном инференсе модель останавливается когда:
        </p>
        <ul>
          <li>Сгенерирован специальный токен EOS (end-of-sequence).</li>
          <li>Достигнут заданный лимит max_new_tokens.</li>
          <li>Сработал stop-string (например, для chat-моделей — токен ассистента).</li>
        </ul>
        <p>
          В наших данных мы ограничились первыми 10 сгенерированными токенами —
          этого достаточно чтобы увидеть «All Time High» и понять направление.
        </p>
      </Block>

      <Block kind="demo">
        <AutoregressionStepper />
      </Block>

      <Block kind="real">
        <p>
          Файл <Code>autoregression.json</Code> содержит первые 10 сгенерированных
          токенов от Qwen-2.5-3B на нашем промпте. Каждый из них — argmax
          распределения <i>после полного forward pass'а на текущей
          последовательности</i>. Чтобы предсказать «·Time», модели потребовался
          forward pass на 5 токенах («Re aching ATH ( All»); чтобы предсказать
          «·High» — на 6 токенах; и так далее.
        </p>
      </Block>
    </Section>
  );
}
