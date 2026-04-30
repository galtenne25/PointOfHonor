interface FilterChipProps {
  label: string
  emoji?: string
  isActive: boolean
  onClick: () => void
}

export default function FilterChip({ label, emoji, isActive, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-shrink-0 flex items-center gap-1
        text-xs font-semibold px-3.5 py-1.5 rounded-full
        border transition-all duration-150 whitespace-nowrap
        ${
          isActive
            ? 'bg-olive-600 border-olive-600 text-white shadow-sm'
            : 'bg-white border-slate-200 text-slate-600 hover:border-olive-300 hover:text-olive-700'
        }
      `}
    >
      {emoji && <span className="text-sm leading-none">{emoji}</span>}
      {label}
    </button>
  )
}
