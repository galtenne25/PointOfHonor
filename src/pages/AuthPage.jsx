import { useState, useCallback } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { LogIn, UserPlus, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Input, Button, Field } from '../components/ui'

const TABS = [
  { id: 'signin', label: 'התחברות' },
  { id: 'signup', label: 'הרשמה'    },
]

function validate(mode, f) {
  const e = {}
  if (mode === 'signup' && !f.fullName.trim())   e.fullName = 'יש להזין שם מלא'
  if (!/^\S+@\S+\.\S+$/.test(f.email))           e.email    = 'יש להזין כתובת אימייל תקינה'
  if (f.password.length < 6)                      e.password = 'סיסמה חייבת להכיל 6 תווים לפחות'
  return e
}

export default function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signUp, user, loading: authLoading } = useAuth()
  const toast = useToast()

  const redirectTo = location.state?.from?.pathname || '/profile'

  const [mode,    setMode   ] = useState('signin')
  const [form,    setForm   ] = useState({ email: '', password: '', fullName: '' })
  const [touched, setTouched] = useState({})
  const [busy,    setBusy   ] = useState(false)
  // After signup we don't navigate imperatively (the session hasn't hydrated
  // yet — a manual push to the protected /profile/edit would bounce through
  // /auth). Instead we flag it and let the redirect block below fire once
  // `user` is populated, so the guarded route sees an authenticated user.
  const [justSignedUp, setJustSignedUp] = useState(false)

  const errors  = validate(mode, form)
  const showErr = key => (touched[key] ? errors[key] : undefined)

  const onChange = useCallback(e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }, [])
  const onBlur = useCallback(e => {
    setTouched(prev => ({ ...prev, [e.target.name]: true }))
  }, [])

  const switchMode = next => {
    setMode(next)
    setTouched({})
  }

  const onSubmit = useCallback(async e => {
    e.preventDefault()
    const allTouched = { email: true, password: true, fullName: mode === 'signup' }
    setTouched(allTouched)
    if (Object.keys(validate(mode, form)).length > 0) return

    setBusy(true)
    try {
      // 10s timeout — guarantees we recover even if Supabase hangs.
      const action = mode === 'signin'
        ? signIn({ email: form.email.trim(), password: form.password })
        : signUp({ email: form.email.trim(), password: form.password, fullName: form.fullName })
      await Promise.race([
        action,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('הבקשה לקחה יותר מדי זמן. נסה/י שוב.')), 10000)),
      ])
      if (mode === 'signin') {
        toast.success('ברוכ/ה השב/ה!')
        setBusy(false)
        navigate(redirectTo, { replace: true })
      } else {
        // New account → hand off to the guided profile-completion step. We do
        // NOT navigate or clear `busy` here: the redirect block below fires
        // once auth hydrates, so the route guard sees an authenticated user
        // and the button stays in its loading state until then.
        toast.success('החשבון נוצר! בוא/י נשלים את הפרופיל')
        setJustSignedUp(true)
      }
    } catch (err) {
      toast.error(mapAuthError(err))
      setBusy(false)
    }
  }, [mode, form, signIn, signUp, navigate, redirectTo, toast])

  // State-sync: once the user is authenticated, the login form is the wrong UI
  // to show. Fresh signups are routed through the guided profile-completion
  // step (carrying their original destination forward); everyone else goes
  // straight to where they were headed.
  if (!authLoading && user) {
    if (justSignedUp) {
      return (
        <Navigate
          to="/profile/edit"
          replace
          state={{ from: location.state?.from, completeProfile: true }}
        />
      )
    }
    return <Navigate to={redirectTo} replace />
  }

  return (
    <div dir="rtl" className="flex flex-col min-h-full bg-slate-50">

      {/* Header */}
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
          {mode === 'signin' ? 'התחברות' : 'יצירת חשבון'}
        </h1>
      </div>
      <hr className="border-slate-100" />

      <div className="px-5 pt-6 pb-10 flex-1 flex flex-col gap-6">

        {/* Brand block */}
        <div className="flex flex-col items-center gap-2 pt-4">
          <div className="w-14 h-14 rounded-full bg-olive-100 flex items-center justify-center">
            <span className="text-olive-700 text-2xl">✡</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">נקודת ציון</h2>
          <p className="text-sm text-slate-500 text-center max-w-xs">
            {mode === 'signin'
              ? 'התחבר/י כדי לשמור מסלולים, לעקוב אחר תרומות ולצבור תגים'
              : 'הצטרפ/י לקהילה — שמור/י מסלולים, סמנ/י השלמות והדלק/י נר וירטואלי'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchMode(tab.id)}
              className={`
                flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-150
                ${mode === tab.id ? 'bg-white text-olive-700 shadow-sm' : 'text-slate-500'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          {mode === 'signup' && (
            <Input
              label="שם מלא"
              name="fullName"
              required
              value={form.fullName}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="ישראל ישראלי"
              error={showErr('fullName')}
              autoComplete="name"
            />
          )}

          <Input
            label="אימייל"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="you@example.com"
            error={showErr('email')}
            autoComplete="email"
          />

          <Field
            label="סיסמה"
            htmlFor="password"
            required
            hint={mode === 'signup' ? 'לפחות 6 תווים' : undefined}
            error={showErr('password')}
          >
            <input
              id="password"
              name="password"
              type="password"
              dir="rtl"
              value={form.password}
              onChange={onChange}
              onBlur={onBlur}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              className={`w-full text-right bg-slate-50 border rounded-2xl px-4 py-3 text-sm
                text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all
                ${showErr('password')
                  ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                  : 'border-slate-200 focus:ring-olive-300 focus:border-olive-500'}`}
              placeholder="••••••"
            />
          </Field>

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={busy}
            icon={mode === 'signin' ? LogIn : UserPlus}
          >
            {mode === 'signin' ? 'התחבר/י' : 'צור/י חשבון'}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
          className="text-sm text-slate-500 text-center hover:text-olive-700 transition-colors"
        >
          {mode === 'signin'
            ? 'אין לך חשבון? '
            : 'יש לך כבר חשבון? '}
          <span className="font-semibold text-olive-700">
            {mode === 'signin' ? 'הירשם/י כאן' : 'התחבר/י כאן'}
          </span>
        </button>
      </div>
    </div>
  )
}

function mapAuthError(err) {
  if (err?.code === 'email-confirmation-required') return err.message
  const m = (err?.message || '').toLowerCase()
  if (m.includes('invalid login credentials')) return 'אימייל או סיסמה שגויים'
  if (m.includes('already registered') || m.includes('already exists')) return 'משתמש עם אימייל זה כבר רשום'
  if (m.includes('password should be')) return 'הסיסמה חלשה מדי'
  if (m.includes('rate limit')) return 'יותר מדי ניסיונות. נסה/י שוב בעוד מספר דקות.'
  return err?.message || 'שגיאה בהתחברות. נסה/י שוב.'
}
