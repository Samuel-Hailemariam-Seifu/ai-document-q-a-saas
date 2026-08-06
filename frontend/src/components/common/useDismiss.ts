import { useEffect, useRef } from 'react'

/** Closes a popover when clicking outside of it or pressing Escape. */
export function useDismiss<T extends HTMLElement = HTMLDivElement>(open: boolean, onDismiss: () => void) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: MouseEvent) => {
      const el = ref.current
      if (el && e.target instanceof Node && !el.contains(e.target)) onDismiss()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
    }

    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onDismiss])

  return ref
}
