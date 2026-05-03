import { useState, useCallback } from 'react'

export default function useChips(initialChips) {
  const [chips, setChips] = useState(initialChips)
  const toggleChip = useCallback(
    id => setChips(prev => prev.map(c => ({ ...c, active: c.id === id ? !c.active : c.active }))),
    []
  )
  return [chips, toggleChip]
}
