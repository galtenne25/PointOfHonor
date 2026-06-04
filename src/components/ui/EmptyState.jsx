import { AlertTriangle } from 'lucide-react'

/**
 * EmptyState — premium, perfectly-centered empty placeholder (RTL).
 * Pass a Lucide `icon` component, a `title`, optional `message` and `action`.
 */
export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
          <Icon size={28} strokeWidth={1.5} className="text-slate-300" />
        </div>
      )}
      <p className="text-base font-semibold text-slate-600">{title}</p>
      {message && (
        <p className="text-sm text-slate-400 leading-relaxed max-w-xs">{message}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

/**
 * ErrorState — same layout, error styling. `message` typically the caught msg.
 */
export function ErrorState({ title = 'משהו השתבש', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
        <AlertTriangle size={28} strokeWidth={1.6} className="text-red-400" />
      </div>
      <p className="text-base font-semibold text-slate-700">{title}</p>
      {message && (
        <p className="text-sm text-slate-400 leading-relaxed max-w-xs">{message}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
