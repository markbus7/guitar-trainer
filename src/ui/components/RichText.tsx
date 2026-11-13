import { Fragment } from 'react';

/** Paragraphs separated by blank lines; **bold** is supported. */
export function RichText({ text, className }: { text: string; className?: string }) {
  const paras = text.split(/\n\s*\n/);
  return (
    <div className={`rich ${className ?? ''}`}>
      {paras.map((p, i) => (
        <p key={i}>{inline(p)}</p>
      ))}
    </div>
  );
}

function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
  );
}
