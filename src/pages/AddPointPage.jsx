import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Upload, MapPin, CheckCircle, Loader2 } from 'lucide-react'

export default function AddPointPage() {
  const navigate = useNavigate()
  const toastTimerRef = useRef(null)

  const [form,         setForm        ] = useState({ name: '', description: '' })
  const [images,       setImages      ] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showToast,    setShowToast   ] = useState(false)

  useEffect(() => {
    return () => { images.forEach(img => URL.revokeObjectURL(img.url)) }
  }, [images])

  useEffect(() => {
    return () => clearTimeout(toastTimerRef.current)
  }, [])

  const handleChange = useCallback(
    e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value })),
    []
  )

  const handleImages = useCallback(e => {
    const entries = Array.from(e.target.files).map(f => ({ url: URL.createObjectURL(f), file: f }))
    setImages(prev => [...prev, ...entries].slice(0, 10))
  }, [])

  const handleSubmit = useCallback(async e => {
    e.preventDefault()
    setIsSubmitting(true)

    await new Promise(r => setTimeout(r, 1200))

    setIsSubmitting(false)
    setForm({ name: '', description: '' })
    setImages([])
    setShowToast(true)

    toastTimerRef.current = setTimeout(() => {
      setShowToast(false)
      navigate('/map')
    }, 2000)
  }, [navigate])

  return (
    <div dir="rtl" className="flex flex-col min-h-full">

      {/* ── Page header ── */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-0.5 text-olive-700 text-sm font-semibold
                     active:opacity-70 transition-opacity"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
          חזרה
        </button>
        <h1 className="flex-1 text-right text-lg font-bold text-slate-800 pe-1">
          הוסף נקודה חדשה
        </h1>
      </div>
      <hr className="border-slate-100" />

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} className="flex-1 px-5 pt-6 pb-8 flex flex-col gap-6">

        {/* 1 · Site name */}
        <Field label="שם האנדרטה / האתר">
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="לדוגמה: מצפה דני כהן"
            dir="rtl"
            required
            className="w-full text-right bg-slate-50 border border-slate-200 rounded-xl
                       px-4 py-3 text-sm text-slate-800 placeholder-slate-400
                       focus:outline-none focus:ring-2 focus:ring-olive-300 focus:border-olive-500
                       transition-all"
          />
        </Field>

        {/* 2 · Map location placeholder */}
        <Field label="מיקום על המפה">
          <div className="relative h-36 rounded-2xl overflow-hidden border border-slate-200 cursor-pointer">
            <img
              src="https://picsum.photos/seed/mapplaceholder/800/300"
              alt="מיקום"
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="w-11 h-11 rounded-full bg-olive-700/90 shadow-md
                              flex items-center justify-center">
                <MapPin size={22} className="text-white" strokeWidth={2} />
              </div>
              <span className="text-sm font-semibold text-slate-800
                               bg-white/85 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                לחץ לבחירת מיקום
              </span>
            </div>
          </div>
        </Field>

        {/* 3 · Image upload */}
        <Field label="תמונות">
          <label
            htmlFor="img-upload"
            className="flex flex-col items-center justify-center gap-2 py-7
                       border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50
                       cursor-pointer hover:border-olive-400 hover:bg-olive-50
                       transition-all duration-150"
          >
            <Upload size={28} className="text-slate-400" strokeWidth={1.5} />
            <p className="text-sm font-medium text-slate-600">הוסף תמונות לאתר</p>
            <p className="text-xs text-slate-400">JPG, PNG — עד 10 תמונות</p>
            <input
              type="file"
              id="img-upload"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleImages}
            />
          </label>

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {images.map((img, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </Field>

        {/* 4 · Description */}
        <Field label="תיאור / סיפור ההנצחה">
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="ספר את הסיפור מאחורי המקום..."
            dir="rtl"
            rows={5}
            className="w-full text-right bg-slate-50 border border-slate-200 rounded-xl
                       px-4 py-3 text-sm text-slate-800 placeholder-slate-400 resize-none
                       focus:outline-none focus:ring-2 focus:ring-olive-300 focus:border-olive-500
                       transition-all"
          />
        </Field>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2
                     bg-olive-700 text-white font-bold text-base
                     py-4 rounded-2xl shadow-sm
                     hover:bg-olive-800 active:scale-[0.98]
                     disabled:opacity-70 disabled:cursor-not-allowed
                     transition-all duration-150"
        >
          {isSubmitting
            ? <><Loader2 size={18} className="animate-spin" /><span>שולח...</span></>
            : <span>שלח לאישור</span>
          }
        </button>

      </form>

      {/* ── Success toast ── */}
      <div
        className={`
          fixed top-20 left-4 right-4 max-w-md mx-auto z-[2000]
          flex items-center gap-3
          bg-olive-700 text-white px-4 py-3.5 rounded-2xl shadow-2xl
          transition-all duration-300
          ${showToast
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-3 pointer-events-none'}
        `}
      >
        <CheckCircle size={20} strokeWidth={2.2} className="flex-shrink-0" />
        <p className="text-sm font-semibold">הבקשה נשלחה לאישור מנהל</p>
      </div>

    </div>
  )
}

// ── Shared label + field wrapper ─────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-700 text-right">
        {label}
      </label>
      {children}
    </div>
  )
}
