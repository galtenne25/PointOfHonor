import { useParams, useNavigate } from 'react-router-dom';
import { Navigation2 } from 'lucide-react';
import { ChevronRight, Clock, MapPin, Dumbbell } from 'lucide-react';
import { useRoute } from '../hooks/useRoute';
import { DIFFICULTY } from '../data/routesData';
import RouteTimeline from '../components/routes/RouteTimeline';

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

export default function RouteDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const route    = useRoute(id);

  if (!route) return <NotFound onBack={() => navigate('/routes')} />;

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

        {/* Gradient overlay so the back button stays readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />

        {/* Back button */}
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

      {/* ── Content card — overlaps the map bottom ── */}
      <div className="-mt-4 bg-white rounded-t-2xl px-5 pt-5 pb-10 flex flex-col gap-5">

        {/* Title */}
        <h1 className="text-[1.15rem] font-bold text-slate-800 text-right leading-snug">
          {route.title}
        </h1>

        {/* Meta pills */}
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

        {/* Waypoints timeline */}
        <RouteTimeline waypoints={route.waypoints} />

        {/* Start navigation CTA */}
        <button
          onClick={() => navigate(`/routes/${id}/navigate`)}
          className="w-full py-4 bg-olive-700 text-white text-sm font-bold rounded-2xl
                     flex items-center justify-center gap-2 shadow-md
                     hover:bg-olive-800 active:scale-95 transition-all duration-150"
        >
          <Navigation2 size={18} strokeWidth={2} />
          התחל מסלול
        </button>

      </div>
    </div>
  );
}
