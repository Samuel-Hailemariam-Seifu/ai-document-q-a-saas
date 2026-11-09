import { useEffect, useState } from 'react'
import { Icon } from '../common/Icon'

export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      className="fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950"
      role="status"
    >
      <Icon name="cloud" size={16} />
      You&apos;re offline. Some actions will fail until the connection returns.
    </div>
  )
}
