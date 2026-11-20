import type { PlaySample } from '../sample/plays.ts'

export type Bucket = '1-3' | '4-6' | '7-10' | '11+'
export interface PlayFilters { down: number | 'all'; bucket: Bucket | 'all'; quarter: number | 'all' }

export function distanceBucket(yardsToGo: number): Bucket {
  if (yardsToGo <= 3) return '1-3'
  if (yardsToGo <= 6) return '4-6'
  if (yardsToGo <= 10) return '7-10'
  return '11+'
}

/** Primer down por pase: completo o scramble que alcanza la distancia (sin penalizaciones). */
export function isFirstDown(p: Pick<PlaySample, 'passResult' | 'prePenaltyPlayResult' | 'yardsToGo'>): boolean {
  return (p.passResult === 'C' || p.passResult === 'R') && p.prePenaltyPlayResult >= p.yardsToGo
}

export function filterPlays(plays: PlaySample[], f: PlayFilters): PlaySample[] {
  return plays.filter(p =>
    (f.down === 'all' || p.down === f.down) &&
    (f.bucket === 'all' || distanceBucket(p.yardsToGo) === f.bucket) &&
    (f.quarter === 'all' || p.quarter === f.quarter))
}

/** Yarda de la línea de scrimmage medida desde la zona de gol del equipo en ataque (0 a 100). */
export function ownYardLine(p: Pick<PlaySample, 'yardlineSide' | 'possessionTeam' | 'yardlineNumber'>): number {
  return p.yardlineSide === p.possessionTeam ? p.yardlineNumber : 100 - p.yardlineNumber
}
