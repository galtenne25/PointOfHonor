/**
 * LandingPage — the memorial splash shown once, right after login (the post-login
 * welcome that introduces the essence of the app). Its CTA ("המשך") calls
 * `onContinue` to dismiss the splash and continue into the app.
 *
 * The design (imported from Claude Design — "Nekudat Tziyon Splash") is rendered
 * inside the app's strict mobile-width column (max-w-md) centered on a desktop
 * surround, so it reads like a native mobile screen on any screen size. Content
 * flows in-normal-order (rather than a fixed 932px frame) so the button is never
 * clipped on short laptop viewports — the column scrolls if it must.
 */

// Pre-computed ember particles (replaces the design's runtime generator).
const EMBERS = [
  { left: '118px', size: '3px', dur: '3.6s', delay: '0s',    drift: '10px'  },
  { left: '155px', size: '4px', dur: '4.4s', delay: '0.7s',  drift: '-8px'  },
  { left: '192px', size: '5px', dur: '5.2s', delay: '1.4s',  drift: '14px'  },
  { left: '139px', size: '3px', dur: '3.6s', delay: '2.1s',  drift: '-12px' },
  { left: '176px', size: '4px', dur: '4.4s', delay: '2.8s',  drift: '6px'   },
  { left: '123px', size: '5px', dur: '5.2s', delay: '3.5s',  drift: '-10px' },
]

const SERIF = "'Frank Ruhl Libre', Georgia, serif"

