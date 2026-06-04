import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Route as RouteIcon } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useToast } from '../contexts/ToastContext'
import { Input, Textarea, Button, Field, ChipSelect } from '../components/ui'

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

function validate(f) {
  const e = {}
  if (!f.title.trim())                    e.title       = 'יש להזין שם למסלול'
  else if (f.title.trim().length < 2)     e.title       = 'השם קצר מדי'
  if (f.description.trim().length < 10)    e.description = 'התיאור חייב להכיל לפחות 10 תווים'
  if (!f.region)                           e.region      = 'יש לבחור אזור'
  const len = Number(f.lengthKm)
  if (!f.lengthKm || isNaN(len) || len <= 0) e.lengthKm  = 'יש להזין אורך תקין בק"מ'
  else if (len > 200)                       e.lengthKm   = 'אורך המסלול אינו סביר'
  if (f.hasWater === null)                  e.hasWater    = 'יש לבחור זמינות מים'
  if (!f.routeType)                         e.routeType   = 'יש לבחור סוג מסלול'
  return e
}

export default function AddRoutePage() {
  const navigate = useNavigate()
  const { addRoute } = useApp()
  const toast = useToast()

  const [form, setForm] = useState({
    title: '', description: '', startLocation: '', lengthKm: '',
    region: null, hasWater: null, routeType: null, difficulty: 'בינוני',
  })
  const [touched,      setTouched     ] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const errors  = validate(form)
  const showErr = key => (touched[key] ? errors[key] : undefined)

  const set = useCallback((key, val) => {
    setForm(prev => ({ ...prev, [key]: val }))
    setTouched(prev => ({ ...prev, [key]: true }))   // chips → validate live
  }, [])
  const onText = useCallback(e => set(e.target.name, e.target.value), [set])
  const onBlur = useCallback(e => setTouched(prev => ({ ...prev, [e.target.name]: true })), [])

  const handleSubmit = useCallback(async e => {
    e.preventDefault()
    if (isSubmitting) return  // guard against double-submit (Enter while in-flight)
    setTouched({ title: true, description: true, region: true, lengthKm: true, hasWater: true, routeType: true })
    if (Object.keys(validate(form)).length > 0) return

    setIsSubmitting(true)
    try {
      await addRoute({
        title:         form.title,
        description:   form.description,
        region:        form.region,
        lengthKm:      Number(form.lengthKm),
        hasWater:      form.hasWater,
        routeType:     form.routeType,
        difficulty:    form.difficulty,
        startLocation: form.startLocation,
      })
      toast.success('תודה! המסלול נשלח לבדיקה ויתווסף לאחר אישור המערכת.')
      navigate('/routes')
    } catch (err) {
      toast.error(err.message ?? 'שגיאה בשמירת המסלול. נסה שנית.')
    } finally {
      setIsSubmitting(false)
    }
  }, [navigate, addRoute, form, toast, isSubmitting])

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
      <form onSubmit={handleSubmit} noValidate className="flex-1 px-5 pt-6 pb-8 flex flex-col gap-6">

        <Input
          label="שם המסלול"
          name="title"
          required
          value={form.title}
          onChange={onText}
          onBlur={onBlur}
          placeholder="לדוגמה: שביל הגבורה בעמק הבכא"
          error={showErr('title')}
        />

        <Textarea
          label="תיאור המסלול"
          name="description"
          required
          rows={4}
          value={form.description}
          onChange={onText}
          onBlur={onBlur}
          placeholder="ספר על המסלול, נקודות העניין והמשמעות ההיסטורית..."
          error={showErr('description')}
        />

        <Field label="אזור בארץ" required error={showErr('region')}>
          <ChipSelect options={REGIONS} value={form.region} onChange={v => set('region', v)} ariaLabel="אזור" />
        </Field>

        <Input
          label='אורך המסלול (ק"מ)'
          name="lengthKm"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.1"
          required
          value={form.lengthKm}
          onChange={onText}
          onBlur={onBlur}
          placeholder="לדוגמה: 5.5"
          error={showErr('lengthKm')}
        />

        <Field label="זמינות מים" required error={showErr('hasWater')}>
          <ChipSelect options={WATER} value={form.hasWater} onChange={v => set('hasWater', v)} ariaLabel="זמינות מים" />
        </Field>

        <Field label="סוג המסלול" required error={showErr('routeType')}>
          <ChipSelect options={TYPES} value={form.routeType} onChange={v => set('routeType', v)} ariaLabel="סוג המסלול" />
        </Field>

        <Field label="דרגת קושי">
          <ChipSelect options={DIFFICULTY} value={form.difficulty} onChange={v => set('difficulty', v)} ariaLabel="דרגת קושי" />
        </Field>

        <Input
          label="נקודת זינוק (לא חובה)"
          name="startLocation"
          value={form.startLocation}
          onChange={onText}
          placeholder="לדוגמה: חניון יער ביריה"
        />

        <Button type="submit" size="lg" fullWidth loading={isSubmitting} icon={RouteIcon}>
          {isSubmitting ? 'שולח...' : 'שלח מסלול לאישור'}
        </Button>
      </form>
    </div>
  )
}
