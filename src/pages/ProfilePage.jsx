import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RouteIcon, CheckCircle2, MapPin, Award, Users, Lock, Plus, ChevronLeft, LogIn, LogOut, ShieldCheck, Pencil, ListChecks } from 'lucide-react'
import { useApp, BADGES } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import RouteListItem from '../components/routes/RouteListItem'
import StatsSheet from '../components/common/StatsSheet'
import { Button, EmptyState as UIEmptyState } from '../components/ui'

const TABS = [
  { id: 'saved',         label: 'מסלולים שמורים' },
  { id: 'contributions', label: 'התרומות שלי'     },
]

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 px-5 pt-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white rounded-2xl px-4 py-3.5 border border-slate-100 animate-pulse">
          <div className="flex items-center gap-2 justify-end">
            <div className="h-7 w-10 bg-slate-200 rounded-full" />
            <div className="w-8 h-8 bg-slate-200 rounded-full" />
          </div>
          <div className="h-3 w-2/3 bg-slate-200 rounded-full mt-2 self-end ml-auto" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ icon, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-slate-400">
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
        {icon}
      </div>
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      {hint && (
        <p className="text-xs text-slate-400 text-center leading-relaxed px-8">{hint}</p>
      )}
    </div>
  )
}

function BadgeCard({ badge, earned }) {
  return (
    <div
      className={`relative flex flex-col items-center gap-1.5 rounded-2xl border p-4 text-center
        transition-all duration-200
        ${earned
          ? 'bg-olive-50 border-olive-200'
          : 'bg-slate-50 border-slate-200 opacity-60 grayscale'}`}
    >
      {!earned && (
        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-slate-200
                        flex items-center justify-center">
          <Lock size={12} className="text-slate-500" strokeWidth={2.2} />
        </div>
      )}
      <span className="text-3xl leading-none">{badge.icon}</span>
      <p className={`text-sm font-bold ${earned ? 'text-olive-800' : 'text-slate-500'}`}>
        {badge.label}
      </p>
      <p className="text-[11px] text-slate-400 leading-snug">{badge.desc}</p>
      {earned && (
        <span className="mt-1 text-[10px] font-bold text-olive-700 bg-olive-100 px-2 py-0.5 rounded-full">
          הושג ✓
        </span>
      )}
    </div>
  )
}

function memberSince(iso) {
  if (!iso) return 'חבר חדש'
  try {
    const d = new Date(iso)
    return `חבר/ה מאז ${d.toLocaleDateString('he-IL', { year: 'numeric', month: 'long' })}`
  } catch { return 'חבר חדש' }
}

function SignedOutGate({ onSignIn }) {
  return (
    <div dir="rtl" className="flex-1 px-5 py-10">
      <UIEmptyState
        icon={LogIn}
        title="התחבר/י לחשבון שלך"
        message="כניסה תאפשר לשמור מסלולים, לסמן השלמות, לצבור תגים ולעקוב אחר התרומות שלך לקהילה."
        action={<Button size="lg" icon={LogIn} onClick={onSignIn}>התחברות / הרשמה</Button>}
      />
    </div>
  )
}

