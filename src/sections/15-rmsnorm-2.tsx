import { Section, Block } from '../components/Section';
import { Code } from '../components/Code';

export function RmsNorm2() {
  return (
    <Section
      id="rmsnorm-2"
      eyebrow="II · Один transformer-блок"
      title="Второй RMSNorm"
      number="14"
    >
      <Block kind="intro">
        <p>
          После первого residual add у нас состояние <Code>h_mid</Code> размера
          (4, 2048). Перед MLP мы снова применяем RMSNorm. Формула и логика —
          ровно те же, что в разделе 5; единственное отличие — другой обучаемый
          вектор <Code>g</Code> (свой у каждого RMSNorm).
        </p>
      </Block>

      <Block kind="words">
        <h4>Почему «второй» — потому что в блоке два RMSNorm</h4>
        <p>
          В архитектуре pre-norm у нас:
        </p>
        <ol>
          <li>
            RMSNorm перед attention — нормирует вход attention.
          </li>
          <li>Attention + первый residual add → <Code>h_mid</Code>.</li>
          <li>
            <b>RMSNorm перед MLP</b> — нормирует вход MLP. Это и есть «второй»
            RMSNorm. Использует свой обученный <Code>g</Code>, отличный от
            первого.
          </li>
          <li>MLP + второй residual add → выход блока.</li>
        </ol>
        <h4>Что делает второй RMSNorm</h4>
        <p>
          Как и первый: для каждого из 4 столбиков отдельно делит на его RMS и
          умножает на обученный g (длины 2048). Никаких нюансов сверх раздела 5
          здесь нет — но мы упоминаем эту операцию, потому что без неё пропустить
          важный шаг pipeline было бы нечестно.
        </p>
      </Block>

      <Block kind="real">
        <p>
          В Qwen-2.5-3B на 36 слоёв приходится 72 RMSNorm в основной цепочке + 1
          финальный, итого 73. Каждый имеет свой обученный g длины 2048.
          Промежуточные нормированные состояния не сохраняются — они служебные.
        </p>
      </Block>
    </Section>
  );
}
