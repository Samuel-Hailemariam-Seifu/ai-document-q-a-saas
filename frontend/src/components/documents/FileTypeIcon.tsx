/** Small coloured file-type chip (PDF / DOCX / TXT) used in document lists. */
function extOf(name: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name)
  return (m?.[1] ?? 'file').toLowerCase()
}

const STYLES: Record<string, string> = {
  pdf: 'bg-rose-50 text-rose-600 ring-rose-600/15 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20',
  docx: 'bg-sky-50 text-sky-600 ring-sky-600/15 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/20',
  doc: 'bg-sky-50 text-sky-600 ring-sky-600/15 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/20',
  txt: 'bg-zinc-100 text-zinc-600 ring-zinc-600/10 dark:bg-white/5 dark:text-zinc-300 dark:ring-white/10',
}

export function FileTypeIcon({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
  const ext = extOf(name)
  return (
    <span
      className={[
        'inline-flex shrink-0 items-center justify-center rounded-md font-mono font-semibold uppercase ring-1 ring-inset',
        size === 'lg' ? 'h-11 w-10 text-[10px]' : 'size-8 text-[9px]',
        STYLES[ext] ?? STYLES.txt,
      ].join(' ')}
      aria-hidden="true"
    >
      {ext.slice(0, 4)}
    </span>
  )
}