function ProfileLoading() {
  return (
    <div dir="rtl" className="flex-1 flex items-center justify-center py-20">
      <div className="w-10 h-10 rounded-full border-2 border-olive-200 border-t-olive-700 animate-spin" />
    </div>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading, isAdmin, signOut, profileLooksDefault } = useAuth()
  const toast = useToast()
  const {
    routes, routesLoading,
    savedRoutes, completedRouteIds, userProgress,
  } = useApp()

  // IMPORTANT: every hook must run on every render — no conditional hooks!
  // The auth gates below are early *returns*, so any useState/useCallback
  // beyond this point would cause a "Rendered more hooks than during the
  // previous render" crash the moment auth resolves.
  const [activeTab,  setActiveTab ] = useState('saved')
  const [statsSheet, setStatsSheet] = useState(null)

  // ── Auth gates (early returns AFTER all hooks above) ─────────────────────
  if (authLoading)  return <ProfileLoading />
  if (!user)        return <SignedOutGate onSignIn={() => navigate('/auth')} />

  const displayName  = profile?.full_name?.trim() || user.email?.split('@')[0] || 'משתמש/ת'
  const memberLabel  = memberSince(profile?.created_at || user.created_at)
  const avatarSrc    = profile?.avatar_url || `https://picsum.photos/seed/nz-user-${user.id}/200/200`

  const completedRoutes = routes.filter(r => completedRouteIds.includes(r.id))
  const earnedBadges    = BADGES.filter(b => b.test(userProgress))

  const STATS = [
    {
      icon: RouteIcon, value: savedRoutes.length, label: 'מסלולים שמורים',
      onClick: () => setStatsSheet('saved'),
    },
    {
      icon: CheckCircle2, value: completedRoutes.length, label: 'מסלולים שהושלמו',
      onClick: () => setStatsSheet('completed'),
    },
    {
      icon: MapPin, value: userProgress.addedMemorials, label: 'נקודות שהוספתי',
      onClick: () => navigate('/my-submissions'),
    },
    {
      icon: Award, value: earnedBadges.length, label: 'תגים שהושגו',
      onClick: () => setStatsSheet('badges'),
    },
  ]

  const sheetConfig = {
    saved: {
      title: 'מסלולים שמורים',
      emptyText: 'עדיין לא שמרת מסלולים',
      items: savedRoutes.map(r => ({
        id: r.id, name: r.title,
        subtitle: `${r.distance || ''}${r.distance && r.duration ? ' · ' : ''}${r.duration || ''}`,
        imageUrl: r.imageUrl,
      })),
    },
    completed: {
      title: 'מסלולים שהושלמו',
      emptyText: 'עדיין לא סימנת מסלולים כהושלמו',
      items: completedRoutes.map(r => ({
        id: r.id, name: r.title,
        subtitle: `${r.distance || ''}${r.distance && r.duration ? ' · ' : ''}${r.duration || ''}`,
        imageUrl: r.imageUrl,
      })),
    },
    badges: {
      title: 'התגים שלי',
      emptyText: 'עדיין לא הושגו תגים — צא למסלול או הדלק נר!',
      items: earnedBadges.map(b => ({ id: b.id, name: `${b.icon} ${b.label}`, subtitle: b.desc })),
    },
  }

  return (
    <div dir="rtl" className="flex flex-col min-h-full pb-4">

      {/* ── User header ── */}
      <div className="bg-white px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="flex-1 flex flex-col items-end min-w-0">
            <p className="text-lg font-bold text-slate-800 truncate max-w-full">{displayName}</p>
            <p className="text-sm text-slate-400 mt-0.5">{memberLabel}</p>
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap justify-end">
              <span className="inline-block bg-olive-100 text-olive-700
                             text-xs font-semibold px-2.5 py-0.5 rounded-full">
                תורם פעיל
              </span>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700
                                 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  <ShieldCheck size={11} strokeWidth={2.4} />
                  מנהל
                </span>
              )}
            </div>
          </div>
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-olive-200 flex-shrink-0">
            <img
              src={avatarSrc}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap">
          <Button
            size="sm" rounded="full" variant="secondary" icon={Pencil}
            onClick={() => navigate('/profile/edit')}
          >
            ערוך פרופיל
          </Button>
          <Button
            size="sm" rounded="full" variant="secondary" icon={ListChecks}
            onClick={() => navigate('/my-submissions')}
          >
            התרומות שלי
          </Button>
          {isAdmin && (
            <Button
              size="sm" rounded="full" variant="secondary" icon={ShieldCheck}
              onClick={() => navigate('/admin')}
            >
              פאנל ניהול
            </Button>
          )}
          <Button
            size="sm" rounded="full" variant="ghost" icon={LogOut}
            onClick={async () => {
              await signOut()
              toast.info('התנתקת בהצלחה')
            }}
          >
            התנתקות
          </Button>
        </div>
      </div>

      {/* ── Soft nudge to complete profile (replaces the previous forced redirect) ── */}
      {profileLooksDefault && (
        <div className="mx-5 mt-3 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200
                        flex items-center justify-between gap-2">
          <button
            onClick={() => navigate('/profile/edit')}
            className="text-xs font-bold text-amber-800 underline-offset-2 hover:underline"
          >
            השלם/י עכשיו
          </button>
          <p className="text-xs text-amber-800 text-right leading-snug flex-1">
            הפרופיל שלך עדיין לא מלא — הוסף/הוסיפי שם ותמונה
          </p>
        </div>
      )}

      {/* ── Community feed link ── */}
      <button
        onClick={() => navigate('/community')}
        className="mx-5 mt-4 py-3 bg-olive-50 border border-olive-200 rounded-xl
                   flex items-center justify-center gap-2
                   text-sm font-semibold text-olive-700
                   hover:bg-olive-100 active:scale-95 transition-all duration-150"
      >
        <Users size={16} strokeWidth={2} />
        פעילות הקהילה
      </button>

      {/* ── Stats grid ── */}
      {routesLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-3 px-5 pt-4">
          {STATS.map(({ icon: Icon, value, label, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-slate-100
                         flex flex-col items-end gap-1 text-right w-full
                         hover:border-olive-200 hover:bg-olive-50 active:scale-95
                         transition-all duration-150"
            >
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-slate-800">{value || ''}</p>
                <div className="w-8 h-8 rounded-full bg-olive-50 flex items-center justify-center">
                  <Icon size={16} className="text-olive-700" strokeWidth={1.8} />
                </div>
              </div>
              <p className="text-xs text-slate-400 text-right leading-snug">{label}</p>
            </button>
          ))}
        </div>
      )}

      {/* ── Badges (Task 3) ── */}
      <section className="px-5 pt-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-400">{earnedBadges.length}/{BADGES.length}</span>
          <h2 className="text-base font-bold text-slate-800">התגים שלי</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {BADGES.map(badge => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              earned={earnedBadges.some(b => b.id === badge.id)}
            />
          ))}
        </div>
      </section>

      {/* ── Segmented tab control ── */}
      <div className="mx-5 mt-6 flex bg-slate-100 rounded-xl p-1 gap-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-150
              ${activeTab === tab.id
                ? 'bg-white text-olive-700 shadow-sm'
                : 'text-slate-500'}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="flex flex-col gap-3 px-5 mt-4">

        {activeTab === 'saved' && (
          routesLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 bg-white p-3 rounded-2xl border border-slate-100 animate-pulse">
                <div className="w-16 h-16 bg-slate-200 rounded-xl flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-2 justify-center">
                  <div className="w-3/4 h-4 bg-slate-200 rounded-full" />
                  <div className="w-1/2 h-3 bg-slate-200 rounded-full" />
                </div>
              </div>
            ))
          ) : savedRoutes.length === 0 ? (
            <EmptyState
              icon={<RouteIcon size={24} strokeWidth={1.5} className="text-slate-300" />}
              title="עדיין לא שמרת מסלולים"
              hint="סמן מסלולים מעניינים בסימנייה כדי שתמצא אותם כאן בקלות"
            />
          ) : (
            savedRoutes.map(route => (
              <RouteListItem
                key={route.id}
                route={route}
                onClick={() => navigate(`/routes/${route.id}`)}
              />
            ))
          )
        )}

        {activeTab === 'contributions' && (
          <button
            onClick={() => navigate('/add-point')}
            className="group flex flex-col items-center justify-center gap-3 py-12 px-6
                       bg-white border-2 border-dashed border-olive-200 rounded-2xl
                       hover:border-olive-400 hover:bg-olive-50 active:scale-[0.98]
                       transition-all duration-150"
          >
            <div className="w-14 h-14 rounded-full bg-olive-100 flex items-center justify-center
                            group-hover:bg-olive-200 transition-colors">
              <Plus size={26} strokeWidth={2} className="text-olive-700" />
            </div>
            <p className="text-sm font-bold text-olive-800">
              {userProgress.addedMemorials > 0
                ? `הוספת ${userProgress.addedMemorials} נקודות — הוסף עוד`
                : 'הוסף אנדרטה או אתר הנצחה'}
            </p>
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              שתף את הקהילה במקום הנצחה. הנקודה תופיע במפה לאחר אישור המערכת.
            </p>
            <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-olive-700">
              למעבר להוספת נקודה
              <ChevronLeft size={14} strokeWidth={2.5} />
            </span>
          </button>
        )}
      </div>

      <StatsSheet
        isOpen={!!statsSheet}
        onClose={() => setStatsSheet(null)}
        title={statsSheet ? sheetConfig[statsSheet].title : ''}
        items={statsSheet ? sheetConfig[statsSheet].items : []}
        emptyText={statsSheet ? sheetConfig[statsSheet].emptyText : ''}
      />

    </div>
  )
}
