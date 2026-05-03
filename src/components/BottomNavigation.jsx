import { NavLink, useLocation } from 'react-router-dom'
import { Map, Flame, RouteIcon, User } from 'lucide-react'

const tabs = [
  { to: '/profile', label: 'פרופיל', Icon: User },
  { to: '/routes',   label: 'מסלולים', Icon: RouteIcon },
  { to: '/memorials', label: 'הנצחה', Icon: Flame },
  { to: '/map',      label: 'מפה',     Icon: Map },
]

export default function BottomNavigation() {
  return (
    <nav
      dir="rtl"
      className="
        sticky bottom-0 z-50
        bg-white border-t border-slate-200
        flex items-stretch
      "
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `
            flex flex-col items-center justify-center gap-0.5
            flex-1 py-2 text-xs font-medium
            transition-colors duration-150
            ${isActive
              ? 'text-olive-700'
              : 'text-slate-400 hover:text-slate-600'}
          `}
        >
          {({ isActive }) => (
            <>
              <span
                className={`
                  p-1 rounded-xl transition-colors duration-150
                  ${isActive ? 'bg-olive-100' : ''}
                `}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
              </span>
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
