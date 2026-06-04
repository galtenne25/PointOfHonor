import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

/**
 * Centralized, leak-free toast system.
 * - One render root at the app shell (survives route changes).
 * - Identical messages are de-duplicated (no stacking/overlap spam).
 * - Max 3 visible; every auto-dismiss timer is tracked and cleared on
 *   removal and on provider unmount (no memory leaks).
 *
 * Usage:  const toast = useToast(); toast.success('נשמר!');
 */
const ToastCtx = createContext(null)

const ICON  = { success: CheckCircle2, error: AlertTriangle, info: Info }
const STYLE = { success: 'bg-olive-700', error: 'bg-red-600', info: 'bg-slate-800' }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const remove = useCallback(id => {
    setToasts(list => list.filter(t => t.id !== id))
    const tm = timers.current.get(id)
    if (tm) { clearTimeout(tm); timers.current.delete(id) }
  }, [])

  const push = useCallback((type, message, duration = 4000) => {
    if (!message) return
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setToasts(list => {
      const deduped = list.filter(t => t.message !== message)
      return [...deduped, { id, type, message }].slice(-3)
    })
    timers.current.set(id, setTimeout(() => remove(id), duration))
    return id
  }, [remove])

  // Clear every outstanding timer when the provider unmounts.
  useEffect(() => {
    const map = timers.current
    return () => { map.forEach(clearTimeout); map.clear() }
  }, [])

  const api = useRef({
    success: (m, d) => push('success', m, d),
    error:   (m, d) => push('error', m, d),
    info:    (m, d) => push('info', m, d),
  }).current

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed top-20 inset-x-0 z-[3000] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map(t => {
          const Icon = ICON[t.type] ?? Info
          return (
            <div
              key={t.id}
              dir="rtl"
              role="status"
              className={`pointer-events-auto w-full max-w-md flex items-center gap-3
                          text-white px-4 py-3.5 rounded-2xl shadow-2xl ${STYLE[t.type] ?? STYLE.info}`}
              style={{ animation: 'fadeSlideIn 0.25s ease-out' }}
            >
              <Icon size={20} strokeWidth={2.2} className="flex-shrink-0" />
              <p className="flex-1 text-sm font-semibold leading-snug text-right">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                aria-label="סגור הודעה"
                className="text-white/80 hover:text-white transition-colors flex-shrink-0"
              >
                <X size={16} strokeWidth={2.4} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
