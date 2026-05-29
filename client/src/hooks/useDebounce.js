import { useState, useEffect, useRef, useCallback } from 'react'

export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)
  const timerRef = useRef()

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timerRef.current)
  }, [value, delay])

  const flush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setDebounced(value)
  }, [value])

  return { debounced, flush }
}
