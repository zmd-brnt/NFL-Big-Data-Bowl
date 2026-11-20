import type { PlayerGroup, PlayerSample } from '../sample/players.ts'

const HIGH = new Set(['compPct', 'yardsPerAttempt', 'pressures', 'sacks', 'hurries', 'topSpeedYdS', 'blocksWonPct'])
const LOW = new Set(['pressuredPct', 'pressuresAllowed', 'sacksAllowed'])

/** Qué lado gana en una métrica. null si la métrica no tiene un mejor o peor claro. */
export function betterSide(metric: string, a: number, b: number): 'a' | 'b' | 'tie' | null {
  if (!HIGH.has(metric) && !LOW.has(metric)) return null
  if (a === b) return 'tie'
  const aWins = HIGH.has(metric) ? a > b : a < b
  return aWins ? 'a' : 'b'
}

export const playersOfGroup = (players: PlayerSample[], group: PlayerGroup): PlayerSample[] =>
  players.filter(p => p.group === group).sort((x, y) => x.displayName.localeCompare(y.displayName))

/** Valor máximo de una métrica en el grupo: la escala común de las barras. */
export const scaleMax = (players: PlayerSample[], metric: string): number =>
  Math.max(1, ...players.map(p => p.metrics[metric] ?? 0))
