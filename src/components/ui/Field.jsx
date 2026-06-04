/**
 * Field — shared label + hint + error wrapper for form controls (RTL).
 */
export default function Field({ label, htmlFor, required, hint, error, children }) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-semibold text-slate-700 text-right">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      {children}
      {error
        ? <span className="text-xs text-red-500 text-right">{error}</span>
        : hint && <span className="text-xs text-slate-400 text-right">{hint}</span>}
    </div>
  )
}
