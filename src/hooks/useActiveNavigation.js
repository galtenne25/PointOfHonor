import { useState, useEffect } from 'react'

export function useActiveNavigation() {
  const [elapsed,  setElapsed ] = useState(0)
  const [offRoute, setOffRoute] = useState(true)
  const [offline,  setOffline ] = useState(true)

  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  function formatTime(s) {
    const h  = Math.floor(s / 3600)
    const m  = Math.floor((s % 3600) / 60)
    const ss = s % 60
    if (h > 0)
      return `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  }

  return { elapsed, formattedTime: formatTime(elapsed), offRoute, setOffRoute, offline, setOffline }
}
