import { Section, Block } from '../components/Section';
import { Code, CodeBlock } from '../components/Code';
import { Formula } from '../components/Formula';
import { MODEL } from '../data/manifest-types';

export function ResidualStream() {
  return (
    <Section
      id="residual-stream"
      eyebrow="I · Вход"
      title="Residual stream — что течёт через слои"
      number="4"
    >
      <Block kind="intro">
        <p>
          Прежде чем нырять внутрь одного блока, важно зафиксировать главную идею
          архитектуры transformer'а — <b>residual stream</b> (резидуал-стрим, «остаточный
          поток»). Это «русло», по которому 4 наших вектора текут через все 36 слоёв.
          В каждом слое к этим векторам что-то <i>прибавляется</i>, но они никогда
          не <i>заменяются</i> целиком. Это объясняет, почему 36 блоков, поставленных
          друг за другом, вместе работают как одно осмысленное целое.
        </p>
      </Block>

      <Block kind="formula">
        <p>
          Обозначим состояние residual stream после слоя <span className="glyph"><span className="glyph__symbol">ℓ</span><span className="glyph__name"> (эль — номер слоя)</span></span>{' '}
          как <Code>h_ℓ</Code> (h на латинице — hidden state). У нас{' '}
          <Code>ℓ ∈ {'{'}0, 1, …, 36{'}'}</Code>; <Code>h_0</Code> это эмбеддинги после
          lookup, <Code>h_36</Code> это финальное состояние.
        </p>
        <Formula tex={`\\mathbf{h}_0 = \\mathbf{E}[\\text{ids}, \\;:]\\quad\\in\\quad \\mathbb{R}^{4 \\times 2048}`} />
        <p>Каждый блок ℓ — это функция от текущего состояния, которая возвращает «дельту»:</p>
        <Formula tex={`\\mathbf{h}_{\\ell+1} = \\mathbf{h}_\\ell + \\text{Attn}_\\ell(\\mathbf{h}_\\ell) + \\text{MLP}_\\ell\\big(\\mathbf{h}_\\ell + \\text{Attn}_\\ell(\\mathbf{h}_\\ell)\\big)`} />
        <p>
          Тут <Code>Attn_ℓ</Code> и <Code>MLP_ℓ</Code> — это две вычислительные подсистемы
          блока ℓ (они нам подробно разберутся в разделах 5–17). Знак{' '}
          <span className="glyph"><span className="glyph__symbol">+</span><span className="glyph__name"> (плюс)</span></span>{' '}
          здесь — поэлементное сложение векторов: складываем 2048 чисел с 2048 числами
          по позициям.
        </p>
      </Block>

      <Block kind="pseudo">
        <CodeBlock lang="python">
{`# residual stream через все 36 слоёв
h = E[ids]                            # shape (4, 2048) — состояние после embedding

for layer in range(36):
    delta_attn = attention_block(h, layer)    # shape (4, 2048)
    h = h + delta_attn                        # ← residual add #1

    delta_mlp = mlp_block(h, layer)           # shape (4, 2048)
    h = h + delta_mlp                         # ← residual add #2

# теперь h это hidden_states[36] — финальное состояние`}
        </CodeBlock>
      </Block>

      <Block kind="words">
        <h4>Зачем это нужно</h4>
        <p>
          В классической архитектуре «слой заменяет состояние» (как, скажем, в
          обычной CNN) информация в начале сети быстро теряется: каждый слой
          превращает входы во что-то новое. Если слоёв много (36, 70, 120…),
          градиенты во время обучения «затухают» — модель не учится. Residual
          connection (резидуал-коннекшн, «остаточная связь») — приём из ResNet 2015 —
          гарантирует, что в любом слое модель может «ничего не делать»: достаточно
          выдать нулевую дельту, и состояние пойдёт дальше неизменным. Тренировка
          становится стабильной даже при сотнях слоёв.
        </p>
        <h4>Метафора</h4>
        <p>
          Представь длинный коридор с 36 дверьми. По коридору катится 4 тележки
          (4 токена). У каждой двери стоит человек с подписями, который смотрит на
          тележки и <i>добавляет</i> на каждую новые предметы (свои выводы). Никто
          не перевыкладывает тележки заново — все только дописывают. К двери №36
          на тележках накоплено всё, что 36 человек по дороге сочли важным.
        </p>
        <h4>Что было бы без residual</h4>
        <p>
          Без residual каждый блок должен был бы переписать всё содержимое заново.
          Это во-первых неэкономно (придётся повторять то, что уже было), во-вторых
          разрушительно (если блок ошибся, информации больше не вернуть).
          Residual фиксирует «нижний слой» как страховку.
        </p>
        <h4>Важный нюанс — pre-norm</h4>
        <p>
          В Qwen внутри блока перед attention и перед MLP применяется RMSNorm, но
          она применяется к <i>входу подсистемы</i>, а <i>дельта</i> (выход подсистемы)
          складывается с <i>исходным</i> residual stream. Это важно — благодаря этому
          residual stream не нормируется на каждом слое и сохраняет свой растущий
          масштаб. Подробнее в разделе про RMSNorm.
        </p>
      </Block>

      <Block kind="real">
        <p>
          В <Code>hidden_states.bin</Code> у нас лежат все 37 снимков residual stream:
          <Code> h_0, h_1, …, h_36</Code>. Размер каждого снимка —{' '}
          {`4 × ${MODEL.hidden_size}`} чисел; полный файл — 37 × 4 × {MODEL.hidden_size} × 4 байта ≈
          1.2 МБ. В разделе про <a href="#logit-lens">logit lens</a> мы будем смотреть
          на <i>top-предсказания</i> модели в каждом из этих 37 состояний — это
          способ заглянуть «куда мысль модели уже доехала к слою ℓ».
        </p>
      </Block>
    </Section>
  );
}
