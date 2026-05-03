import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div dir="rtl" className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="text-6xl">🗺️</span>
      <h1 className="text-2xl font-bold text-slate-800">הדף לא נמצא</h1>
      <p className="text-sm text-slate-400">הכתובת שחיפשת אינה קיימת</p>
      <button
        onClick={() => navigate('/map', { replace: true })}
        className="bg-olive-700 text-white font-semibold rounded-xl px-6 py-2.5
                   hover:bg-olive-800 active:scale-95 transition-all duration-150"
      >
        חזרה למפה
      </button>
    </div>
  )
}
