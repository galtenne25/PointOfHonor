import { User } from 'lucide-react'

export default function ProfilePage() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4 text-slate-500">
      <div className="p-5 rounded-full bg-slate-100 text-slate-600">
        <User size={40} strokeWidth={1.5} />
      </div>
      <h2 className="text-2xl font-bold text-slate-700">פרופיל</h2>
      <p className="text-sm text-slate-400">פרטי המשתמש יוצגו כאן</p>
    </div>
  )
}
