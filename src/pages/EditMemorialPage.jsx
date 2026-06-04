import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { supabase } from '../utils/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { updateMemorial } from '../services/memorials'
import { Input, Textarea, Button, Field, ChipSelect } from '../components/ui'

const CATEGORIES = [
  { value: 'חרבות ברזל',          label: 'חרבות ברזל' },
  { value: 'מלחמת ששת הימים',     label: 'ששת הימים' },
  { value: 'מלחמת יום הכיפורים',  label: 'יום כיפור' },
  { value: 'נפגעי פעולות איבה',   label: 'נפגעי איבה' },
  { value: 'מורשת יחידה',         label: 'מורשת יחידה' },
]

function validate(form) {
  const e = {}
  if (!form.name?.trim())                       e.name        = 'יש להזין את שם האתר'
  else if (form.name.trim().length < 2)         e.name        = 'השם קצר מדי'
  if (!form.description || form.description.trim().length < 10)
                                                 e.description = 'התיאור חייב להכיל לפחות 10 תווים'
  if (!form.category)                            e.category    = 'יש לבחור קטגוריה'
  return e
}

export default function EditMemorialPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()

  const [original, setOriginal] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', category: '' })
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(true)
  const [busy,    setBusy   ] = useState(false)
  const [error,   setError  ] = useState(null)

  // ── Read existing row, pre-fill form (Phase 2 Update spec) ────────────────
  useEffect(() => {
    if (!user || !id) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      // We use a raw query so we can read our own pending rows (RLS ms_public_read
      // allows owner or admin to read non-approved rows).
      const { data, error } = await supabase
        .from('memorial_sites')
        .select('id, name, description_snippet, full_description, category, user_id, status, latitude, longitude')
        .eq('id', id)
        .single()
      if (cancelled) return
      if (error) {
        setError(error.message)
      } else if (data.user_id !== user.id) {
        setError('אין לך הרשאה לערוך את האתר הזה')
      } else if (data.status !== 'pending') {
        setError('ניתן לערוך רק אתרים שעדיין ממתינים לאישור')
      } else {
        setOriginal(data)
        setForm({
          name:        data.name ?? '',
          description: data.full_description ?? '',
          category:    data.category ?? '',
        })
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [id, user?.id])

  const errors  = validate(form)
  const showErr = key => (touched[key] ? errors[key] : undefined)
  const onText = useCallback(e => setForm(f => ({ ...f, [e.target.name]: e.target.value })), [])
  const onBlur = useCallback(e => setTouched(t => ({ ...t, [e.target.name]: true })), [])
  const setField = useCallback((key, value) => {
    setForm(f => ({ ...f, [key]: value }))
    setTouched(t => ({ ...t, [key]: true }))
  }, [])

  const handleSubmit = useCallback(async e => {
    e.preventDefault()
    if (busy) return  // guard against double-submit (Enter while in-flight)
    setTouched({ name: true, description: true, category: true })
    if (Object.keys(validate(form)).length > 0) return
    setBusy(true)
    try {
      await updateMemorial(original.id, {
        name:        form.name.trim(),
        description: form.description.trim(),
        category:    form.category,
      })
      toast.success('האתר עודכן. הוא ימשיך להמתין לאישור.')
      navigate('/my-submissions')
    } catch (err) {
      toast.error(err.message ?? 'עדכון האתר נכשל')
    } finally {
      setBusy(false)
    }
  }, [original, form, toast, navigate, busy])

  if (loading) {
    return (
      <div dir="rtl" className="flex-1 flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-full border-2 border-olive-200 border-t-olive-700 animate-spin" />
      </div>
    )
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
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-0.5 text-olive-700 text-sm font-semibold active:opacity-70"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
          חזרה
        </button>
        <h1 className="flex-1 text-right text-lg font-bold text-slate-800 pe-1">
          עריכת אתר הנצחה
        </h1>
      </div>
      <hr className="border-slate-100" />

      <form onSubmit={handleSubmit} noValidate className="flex-1 px-5 pt-6 pb-8 flex flex-col gap-6">
        <Input
          label="שם האתר" name="name" required
          value={form.name} onChange={onText} onBlur={onBlur}
          error={showErr('name')}
        />
        <Textarea
          label="תיאור / סיפור ההנצחה" name="description" required rows={5}
          value={form.description} onChange={onText} onBlur={onBlur}
          error={showErr('description')}
        />
        <Field label="קטגוריה" required error={showErr('category')}>
          <ChipSelect options={CATEGORIES} value={form.category} onChange={v => setField('category', v)} />
        </Field>

        <Button type="submit" size="lg" fullWidth loading={busy}>
          {busy ? 'שומר...' : 'שמירת שינויים'}
        </Button>
      </form>
    </div>
  )
}
