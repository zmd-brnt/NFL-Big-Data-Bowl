import type { MatchupSample } from '../sample/players.ts'

export type MatchupKey = 'blocksWonPct' | 'pressuresAllowed' | 'sacksAllowed' | 'snaps'

/** De mayor a menor por la columna elegida; empata por id. No modifica la lista original. */
export const sortMatchups = (rows: MatchupSample[], key: MatchupKey): MatchupSample[] =>
  [...rows].sort((a, b) => b[key] - a[key] || a.id - b.id)
