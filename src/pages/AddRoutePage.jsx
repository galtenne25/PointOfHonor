import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, CheckCircle, Loader2, Route as RouteIcon } from 'lucide-react'
import { useApp } from '../contexts/AppContext'

const REGIONS = [
  { value: 'north',  label: 'צפון'  },
  { value: 'center', label: 'מרכז' },
  { value: 'south',  label: 'דרום' },
]
const WATER = [
  { value: true,  label: 'יש מים בדרך' },
  { value: false, label: 'אין מים בדרך' },
]
const TYPES = [
  { value: 'trail',   label: 'מסלול הליכה' },
  { value: 'lookout', label: 'מצפה / תצפית' },
]
const DIFFICULTY = [
  { value: 'קל',     label: 'קל'     },
  { value: 'בינוני', label: 'בינוני' },
  { value: 'קשה',    label: 'קשה'    },
]

// Single-select chip group
function ChipSelect({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 justify-end">
      {options.map(opt => {
        const active = value === opt.value
        return (
          <button
            key={String(opt.value)}
            type="button"
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

function Field({ label, children, error }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-700 text-right">{label}</label>
      {children}
      {error && <span className="text-xs text-red-500 mt-0.5 text-right">{error}</span>}
    </div>
  )
}

export default function AddRoutePage() {
  const navigate = useNavigate()
  const { addRoute } = useApp()
  const toastTimerRef = useRef(null)

  const [form, setForm] = useState({
    title: '', description: '', startLocation: '', lengthKm: '',
    region: null, hasWater: null, routeType: null, difficulty: 'בינוני',
  })
  const [errors,       setErrors      ] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError,  setSubmitError ] = useState(null)
  const [showToast,    setShowToast   ] = useState(false)

  useEffect(() => () => clearTimeout(toastTimerRef.current), [])

  const set = useCallback((key, val) => {
    setForm(prev => ({ ...prev, [key]: val }))
    setErrors(prev => (prev[key] ? { ...prev, [key]: undefined } : prev))
  }, [])

  const handleSubmit = useCallback(async e => {
    e.preventDefault()
    const next = {}
    if (!form.title.trim())                       next.title       = 'יש להזין שם למסלול'
    if (form.description.trim().length < 10)       next.description = 'התיאור חייב להכיל לפחות 10 תווים'
    if (!form.region)                              next.region      = 'יש לבחור אזור'
    const len = Number(form.lengthKm)
    if (!form.lengthKm || isNaN(len) || len <= 0)  next.lengthKm    = 'יש להזין אורך תקין בק"מ'
    if (form.hasWater === null)                    next.hasWater    = 'יש לבחור זמינות מים'
    if (!form.routeType)                           next.routeType   = 'יש לבחור סוג מסלול'
    if (Object.keys(next).length) { setErrors(next); return }

    setErrors({})
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      await addRoute({
        title:         form.title,
        description:   form.description,
        region:        form.region,
        lengthKm:      len,
        hasWater:      form.hasWater,
        routeType:     form.routeType,
        difficulty:    form.difficulty,
        startLocation: form.startLocation,
      })
      setShowToast(true)
      toastTimerRef.current = setTimeout(() => {
        setShowToast(false)
        navigate('/routes')
      }, 3400)
    } catch (err) {
      setSubmitError(err.message ?? 'שגיאה בשמירת המסלול. נסה שנית.')
    } finally {
      setIsSubmitting(false)
    }
  }, [navigate, addRoute, form])

  const inputCls =
    'w-full text-right bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 ' +
    'text-sm text-slate-800 placeholder-slate-400 focus:outline-none ' +
    'focus:ring-2 focus:ring-olive-300 focus:border-olive-500 transition-all'

  return (
    <div dir="rtl" className="flex flex-col min-h-full">

      {/* ── Header ── */}
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
          הוספת מסלול חדש
        </h1>
      </div>
      <hr className="border-slate-100" />

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} className="flex-1 px-5 pt-6 pb-8 flex flex-col gap-6">

        <Field label="שם המסלול" error={errors.title}>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="לדוגמה: שביל הגבורה בעמק הבכא"
            dir="rtl"
            className={inputCls}
          />
        </Field>

        <Field label="תיאור המסלול" error={errors.description}>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="ספר על המסלול, נקודות העניין והמשמעות ההיסטורית..."
            dir="rtl"
            rows={4}
            className={`${inputCls} resize-none`}
          />
        </Field>

        <Field label="אזור בארץ" error={errors.region}>
          <ChipSelect options={REGIONS} value={form.region} onChange={v => set('region', v)} />
        </Field>

        <Field label='אורך המסלול (ק"מ)' error={errors.lengthKm}>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.1"
            value={form.lengthKm}
            onChange={e => set('lengthKm', e.target.value)}
            placeholder="לדוגמה: 5.5"
            dir="rtl"
            className={inputCls}
          />
        </Field>

        <Field label="זמינות מים" error={errors.hasWater}>
          <ChipSelect options={WATER} value={form.hasWater} onChange={v => set('hasWater', v)} />
        </Field>

        <Field label="סוג המסלול" error={errors.routeType}>
          <ChipSelect options={TYPES} value={form.routeType} onChange={v => set('routeType', v)} />
        </Field>

        <Field label="דרגת קושי">
          <ChipSelect options={DIFFICULTY} value={form.difficulty} onChange={v => set('difficulty', v)} />
        </Field>

        <Field label="נקודת זינוק (לא חובה)">
          <input
            type="text"
            value={form.startLocation}
            onChange={e => set('startLocation', e.target.value)}
            placeholder="לדוגמה: חניון יער ביריה"
            dir="rtl"
            className={inputCls}
          />
        </Field>

        {submitError && (
          <p className="text-sm text-red-500 text-center font-medium">{submitError}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2
                     bg-olive-700 text-white font-bold text-base py-4 rounded-2xl shadow-sm
                     hover:bg-olive-800 active:scale-[0.98]
                     disabled:opacity-70 disabled:cursor-not-allowed
                     transition-all duration-150"
        >
          {isSubmitting
            ? <><Loader2 size={18} className="animate-spin" /><span>שולח...</span></>
            : <><RouteIcon size={18} strokeWidth={2} /><span>שלח מסלול לאישור</span></>
          }
        </button>
      </form>

      {/* ── Success toast ── */}
      <div
        className={`fixed top-20 left-4 right-4 max-w-md mx-auto z-[2000]
          flex items-center gap-3 bg-olive-700 text-white px-4 py-3.5 rounded-2xl shadow-2xl
          transition-all duration-300
          ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3 pointer-events-none'}`}
      >
        <CheckCircle size={20} strokeWidth={2.2} className="flex-shrink-0" />
        <p className="text-sm font-semibold leading-snug text-right">
          תודה! המסלול נשלח לבדיקה ויתווסף לאחר אישור המערכת.
        </p>
      </div>

    </div>
  )
}
