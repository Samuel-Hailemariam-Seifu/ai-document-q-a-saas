import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

const components: Components = {
  h1: ({ children }) => <h1 className="saas-md-h1">{children}</h1>,
  h2: ({ children }) => <h2 className="saas-md-h2">{children}</h2>,
  h3: ({ children }) => <h3 className="saas-md-h3">{children}</h3>,
  h4: ({ children }) => <h4 className="saas-md-h4">{children}</h4>,
  p: ({ children }) => <p className="saas-md-p">{children}</p>,
  ul: ({ children }) => <ul className="saas-md-ul">{children}</ul>,
  ol: ({ children }) => <ol className="saas-md-ol">{children}</ol>,
  li: ({ children }) => <li className="saas-md-li">{children}</li>,
  a: ({ href, children }) => (
    <a href={href} className="saas-md-a" target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="saas-md-strong">{children}</strong>,
  em: ({ children }) => <em className="saas-md-em">{children}</em>,
  blockquote: ({ children }) => <blockquote className="saas-md-blockquote">{children}</blockquote>,
  hr: () => <hr className="saas-md-hr" />,
  table: ({ children }) => (
    <div className="saas-md-table-wrap">
      <table className="saas-md-table">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="saas-md-thead">{children}</thead>,
  th: ({ children }) => <th className="saas-md-th">{children}</th>,
  td: ({ children }) => <td className="saas-md-td">{children}</td>,
  code: ({ className, children }) => {
    const isBlock = Boolean(className?.includes('language-'))
    if (isBlock) {
      return <code className={className}>{children}</code>
    }
    return <code className="saas-md-code-inline">{children}</code>
  },
  pre: ({ children }) => <pre className="saas-md-pre">{children}</pre>,
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="saas-md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
