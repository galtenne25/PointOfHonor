import { Outlet, useLocation } from 'react-router-dom'
import BottomNavigation from './BottomNavigation'

export default function Layout() {
  const { pathname } = useLocation()
  const isMap = pathname === '/map'

  return (
    <div className="min-h-screen bg-slate-200 flex justify-center">
      <div
        dir="rtl"
        className="relative w-full max-w-md bg-slate-50 shadow-2xl flex flex-col min-h-screen"
      >
        {/* App header */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-center gap-2 px-4 py-3">
            <span className="text-olive-700 text-xl leading-none">✡</span>
            <h1 className="text-lg font-bold text-slate-800 tracking-wide">
              נקודת ציון
            </h1>
          </div>
        </header>

        {/*
         * Map page: overflow-hidden so the full-height Leaflet canvas doesn't
         * create a scroll container.
         * All other pages: scrollable, no bottom padding needed since nav
         * is sticky inside the flex column.
         */}
        <main className={`flex-1 scrollbar-hide ${isMap ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          <Outlet />
        </main>

        <BottomNavigation />
      </div>
    </div>
  )
}
