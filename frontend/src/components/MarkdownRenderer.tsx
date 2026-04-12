import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';

interface Props {
  content: string;
  className?: string;
}

/**
 * Renders Markdown content inline within resume templates.
 * Supports line breaks, bold, italic, links, lists, etc.
 */
export default function MarkdownRenderer({ content, className }: Props) {
  if (!content) return null;

  // react-markdown v10 removed className prop — wrap in a div instead
  const cls = className ? `md-content ${className}` : 'md-content';
  return (
    <div className={cls}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Keep paragraphs inline-friendly for resume context
          p: ({ children }) => <p style={{ margin: '0 0 0.4em 0' }}>{children}</p>,
          // Headings
          h1: ({ children }) => <h3 style={{ fontSize: '1.1em', fontWeight: 600, margin: '0.4em 0 0.2em' }}>{children}</h3>,
          h2: ({ children }) => <h4 style={{ fontSize: '1em', fontWeight: 600, margin: '0.3em 0 0.2em' }}>{children}</h4>,
          h3: ({ children }) => <h5 style={{ fontSize: '0.95em', fontWeight: 600, margin: '0.2em 0 0.1em' }}>{children}</h5>,
          // Style links — color & underline handled by CSS (.resume-page a)
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          // Lists
          ul: ({ children }) => <ul style={{ paddingLeft: '1.2em', margin: '0.2em 0', listStyle: 'disc' }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ paddingLeft: '1.4em', margin: '0.2em 0', listStyle: 'decimal' }}>{children}</ol>,
          li: ({ children }) => <li style={{ marginBottom: '0.1em', listStylePosition: 'outside' }}>{children}</li>,
          // Code
          code: ({ children }) => (
            <code style={{ background: 'rgba(0,0,0,0.06)', padding: '0.1em 0.3em', borderRadius: '3px', fontSize: '0.9em' }}>
              {children}
            </code>
          ),
          // Blockquote
          blockquote: ({ children }) => (
            <blockquote style={{ margin: '0.3em 0', paddingLeft: '0.8em', borderLeft: '3px solid rgba(0,0,0,0.15)', color: 'inherit', opacity: 0.85 }}>
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
