import { rng, between, round1 } from './rng.ts'
import { FORMATIONS, COVERAGES } from './teams.ts'

export interface SchemeCell { formation: string; coverage: string; plays: number; compPct: number; yardsPerAttempt: number }
export interface PlayActionSplit { withPlayAction: { plays: number; compPct: number; yardsPerAttempt: number }; without: { plays: number; compPct: number; yardsPerAttempt: number } }

export function makeSchemes(): { cells: SchemeCell[]; playAction: PlayActionSplit } {
  const r = rng(909)
  const covEffect: Record<string, number> = { 'Cover-3': 0, 'Cover-1': -1.5, 'Cover-2': 3.5, Quarters: 2.5, '2-Man': -3.5, 'Cover-0': -6 }
  const cells = FORMATIONS.flatMap(formation =>
    COVERAGES.map(coverage => ({
      formation, coverage,
      plays: Math.round(between(r, 20, formation === 'SHOTGUN' ? 600 : 160)),
      compPct: round1(61 + covEffect[coverage] + between(r, -3, 3)),
      yardsPerAttempt: round1(6.6 + covEffect[coverage] * 0.12 + between(r, -0.6, 0.6)),
    })),
  )
  return {
    cells,
    playAction: {
      withPlayAction: { plays: 2038, compPct: 64.2, yardsPerAttempt: 7.9 },
      without: { plays: 6519, compPct: 60.1, yardsPerAttempt: 6.4 },
    },
  }
}

export type DownBucket = '1-3' | '4-6' | '7-10' | '11+'
export interface SituationCell { down: number; bucket: DownBucket; plays: number; compPct: number; yardsPerAttempt: number; firstDownPct: number }
export interface SituationRow { id: 'redZone' | 'twoMinute' | 'rest'; plays: number; compPct: number; yardsPerAttempt: number; sackPct: number }

export function makeSituations(): { matrix: SituationCell[]; special: SituationRow[] } {
  const r = rng(1212)
  const buckets: DownBucket[] = ['1-3', '4-6', '7-10', '11+']
  const base = { '1-3': 72, '4-6': 52, '7-10': 36, '11+': 21 } as const
  const matrix = [1, 2, 3].flatMap(down =>
    buckets.map(bucket => ({
      down, bucket,
      plays: Math.round(between(r, 60, 900)),
      compPct: round1(between(r, 52, 72) - (bucket === '11+' ? 4 : 0)),
      yardsPerAttempt: round1(between(r, 4.8, 8.2) + (bucket === '11+' ? 0.6 : 0)),
      firstDownPct: round1(base[bucket] + (down === 3 ? -6 : 0) + between(r, -4, 4)),
    })),
  )
  return {
    matrix,
    special: [
      { id: 'redZone', plays: 940, compPct: 55.8, yardsPerAttempt: 4.9, sackPct: 6.9 },
      { id: 'twoMinute', plays: 1210, compPct: 63.5, yardsPerAttempt: 6.9, sackPct: 6.1 },
      { id: 'rest', plays: 6407, compPct: 61.4, yardsPerAttempt: 6.7, sackPct: 6.2 },
    ],
  }
}
