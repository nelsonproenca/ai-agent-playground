import ReactMarkdown from "react-markdown";

interface MarkdownViewProps {
  /** Texto em Markdown (resposta da IA). HTML dentro do texto NÃO é interpretado: aparece como texto. */
  children: string;
  className?: string;
}

/**
 * Mostra a resposta da IA formatada (negrito, listas, títulos, código). O react-markdown não renderiza HTML
 * cru por padrão, então texto vindo da IA ou de visitantes não injeta marcação na página. Links abrem em
 * outra aba sem passar o `opener`.
 */
const MarkdownView = ({ children, className = "" }: MarkdownViewProps) => (
  <div
    className={`prose prose-sm prose-invert max-w-none break-words
      prose-headings:font-mono prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground
      prose-strong:text-foreground prose-code:text-primary prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-secondary prose-pre:border prose-pre:border-border prose-hr:border-border ${className}`}
  >
    <ReactMarkdown
      components={{
        a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
      }}
    >
      {children}
    </ReactMarkdown>
  </div>
);

export default MarkdownView;
