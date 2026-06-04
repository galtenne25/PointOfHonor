import { Outlet, useLocation, useNavigate, NavLink, Navigate } from 'react-router-dom'
import { LogIn, LogOut, User as UserIcon } from 'lucide-react'
import BottomNavigation from './BottomNavigation'
import { useAuth } from '../contexts/AuthContext'

// Paths reachable without an active Supabase session.
const PUBLIC_PATHS = new Set(['/auth', '/onboarding'])

/**
 * AppAuthGate — auth gate placed inside Layout.
 *   1. While auth is loading: passes through (children render their own skeleton).
 *   2. No session  →  Navigate to /auth immediately.
 *   3. Otherwise renders children.
 *
 * NOTE: we intentionally do NOT hard-redirect on a missing profile row. New
 * users are guided to /profile/edit right after signup (AuthPage) and existing
 * users get a soft banner on the profile page. A hard gate here trapped users
 * whenever the profile row couldn't be created/fetched (DB/RLS/hang), bouncing
 * every navigation back to the edit screen.
 */
function AppAuthGate({ children }) {
  const { user, loading } = useAuth()
  const { pathname } = useLocation()
  if (loading) return children
  if (!user && !PUBLIC_PATHS.has(pathname)) {
    return <Navigate to="/auth" replace state={{ from: { pathname } }} />
  }
  return children
}

function HeaderUserBlock() {
  const navigate  = useNavigate()
  const { user, profile, loading, signOut } = useAuth()

  if (loading) {
    return <div className="w-7 h-7 rounded-full bg-slate-200 animate-pulse" />
  }

  if (!user) {
    return (
      <button
        onClick={() => navigate('/auth')}
        aria-label="התחברות"
        className="flex items-center gap-1 text-xs font-semibold text-olive-700
                   hover:text-olive-800 active:scale-95 transition-all"
      >
        <LogIn size={14} strokeWidth={2.2} />
        <span>התחברות</span>
      </button>
    )
  }

  const name   = profile?.full_name?.trim() || user.email?.split('@')[0] || ''
  const avatar = profile?.avatar_url

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={signOut}
        aria-label="התנתקות"
        title="התנתקות"
        className="text-slate-400 hover:text-red-600 active:scale-90 transition-all"
      >
        <LogOut size={15} strokeWidth={2.2} />
      </button>
      <NavLink
        to="/profile"
        className="flex items-center gap-2 group active:scale-95 transition-transform"
        aria-label={`פרופיל של ${name}`}
      >
        <span className="text-xs font-semibold text-slate-700 group-hover:text-olive-700 max-w-[110px] truncate">
          {name}
        </span>
        <span className="w-7 h-7 rounded-full overflow-hidden border border-olive-200 bg-slate-100 flex items-center justify-center flex-shrink-0">
          {avatar
            ? <img src={avatar} alt={name} className="w-full h-full object-cover" />
            : <UserIcon size={14} className="text-slate-400" strokeWidth={1.8} />}
        </span>
      </NavLink>
    </div>
  )
}

export default function Layout() {
  const { pathname } = useLocation()
  const isMap = pathname === '/map'

  return (
    <div className="min-h-screen bg-slate-200 flex justify-center">
      <div
        dir="rtl"
        className="relative w-full max-w-md bg-slate-50 shadow-2xl flex flex-col min-h-screen"
      >
        {/* App header — brand on the right (RTL start), user identity on the left */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-between gap-2 px-4 py-3">
            <HeaderUserBlock />
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-800 tracking-wide">
                נקודת ציון
              </h1>
              <span className="text-olive-700 text-xl leading-none">✡</span>
            </div>
          </div>
        </header>

        {/*
         * Map page: overflow-hidden so the full-height Leaflet canvas doesn't
         * create a scroll container.
         * All other pages: scrollable, no bottom padding needed since nav
         * is sticky inside the flex column.
         */}
        <main className={`flex-1 scrollbar-hide ${isMap ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          <AppAuthGate>
            <Outlet />
          </AppAuthGate>
        </main>

        <BottomNavigation />
      </div>
    </div>
  )
}
