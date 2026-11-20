import { rng, between, round1 } from './rng.ts'
import { TEAM_IDS, makeTeams } from './teams.ts'

export const GAMES_PER_WEEK = [16, 16, 16, 16, 16, 14, 13, 15]

export interface TeamGameStats { comp: number; ya: number; press: number; sack: number; attempts: number }
export interface GameSample {
  gameId: number
  week: number
  home: string
  away: string
  kickoffIso: string
  stats: { home: TeamGameStats; away: TeamGameStats }
}

const SUNDAY_WEEK_1 = Date.UTC(2021, 8, 12)
const DAY = 86_400_000
const iso = (week: number, dayOffset: number, h: number, m: number) =>
  new Date(SUNDAY_WEEK_1 + (week - 1) * 7 * DAY + dayOffset * DAY + (h * 60 + m) * 60_000).toISOString().replace('.000Z', 'Z')

/** Jueves 8:20 p.m. ET, domingos 1:00 y 4:05 p.m., domingo 8:20 p.m. y lunes 8:15 p.m. (hora del Este). */
function kickoff(week: number, i: number, n: number): string {
  if (i === 0) return iso(week, -2, 0, 20)
  if (i === n - 1) return iso(week, 2, 0, 15)
  if (i === n - 2) return iso(week, 1, 0, 20)
  return i <= 8 ? iso(week, 0, 17, 0) : iso(week, 0, 20, 5)
}

export function makeGames(week: number): GameSample[] {
  const r = rng(week * 31 + 5)
  const ids = [...TEAM_IDS]
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
  }
  const teams = new Map(makeTeams().map(t => [t.id, t]))
  const n = GAMES_PER_WEEK[week - 1]
  const statsFor = (id: string): TeamGameStats => {
    const w = teams.get(id)!.weekly
    const k = week - 1
    return {
      comp: round1(w.comp[k] + (r() - 0.5) * 3), ya: round1(w.ya[k] + (r() - 0.5) * 0.8),
      press: round1(w.press[k] + (r() - 0.5) * 4), sack: round1(w.sack[k] + (r() - 0.5) * 2),
      attempts: Math.round(between(r, 26, 46)),
    }
  }
  return Array.from({ length: n }, (_, i) => ({
    gameId: 2021090900 + (week - 1) * 100 + i,
    week,
    home: ids[i * 2],
    away: ids[i * 2 + 1],
    kickoffIso: kickoff(week, i, n),
    stats: { home: statsFor(ids[i * 2]), away: statsFor(ids[i * 2 + 1]) },
  }))
}
