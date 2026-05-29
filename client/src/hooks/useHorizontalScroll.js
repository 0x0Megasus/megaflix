import { useState, useEffect, useRef, useCallback } from 'react'

export function useHorizontalScroll(deps = []) {
  const containerRef = useRef(null)
  const [canScroll, setCanScroll] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) { setCanScroll(false); return }
    const check = () => setCanScroll(el.scrollWidth > el.clientWidth + 1)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, deps)

  const scroll = useCallback((dir) => {
    if (!containerRef.current) return
    const amount = containerRef.current.clientWidth * 0.75
    containerRef.current.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth'
    })
  }, [])

  return { containerRef, canScroll, scroll, showArrows: canScroll }
}
