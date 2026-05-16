import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const STEPS = [
  {
    icon: '🗺️',
    title: 'גלה מסלולי הנצחה',
    subtitle: 'גלה מסלולי הנצחה, אתרי זיכרון ומצפים ברחבי הארץ',
    from: '#4c5a28',
    to:   '#3d4821',
  },
  {
    icon: '🕯️',
    title: 'הדלק נר לזכרם',
    subtitle: 'הדלק נר וכתוב מסר לזכר לוחמים ואנשים שנפלו',
    from: '#92400e',
    to:   '#78350f',
  },
  {
    icon: '📍',
    title: 'הוסף נקודה',
    subtitle: 'שתף מקומות חשובים עם הקהילה ועזור לשמר את הזיכרון',
    from: '#1e40af',
    to:   '#1e3a8a',
  },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  function finish() {
    localStorage.setItem('ntz_onboarded', '1')
    window.dispatchEvent(new Event('ntz:onboarded'))
    navigate('/map', { replace: true })
  }

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else finish()
  }

  const { icon, title, subtitle, from, to } = STEPS[step]

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col items-center justify-between px-6 py-10 text-white"
      style={{ background: `linear-gradient(to bottom, ${from}, ${to})` }}
    >
      <div className="w-full flex justify-start">
        <button
          onClick={finish}
          className="text-white/60 text-sm font-medium hover:text-white transition-colors"
        >
          דלג
        </button>
      </div>

      <div className="flex flex-col items-center gap-6 text-center">
        <span className="text-7xl select-none">{icon}</span>
        <h1 className="text-2xl font-bold leading-snug">{title}</h1>
        <p className="text-base text-white/75 leading-relaxed max-w-xs">{subtitle}</p>
      </div>

      <div className="w-full flex flex-col items-center gap-6">
        <div className="flex gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width:           i === step ? '1.5rem' : '0.5rem',
                backgroundColor: i === step ? 'white' : 'rgba(255,255,255,0.35)',
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="w-full max-w-xs py-3.5 bg-white text-slate-800 text-base font-bold
                     rounded-full active:scale-95 transition-transform shadow-lg"
        >
          {step < STEPS.length - 1 ? 'הבא' : 'בוא נתחיל'}
        </button>
      </div>
    </div>
  )
}
