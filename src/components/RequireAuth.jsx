import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function FullPageSpinner() {
  return (
    <div dir="rtl" className="flex-1 flex items-center justify-center py-20">
      <div className="w-10 h-10 rounded-full border-2 border-olive-200 border-t-olive-700 animate-spin" />
    </div>
  )
}

/** Redirects to /auth (preserving original target) if no session. */
export function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageSpinner />
  if (!user)   return <Navigate to="/auth" replace state={{ from: location }} />
  return children
}

/** Requires both auth + isAdmin. Non-admins are bounced to the map. */
export function RequireAdmin({ children }) {
  const { user, loading, isAdmin } = useAuth()
  const location = useLocation()
  if (loading)  return <FullPageSpinner />
  if (!user)    return <Navigate to="/auth" replace state={{ from: location }} />
  if (!isAdmin) return <Navigate to="/map" replace />
  return children
}
