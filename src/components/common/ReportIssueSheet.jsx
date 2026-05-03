import { useState, useEffect } from 'react'
import { X, MapPin, PenLine, Image, Info, Lock, MoreHorizontal, Send, Check } from 'lucide-react'

const ISSUE_TYPES = [
  { id: 'location', label: 'מיקום שגוי',      Icon: MapPin         },
  { id: 'text',     label: 'טעות בטקסט',      Icon: PenLine        },
  { id: 'photo',    label: 'תמונה לא הולמת',  Icon: Image          },
  { id: 'missing',  label: 'מידע חסר',        Icon: Info           },
  { id: 'closed',   label: 'האתר סגור',        Icon: Lock           },
  { id: 'other',    label: 'אחר',             Icon: MoreHorizontal },
]

export default function ReportIssueSheet({ isOpen, onClose, siteName }) {
  const [selected,  setSelected ] = useState(null)
  const [text,      setText     ] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSelected(null)
      setText('')
      setSubmitted(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const selectedLabel = ISSUE_TYPES.find(i => i.id === selected)?.label

  return (
    <>
      <div className="fixed inset-0 z-[2000] bg-black/45" onClick={onClose} />

      <div
        dir="rtl"
        className="fixed bottom-0 left-0 right-0 z-[2001] bg-white rounded-t-2xl
                   max-h-[88vh] flex flex-col"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-0 flex-shrink-0" />

        {!submitted ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-shrink-0">
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200
                           flex items-center justify-center text-slate-500
                           hover:bg-slate-200 transition-colors active:scale-95"
              >
                <X size={16} strokeWidth={2} />
              </button>
              <div className="text-center">
                <h2 className="text-base font-bold text-slate-800">דיווח / עדכון פרטים</h2>
                {siteName && <p className="text-xs text-slate-400 mt-0.5">{siteName}</p>}
              </div>
              <div className="w-8" />
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4">
              {/* Issue type grid */}
              <div className="mb-5">
                <h3 className="text-sm font-bold text-slate-800 mb-3 text-right">סוג הבעיה</h3>
                <div className="grid grid-cols-3 gap-2">
                  {ISSUE_TYPES.map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      onClick={() => setSelected(id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-[1.5px]
                                  transition-all duration-150 active:scale-95
                        ${selected === id
                          ? 'border-olive-700 bg-olive-50 text-olive-700'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                    >
                      <Icon size={16} strokeWidth={2} />
                      <span className={`text-[11px] text-center leading-snug
                        ${selected === id ? 'font-bold' : 'font-medium'}`}>
                        {label}
                      </span>
                      {selected === id && (
                        <div className="w-4 h-4 rounded-full bg-olive-700 flex items-center justify-center">
                          <Check size={10} strokeWidth={3} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-800 mb-2 text-right">
                  תיאור הבעיה
                  <span className="text-xs font-normal text-slate-400 mr-2">(אופציונלי)</span>
                </h3>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value.slice(0, 300))}
                  placeholder="תאר את הטעות או העדכון הנדרש..."
                  dir="rtl"
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5
                             text-sm text-slate-700 placeholder-slate-400 outline-none resize-none
                             focus:border-olive-700 transition-colors leading-relaxed"
                />
                <div className="flex justify-between mt-1">
                  <span className={`text-xs ${text.length > 250 ? 'text-orange-500' : 'text-slate-400'}`}>
                    {text.length}/300
                  </span>
                  <span className="text-xs text-slate-400">הפרטים יעזרו לנו לטפל מהר יותר</span>
                </div>
              </div>

              {/* Privacy banner */}
              <div className="flex gap-2 items-start bg-sky-50 border border-sky-200 rounded-xl px-3 py-2.5">
                <Info size={14} className="text-sky-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <p className="text-xs text-sky-700 leading-relaxed text-right">
                  הדיווח שלך יישאר אנונימי. הצוות שלנו יבדוק ויעדכן תוך 48 שעות.
                </p>
              </div>
            </div>

            {/* Submit */}
            <div className="px-5 py-4 border-t border-slate-200 flex-shrink-0">
              <button
                onClick={() => selected && setSubmitted(true)}
                disabled={!selected}
                className="w-full py-3.5 bg-olive-700 text-white text-sm font-bold rounded-full
                           flex items-center justify-center gap-2
                           disabled:bg-slate-300 disabled:cursor-not-allowed
                           hover:bg-olive-800 active:scale-95 transition-all duration-150"
              >
                <Send size={15} strokeWidth={2.5} />
                שלח דיווח
              </button>
            </div>
          </>
        ) : (
          /* Success state */
          <div className="flex flex-col items-center px-6 py-10 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-olive-100 flex items-center justify-center">
              <Check size={32} className="text-olive-700" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-2">הדיווח נשלח בהצלחה</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                תודה! הצוות שלנו יבדוק את הדיווח<br />ויטפל בו בהקדם האפשרי.
              </p>
            </div>
            <div className="w-full bg-olive-50 rounded-xl px-4 py-3 text-right border border-olive-200">
              <p className="text-xs text-slate-400 mb-1">בעיה שדווחה:</p>
              <p className="text-sm font-bold text-olive-700">{selectedLabel}</p>
              {text && <p className="text-xs text-slate-500 mt-2 leading-relaxed">"{text}"</p>}
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 bg-olive-700 text-white text-sm font-bold rounded-full
                         hover:bg-olive-800 active:scale-95 transition-all duration-150"
            >
              סגור
            </button>
          </div>
        )}
      </div>
    </>
  )
}
