import { rng, between, round1 } from './rng.ts'

export const TEAM_IDS = [
  'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC',
  'LV', 'LAC', 'LAR', 'MIA', 'MIN', 'NE', 'NO', 'NYG', 'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB', 'TEN', 'WAS',
] as const

export const FORMATIONS = ['SHOTGUN', 'EMPTY', 'SINGLEBACK', 'I_FORM', 'PISTOL'] as const
export const COVERAGES = ['Cover-3', 'Cover-1', 'Cover-2', 'Quarters', '2-Man', 'Cover-0'] as const
export type MetricKey = 'comp' | 'ya' | 'press' | 'sack'

export interface Share { name: string; share: number }
export interface TeamProfile {
  id: string
  weekly: Record<MetricKey, number[]>
  avg: Record<MetricKey, number>
  formations: Share[]
  coverages: Share[]
}

function shares(names: readonly string[], weights: number[], r: () => number): Share[] {
  const raw = weights.map(w => w * between(r, 0.7, 1.3))
  const total = raw.reduce((a, b) => a + b, 0)
  return names.map((name, i) => ({ name, share: round1((raw[i] / total) * 100) }))
}

export function makeTeams(): TeamProfile[] {
  return TEAM_IDS.map((id, i) => {
    const r = rng(i * 97 + 11)
    const base = { comp: between(r, 57, 66), ya: between(r, 5.6, 7.6), press: between(r, 24, 38), sack: between(r, 4, 8) }
    const noise = { comp: 2.2, ya: 0.5, press: 3, sack: 1.2 }
    const weekly = {} as Record<MetricKey, number[]>
    const avg = {} as Record<MetricKey, number>
    for (const k of ['comp', 'ya', 'press', 'sack'] as const) {
      weekly[k] = Array.from({ length: 8 }, () => round1(base[k] + (r() - 0.5) * 2 * noise[k]))
      avg[k] = round1(weekly[k].reduce((a, b) => a + b, 0) / 8)
    }
    return {
      id, weekly, avg,
      formations: shares(FORMATIONS, [62, 8, 18, 5, 7], r),
      coverages: shares(COVERAGES, [30, 24, 14, 14, 10, 8], r),
    }
  })
}
