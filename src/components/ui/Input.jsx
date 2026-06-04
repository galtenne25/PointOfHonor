import Field from './Field'

const BASE =
  'w-full text-right bg-slate-50 border rounded-2xl px-4 py-3 text-sm ' +
  'text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all'

/**
 * Input — standardized text field. Renders inside a Field (label/hint/error).
 * Pass `label`, `error`, `hint` for the wrapper; any other prop (value,
 * onChange, onBlur, name, type, placeholder…) is forwarded to <input>.
 */
export default function Input({ label, error, hint, required, id, className = '', ...props }) {
  const inputId = id || props.name
  return (
    <Field label={label} htmlFor={inputId} required={required} hint={hint} error={error}>
      <input
        id={inputId}
        dir="rtl"
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
