import { Section, Block } from '../components/Section';
import { Code, CodeBlock } from '../components/Code';
import { VocabScroll } from '../widgets/VocabScroll';
import { MODEL } from '../data/manifest-types';

export function TokenIds() {
  return (
    <Section id="token-ids" eyebrow="I · Вход" title="Токены → числа (вокабуляр)" number="2">
      <Block kind="intro">
        <p>
          После BPE-нарезки у нас 4 текстовых кусочка. Но модель не работает с
          текстом — только с числами. Поэтому у каждого токена есть жёстко
          закреплённый <b>ID</b>: целое число — его позиция в <b>вокабуляре</b>{' '}
          (vocabulary, словаре). Размер вокабуляра у Qwen-2.5-3B — <b>{MODEL.vocab_size.toLocaleString('ru-RU')}</b>.
        </p>
      </Block>

      <Block kind="formula">
        <p>
          Вокабуляр — это просто упорядоченный список (массив) длины V (вэ) ={' '}
          {MODEL.vocab_size.toLocaleString('ru-RU')}, где i-я ячейка хранит i-й токен.
          Поиск ID — это инвертированная таблица:
        </p>
        <CodeBlock lang="pseudo">
{`vocab : list of size V = 151_936
       [token_for_id_0, token_for_id_1, ..., token_for_id_(V-1)]

inv_vocab : dict { token_string → id }   # ровно те же данные, обратный индекс

id_of(token_string) = inv_vocab[token_string]`}
        </CodeBlock>
        <p>
          В реальности это даже не <Code>dict</Code>, а заранее построенное Trie
          с merge-правилами BPE. Но логически — обычный поиск по таблице.
        </p>
      </Block>

      <Block kind="pseudo">
        <CodeBlock lang="python">
{`tok = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-3B")

ids = []
for piece in tok.tokenize("Reaching ATH ("):
    ids.append(tok.convert_tokens_to_ids(piece))

# ids → [693, 11829, 87089, 320]`}
        </CodeBlock>
      </Block>

      <Block kind="words">
        <h4>Что значит «ID токена»</h4>
        <p>
          Это просто целое число — индекс. Никакой внутренней семантики у самого
          числа нет. ID 693 не «больше» или «меньше» ID 320 в смысле языка — это
          просто разные адреса. Соседние ID не обязательно похожи: 693 это{' '}
          <Code>"Re"</Code>, 692 может быть, скажем, <Code>"yet"</Code>, а 694 —{' '}
          <Code>"my"</Code>. Порядок в словаре определялся частотностью при сборке
          BPE, а потом был зафиксирован.
        </p>
        <h4>Почему именно {MODEL.vocab_size.toLocaleString('ru-RU')}</h4>
        <p>
          Это компромисс. У GPT-2 был словарь 50 257. У Qwen, который должен
          одинаково хорошо работать на английском, китайском, японском и коде,
          словарь больше — нужно покрыть символы CJK (китайские/японские/корейские
          иероглифы). 151 936 ≈ 152 000, и это число выбрано так, чтобы быть{' '}
          <i>кратным 128</i> для эффективной работы матричного умножения на
          современных GPU.
        </p>
        <h4>Что произошло бы, если бы мы взяли неправильный ID</h4>
        <p>
          Если ID указывает не на тот токен — следующий шаг (embedding lookup)
          вытащит совершенно другой вектор и весь forward-pass поедет в другую
          сторону. Это место абсолютно жёсткое: ID — однозначная ссылка.
        </p>
      </Block>

      <Block kind="demo">
        <VocabScroll />
      </Block>

      <Block kind="real">
        <p>
          На нашем промпте 4 токена получают 4 ID:
        </p>
        <table>
          <thead>
            <tr><th>Позиция</th><th>Токен</th><th>ID</th></tr>
          </thead>
          <tbody>
            <tr><td>0</td><td><code>Re</code></td><td><b>693</b></td></tr>
            <tr><td>1</td><td><code>aching</code></td><td><b>11 829</b></td></tr>
            <tr><td>2</td><td><code>·ATH</code></td><td><b>87 089</b></td></tr>
            <tr><td>3</td><td><code>·(</code></td><td><b>320</b></td></tr>
          </tbody>
        </table>
        <p>
          Эти 4 числа — единственное, с чем модель работает дальше.
        </p>
      </Block>
    </Section>
  );
}
