import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navigation2, Share2, Flame, ChevronRight, Flag } from 'lucide-react';
import { useMemorial } from '../hooks/useMemorial';
import CandleModal from '../components/common/CandleModal';
import ReportIssueSheet from '../components/common/ReportIssueSheet';

function NotFound({ onBack }) {
  return (
    <div
      dir="rtl"
      className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center"
    >
      <span className="text-5xl">🕯️</span>
      <h2 className="text-xl font-bold text-slate-700">האתר לא נמצא</h2>
      <p className="text-sm text-slate-400">המזהה שחיפשת אינו קיים במאגר.</p>
      <button
        onClick={onBack}
        className="mt-2 px-6 py-2.5 bg-olive-700 text-white text-sm font-semibold rounded-xl
                   active:scale-95 transition-transform"
      >
        חזרה להנצחה
      </button>
    </div>
  );
}

export default function MemorialDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const memorial = useMemorial(id);
  const [candleOpen,  setCandleOpen ] = useState(false);
  const [reportOpen,  setReportOpen ] = useState(false);

  if (!memorial) {
    return <NotFound onBack={() => navigate('/memorials')} />;
  }

  const paragraphs = memorial.fullDescription.split('\n\n').filter(Boolean);

  function handleNavigate() {
    const { lat, lng } = memorial.coordinates;
    window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
  }

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: memorial.name, text: memorial.descriptionSnippet, url });
    } else {
      navigator.clipboard?.writeText(url);
    }
  }

  return (
    <div dir="rtl" className="flex flex-col">

      {/* ── Hero image ── */}
      <div className="relative">
        <img
          src={memorial.imageUrl}
          alt={memorial.name}
          className="w-full h-56 object-cover"
        />
        {/* Back button — floats over the image, top-right in RTL */}
        <button
          onClick={() => navigate(-1)}
          aria-label="חזרה"
          className="absolute top-3 right-3 flex items-center gap-1
                     bg-white/80 backdrop-blur-sm text-slate-700
                     text-xs font-semibold px-3 py-1.5 rounded-full shadow
                     active:scale-95 transition-transform"
        >
          <ChevronRight size={13} strokeWidth={2.5} />
          <span>חזרה</span>
        </button>
      </div>

      {/* ── Content ── */}
      <div className="px-5 pt-5 pb-8 flex flex-col gap-5">

        {/* Title + meta */}
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-slate-800 text-right leading-snug">
            {memorial.name}
          </h1>
          <p className="text-xs text-slate-500 text-right">
            {memorial.hebrewDate} | {memorial.gregorianDate}
          </p>
          <p className="text-xs text-slate-500 text-right">
            {memorial.city} | {memorial.distanceFull}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2.5">
          <button
            onClick={handleNavigate}
            className="flex-1 flex items-center justify-center gap-1.5
                       bg-olive-700 text-white text-sm font-semibold
                       py-2.5 rounded-xl shadow-sm
                       hover:bg-olive-800 active:scale-95 transition-all duration-150"
          >
            <Navigation2 size={15} strokeWidth={2} />
            <span>נווט</span>
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-1.5
                       border border-slate-300 text-slate-700 text-sm font-medium
                       py-2.5 rounded-xl
                       hover:bg-slate-50 active:scale-95 transition-all duration-150"
          >
            <Share2 size={15} strokeWidth={2} />
            <span>שתף</span>
          </button>
          <button
            onClick={() => setCandleOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5
                       border border-slate-300 text-slate-700 text-sm font-medium
                       py-2.5 rounded-xl
                       hover:bg-slate-50 active:scale-95 transition-all duration-150"
          >
            <Flame size={15} strokeWidth={2} />
            <span>הדלקת נר</span>
          </button>
        </div>

        <hr className="border-slate-200" />

        {/* Full description */}
        <div className="flex flex-col gap-3">
          {paragraphs.map((para, i) => (
            <p key={i} className="text-sm text-slate-700 text-right leading-relaxed">
              {para}
            </p>
          ))}
        </div>

        {/* Photo gallery */}
        {memorial.gallery?.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5">
            {memorial.gallery.map((src, i) => (
              <div
                key={i}
                className="aspect-square overflow-hidden rounded-lg bg-slate-100"
              >
                <img
                  src={src}
                  alt={`${memorial.name} — תמונה ${i + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        )}

        {/* Soldier extended profile link */}
        <button
          onClick={() => navigate(`/soldiers/${memorial.id}`)}
          className="w-full py-3 border border-olive-700 text-olive-700 text-sm font-semibold
                     rounded-xl hover:bg-olive-50 active:scale-95 transition-all duration-150"
        >
          פרופיל מלא של הלוחם
        </button>

        {/* Report issue */}
        <button
          onClick={() => setReportOpen(true)}
          className="w-full py-2.5 flex items-center justify-center gap-1.5
                     text-xs text-slate-400 font-medium
                     hover:text-slate-600 active:scale-95 transition-all duration-150"
        >
          <Flag size={13} strokeWidth={2} />
          דווח על שגיאה
        </button>

      </div>

      <CandleModal
        isOpen={candleOpen}
        onClose={() => setCandleOpen(false)}
        siteName={memorial.name}
      />
      <ReportIssueSheet
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        siteName={memorial.name}
      />
    </div>
  );
}
