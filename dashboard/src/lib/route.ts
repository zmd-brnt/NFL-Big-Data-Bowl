export type RouteId =
  | 'overview' | 'games' | 'plays' | 'teams' | 'players' | 'matchups'
  | 'schemes' | 'situations' | 'notes' | 'glossary' | 'data'

/** group: 0 resumen y partidos, 1 análisis, 2 apoyo, 3 pie de la barra lateral */
export const ROUTES: { id: RouteId; icon: string; group: 0 | 1 | 2 | 3 }[] = [
  { id: 'overview', icon: 'overview', group: 0 },
  { id: 'games', icon: 'games', group: 0 },
  { id: 'plays', icon: 'plays', group: 0 },
  { id: 'teams', icon: 'teams', group: 1 },
  { id: 'players', icon: 'players', group: 1 },
  { id: 'matchups', icon: 'matchups', group: 1 },
  { id: 'schemes', icon: 'schemes', group: 1 },
  { id: 'situations', icon: 'situations', group: 1 },
  { id: 'notes', icon: 'notes', group: 2 },
  { id: 'glossary', icon: 'glossary', group: 2 },
  { id: 'data', icon: 'data', group: 3 },
]

export interface ParsedRoute { id: RouteId; param?: string }

export function parseHash(hash: string): ParsedRoute {
  const [, id, rawParam] = hash.replace(/^#/, '').split('/')
  const found = ROUTES.find(r => r.id === id)
  if (!found) return { id: 'overview' }
  if (!rawParam) return { id: found.id }
  let param = rawParam
  try { param = decodeURIComponent(rawParam) } catch { /* se queda tal cual */ }
  return { id: found.id, param }
}
