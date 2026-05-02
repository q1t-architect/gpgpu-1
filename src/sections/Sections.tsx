import { Intro } from './00-intro';
import { Lexicon } from './01-lexicon';
import { Tokenize } from './02-tokenize';
import { TokenIds } from './03-token-ids';
import { Embedding } from './04-embedding';
import { ResidualStream } from './05-residual-stream';
import { RmsNormSection } from './06-rmsnorm';
import { Projections } from './07-projections';
import { GqaSection } from './08-gqa';
import { ReshapeHeads } from './09-reshape-heads';
import { Rope } from './10-rope';
import { AttentionScores } from './11-attention-scores';
import { Softmax } from './12-softmax';
import { AttentionV } from './13-attention-v';
import { OutputProj } from './14-output-proj';
import { RmsNorm2 } from './15-rmsnorm-2';
import { Mlp } from './16-mlp';
import { Residual2 } from './17-residual-2';
import { LayerLoop } from './18-layer-loop';
import { LogitLensSection } from './19-logit-lens';
import { FinalNorm } from './20-final-norm';
import { Unembedding } from './21-unembedding';
import { FinalSoftmax } from './22-final-softmax';
import { Sampling } from './23-sampling';
import { Autoregression } from './24-autoregression';
import { KvCache } from './25-kv-cache';
import { Summary } from './26-summary';
import { Glossary } from './27-glossary';
import { TensorsAppendix } from './28-tensors';

export default function Sections() {
  return (
    <>
      <Intro />
      <Lexicon />
      <Tokenize />
      <TokenIds />
      <Embedding />
      <ResidualStream />
      <RmsNormSection />
      <Projections />
      <GqaSection />
      <ReshapeHeads />
      <Rope />
      <AttentionScores />
      <Softmax />
      <AttentionV />
      <OutputProj />
      <RmsNorm2 />
      <Mlp />
      <Residual2 />
      <LayerLoop />
      <LogitLensSection />
      <FinalNorm />
      <Unembedding />
      <FinalSoftmax />
      <Sampling />
      <Autoregression />
      <KvCache />
      <Summary />
      <Glossary />
      <TensorsAppendix />
    </>
  );
}
