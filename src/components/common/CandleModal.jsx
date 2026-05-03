import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function CandleModal({ isOpen, onClose, siteName }) {
  const [name,       setName      ] = useState('')
  const [dedication, setDedication] = useState('')
  const [submitted,  setSubmitted ] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName('')
      setDedication('')
      setSubmitted(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  function handleSubmit() {
    if (!name.trim()) return
    setSubmitted(true)
  }

  return (
    <>
      <div className="fixed inset-0 z-[2000] bg-black/50" onClick={onClose} />

      <div
        dir="rtl"
        className="fixed bottom-0 left-0 right-0 z-[2001] bg-white rounded-t-2xl px-5 pt-5 pb-10"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />

        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} strokeWidth={2} />
        </button>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="text-5xl" style={{ animation: 'flicker 1.5s ease-in-out infinite' }}>
              🕯️
            </span>
            <h2 className="text-lg font-bold text-slate-800">הנר הודלק</h2>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
              הנר שהדלקת{siteName ? ` לזכר ${siteName}` : ''} יישאר דלוק לנצח בלב הקהילה
            </p>
            {(name || dedication) && (
              <div className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-right">
                {name && <p className="text-xs font-bold text-slate-700">{name}</p>}
                {dedication && <p className="text-xs text-slate-500 mt-1 leading-relaxed italic">"{dedication}"</p>}
              </div>
            )}
            <button
              onClick={onClose}
              className="mt-2 px-8 py-2.5 bg-olive-700 text-white text-sm font-semibold rounded-full
                         active:scale-95 transition-transform"
            >
              סגור
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-1 mb-5 text-center">
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 mb-1">
                {['flicker 1.8s ease-in-out infinite', 'flicker 2.2s ease-in-out infinite 0.3s', 'flicker 2s ease-in-out infinite 0.6s'].map((anim, i) => (
                  <span key={i} className="text-3xl" style={{ animation: anim }}>🕯️</span>
                ))}
              </div>
              <p className="text-xs font-semibold text-amber-600">1,247 נרות הודלקו</p>
              <h2 className="text-base font-bold text-slate-800 mt-2">הדלקת נר לזכרם</h2>
              {siteName && <p className="text-xs text-slate-500">{siteName}</p>}
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">שמך</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="הכנס שמך..."
                  dir="rtl"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5
                             text-sm text-slate-700 placeholder-slate-400 outline-none
                             focus:border-olive-700 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">הקדשה</label>
                <textarea
                  value={dedication}
                  onChange={e => setDedication(e.target.value.slice(0, 200))}
                  placeholder="כתוב מסר לזכרם..."
                  dir="rtl"
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5
                             text-sm text-slate-700 placeholder-slate-400 outline-none resize-none
                             focus:border-olive-700 transition-colors"
                />
                <p className="text-xs text-slate-400 text-left mt-0.5">{dedication.length}/200</p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!name.trim()}
                className="w-full py-3 bg-olive-700 text-white text-sm font-semibold rounded-full
                           disabled:opacity-40 disabled:cursor-not-allowed
                           hover:bg-olive-800 active:scale-95 transition-all duration-150 mt-1"
              >
                הדלק נר
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
