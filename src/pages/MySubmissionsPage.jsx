import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Pencil, Trash2, MapPin, Route as RouteIcon, Clock as ClockIcon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { getMyMemorials, deleteMemorialOwn } from '../services/memorials'
import { getMyRoutes, deleteRouteOwn } from '../services/routes'
import { Button, ListSkeleton, EmptyState, ErrorState } from '../components/ui'

const TABS = [
  { id: 'memorials', label: 'אתרי הנצחה', Icon: MapPin },
  { id: 'routes',    label: 'מסלולים',    Icon: RouteIcon },
]

const STATUS_BADGES = {
  pending:  { label: 'ממתין לאישור', cls: 'bg-amber-50 text-amber-700' },
  approved: { label: 'אושר',          cls: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: 'נדחה',          cls: 'bg-red-50 text-red-700' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_BADGES[status] ?? STATUS_BADGES.pending
  return (
    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

function SubmissionCard({ kind, item, onEdit, onDelete, deleting }) {
  const editable = item.status === 'pending'   // only pending submissions are editable
  const title = kind === 'memorial' ? item.name : item.title
  const subtitle = kind === 'memorial'
    ? `${item.location || ''}${item.city ? ` · ${item.city}` : ''}`
    : `${item.distance || ''}${item.distance && item.duration ? ' · ' : ''}${item.duration || ''}`
  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex gap-3 items-start">
      <img
        src={item.imageUrl || `https://picsum.photos/seed/nz-own-${kind}-${item.id}/200/200`}
        alt={title}
        loading="lazy"
        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <StatusBadge status={item.status} />
          <p className="text-sm font-bold text-slate-800 text-right truncate flex-1">{title}</p>
        </div>
        {subtitle && <p className="text-xs text-slate-400 text-right mt-1">{subtitle}</p>}
        <div className="flex gap-2 mt-2 justify-end">
          {editable && (
            <Button size="sm" rounded="full" variant="secondary" icon={Pencil} onClick={() => onEdit(item)}>
              עריכה
            </Button>
          )}
          <Button
            size="sm" rounded="full" variant="danger" icon={Trash2}
            loading={deleting}
            onClick={() => onDelete(item)}
          >
            מחיקה
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function MySubmissionsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const [tab, setTab] = useState('memorials')

  const [memorials, setMemorials] = useState([])
  const [routes,    setRoutes   ] = useState([])
  const [loading,   setLoading  ] = useState(true)
  const [error,     setError    ] = useState(null)
  const [deleting,  setDeleting ] = useState({})

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const [m, r] = await Promise.all([getMyMemorials(user.id), getMyRoutes(user.id)])
      setMemorials(m)
      setRoutes(r)
    } catch (e) {
      setError(e.message ?? 'שגיאה בטעינת התרומות שלך')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { refresh() }, [refresh])

  const handleDelete = useCallback(async (kind, item) => {
    const label = kind === 'memorial' ? 'אתר ההנצחה' : 'המסלול'
    // Premium confirmation modal before a destructive, irreversible delete.
    const ok = await confirm({
      title:        `מחיקת ${label}`,
      message:      `"${item.name || item.title}" יימחק לצמיתות. לא ניתן לשחזר את הפעולה.`,
      confirmLabel: 'מחיקה',
      cancelLabel:  'ביטול',
      tone:         'danger',
    })
    if (!ok) return
    const key = `${kind}-${item.id}`
    setDeleting(b => ({ ...b, [key]: true }))
    try {
      if (kind === 'memorial') {
        await deleteMemorialOwn(item.id)
        setMemorials(list => list.filter(x => x.id !== item.id))
      } else {
        await deleteRouteOwn(item.id)
        setRoutes(list => list.filter(x => x.id !== item.id))
      }
      toast.success('נמחק בהצלחה')
    } catch (e) {
      toast.error(e.message ?? 'מחיקה נכשלה')
    } finally {
      setDeleting(b => { const c = { ...b }; delete c[key]; return c })
    }
  }, [toast, confirm])

  if (!user) {
    return (
      <div dir="rtl" className="p-6 text-center text-slate-500">
        יש להתחבר כדי לראות את התרומות שלך.
        <button className="block mt-2 mx-auto text-olive-700 font-semibold" onClick={() => navigate('/auth')}>
          התחברות
        </button>
      </div>
    )
  }

  const list = tab === 'memorials' ? memorials : routes

  return (
    <div dir="rtl" className="flex flex-col min-h-full">
      <div className="px-5 pt-4 pb-3 flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-0.5 text-olive-700 text-sm font-semibold
                     active:opacity-70 transition-opacity"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
          חזרה
        </button>
        <h1 className="flex-1 text-right text-lg font-bold text-slate-800 pe-1">
          התרומות שלי
        </h1>
      </div>
      <hr className="border-slate-100" />

      <div className="mx-5 mt-4 flex bg-slate-100 rounded-xl p-1 gap-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`
              flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-150
              flex items-center justify-center gap-2
              ${tab === t.id ? 'bg-white text-olive-700 shadow-sm' : 'text-slate-500'}
            `}
          >
            <t.Icon size={14} />
            <span>{t.label}</span>
            <span className={`text-xs font-bold px-1.5 rounded-full
              ${tab === t.id ? 'bg-olive-100 text-olive-700' : 'bg-slate-200 text-slate-500'}`}>
              {t.id === 'memorials' ? memorials.length : routes.length}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 px-5 mt-4 pb-6">
        {loading ? (
          <ListSkeleton count={3} className="flex flex-col gap-3" />
        ) : error ? (
          <ErrorState title="שגיאה בטעינה" message={error} action={
            <Button size="sm" rounded="full" onClick={refresh}>נסה/י שוב</Button>
          } />
        ) : list.length === 0 ? (
          <EmptyState
            icon={tab === 'memorials' ? MapPin : RouteIcon}
            title={tab === 'memorials' ? 'עדיין לא הוספת אתרי הנצחה' : 'עדיין לא הוספת מסלולים'}
            message="כל תרומה שתשלח לאישור תופיע כאן."
            action={
              <Button size="sm" rounded="full"
                onClick={() => navigate(tab === 'memorials' ? '/add-point' : '/add-route')}>
                {tab === 'memorials' ? 'הוסף נקודה' : 'הוסף מסלול'}
              </Button>
            }
          />
        ) : tab === 'memorials' ? (
          memorials.map(item => (
            <SubmissionCard
              key={item.id} kind="memorial" item={item}
              deleting={!!deleting[`memorial-${item.id}`]}
              onEdit={(it) => navigate(`/edit-point/${it.id}`)}
              onDelete={(it) => handleDelete('memorial', it)}
            />
          ))
        ) : (
          routes.map(item => (
            <SubmissionCard
              key={item.id} kind="route" item={item}
              deleting={!!deleting[`route-${item.id}`]}
              onEdit={(it) => navigate(`/edit-route/${it.id}`)}
              onDelete={(it) => handleDelete('route', it)}
            />
          ))
        )}
      </div>
    </div>
  )
}
