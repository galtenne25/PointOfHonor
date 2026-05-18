import { useParams, useNavigate } from 'react-router-dom';
import { Navigation2, ChevronRight, Clock, MapPin, Dumbbell, CheckCircle2 } from 'lucide-react';
import { useRoute } from '../hooks/useRoute';
import { useApp } from '../contexts/AppContext';
import RouteTimeline from '../components/routes/RouteTimeline';

// Inlined — no longer imported from routesData
const DIFFICULTY = {
  easy:   { label: 'קל',     color: 'text-emerald-600' },
  medium: { label: 'בינוני', color: 'text-amber-600'   },
  hard:   { label: 'קשה',    color: 'text-red-500'     },
  'קל':     { label: 'קל',     color: 'text-emerald-600' },
  'בינוני': { label: 'בינוני', color: 'text-amber-600'   },
  'קשה':    { label: 'קשה',    color: 'text-red-500'     },
}

function NotFound({ onBack }) {
  return (
    <div
      dir="rtl"
      className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center"
    >
      <span className="text-5xl">🗺️</span>
      <h2 className="text-xl font-bold text-slate-700">המסלול לא נמצא</h2>
      <p className="text-sm text-slate-400">המזהה שחיפשת אינו קיים במאגר.</p>
      <button
        onClick={onBack}
        className="mt-2 px-6 py-2.5 bg-olive-700 text-white text-sm font-semibold rounded-xl
                   active:scale-95 transition-transform"
      >
        חזרה למסלולים
      </button>
    </div>
  );
}

function RouteSkeleton() {
  return (
    <div dir="rtl" className="flex flex-col animate-pulse">
      <div className="w-full h-52 bg-slate-200" />
      <div className="-mt-4 bg-white rounded-t-2xl px-5 pt-5 pb-10 flex flex-col gap-5">
        <div className="h-6 w-3/4 bg-slate-200 rounded-full self-end" />
        <div className="flex gap-2">
          {[1,2,3].map(i => <div key={i} className="h-8 w-24 bg-slate-200 rounded-full" />)}
        </div>
        <div className="h-px bg-slate-100" />
        {[1,2,3].map(i => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 bg-slate-200 rounded-full flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-2 pt-1">
              <div className="h-3 w-2/3 bg-slate-200 rounded-full" />
              <div className="h-3 w-1/2 bg-slate-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RouteDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { route, loading } = useRoute(id);
  const { completedRouteIds, markRouteCompleted } = useApp();
  const isCompleted = completedRouteIds.includes(Number(id)) || completedRouteIds.includes(id);

  if (loading) return <RouteSkeleton />;
  if (!route)  return <NotFound onBack={() => navigate('/routes')} />;

  const diff = DIFFICULTY[route.difficulty] ?? { label: route.difficulty, color: 'text-slate-500' };

  return (
    <div dir="rtl" className="flex flex-col">

      {/* ── Map placeholder ── */}
      <div className="relative">
        <img
          src={route.mapImageUrl}
          alt="מפת המסלול"
          className="w-full h-52 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
        <button
          onClick={() => navigate(-1)}
          aria-label="חזרה"
          className="absolute top-3 right-3 flex items-center gap-1
                     bg-white/85 backdrop-blur-sm text-slate-700
                     text-xs font-semibold px-3 py-1.5 rounded-full shadow
                     active:scale-95 transition-transform"
        >
          <ChevronRight size={13} strokeWidth={2.5} />
          <span>חזרה</span>
        </button>
      </div>

      {/* ── Content card ── */}
      <div className="-mt-4 bg-white rounded-t-2xl px-5 pt-5 pb-10 flex flex-col gap-5">

        <h1 className="text-[1.15rem] font-bold text-slate-800 text-right leading-snug">
          {route.title}
        </h1>

        <div className="flex gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-full
                           text-xs text-slate-600 bg-slate-50">
            <span>{route.distance}</span>
            <MapPin size={12} className="text-olive-600 flex-shrink-0" />
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-full
                           text-xs text-slate-600 bg-slate-50">
            <span>{route.duration}</span>
            <Clock size={12} className="text-olive-600 flex-shrink-0" />
          </span>
          <span className={`flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-full
                            text-xs bg-slate-50 ${diff.color}`}>
            <span>דרגת קושי: {diff.label}</span>
            <Dumbbell size={12} className="flex-shrink-0" />
          </span>
        </div>

        <hr className="border-slate-100" />

        <RouteTimeline waypoints={route.waypoints} />

        <button
          onClick={() => navigate(`/routes/${id}/navigate`)}
          className="w-full py-4 bg-olive-700 text-white text-sm font-bold rounded-2xl
                     flex items-center justify-center gap-2 shadow-md
                     hover:bg-olive-800 active:scale-95 transition-all duration-150"
        >
          <Navigation2 size={18} strokeWidth={2} />
          התחל מסלול
        </button>

        <button
          onClick={() => !isCompleted && markRouteCompleted(Number(id))}
          disabled={isCompleted}
          className={`w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2
                      transition-all duration-150
                      ${isCompleted
                        ? 'bg-emerald-50 text-emerald-700 cursor-default'
                        : 'border border-olive-700 text-olive-700 hover:bg-olive-50 active:scale-95'}`}
        >
          <CheckCircle2 size={18} strokeWidth={2} />
          {isCompleted ? 'המסלול הושלם' : 'סמן כמסלול שהושלם'}
        </button>

      </div>
    </div>
  );
}
