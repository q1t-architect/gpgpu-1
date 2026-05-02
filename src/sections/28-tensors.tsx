import { Section, Block } from '../components/Section';
import { Code } from '../components/Code';

export function TensorsAppendix() {
  return (
    <Section
      id="tensors"
      eyebrow="VI · Сводка и приложения"
      title="Что лежит в репо как реальные тензоры"
      number="27"
    >
      <p>
        В <Code>public/data/tensors/</Code> уложены настоящие массивы чисел,
        записанные при реальном forward-pass'е Qwen-2.5-3B на промпте «Reaching ATH (».
        Их можно использовать для своих визуализаций — формат и размерности
        задокументированы в <Code>manifest.json</Code>.
      </p>

      <table>
        <thead>
          <tr>
            <th>Файл</th>
            <th>Что хранится</th>
            <th>Форма</th>
            <th>Размер</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><Code>input_ids.bin</Code></td>
            <td>4 ID токена промпта</td>
            <td>[4]</td>
            <td>16 Б</td>
          </tr>
          <tr>
            <td><Code>embedding.bin</Code></td>
            <td>Стартовый residual stream (после embedding lookup)</td>
            <td>[4, 2048]</td>
            <td>32 КБ</td>
          </tr>
          <tr>
            <td><Code>hidden_states.bin</Code></td>
            <td>Residual stream после каждого слоя; 0-й = после embedding, 36-й = финальный</td>
            <td>[37, 4, 2048]</td>
            <td>1.2 МБ</td>
          </tr>
          <tr>
            <td><Code>attention_weights.bin</Code></td>
            <td>Веса внимания после softmax, для всех слоёв и голов; causal mask уже применён</td>
            <td>[36, 16, 4, 4]</td>
            <td>36 КБ</td>
          </tr>
          <tr>
            <td><Code>final_logits.bin</Code></td>
            <td>Сырые logits после полного forward pass для последнего токена</td>
            <td>[151 936]</td>
            <td>608 КБ</td>
          </tr>
          <tr>
            <td><Code>final_probs.bin</Code></td>
            <td>Те же значения после softmax — вероятности по словарю</td>
            <td>[151 936]</td>
            <td>608 КБ</td>
          </tr>
          <tr>
            <td><Code>logit_lens.json</Code></td>
            <td>Top-15 предсказаний на каждом из 37 слоёв (применили unembedding к промежуточному residual)</td>
            <td>per-layer</td>
            <td>43 КБ</td>
          </tr>
          <tr>
            <td><Code>autoregression.json</Code></td>
            <td>Первые 10 сгенерированных токенов (greedy)</td>
            <td>per-step</td>
            <td>~50 Б</td>
          </tr>
          <tr>
            <td><Code>metadata.json</Code></td>
            <td>Конфигурация модели + входные/сгенерированные токены</td>
            <td>—</td>
            <td>2 КБ</td>
          </tr>
          <tr>
            <td><Code>manifest.json</Code></td>
            <td>Карта всех файлов с размерами и формами</td>
            <td>—</td>
            <td>~3 КБ</td>
          </tr>
        </tbody>
      </table>

      <Block kind="note" label="Чего НЕТ в репо">
        <p>
          Сами обученные веса модели (W_Q, W_K, W_V, W_O, W_g, W_u, W_d, RMSNorm-g) —
          это около 6 ГБ в float16, и они в репо не лежат. Соответственно нет и
          промежуточных Q, K, V после проекции. Если нужны — берутся напрямую
          из Qwen-2.5-3B по HuggingFace.
        </p>
      </Block>

      <Block kind="note" label="Как все эти числа были получены">
        <p>
          Отдельный Python-скрипт (не в этом репо) использует библиотеку{' '}
          <Code>transformers</Code> от HuggingFace, загружает Qwen-2.5-3B,
          включает <Code>output_hidden_states=True</Code> и{' '}
          <Code>output_attentions=True</Code>, прогоняет промпт и сохраняет нужные
          тензоры в файлы. Полностью воспроизводимо: на одинаковой версии
          модели и transformers получим побайтно те же числа.
        </p>
      </Block>
    </Section>
  );
}
