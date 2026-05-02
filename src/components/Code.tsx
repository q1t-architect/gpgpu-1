import type { ReactNode } from 'react';

interface CodeProps {
  children: ReactNode;
  lang?: string;
}

export function CodeBlock({ children, lang }: CodeProps) {
  return (
    <pre className="codeblock" data-lang={lang}>
      <code>{children}</code>
    </pre>
  );
}

interface InlineCodeProps {
  children: ReactNode;
}

export function Code({ children }: InlineCodeProps) {
  return <code className="code-inline">{children}</code>;
}
