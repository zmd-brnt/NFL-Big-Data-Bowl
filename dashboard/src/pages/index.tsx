import { lazy, type ComponentType } from 'react'
import type { ParsedRoute, RouteId } from '../lib/route'

export type PageProps = { param?: string }

/** Cada página se descarga cuando se abre: la carga inicial no incluye Recharts. */
export const PAGES: Record<RouteId, ComponentType<PageProps>> = {
  overview: lazy(() => import('./Overview')),
  games: lazy(() => import('./Games')),
  plays: lazy(() => import('./Plays')),
  teams: lazy(() => import('./Teams')),
  players: lazy(() => import('./Players')),
  matchups: lazy(() => import('./Matchups')),
  schemes: lazy(() => import('./Schemes')),
  situations: lazy(() => import('./Situations')),
  notes: lazy(() => import('./BoothNotes')),
  glossary: lazy(() => import('./Glossary')),
  data: lazy(() => import('./DataNotes')),
}

export function renderPage(route: ParsedRoute) {
  const Page = PAGES[route.id]
  return <Page key={route.id} param={route.param} />
}
