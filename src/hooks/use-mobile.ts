
'use client'

import { useState, useEffect } from 'react'

export function useIsMobile(query: string = '(max-width: 1024px)') {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const handler = () => setIsMobile(mediaQuery.matches)
    
    handler()
    mediaQuery.addEventListener('change', handler)

    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return isMobile
}
