import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface FormulaProps {
  tex: string;
  display?: boolean;
  className?: string;
}

export function Formula({ tex, display = true, className }: FormulaProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    katex.render(tex, ref.current, {
      displayMode: display,
      throwOnError: false,
      strict: 'ignore',
      trust: false,
      output: 'html',
    });
  }, [tex, display]);
  return (
    <div
      ref={ref}
      className={`formula${display ? ' formula--display' : ' formula--inline'}${className ? ' ' + className : ''}`}
    />
  );
}

interface InlineFormulaProps {
  tex: string;
}

export function InlineFormula({ tex }: InlineFormulaProps) {
  return <Formula tex={tex} display={false} />;
}
