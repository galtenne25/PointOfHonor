/**
 * ChipSelect — single-select pill group (RTL).
 * options: [{ value, label }]   value can be string | number | boolean.
 */
export default function ChipSelect({ options, value, onChange, ariaLabel }) {
  return (
    <div className="flex flex-wrap gap-2 justify-end" role="radiogroup" aria-label={ariaLabel}>
      {options.map(opt => {
        const active = value === opt.value
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`px-3.5 py-2 rounded-full text-sm font-medium transition-colors active:scale-95
              ${active
                ? 'bg-olive-700 text-white'
                : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'}`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
