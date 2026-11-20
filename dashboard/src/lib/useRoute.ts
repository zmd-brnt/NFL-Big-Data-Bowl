import { useEffect, useState } from 'react'
import { parseHash, type ParsedRoute } from './route'

/** Ruta actual según el hash de la URL (#/games, #/glossary/cover0). */
export function useRoute(): ParsedRoute {
  const [route, setRoute] = useState<ParsedRoute>(() => parseHash(window.location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
