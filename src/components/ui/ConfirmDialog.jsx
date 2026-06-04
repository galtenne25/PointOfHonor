import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X } from 'lucide-react'
import Button from './Button'

/**
 * ConfirmDialog — a styled, RTL, accessible replacement for window.confirm().
 *
 * Presentational only: it's driven by the ConfirmProvider (see
 * contexts/ConfirmContext). Backdrop click / Esc cancel, Enter confirms, and
 * the primary action is auto-focused. Body scroll is locked while open.
 */
const TONES = {
  danger:  { iconWrap: 'bg-red-100 text-red-600',     confirmVariant: 'danger'  },
  primary: { iconWrap: 'bg-olive-100 text-olive-700', confirmVariant: 'primary' },
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'אישור',
  cancelLabel  = 'ביטול',
  tone = 'danger',
  icon: Icon = AlertTriangle,
  loading = false,
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape')      { e.preventDefault(); onCancel?.() }
      else if (e.key === 'Enter')  { e.preventDefault(); onConfirm?.() }
    }
    document.addEventListener('keydown', onKey)

    // Lock background scroll while the modal is open.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Focus the primary action after the open animation kicks in.
    const t = setTimeout(() => confirmRef.current?.focus(), 60)

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      clearTimeout(t)
    }
  }, [open, onCancel, onConfirm])

  if (!open) return null
  const cfg = TONES[tone] ?? TONES.danger

  return createPortal(
    <div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-[4000] flex items-center justify-center p-5"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        style={{ animation: 'fadeIn 0.18s ease-out' }}
        onClick={loading ? undefined : onCancel}
      />

      {/* Dialog */}
      <div
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6
                   flex flex-col items-center text-center"
        style={{ animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          aria-label="סגירה"
          className="absolute top-3.5 left-3.5 w-8 h-8 rounded-full flex items-center justify-center
                     text-slate-400 hover:bg-slate-100 hover:text-slate-600
                     disabled:opacity-40 transition-colors"
        >
          <X size={18} strokeWidth={2.2} />
        </button>

        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${cfg.iconWrap}`}>
          <Icon size={26} strokeWidth={2} />
        </div>

        <h2 id="confirm-dialog-title" className="text-lg font-bold text-slate-800">
          {title}
        </h2>
        {message && (
          <p className="text-sm text-slate-500 leading-relaxed mt-2 px-1">{message}</p>
        )}

        <div className="flex gap-3 w-full mt-6">
          <Button variant="ghost" rounded="full" fullWidth onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            variant={cfg.confirmVariant}
            rounded="full"
            fullWidth
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
