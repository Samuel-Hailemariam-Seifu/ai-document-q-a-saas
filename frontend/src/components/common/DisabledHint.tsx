import type { ReactNode } from 'react'

/** Wraps a control so a disabled reason stays available via title/aria when pointer-events are off. */
export function DisabledHint({
  disabled,
  reason,
  children,
  className,
}: {
  disabled: boolean
  reason: string
  children: ReactNode
  className?: string
}) {
  if (!disabled) return <>{children}</>
  return (
    <span className={['inline-flex', className].filter(Boolean).join(' ')} title={reason}>
      {children}
    </span>
  )
}
