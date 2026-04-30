import { RouteIcon } from 'lucide-react'

export default function RoutesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4 text-slate-500">
      <div className="p-5 rounded-full bg-sky-50 text-sky-600">
        <RouteIcon size={40} strokeWidth={1.5} />
      </div>
      <h2 className="text-2xl font-bold text-slate-700">מסלולים</h2>
      <p className="text-sm text-slate-400">מסלולי עלייה לרגל יוצגו כאן</p>
    </div>
  )
}
