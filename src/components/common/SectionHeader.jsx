export default function SectionHeader({ title, onShowAll, className = '' }) {
  return (
    <div className={`flex items-center ${onShowAll ? 'justify-between' : 'justify-end'} ${className}`}>
      {onShowAll && (
        <button
          onClick={onShowAll}
          className="text-sm text-olive-700 font-medium"
        >
          הצג הכל
        </button>
      )}
      <h2 className="text-base font-bold text-slate-800">{title}</h2>
    </div>
  );
}
