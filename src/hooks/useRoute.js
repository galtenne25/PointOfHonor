import { useState, useEffect } from 'react'
import { getRouteById } from '../services/routes'

export function useRoute(id) {
  const [route,   setRoute  ] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setRoute(null)
    const parsed = parseInt(id, 10)
    if (Number.isNaN(parsed)) {
      setLoading(false)
      return
    }
    getRouteById(parsed)
      .then(setRoute)
      .catch(() => setRoute(null))
      .finally(() => setLoading(false))
  }, [id])

  return { route, loading }
}
