export default function FilterChip({ label, emoji, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
        ${active
          ? 'bg-olive-700 text-white'
          : 'bg-white text-slate-700 border border-slate-200 shadow-sm'
        }`}
    >
      {emoji && <span className="text-xs">{emoji}</span>}
      <span>{label}</span>
    </button>
  )
}
