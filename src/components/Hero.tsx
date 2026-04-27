import { MODEL, PROMPT } from '../data/manifest-types';

export function Hero() {
  return (
    <header className="hero">
      <div className="hero__eyebrow">Forward pass · подробный разбор</div>
      <h1 className="hero__title">
        Что происходит внутри Qwen-2.5-3B,
        <br />
        когда мы подаём ему «{PROMPT}»
      </h1>
      <p className="hero__lede">
        Каждая операция, каждая формула, каждый винтик: токенизация, эмбеддинги, RMSNorm,
        Q/K/V-проекции, RoPE, attention, softmax, MLP, residual stream. С реальными
        числами модели и интерактивом — чтобы потом из этого можно было собирать
        правдивую визуализацию.
      </p>
      <div className="hero__meta">
        <span>
          модель <b>{MODEL.num_hidden_layers}</b> слоёв
        </span>
        <span>
          hidden <b>{MODEL.hidden_size}</b>
        </span>
        <span>
          голов Q <b>{MODEL.num_attention_heads}</b> · KV <b>{MODEL.num_key_value_heads}</b>
        </span>
        <span>
          head_dim <b>{MODEL.head_dim}</b>
        </span>
        <span>
          вокабуляр <b>{MODEL.vocab_size.toLocaleString('ru-RU')}</b>
        </span>
      </div>
    </header>
  );
}
