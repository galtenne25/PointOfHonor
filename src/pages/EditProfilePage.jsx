import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronRight, Camera, X, User as UserIcon, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../utils/supabase'
import { Input, Textarea, Button, Field } from '../components/ui'
import { uploadImage, validateImageFile, FileValidationError, MAX_FILE_MB } from '../services/storage'

function validate(form) {
  const e = {}
  if (!form.full_name.trim())                 e.full_name = 'יש להזין שם מלא'
  else if (form.full_name.trim().length < 2)  e.full_name = 'השם קצר מדי'
  if (form.bio && form.bio.length > 300)      e.bio       = 'הביוגרפיה מוגבלת ל-300 תווים'
  return e
}

export default function EditProfilePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, refreshProfile } = useAuth()
  const toast = useToast()

  // Completion mode: a brand-new account was routed here from signup to finish
  // setting up their profile (name + avatar) before diving into the community.
  const completing = location.state?.completeProfile === true
  const skipDest   = location.state?.from?.pathname || '/profile'

  // Pre-fill form from current profile (Phase 2 "Update": pre-filled fields)
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    bio:       profile?.bio       ?? '',
    avatar_url: profile?.avatar_url ?? '',
  })
  const [touched,    setTouched   ] = useState({})
  const [busy,       setBusy      ] = useState(false)
  const [uploading,  setUploading ] = useState(false)
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!user) return
    setForm({
      full_name:  profile?.full_name  ?? '',
      bio:        profile?.bio        ?? '',
      avatar_url: profile?.avatar_url ?? '',
    })
  }, [user, profile?.full_name, profile?.bio, profile?.avatar_url])

  // Revoke any local object URL on unmount to prevent memory leaks.
  useEffect(() => () => { if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl) }, [localPreviewUrl])

  const errors  = validate(form)
  const showErr = key => (touched[key] ? errors[key] : undefined)

  const onText = useCallback(e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value })), [])
  const onBlur = useCallback(e => setTouched(prev => ({ ...prev, [e.target.name]: true })), [])

  const handlePickAvatar = useCallback(async e => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return

    try {
      validateImageFile(file)
    } catch (err) {
      if (err instanceof FileValidationError) toast.error(err.message)
      else toast.error('שגיאה בקובץ')
      return
    }

    // Local preview while we upload (UX)
    const localUrl = URL.createObjectURL(file)
    setLocalPreviewUrl(localUrl)

    setUploading(true)
    try {
      const { url } = await uploadImage(file, `avatars/${user.id}`)
      setForm(prev => ({ ...prev, avatar_url: url }))
      toast.success('האווטאר הועלה בהצלחה')
    } catch (err) {
      toast.error(err.message ?? 'העלאת האווטאר נכשלה')
      setLocalPreviewUrl(null)
      URL.revokeObjectURL(localUrl)
    } finally {
      setUploading(false)
    }
  }, [user?.id, toast])

  const handleSubmit = useCallback(async e => {
    e.preventDefault()
    if (busy || uploading) return  // no double-submit; never save mid-upload
    setTouched({ full_name: true, bio: true })
    if (Object.keys(validate(form)).length > 0) return

    setBusy(true)
    try {
      const initials = (form.full_name.trim().slice(0, 1) || '?').toUpperCase()
      // UPSERT (not UPDATE): a missing profiles row must be CREATED here, not
      // just updated (UPDATE would match 0 rows and silently no-op).
      const save = supabase
        .from('profiles')
        .upsert({
          id:         user.id,
          full_name:  form.full_name.trim(),
          initials,
          bio:        form.bio.trim() || null,
          avatar_url: form.avatar_url || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })

      // Supabase calls can hang (see AuthPage) — race a timeout so the button
      // can never get stuck on "שומר..." indefinitely.
      const { error } = await Promise.race([
        save,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('השמירה לקחה יותר מדי זמן. בדוק/י חיבור ונסה/י שוב.')), 8000)),
      ])
      if (error) throw error

      // Fire-and-forget: a slow profile re-fetch must not re-hang the UI.
      refreshProfile()
      toast.success('הפרופיל נשמר בהצלחה')
      const dest = location.state?.from?.pathname || '/profile'
      navigate(dest, { replace: true })
    } catch (err) {
      toast.error(err.message ?? 'שגיאה בשמירת הפרופיל')
    } finally {
      setBusy(false)
    }
  }, [user?.id, form, refreshProfile, toast, navigate, location.state, busy, uploading])

  // Auth gate (Phase 1.2 — protected route)
  if (!user) {
    return (
      <div dir="rtl" className="p-6 text-center text-slate-500">
        יש להתחבר כדי לערוך פרופיל. <button className="text-olive-700 font-semibold" onClick={() => navigate('/auth')}>התחברות</button>
      </div>
    )
  }

  const previewSrc = localPreviewUrl || form.avatar_url

  return (
    <div dir="rtl" className="flex flex-col min-h-full">

      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-2">
        <button
          onClick={() => (completing ? navigate(skipDest, { replace: true }) : navigate(-1))}
          className="flex items-center gap-0.5 text-olive-700 text-sm font-semibold
                     active:opacity-70 transition-opacity"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
          {completing ? 'דלג' : 'חזרה'}
        </button>
        <h1 className="flex-1 text-right text-lg font-bold text-slate-800 pe-1">
          {completing ? 'השלמת פרופיל' : 'עריכת פרופיל'}
        </h1>
      </div>
      <hr className="border-slate-100" />

      {completing && (
        <div
          className="mx-5 mt-4 px-4 py-3.5 rounded-2xl bg-olive-50 border border-olive-200
                     flex items-start gap-3"
          style={{ animation: 'fadeSlideIn 0.3s ease-out' }}
        >
          <div className="w-9 h-9 rounded-full bg-olive-100 flex items-center justify-center flex-shrink-0">
            <Sparkles size={18} className="text-olive-700" strokeWidth={2} />
          </div>
          <div className="flex-1 text-right">
            <p className="text-sm font-bold text-olive-800">ברוכ/ה הבא/ה לנקודת ציון!</p>
            <p className="text-xs text-olive-700/90 leading-relaxed mt-0.5">
              הוסף/הוסיפי שם ותמונת פרופיל כדי שחברי הקהילה יזהו את התרומות, הנרות והסיפורים שלך.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex-1 px-5 pt-6 pb-8 flex flex-col gap-6">

        {/* Avatar uploader */}
        <Field label="תמונת פרופיל" hint={`JPG / PNG · עד ${MAX_FILE_MB}MB`}>
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-olive-200 flex-shrink-0">
              {previewSrc ? (
                <img src={previewSrc} alt="תמונת פרופיל" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                  <UserIcon size={36} className="text-slate-300" strokeWidth={1.5} />
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePickAvatar}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                icon={Camera}
                onClick={() => fileInputRef.current?.click()}
                loading={uploading}
              >
                {form.avatar_url ? 'החלף תמונה' : 'העלה תמונה'}
              </Button>
              {form.avatar_url && !uploading && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  icon={X}
                  onClick={() => {
                    setForm(prev => ({ ...prev, avatar_url: '' }))
                    if (localPreviewUrl) { URL.revokeObjectURL(localPreviewUrl); setLocalPreviewUrl(null) }
                  }}
                >
                  הסר תמונה
                </Button>
              )}
            </div>
          </div>
        </Field>

        <Input
          label="שם מלא"
          name="full_name"
          required
          value={form.full_name}
          onChange={onText}
          onBlur={onBlur}
          placeholder="ישראל ישראלי"
          error={showErr('full_name')}
          autoComplete="name"
        />

        <Textarea
          label="ביוגרפיה / על עצמי"
          name="bio"
          rows={4}
          value={form.bio}
          onChange={onText}
          onBlur={onBlur}
          placeholder="ספר/י קצת על עצמך..."
          error={showErr('bio')}
          hint={`${form.bio.length}/300`}
        />

        <Button type="submit" size="lg" fullWidth loading={busy} disabled={uploading}>
          {busy ? 'שומר...' : completing ? 'סיום והמשך' : 'שמירת פרופיל'}
        </Button>

        {completing && (
          <button
            type="button"
            onClick={() => navigate(skipDest, { replace: true })}
            disabled={busy}
            className="text-sm text-slate-400 text-center hover:text-olive-700
                       disabled:opacity-50 transition-colors -mt-2"
          >
            אשלים את הפרטים מאוחר יותר
          </button>
        )}
      </form>
    </div>
  )
}