export default function LandingPage({ onContinue }) {
  return (
    <div className="min-h-screen bg-slate-200 flex justify-center">
      <div
        dir="rtl"
        className="relative w-full max-w-md min-h-screen overflow-hidden shadow-2xl"
        style={{
          color: '#f4ead0',
          background:
            'radial-gradient(120% 70% at 50% 38%, rgba(232,193,124,0.20) 0%, rgba(214,176,112,0.06) 34%, rgba(0,0,0,0) 62%), linear-gradient(180deg, #1c2113 0%, #161a0e 50%, #0d1007 100%)',
        }}
      >
        {/* stone wall texture */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, opacity: 0.5, mixBlendMode: 'overlay',
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(255,238,200,0.10) 0 1px, rgba(0,0,0,0) 1px 86px), repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0 1px, rgba(0,0,0,0) 1px 58px), repeating-linear-gradient(0deg, rgba(255,238,200,0.05) 0 1px, rgba(0,0,0,0) 1px 58px)',
        }} />
        <div aria-hidden style={{
          position: 'absolute', inset: 0, opacity: 0.45, mixBlendMode: 'overlay',
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.22) 0 1px, rgba(0,0,0,0) 1px 86px)',
          backgroundPosition: '43px 29px', backgroundSize: '86px 116px',
        }} />

        {/* map of israel backdrop */}
        <div aria-hidden style={{
          position: 'absolute', top: '118px', left: '50%', transform: 'translateX(-50%)',
          width: '184px', height: '610px', opacity: 0.20,
          clipPath: "path('M108,8 L70,40 L66,95 L60,150 L54,205 L48,250 L44,300 L60,360 L78,430 L92,500 L104,560 L112,600 L120,560 L120,500 L126,440 L132,380 L140,320 L146,270 L148,220 L150,150 L148,90 L140,50 Z')",
          backgroundColor: '#5a4a30',
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0 1px, rgba(0,0,0,0) 1px 34px), repeating-linear-gradient(90deg, rgba(0,0,0,0.4) 0 1px, rgba(0,0,0,0) 1px 34px), radial-gradient(circle at 25% 12%, rgba(190,150,100,0.9), rgba(0,0,0,0) 18%), radial-gradient(circle at 70% 30%, rgba(120,95,60,0.9), rgba(0,0,0,0) 16%), radial-gradient(circle at 35% 48%, rgba(200,170,120,0.8), rgba(0,0,0,0) 18%), radial-gradient(circle at 60% 66%, rgba(110,88,55,0.9), rgba(0,0,0,0) 16%), radial-gradient(circle at 40% 82%, rgba(175,140,95,0.85), rgba(0,0,0,0) 18%)',
        }} />

        {/* vignette */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(110% 80% at 50% 45%, rgba(0,0,0,0) 48%, rgba(0,0,0,0.55) 100%)',
        }} />

        {/* ── content column ── */}
        <div
          className="relative z-[3] flex flex-col items-center min-h-screen"
          style={{ padding: '62px 30px 46px' }}
        >
          {/* header */}
          <div className="text-center">
            <div style={{
              fontFamily: SERIF, fontWeight: 700, fontSize: '46px', lineHeight: 1,
              color: '#f3dca2', letterSpacing: '1px',
              textShadow: '0 2px 30px rgba(232,193,124,0.55), 0 1px 2px rgba(0,0,0,0.5)',
            }}>
              נקודת ציון
            </div>
            <div style={{ marginTop: '14px', fontSize: '15px', fontWeight: 500, letterSpacing: '5px', color: '#c79a52' }}>
              פלטפורמת ההנצחה של ישראל
            </div>
            <div style={{
              margin: '20px auto 0', width: '64px', height: '1px',
              background: 'linear-gradient(90deg, rgba(199,154,82,0) 0%, rgba(199,154,82,0.9) 50%, rgba(199,154,82,0) 100%)',
            }} />
            <div style={{ marginTop: '18px', fontFamily: SERIF, fontWeight: 300, fontStyle: 'italic', fontSize: '19px', color: '#e8d9b6' }}>
              לזכור, לשתף, להמשיך את דרכם.
            </div>
          </div>

          {/* candle scene */}
          <div className="relative w-full flex items-center justify-center" style={{ flex: '1 1 auto', minHeight: '330px' }}>
            <div style={{ position: 'relative', width: '300px', height: '330px' }}>

              {/* star of david (floating) */}
              <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)' }}>
                <div style={{ animation: 'nz-float 5.5s ease-in-out infinite' }}>
                  <svg width="56" height="56" viewBox="0 0 40 40" fill="none" style={{ display: 'block', filter: 'drop-shadow(0 0 12px rgba(240,210,150,0.85))' }}>
                    <path d="M20 3 L36 31 L4 31 Z" stroke="#f0d49a" strokeWidth="1.6" strokeLinejoin="round" />
                    <path d="M20 37 L4 9 L36 9 Z" stroke="#f0d49a" strokeWidth="1.6" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* flame glow */}
              <div style={{ position: 'absolute', left: '50%', top: '78px', width: '190px', height: '230px', transform: 'translateX(-50%)' }}>
                <div style={{
                  position: 'absolute', inset: 0, animation: 'nz-glow 4s ease-in-out infinite',
                  background: 'radial-gradient(closest-side, rgba(245,205,130,0.77) 0%, rgba(232,170,90,0.40) 35%, rgba(214,150,70,0) 72%)',
                }} />
              </div>

              {/* flame (flickering) */}
              <div style={{ position: 'absolute', left: '50%', top: '96px', transform: 'translateX(-50%)' }}>
                <div style={{ transformOrigin: '50% 100%', animation: 'nz-flicker 1.6s ease-in-out infinite' }}>
                  <svg width="40" height="58" viewBox="0 0 44 64" fill="none" style={{ display: 'block' }}>
                    <defs>
                      <radialGradient id="nzOuter" cx="50%" cy="68%" r="62%">
                        <stop offset="0%" stopColor="#fff2c8" />
                        <stop offset="42%" stopColor="#f6b94e" />
                        <stop offset="100%" stopColor="#d97a26" />
                      </radialGradient>
                      <radialGradient id="nzInner" cx="50%" cy="72%" r="60%">
                        <stop offset="0%" stopColor="#fffdf2" />
                        <stop offset="100%" stopColor="#ffd97a" />
                      </radialGradient>
                    </defs>
                    <path d="M22 2 C31 21 42 31 33 48 C29 59 16 59 12 48 C5 34 16 23 22 2 Z" fill="url(#nzOuter)" />
                    <path d="M22 22 C27 32 31 38 26 47 C23 54 17 54 15 47 C11 38 18 33 22 22 Z" fill="url(#nzInner)" />
                  </svg>
                </div>
              </div>

              {/* wick */}
              <div style={{ position: 'absolute', left: '50%', top: '150px', width: '3px', height: '12px', transform: 'translateX(-50%)', background: 'linear-gradient(180deg,#3a2a14,#1a130a)', borderRadius: '2px' }} />

              {/* candle body */}
              <div style={{
                position: 'absolute', left: '50%', top: '160px', width: '64px', height: '128px', transform: 'translateX(-50%)',
                borderRadius: '8px 8px 4px 4px',
                background: 'linear-gradient(90deg, #5a4d34 0%, #b09c74 24%, #f3e7c6 52%, #d9c79c 70%, #6f5f40 100%)',
                boxShadow: 'inset 0 -10px 22px rgba(60,45,20,0.5), 0 0 26px rgba(240,200,130,0.25)',
              }}>
                <div style={{ position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)', width: '64px', height: '14px', borderRadius: '50%', background: 'radial-gradient(ellipse at 50% 35%, #2e2412 0%, #6e5c3a 45%, #efe0bb 90%)' }} />
                <div style={{ position: 'absolute', top: '10px', left: '14px', width: '10px', height: '42px', borderRadius: '0 0 6px 6px', background: 'linear-gradient(180deg, rgba(255,250,235,0.7), rgba(255,250,235,0))' }} />
              </div>

              {/* ember particles */}
              {EMBERS.map((e, i) => (
                <div key={i} style={{
                  position: 'absolute', bottom: '120px', left: e.left, width: e.size, height: e.size,
                  borderRadius: '50%', background: '#ffd98a', boxShadow: '0 0 6px rgba(255,210,130,0.9)',
                  ['--drift']: e.drift, animation: `nz-rise ${e.dur} linear ${e.delay} infinite`,
                }} />
              ))}

              {/* stone ledge */}
              <div style={{
                position: 'absolute', left: '50%', bottom: '6px', width: '300px', height: '34px', transform: 'translateX(-50%)',
                borderRadius: '5px',
                background: 'linear-gradient(180deg, #8a7650 0%, #6c5b3d 40%, #4a3e29 100%)',
                boxShadow: '0 14px 34px rgba(0,0,0,0.55), inset 0 2px 0 rgba(255,235,190,0.18)',
              }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.45, mixBlendMode: 'overlay', backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.5) 0 2px, rgba(0,0,0,0) 2px 76px)' }} />
                <div style={{ position: 'absolute', top: '-2px', left: '50%', transform: 'translateX(-50%)', width: '160px', height: '10px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,214,140,0.55), rgba(255,214,140,0))', filter: 'blur(2px)' }} />
              </div>
            </div>
          </div>

          {/* body copy */}
          <p style={{ maxWidth: '330px', margin: '6px auto 0', textAlign: 'center', fontWeight: 300, fontSize: '15.5px', lineHeight: 1.85, color: 'rgba(244,234,208,0.82)' }}>
            מפה חיה אחת שמחברת סיפורים, אנשים ומקומות. כאן מדליקים נר, משתפים זיכרון, וממשיכים את דרכם — יחד.
          </p>

          {/* continue button → AuthPage */}
          <button
            onClick={onContinue}
            className="nz-cta"
            style={{
              marginTop: '30px', display: 'inline-flex', alignItems: 'center', gap: '12px',
              padding: '15px 34px', border: 'none', borderRadius: '40px', cursor: 'pointer',
              fontFamily: "'Assistant', sans-serif", fontSize: '17px', fontWeight: 600, color: '#2a2614',
              background: 'linear-gradient(180deg, #f7eed5 0%, #e8d6ac 100%)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,163,90,0.6), inset 0 1px 0 rgba(255,255,255,0.7)',
            }}
          >
            המשך
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M14 5 L7 12 L14 19" stroke="#2a2614" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
