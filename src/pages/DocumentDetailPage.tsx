import { Link, useParams } from 'react-router-dom'

export function DocumentDetailPage() {
  const { documentId } = useParams()

  return (
    <div className="min-h-screen bg-background-light font-display text-slate-900 dark:bg-background-dark dark:text-slate-100">
      <div className="relative flex w-full flex-col overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">
          <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 bg-white px-6 py-3 backdrop-blur-md dark:border-primary/20 dark:bg-background-dark/50 lg:px-40">
            <div className="flex items-center gap-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
                <span className="material-symbols-outlined">description</span>
              </div>
              <h2 className="text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
                DocuMind AI
              </h2>
            </div>
            <div className="flex gap-2">
              {[
                ['download', 'Download'],
                ['share', 'Share'],
                ['more_horiz', 'More'],
              ].map(([icon, label]) => (
                <button
                  key={icon}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors hover:bg-primary/30 dark:bg-primary/20 dark:text-white"
                  type="button"
                  aria-label={label}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {icon}
                  </span>
                </button>
              ))}
            </div>
          </header>

          <main className="flex-1 px-6 py-8 lg:px-40">
            <div className="mx-auto max-w-5xl space-y-6">
              <nav className="flex flex-wrap items-center gap-2 text-sm">
                <Link
                  className="font-medium text-slate-500 hover:text-primary dark:text-primary/70"
                  to="/app/empty"
                >
                  My Documents
                </Link>
                <span className="material-symbols-outlined text-sm text-slate-400">
                  chevron_right
                </span>
                <a
                  className="font-medium text-slate-500 hover:text-primary dark:text-primary/70"
                  href="#"
                >
                  Project Alpha
                </a>
                <span className="material-symbols-outlined text-sm text-slate-400">
                  chevron_right
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  technical_specs_v2.pdf
                </span>
              </nav>

              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    technical_specs_v2.pdf
                  </h1>
                  <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-primary/60">
                    <span className="material-symbols-outlined text-xs">
                      calendar_today
                    </span>
                    Uploaded on Oct 24, 2023 • 2.4 MB • id: {documentId ?? '—'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    to="/app/chat"
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      psychology
                    </span>
                    Ask AI
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-primary/20 dark:bg-primary/10">
                  <p className="text-sm font-medium text-slate-500 dark:text-primary/70">
                    Status
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      Processed
                    </p>
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-500">
                      <span className="material-symbols-outlined text-xs">
                        check_circle
                      </span>
                      Healthy
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-primary/20 dark:bg-primary/10">
                  <p className="text-sm font-medium text-slate-500 dark:text-primary/70">
                    Chunks
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      128
                    </p>
                    <span className="text-sm font-medium text-emerald-500">
                      +12 new
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-primary/20 dark:bg-primary/10">
                  <p className="text-sm font-medium text-slate-500 dark:text-primary/70">
                    AI Confidence
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      98.4%
                    </p>
                    <span className="text-sm font-medium text-emerald-500">
                      +0.2%
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-b border-slate-200 dark:border-primary/20">
                <div className="flex gap-8 overflow-x-auto">
                  <a
                    className="flex items-center gap-2 border-b-2 border-primary pb-3 pt-4 text-sm font-bold text-primary"
                    href="#"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      visibility
                    </span>
                    Preview
                  </a>
                  {[
                    ['database', 'Metadata'],
                    ['auto_awesome', 'AI Insights'],
                  ].map(([icon, label]) => (
                    <a
                      key={label}
                      className="flex items-center gap-2 border-b-2 border-transparent pb-3 pt-4 text-sm font-bold text-slate-500 transition-colors hover:text-primary dark:text-primary/60"
                      href="#"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {icon}
                      </span>
                      {label}
                    </a>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-primary/20 dark:bg-primary/5">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-primary/20 dark:bg-primary/10">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-primary/70">
                        Extracted Chunks
                      </span>
                      <div className="flex gap-2">
                        <button
                          className="material-symbols-outlined text-sm text-slate-400 transition-colors hover:text-primary"
                          type="button"
                        >
                          search
                        </button>
                        <button
                          className="material-symbols-outlined text-sm text-slate-400 transition-colors hover:text-primary"
                          type="button"
                        >
                          settings
                        </button>
                      </div>
                    </div>

                    <div className="custom-scrollbar max-h-[600px] space-y-6 overflow-y-auto p-6">
                      {[
                        [
                          'CHUNK #001',
                          '1. System Architecture Overview',
                          'The Project Alpha infrastructure is designed to be a distributed, microservices-based architecture built on top of Kubernetes. The core system components include a highly available API gateway, authentication service (OAuth 2.0), and a persistent storage layer managed via PostgreSQL clusters with automated failover mechanisms.',
                        ],
                        [
                          'CHUNK #002',
                          '2. Data Ingestion Pipeline',
                          'Incoming telemetry data is processed through a Kafka-based message queue system. The stream processing layer utilizes Apache Flink for real-time analytics and data enrichment. Each data packet is validated against the Protobuf schema before being committed to the cold storage S3 bucket and the hot storage Redis cache.',
                        ],
                        [
                          'CHUNK #003',
                          '3. Security and Compliance',
                          'All data at rest is encrypted using AES-256 standards, with keys managed by AWS KMS. TLS 1.3 is enforced for all data in transit. The system maintains SOC2 Type II compliance through automated monitoring and periodic third-party security audits of the IAM policies and network security groups.',
                        ],
                      ].map(([tag, title, body]) => (
                        <div key={tag} className="group space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                              {tag}
                            </span>
                            <div className="h-px flex-1 bg-slate-100 dark:bg-primary/10" />
                          </div>
                          <div className="rounded-lg border border-transparent bg-slate-50 p-4 transition-all group-hover:border-primary/30 dark:bg-primary/5">
                            <h3 className="mb-2 font-bold text-slate-900 dark:text-white">
                              {title}
                            </h3>
                            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                              {body}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-primary/20 dark:bg-primary/10">
                    <h4 className="mb-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                      <span className="material-symbols-outlined text-primary">
                        info
                      </span>
                      File Details
                    </h4>
                    <div className="space-y-4 text-sm">
                      {[
                        ['Type', 'PDF Document'],
                        ['Size', '2,412 KB'],
                        ['Pages', '14'],
                        ['Author', 'Sarah Jenkins'],
                        ['Language', 'English (EN-US)'],
                      ].map(([k, v], idx, arr) => (
                        <div
                          key={k}
                          className={[
                            'flex justify-between py-2',
                            idx < arr.length - 1
                              ? 'border-b border-slate-100 dark:border-primary/10'
                              : '',
                          ].join(' ')}
                        >
                          <span className="text-slate-500 dark:text-primary/60">
                            {k}
                          </span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {v}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-primary/20 bg-primary/10 p-6">
                    <h4 className="mb-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                      <span className="material-symbols-outlined text-primary">
                        label
                      </span>
                      Detected Entities
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Kubernetes',
                        'AWS S3',
                        'OAuth 2.0',
                        'PostgreSQL',
                        'SOC2',
                        'Kafka',
                      ].map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-primary/30 bg-white/10 px-3 py-1 text-xs font-bold text-primary"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-primary/20 dark:bg-primary/5">
                    <h4 className="mb-4 font-bold text-slate-900 dark:text-white">
                      Processing History
                    </h4>
                    <div className="space-y-4">
                      {[
                        ['Analysis Complete', 'Oct 24, 14:32'],
                        ['Chunking Finished', 'Oct 24, 14:31'],
                        ['File Uploaded', 'Oct 24, 14:30'],
                      ].map(([title, time], idx) => (
                        <div key={title} className="flex gap-4">
                          <div className="relative">
                            <div className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                            {idx < 2 ? (
                              <div className="absolute left-0.5 top-4 h-full w-px bg-slate-200 dark:bg-primary/20" />
                            ) : null}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-primary/60">
                              {time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

