import { INPUT_TOKENS, PROMPT } from '../data/manifest-types';

export function TokenizerView() {
  return (
    <div className="widget" aria-label="BPE-разрез промпта">
      <div className="widget__title">Как Qwen режет нашу строку «{PROMPT}»</div>
      <div className="tokenizer">
        {INPUT_TOKENS.map((tok) => (
          <div className="tokenizer__token" key={tok.position}>
            <span className="tokenizer__pos">pos {tok.position}</span>
            <span className="tokenizer__text">{visualize(tok.decoded)}</span>
            <span className="tokenizer__id">id {tok.id.toLocaleString('ru-RU')}</span>
          </div>
        ))}
      </div>
      <div className="widget__hint">
        Обрати внимание: «Reaching» режется на <code>Re</code> + <code>aching</code>,
        а <code>·ATH</code> и <code>·(</code> остаются целыми (точка «·» обозначает
        пробел перед токеном — так BPE отличает « ATH» от «ATH»). Это решение принял
        не человек, а статистика обучения: тренировочные тексты Qwen чаще встречали
        «·ATH» как одно целое, чем «Reaching».
      </div>
    </div>
  );
}

function visualize(text: string): string {
  // visualise leading space using a middle dot to make boundaries obvious
  return text.replace(/^ /, '·');
}
