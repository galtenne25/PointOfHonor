import { createContext, useContext, useState, useCallback, useRef } from 'react'
import ConfirmDialog from '../components/ui/ConfirmDialog'

/**
 * Promise-based confirmation, a drop-in upgrade over window.confirm():
 *
 *   const confirm = useConfirm()
 *   const ok = await confirm({ title, message, confirmLabel: 'מחיקה' })
 *   if (!ok) return
 *
 * One dialog instance lives at the app root, so any page can request a
 * confirmation without rendering its own modal. The promise resolves `true`
 * on confirm and `false` on cancel / Esc / backdrop.
 */
const ConfirmCtx = createContext(null)

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null)   // options object while open, else null
  const resolverRef = useRef(null)

  const settle = useCallback((result) => {
    resolverRef.current?.(result)
    resolverRef.current = null
    setDialog(null)
  }, [])

  const confirm = useCallback((options = {}) => new Promise((resolve) => {
    // If a dialog was somehow already open, resolve it as cancelled first.
    resolverRef.current?.(false)
    resolverRef.current = resolve
    setDialog({
      title:        options.title        ?? 'אישור פעולה',
      message:      options.message      ?? '',
      confirmLabel: options.confirmLabel ?? 'אישור',
      cancelLabel:  options.cancelLabel  ?? 'ביטול',
      tone:         options.tone         ?? 'danger',
      icon:         options.icon,
    })
  }), [])

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={!!dialog}
        title={dialog?.title}
        message={dialog?.message}
        confirmLabel={dialog?.confirmLabel}
        cancelLabel={dialog?.cancelLabel}
        tone={dialog?.tone}
        icon={dialog?.icon}
        onConfirm={() => settle(true)}
        onCancel={() => settle(false)}
      />
    </ConfirmCtx.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmCtx)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}
