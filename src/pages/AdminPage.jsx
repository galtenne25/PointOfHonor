import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Check, Trash2, ShieldCheck, MapPin, Route as RouteIcon } from 'lucide-react'
import {
  getPendingMemorials, approveMemorial, rejectMemorial,
} from '../services/memorials'
import {
  getPendingRoutes, approveRoute, rejectRoute,
} from '../services/routes'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { Button, ListSkeleton, EmptyState, ErrorState } from '../components/ui'

const TABS = [
  { id: 'memorials', label: 'אתרים' },
  { id: 'routes',    label: 'מסלולים' },
]

function PendingMemorialCard({ item, onApprove, onReject, busy }) {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex gap-3 items-start">
      <img
        src={item.imageUrl || `https://picsum.photos/seed/nz-pending-mem-${item.id}/200/200`}
        alt={item.name}
        loading="lazy"
        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 text-right">{item.name}</p>
        <p className="text-xs text-slate-400 text-right mt-0.5">
          {item.category}{item.city ? ` · ${item.city}` : ''}
        </p>
        {item.descriptionSnippet && (
          <p className="text-xs text-slate-500 text-right mt-1 line-clamp-2 leading-relaxed">
            {item.descriptionSnippet}
          </p>
        )}
        <div className="flex gap-2 mt-2 justify-end">
          <Button size="sm" rounded="full" variant="secondary" icon={Trash2}
                  loading={busy === 'reject'} onClick={() => onReject(item.id)}>
            דחה
          </Button>
          <Button size="sm" rounded="full" icon={Check}
                  loading={busy === 'approve'} onClick={() => onApprove(item.id)}>
            אשר
          </Button>
        </div>
      </div>
    </div>
  )
}

