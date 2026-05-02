import { useState } from 'react';

const HEAD_DIM = 128;
const BASE = 10000;

function freq(k: number, headDim = HEAD_DIM, base = BASE): number {
  // θ_k = base^(-2k/d). k — индекс пары 0..(d/2-1)
  return Math.pow(base, (-2 * k) / headDim);
}

const PAIR_INDICES = [0, 1, 2, 4, 8, 16, 32, 63]; // редкие на низких k, плотные на высоких

export function RopeClock() {
  const [position, setPosition] = useState(2);

  return (
    <div className="widget" aria-label="RoPE: 8 циферблатов на разных частотах">
      <div className="widget__title">
        Циферблаты RoPE: 8 пар из 64 на одной голове, разные частоты
      </div>
      <div className="widget__slider-label">
        <span>position m (позиция токена)</span>
        <span>m = {position}</span>
      </div>
      <input
        type="range"
        min={0}
        max={3}
        step={1}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label="Позиция токена для RoPE"
      />

      <div className="rope">
        {PAIR_INDICES.map((k) => {
          const theta_k = freq(k);
          const angle = position * theta_k; // в радианах
          // длина вектора для визуала — фиксируем 1
          const r = 18;
          const x = Math.cos(angle) * r;
          const y = -Math.sin(angle) * r; // -sin потому что SVG Y вниз
          // период: сколько позиций нужно чтобы повернуться на 2π
          const period = (2 * Math.PI) / theta_k;
          return (
            <div className="rope__clock" key={k}>
              <svg className="rope__svg" width="46" height="46" viewBox="-23 -23 46 46">
                <circle className="face" cx="0" cy="0" r="20" />
                <circle cx="0" cy="0" r="1.5" fill="var(--fg-muted)" />
                <line className="hand" x1="0" y1="0" x2={x} y2={y} />
                {/* tick at 0° */}
                <line x1="20" y1="0" x2="22" y2="0" stroke="var(--fg-muted)" strokeWidth="1" />
              </svg>
              <div className="rope__label">
                k = {k}
                <span className="rope__freq">
                  θ ≈ {theta_k.toExponential(1)}
                  <br />
                  T ≈ {period.toExponential(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="widget__hint">
        Каждый циферблат — одна пара координат (q_2k, q_2k+1) в head-векторе.
        Слева направо k растёт: чем больше k, тем меньше частота θ_k и тем медленнее
        крутится стрелка. Двигай позицию m — у пары k = 0 стрелка прыгает
        большими шагами, у пары k = 63 практически не сдвигается. Период T — это
        число позиций, за которое пара совершает полный оборот.
      </div>
    </div>
  );
}
