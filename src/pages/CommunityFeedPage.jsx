import { useState, useEffect } from 'react'
import { Bell, Flame, Check, MapPin, FileText, Inbox } from 'lucide-react'
import { EmptyState, ErrorState } from '../components/ui'
import {
  getCommunityActivities,
  getActivityById,
  subscribeToActivityInserts,
} from '../services/community'

const FILTERS = [
  { id: 'all',    label: 'הכל'     },
  { id: 'candle', label: 'נרות'    },
  { id: 'route',  label: 'מסלולים' },
  { id: 'visit',  label: 'ביקורים' },
  { id: 'story',  label: 'סיפורים' },
]

const BADGE_CFG = {
  candle: { bg: 'bg-amber-50',   text: 'text-amber-600',  Icon: Flame    },
  route:  { bg: 'bg-olive-50',   text: 'text-olive-700',  Icon: Check    },
  visit:  { bg: 'bg-indigo-50',  text: 'text-indigo-600', Icon: MapPin   },
  story:  { bg: 'bg-pink-50',    text: 'text-pink-700',   Icon: FileText },
}

function ActivityBadge({ type }) {
  const cfg = BADGE_CFG[type] || BADGE_CFG.visit
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
      <cfg.Icon size={14} strokeWidth={2.2} />
    </div>
  )
}

function FeedSkeleton() {
  return (
    <>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100
                                flex items-center gap-3 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-3 w-3/4 bg-slate-200 rounded-full self-end" />
            <div className="h-3 w-1/2 bg-slate-200 rounded-full self-end" />
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0" />
        </div>
      ))}
    </>
  )
}

export default function CommunityFeedPage() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [feedItems,    setFeedItems   ] = useState([])
  const [loading,      setLoading     ] = useState(true)
  const [error,        setError       ] = useState(null)

  // Initial fetch
  useEffect(() => {
    setLoading(true)
    getCommunityActivities()
      .then(setFeedItems)
      .catch(err => setError(err.message ?? 'שגיאה בטעינת הפעילות'))
      .finally(() => setLoading(false))
  }, [])

  // Realtime: prepend new activities as they arrive from any user
  useEffect(() => {
    const unsubscribe = subscribeToActivityInserts(
      'rt-community-feed',
      async (payload) => {
        const activity = await getActivityById(payload.new.id)
        if (!activity) return
        setFeedItems(prev =>
          // De-duplicate in case the initial fetch and the realtime event race
          prev.some(item => item.id === activity.id)
            ? prev
            : [activity, ...prev]
        )
      }
    )
    return unsubscribe
  }, [])

  const visible = activeFilter === 'all'
    ? feedItems
    : feedItems.filter(item => item.type === activeFilter)

  return (
    <div dir="rtl" className="flex flex-col min-h-full bg-slate-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-4 pt-4 pb-0 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full bg-green-500"
              style={{ animation: 'pulse 2s ease-in-out infinite' }}
            />
            <span className="text-xs font-semibold text-green-500">חי</span>
          </div>
          <h1 className="text-base font-bold text-slate-800">פעילות הקהילה</h1>
          <button className="text-slate-400 hover:text-slate-600 transition-colors active:scale-95">
            <Bell size={20} strokeWidth={1.8} />
          </button>
        </div>

        <div className="flex flex-row-reverse gap-2 overflow-x-auto scrollbar-hide pb-3">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0
                transition-colors active:scale-95
                ${activeFilter === f.id
                  ? 'bg-olive-700 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="flex bg-white border-b border-slate-200">
        {[
          { value: '1,247', label: 'נרות הודלקו'    },
          { value: '348',   label: 'מסלולים הושלמו' },
          { value: '89',    label: 'סיפורים נוספו'  },
        ].map((stat, i) => (
          <div
            key={i}
            className={`flex-1 py-3 text-center ${i < 2 ? 'border-l border-slate-200' : ''}`}
          >
            <p className="text-base font-bold text-olive-700">{stat.value}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Feed ── */}
      <div className="flex flex-col gap-2 px-4 py-3">
        {loading ? (
          <FeedSkeleton />
        ) : error ? (
          <ErrorState title="שגיאה בטעינת הפעילות" message={error} />
        ) : (
          <>
            {visible.map((item, idx) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100 flex items-center gap-3"
                style={{ animation: `fadeSlideIn 0.3s ease-out ${idx * 0.05}s both` }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center
                             text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                >
                  {item.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 leading-snug text-right">
                    <span className="font-bold">{item.name}</span>
                    {' '}{item.action}{' '}
                    <span className="font-bold text-olive-700">{item.site}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 text-right">{item.time}</p>
                </div>
                <ActivityBadge type={item.type} />
              </div>
            ))}

            {visible.length === 0 && (
              <EmptyState
                icon={Inbox}
                title="אין פעילות להצגה"
                message="נסה לבחור קטגוריה אחרת או חזור מאוחר יותר"
              />
            )}

            <button
              className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200
                         text-sm text-slate-400 font-medium mt-1
                         hover:border-slate-300 hover:text-slate-500 active:scale-95 transition-all duration-150"
            >
              טען פעילויות נוספות
            </button>
          </>
        )}
      </div>

    </div>
  )
}
