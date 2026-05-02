import type { ReactNode } from 'react';

interface SectionProps {
  id: string;
  number?: string;
  eyebrow?: string;
  title: string;
  children: ReactNode;
}

export function Section({ id, number, eyebrow, title, children }: SectionProps) {
  return (
    <section id={id} className="section">
      <header className="section__header">
        {eyebrow ? <div className="section__eyebrow">{eyebrow}</div> : null}
        <h2 className="section__title">
          {number ? <span className="section__number">{number}.</span> : null}
          {title}
        </h2>
      </header>
      <div className="section__body">{children}</div>
    </section>
  );
}

interface BlockProps {
  kind: 'intro' | 'formula' | 'pseudo' | 'words' | 'demo' | 'real' | 'callout' | 'note';
  label?: string;
  children: ReactNode;
}

const kindLabels: Record<BlockProps['kind'], string> = {
  intro: '0 · Что это и зачем',
  formula: '1 · Сырая формула',
  pseudo: '2 · Псевдокод',
  words: '3 · Подробное словесное объяснение',
  demo: '4 · Интерактивная визуализация',
  real: '5 · На наших числах',
  callout: 'Важно',
  note: 'Заметка',
};

export function Block({ kind, label, children }: BlockProps) {
  return (
    <div className={`block block--${kind}`}>
      <div className="block__label">{label ?? kindLabels[kind]}</div>
      <div className="block__body">{children}</div>
    </div>
  );
}
