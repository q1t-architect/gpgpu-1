import { Section, Block } from '../components/Section';
import { Code } from '../components/Code';

export function FinalNorm() {
  return (
    <Section
      id="final-norm"
      eyebrow="IV · Выход"
      title="Финальный RMSNorm"
      number="19"
    >
      <Block kind="intro">
        <p>
          После 36 блоков residual stream <Code>h_36</Code> прогоняется через ещё
          один — финальный — RMSNorm. Это та же операция, что описана в разделе 5,
          но это <b>самый последний раз</b> мы её применяем перед тем как смотреть
          в словарь.
        </p>
      </Block>

      <Block kind="words">
        <h4>Зачем нужен финальный RMSNorm</h4>
        <p>
          Residual stream рос при каждом из 72 residual add'ов. Без финальной
          нормировки масштаб <Code>h_36</Code> был бы непредсказуемо большим, и
          dot product с embedding-матрицей дал бы logits огромных значений, что
          сильно «насытило» бы финальный softmax (один кандидат с вероятностью ≈ 1,
          остальные ≈ 0). Финальный RMSNorm приводит h_36 к устойчивому масштабу.
        </p>
        <h4>Чем отличается от внутреблочных RMSNorm</h4>
        <p>
          По формуле — ничем. Это просто 73-й RMSNorm в pipeline, со своим
          обученным g-вектором длины 2048. Применяется ко всему h_36 (4 × 2048),
          но дальше нам понадобится только последний токен (q = 3).
        </p>
      </Block>

      <Block kind="real">
        <p>
          В нашем репо финальное состояние <i>после</i> финального RMSNorm не
          сохранено отдельно — мы храним только <Code>h_36</Code> (последний
          снимок residual stream <i>до</i> финального RMSNorm). Зато мы храним{' '}
          <Code>final_logits.bin</Code> и <Code>final_probs.bin</Code> — то, что
          получается <i>после</i> финального RMSNorm и unembedding. Эти числа
          мы покажем в следующих двух разделах.
        </p>
      </Block>
    </Section>
  );
}
