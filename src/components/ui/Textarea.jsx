import Field from './Field'

const BASE =
  'w-full text-right bg-slate-50 border rounded-2xl px-4 py-3 text-sm resize-none ' +
  'text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all'

/**
 * Textarea — standardized multi-line field, same look/feel as Input.
 */
export default function Textarea({ label, error, hint, required, id, rows = 5, className = '', ...props }) {
  const fieldId = id || props.name
  return (
    <Field label={label} htmlFor={fieldId} required={required} hint={hint} error={error}>
      <textarea
        id={fieldId}
        dir="rtl"
        rows={rows}
        aria-invalid={!!error}
        className={`${BASE} ${
          error
            ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
            : 'border-slate-200 focus:ring-olive-300 focus:border-olive-500'
        } ${className}`}
        {...props}
      />
    </Field>
  )
}
