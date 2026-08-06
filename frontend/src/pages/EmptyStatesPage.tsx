import { Link } from 'react-router-dom'
import { Icon } from '../components/common/Icon'
import { PageHeader } from '../components/layout/PageHeader'

const TIPS = [
  'Ask for summaries of long research papers.',
  'Compare key findings across multiple documents.',
  'Generate study guides from your lecture notes.',
]

export function EmptyStatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Empty states"
        description="Reference layouts used when a workspace has no content yet."
      />

      <section className="space-y-3">
        <h2 className="saas-section-title">Documents</h2>
        <div className="saas-card flex flex-col items-center justify-center px-6 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary dark:text-primary-dark">
            <Icon name="upload" size={22} />
          </span>
          <h3 className="mt-4 saas-section-title">No documents yet</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Upload your first PDF, Word file or text document to start extracting insights with AI.
          </p>
          <Link to="/app/documents" className="saas-btn saas-btn-primary mt-5">
            <Icon name="upload" size={16} />
            Start uploading
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="saas-section-title">Chats</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="saas-card flex flex-col items-center justify-center px-6 py-14 text-center lg:col-span-2">
            <span className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary dark:text-primary-dark">
              <Icon name="chat" size={22} />
            </span>
            <h3 className="mt-4 saas-section-title">No conversations yet</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              Ask DocuMind AI anything about your documents to start a conversation.
            </p>
            <Link to="/app/chat" className="saas-btn saas-btn-primary mt-5">
              <Icon name="plus" size={16} />
              New chat
            </Link>
          </div>

          <div className="saas-card p-5">
            <div className="flex items-center gap-2">
              <Icon name="lightbulb" size={16} className="text-primary dark:text-primary-dark" />
              <h3 className="saas-section-title">Quick tips</h3>
            </div>
            <ul className="mt-4 space-y-3">
              {TIPS.map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <Icon name="check" size={16} className="mt-0.5 shrink-0 text-primary dark:text-primary-dark" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
