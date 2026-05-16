import { useState, useEffect } from 'react'
import { getMemorialById } from '../services/memorials'

export function useMemorial(id) {
  const [memorial, setMemorial] = useState(null)
  const [loading,  setLoading ] = useState(true)

  useEffect(() => {
    setLoading(true)
    setMemorial(null)
    const parsed = parseInt(id, 10)
    if (Number.isNaN(parsed)) {
      setLoading(false)
      return
    }
    getMemorialById(parsed)
      .then(setMemorial)
      .catch(() => setMemorial(null))
      .finally(() => setLoading(false))
  }, [id])

  return { memorial, loading }
}
