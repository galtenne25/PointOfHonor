import { Outlet } from 'react-router-dom'
import BottomNavigation from './BottomNavigation'

export default function Layout() {
  return (
    /*
     * Outer wrapper: full viewport, gray desktop background,
     * centers the mobile column.
     */
    <div className="min-h-screen bg-slate-200 flex justify-center">
      {/*
       * Mobile column: max 448 px wide, white background,
       * relative so the fixed nav aligns to the viewport correctly.
       */}
      <div
        dir="rtl"
        className="
          relative w-full max-w-md
          bg-slate-50
          shadow-2xl
          flex flex-col
          min-h-screen
        "
      >
        {/* App header */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-center gap-2 px-4 py-3">
            {/* Star of David placeholder — can be replaced with an SVG asset */}
            <span className="text-olive-700 text-xl leading-none">✡</span>
            <h1 className="text-lg font-bold text-slate-800 tracking-wide">
              נקודת ציון
            </h1>
          </div>
        </header>

        {/* Page content scrolls; bottom padding reserves space for the nav bar */}
        <main className="flex-1 overflow-y-auto scrollbar-hide pb-20">
          <Outlet />
        </main>

        <BottomNavigation />
      </div>
    </div>
  )
}