function PendingRouteCard({ item, onApprove, onReject, busy }) {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex gap-3 items-start">
      <img
        src={item.imageUrl || `https://picsum.photos/seed/nz-pending-rt-${item.id}/200/200`}
        alt={item.title}
        loading="lazy"
        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 text-right">{item.title}</p>
        <p className="text-xs text-slate-400 text-right mt-0.5">
          {item.distance}{item.distance && item.duration ? ' · ' : ''}{item.duration}
        </p>
        {item.description && (
          <p className="text-xs text-slate-500 text-right mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
        <div className="flex gap-2 mt-2 justify-end">
          <Button size="sm" rounded="full" variant="secondary" icon={Trash2}
                  loading={busy === 'reject'} onClick={() => onReject(item.id)}>
            דחה
          </Button>
          <Button size="sm" rounded="full" icon={Check}
                  loading={busy === 'approve'} onClick={() => onApprove(item.id)}>
            אשר
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()

  const [tab, setTab] = useState('memorials')
  const [memorials, setMemorials] = useState([])
  const [routes,    setRoutes   ] = useState([])
  const [loading,   setLoading  ] = useState(true)
  const [error,     setError    ] = useState(null)
  const [busy,      setBusy     ] = useState({})  // { [id]: 'approve'|'reject' }

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [m, r] = await Promise.all([getPendingMemorials(), getPendingRoutes()])
      setMemorials(m)
      setRoutes(r)
    } catch (e) {
      setError(e.message ?? 'שגיאה בטעינת הפריטים הממתינים')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const handleApproveMemorial = useCallback(async (id) => {
    setBusy(b => ({ ...b, [`m-${id}`]: 'approve' }))
    try {
      await approveMemorial(id)
      setMemorials(list => list.filter(x => x.id !== id))
      toast.success('האתר אושר ופורסם')
    } catch (e) {
      toast.error(e.message ?? 'אישור האתר נכשל')
    } finally {
      setBusy(b => { const c = { ...b }; delete c[`m-${id}`]; return c })
    }
  }, [toast])

  const handleRejectMemorial = useCallback(async (id) => {
    const ok = await confirm({
      title:        'דחיית אתר הנצחה',
      message:      'האתר הממתין יידחה ויימחק לצמיתות. להמשיך?',
      confirmLabel: 'דחה ומחק',
      cancelLabel:  'ביטול',
      tone:         'danger',
    })
    if (!ok) return
    setBusy(b => ({ ...b, [`m-${id}`]: 'reject' }))
    try {
      await rejectMemorial(id)
      setMemorials(list => list.filter(x => x.id !== id))
      toast.success('האתר נדחה ונמחק')
    } catch (e) {
      toast.error(e.message ?? 'מחיקת האתר נכשלה')
    } finally {
      setBusy(b => { const c = { ...b }; delete c[`m-${id}`]; return c })
    }
  }, [toast, confirm])

  const handleApproveRoute = useCallback(async (id) => {
    setBusy(b => ({ ...b, [`r-${id}`]: 'approve' }))
    try {
      await approveRoute(id)
      setRoutes(list => list.filter(x => x.id !== id))
      toast.success('המסלול אושר ופורסם')
    } catch (e) {
      toast.error(e.message ?? 'אישור המסלול נכשל')
    } finally {
      setBusy(b => { const c = { ...b }; delete c[`r-${id}`]; return c })
    }
  }, [toast])

  const handleRejectRoute = useCallback(async (id) => {
    const ok = await confirm({
      title:        'דחיית מסלול',
      message:      'המסלול הממתין יידחה ויימחק לצמיתות. להמשיך?',
      confirmLabel: 'דחה ומחק',
      cancelLabel:  'ביטול',
      tone:         'danger',
    })
    if (!ok) return
    setBusy(b => ({ ...b, [`r-${id}`]: 'reject' }))
    try {
      await rejectRoute(id)
      setRoutes(list => list.filter(x => x.id !== id))
      toast.success('המסלול נדחה ונמחק')
    } catch (e) {
      toast.error(e.message ?? 'מחיקת המסלול נכשלה')
    } finally {
      setBusy(b => { const c = { ...b }; delete c[`r-${id}`]; return c })
    }
  }, [toast, confirm])

  const memCount    = memorials.length
  const routeCount  = routes.length
  const currentList = tab === 'memorials' ? memorials : routes

  return (
    <div dir="rtl" className="flex flex-col min-h-full">

      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-0.5 text-olive-700 text-sm font-semibold
                     active:opacity-70 transition-opacity"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
          חזרה
        </button>
        <h1 className="flex-1 text-right text-lg font-bold text-slate-800 pe-1
                       flex items-center gap-2 justify-end">
          <span>פאנל ניהול</span>
          <ShieldCheck size={18} className="text-indigo-600" strokeWidth={2.2} />
        </h1>
      </div>
      <hr className="border-slate-100" />

      {/* Tabs */}
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
            {t.id === 'memorials' ? <MapPin size={14} /> : <RouteIcon size={14} />}
            <span>{t.label}</span>
            <span className={`text-xs font-bold px-1.5 rounded-full
              ${tab === t.id ? 'bg-olive-100 text-olive-700' : 'bg-slate-200 text-slate-500'}`}>
              {t.id === 'memorials' ? memCount : routeCount}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 px-5 mt-4 pb-6">
        {loading ? (
          <ListSkeleton count={3} className="flex flex-col gap-3" />
        ) : error ? (
          <ErrorState title="שגיאה בטעינה" message={error} action={
            <Button size="sm" rounded="full" onClick={refresh}>נסה/י שוב</Button>
          } />
        ) : currentList.length === 0 ? (
          <EmptyState
            icon={Check}
            title="אין פריטים ממתינים"
            message={tab === 'memorials'
              ? 'כל אתרי ההנצחה שנשלחו אושרו או נדחו.'
              : 'כל המסלולים שנשלחו אושרו או נדחו.'}
          />
        ) : tab === 'memorials' ? (
          memorials.map(item => (
            <PendingMemorialCard
              key={item.id}
              item={item}
              busy={busy[`m-${item.id}`]}
              onApprove={handleApproveMemorial}
              onReject={handleRejectMemorial}
            />
          ))
        ) : (
          routes.map(item => (
            <PendingRouteCard
              key={item.id}
              item={item}
              busy={busy[`r-${item.id}`]}
              onApprove={handleApproveRoute}
              onReject={handleRejectRoute}
            />
          ))
        )}
      </div>
    </div>
  )
}
