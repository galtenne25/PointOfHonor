import { X } from 'lucide-react'

export default function StatsSheet({ isOpen, onClose, title, items = [], emptyText = 'אין פריטים להצגה' }) {
  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-[2000] bg-black/50" onClick={onClose} />
      <div
        dir="rtl"
        className="fixed bottom-0 left-0 right-0 z-[2001] bg-white rounded-t-2xl
                   max-h-[80vh] flex flex-col"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 flex-shrink-0" />

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200
                       flex items-center justify-center text-slate-500
                       hover:bg-slate-200 transition-colors active:scale-95"
          >
            <X size={16} strokeWidth={2} />
          </button>
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <div className="w-8" />
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <span className="text-4xl">📭</span>
              <p className="text-sm font-medium text-slate-500">{emptyText}</p>
            </div>
          ) : (
            items.map(item => (
              <div
                key={item.id}
                className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm flex gap-3 items-center"
              >
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 flex flex-col items-end gap-0.5">
                  <p className="text-sm font-bold text-slate-800 text-right">{item.name}</p>
                  {item.subtitle && (
                    <p className="text-xs text-slate-400 text-right">{item.subtitle}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
