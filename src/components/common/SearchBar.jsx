import { Search, SlidersHorizontal } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder = 'חיפוש...', onFilterClick, filterCount = 0 }) {
  return (
    <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2.5">
      <button
        onClick={onFilterClick}
        className="relative flex-shrink-0 focus:outline-none"
        aria-label="פתח סינון"
      >
        <SlidersHorizontal size={16} className={onFilterClick ? 'text-olive-700' : 'text-slate-400'} />
        {filterCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-olive-700 text-white
                           text-[8px] font-bold rounded-full flex items-center justify-center">
            {filterCount}
          </span>
        )}
      </button>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        dir="rtl"
        className="flex-1 bg-transparent text-sm text-right text-slate-700 placeholder-slate-400 outline-none"
      />
      <Search size={16} className="text-slate-400 flex-shrink-0" />
    </div>
  );
}
