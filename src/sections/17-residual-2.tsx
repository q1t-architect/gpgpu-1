import { Section, Block } from '../components/Section';
import { CodeBlock } from '../components/Code';
import { Formula } from '../components/Formula';

export function Residual2() {
  return (
    <Section
      id="residual-2"
      eyebrow="II · Один transformer-блок"
      title="Второй residual add → выход блока"
      number="16"
    >
      <Block kind="intro">
        <p>
          Финальный шаг блока — прибавить выход MLP к промежуточному состоянию.
          После этого «выход блока ℓ» становится «входом блока ℓ + 1».
        </p>
      </Block>

      <Block kind="formula">
        <Formula tex={`h_{\\ell+1} = h_\\ell^{\\text{mid}} + \\Delta\\text{MLP}`} />
        <p>
          Если развернуть полностью, как одна формула блока:
        </p>
        <Formula tex={`\\boxed{\\;h_{\\ell+1} = h_\\ell + \\text{Attn}_\\ell(\\text{RMSNorm}(h_\\ell)) + \\text{MLP}_\\ell(\\text{RMSNorm}(h_\\ell + \\text{Attn}_\\ell(\\text{RMSNorm}(h_\\ell))))\\;}`} />
      </Block>

      <Block kind="pseudo">
        <CodeBlock lang="python">
{`def transformer_block(h, layer_weights):
    # h : (4, 2048)

    # ── attention подсистема ────────────────────────────
    x = rms_norm(h, layer_weights["norm1_g"])
    Q = (x @ layer_weights["q_proj"]).reshape(4, 16, 128)
    K = (x @ layer_weights["k_proj"]).reshape(4,  2, 128)
    V = (x @ layer_weights["v_proj"]).reshape(4,  2, 128)
    Q = apply_rope(Q)
    K = apply_rope(K)
    scores = compute_scores(Q, K) / np.sqrt(128)
    scores = apply_causal_mask(scores)
    attn = softmax(scores)
    out = combine_with_V(attn, V)            # (4, 16, 128)
    delta_attn = out.reshape(4, 2048) @ layer_weights["o_proj"]
    h = h + delta_attn                        # ← residual add #1

    # ── MLP подсистема ──────────────────────────────────
    x = rms_norm(h, layer_weights["norm2_g"])
    gate = x @ layer_weights["gate_proj"]    # (4, 11008)
    up   = x @ layer_weights["up_proj"]      # (4, 11008)
    delta_mlp = (silu(gate) * up) @ layer_weights["down_proj"]  # (4, 2048)
    h = h + delta_mlp                         # ← residual add #2

    return h`}
        </CodeBlock>
      </Block>

      <Block kind="words">
        <h4>Чем эта функция полезна</h4>
        <p>
          Один transformer-блок принимает на вход тензор residual stream
          формы (4, 2048) и возвращает тензор той же формы (4, 2048). То есть
          блок — это просто <i>функция «h_ℓ → h_ℓ+1»</i>. Можно ставить такие
          блоки в цепочку любой длины и они будут совместимы по форме.
        </p>
        <h4>Что меняется между блоками</h4>
        <p>
          Только обученные веса: norm1_g, q_proj, k_proj, v_proj, o_proj, norm2_g,
          gate_proj, up_proj, down_proj. У нас 36 наборов таких весов — по одному
          на каждый блок. RoPE, причинная маска, формула softmax и прочая
          «механика» — одни и те же на всех слоях.
        </p>
        <h4>Сколько всего параметров в одном блоке</h4>
        <p>
          Округлённо:
        </p>
        <ul>
          <li>2 × RMSNorm: 2 × 2048 = 4 096</li>
          <li>W_Q (2048×2048): 4.2 М</li>
          <li>W_K (2048×256): 524 К</li>
          <li>W_V (2048×256): 524 К</li>
          <li>W_O (2048×2048): 4.2 М</li>
          <li>W_g (2048×11008): 22.5 М</li>
          <li>W_u (2048×11008): 22.5 М</li>
          <li>W_d (11008×2048): 22.5 М</li>
          <li><b>Итого:</b> ~76.9 М параметров на блок</li>
        </ul>
        <p>
          За 36 слоёв это около 2.77 миллиардов. Плюс embedding-матрица (≈311 М),
          плюс финальный RMSNorm (4096) — приходим к ~3.1 миллиарда. Это и есть
          размер модели Qwen-2.5-3B.
        </p>
        <h4>Почему два residual add'а лучше одного</h4>
        <p>
          В оригинальном Transformer'е (2017) тоже было два — после attention
          и после MLP. Можно представлять блок как «два шага медитации»: сначала
          посоветоваться с другими токенами (attention), потом подумать
          самостоятельно (MLP). Каждый раз обновляем состояние, не теряя
          предыдущее.
        </p>
      </Block>

      <Block kind="real">
        <p>
          После этого мы готовы пройти 36 раз через ровно эту функцию (с разными
          весами) и получить финальный residual stream. О том что меняется от
          слоя к слою — следующий раздел.
        </p>
      </Block>
    </Section>
  );
}
