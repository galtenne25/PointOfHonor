import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, Route as RouteIcon } from 'lucide-react'
import { supabase } from '../utils/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { updateRouteOwn } from '../services/routes'
import { Input, Textarea, Button, Field, ChipSelect } from '../components/ui'

const REGIONS    = [{ value:'north', label:'צפון' }, { value:'center', label:'מרכז' }, { value:'south', label:'דרום' }]
const WATER      = [{ value:true,    label:'יש מים בדרך' }, { value:false, label:'אין מים בדרך' }]
const TYPES      = [{ value:'trail', label:'מסלול הליכה' }, { value:'lookout', label:'מצפה / תצפית' }]
const DIFFICULTY = [{ value:'קל', label:'קל' }, { value:'בינוני', label:'בינוני' }, { value:'קשה', label:'קשה' }]

function validate(f) {
  const e = {}
  if (!f.title?.trim())                              e.title = 'יש להזין שם למסלול'
  if (!f.description || f.description.trim().length < 10) e.description = 'התיאור חייב להכיל לפחות 10 תווים'
  if (!f.region)                                     e.region = 'יש לבחור אזור'
  const len = Number(f.lengthKm)
  if (!f.lengthKm || isNaN(len) || len <= 0)         e.lengthKm = 'יש להזין אורך תקין בק"מ'
  if (f.hasWater === null || f.hasWater === undefined) e.hasWater = 'יש לבחור זמינות מים'
  if (!f.routeType)                                  e.routeType = 'יש לבחור סוג מסלול'
  return e
}

export default function EditRoutePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [error,   setError  ] = useState(null)
  const [busy,    setBusy   ] = useState(false)
  const [original, setOriginal] = useState(null)
  const [form, setForm] = useState({
    title: '', description: '', startLocation: '', lengthKm: '',
    region: null, hasWater: null, routeType: null, difficulty: 'בינוני',
  })
  const [touched, setTouched] = useState({})

  useEffect(() => {
    if (!user || !id) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const { data, error } = await supabase
        .from('routes')
        .select('id, title, description_short, start_location, distance_km, region, has_water, route_type, difficulty, status, user_id')
        .eq('id', id)
        .single()
      if (cancelled) return
      if (error)                       setError(error.message)
      else if (data.user_id !== user.id) setError('אין לך הרשאה לערוך את המסלול הזה')
      else if (data.status !== 'pending') setError('ניתן לערוך רק מסלולים שעדיין ממתינים לאישור')
      else {
        setOriginal(data)
        setForm({
          title:         data.title ?? '',
          description:   data.description_short ?? '',
          startLocation: data.start_location ?? '',
          lengthKm:      data.distance_km != null ? String(data.distance_km) : '',
          region:        data.region ?? null,
          hasWater:      data.has_water,
          routeType:     data.route_type ?? null,
          difficulty:    data.difficulty ?? 'בינוני',
        })
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [id, user?.id])

  const errors  = validate(form)
  const showErr = key => (touched[key] ? errors[key] : undefined)

  const setField = useCallback((key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    setTouched(t => ({ ...t, [key]: true }))
  }, [])
  const onText = useCallback(e => setField(e.target.name, e.target.value), [setField])
  const onBlur = useCallback(e => setTouched(t => ({ ...t, [e.target.name]: true })), [])

  const handleSubmit = useCallback(async e => {
    e.preventDefault()
    if (busy) return  // guard against double-submit (Enter while in-flight)
    setTouched({ title:true, description:true, region:true, lengthKm:true, hasWater:true, routeType:true })
    if (Object.keys(validate(form)).length > 0) return
    setBusy(true)
    try {
      await updateRouteOwn(original.id, {
        title:         form.title,
        description:   form.description,
        region:        form.region,
        lengthKm:      Number(form.lengthKm),
        hasWater:      form.hasWater,
        routeType:     form.routeType,
        difficulty:    form.difficulty,
        startLocation: form.startLocation,
      })
      toast.success('המסלול עודכן. הוא ימשיך להמתין לאישור.')
      navigate('/my-submissions')
    } catch (err) {
      toast.error(err.message ?? 'עדכון המסלול נכשל')
    } finally {
      setBusy(false)
    }
  }, [original, form, toast, navigate, busy])

  if (loading) {
    return <div dir="rtl" className="flex-1 flex items-center justify-center py-20">
      <div className="w-10 h-10 rounded-full border-2 border-olive-200 border-t-olive-700 animate-spin" />
    </div>
  }
  if (error) {
    return (
      <div dir="rtl" className="p-6 text-center text-red-600">
        {error}
        <button className="block mt-3 mx-auto text-olive-700 font-semibold" onClick={() => navigate('/my-submissions')}>
          חזרה לתרומות שלי
        </button>
      </div>
    )
  }

  return (
    <div dir="rtl" className="flex flex-col min-h-full">
      <div className="px-5 pt-4 pb-3 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-0.5 text-olive-700 text-sm font-semibold active:opacity-70">
          <ChevronRight size={18} strokeWidth={2.5} /> חזרה
        </button>
        <h1 className="flex-1 text-right text-lg font-bold text-slate-800 pe-1">עריכת מסלול</h1>
      </div>
      <hr className="border-slate-100" />

      <form onSubmit={handleSubmit} noValidate className="flex-1 px-5 pt-6 pb-8 flex flex-col gap-6">
        <Input label="שם המסלול" name="title" required value={form.title} onChange={onText} onBlur={onBlur} error={showErr('title')} />
        <Textarea label="תיאור" name="description" required rows={4} value={form.description} onChange={onText} onBlur={onBlur} error={showErr('description')} />
        <Field label="אזור" required error={showErr('region')}>
          <ChipSelect options={REGIONS} value={form.region} onChange={v => setField('region', v)} />
        </Field>
        <Input label='אורך (ק"מ)' name="lengthKm" type="number" inputMode="decimal" min="0" step="0.1"
               required value={form.lengthKm} onChange={onText} onBlur={onBlur} error={showErr('lengthKm')} />
        <Field label="זמינות מים" required error={showErr('hasWater')}>
          <ChipSelect options={WATER} value={form.hasWater} onChange={v => setField('hasWater', v)} />
        </Field>
        <Field label="סוג המסלול" required error={showErr('routeType')}>
          <ChipSelect options={TYPES} value={form.routeType} onChange={v => setField('routeType', v)} />
        </Field>
        <Field label="דרגת קושי">
          <ChipSelect options={DIFFICULTY} value={form.difficulty} onChange={v => setField('difficulty', v)} />
        </Field>
        <Input label="נקודת זינוק" name="startLocation" value={form.startLocation} onChange={onText} />
        <Button type="submit" size="lg" fullWidth loading={busy} icon={RouteIcon}>
          {busy ? 'שומר...' : 'שמירת שינויים'}
        </Button>
      </form>
    </div>
  )
}
