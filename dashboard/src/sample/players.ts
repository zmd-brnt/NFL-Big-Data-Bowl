import { rng, between, round1, pick } from './rng.ts'
import { TEAM_IDS } from './teams.ts'

export type PlayerGroup = 'QB' | 'RUSH' | 'BLOCK'

export const METRIC_KEYS: Record<PlayerGroup, readonly string[]> = {
  QB: ['compPct', 'yardsPerAttempt', 'pressuredPct', 'timeToThrowS'],
  RUSH: ['pressures', 'sacks', 'hurries', 'topSpeedYdS'],
  BLOCK: ['blocksWonPct', 'pressuresAllowed', 'sacksAllowed', 'snaps'],
}

/** Campos de players.csv más el equipo y el dorsal (que salen de tracking). */
export interface PlayerSample {
  nflId: number
  displayName: string
  officialPosition: string
  group: PlayerGroup
  team: string
  jersey: number
  heightIn: number
  weightLb: number
  collegeName: string
  age: number
  metrics: Record<string, number>
}

const POSITIONS: Record<PlayerGroup, string[]> = { QB: ['QB'], RUSH: ['DE', 'OLB', 'DT'], BLOCK: ['T', 'G', 'C'] }
const BODY: Record<PlayerGroup, [number, number, number, number]> = { QB: [74, 78, 215, 240], RUSH: [74, 78, 255, 290], BLOCK: [75, 79, 305, 335] }

export function makePlayers(): PlayerSample[] {
  const r = rng(77)
  const out: PlayerSample[] = []
  const groups: PlayerGroup[] = ['QB', 'RUSH', 'BLOCK']
  groups.forEach((group, gi) => {
    for (let i = 0; i < 6; i++) {
      const [h0, h1, w0, w1] = BODY[group]
      const metrics: Record<string, number> =
        group === 'QB'
          ? { compPct: round1(between(r, 58, 70)), yardsPerAttempt: round1(between(r, 5.8, 9.1)), pressuredPct: round1(between(r, 20, 38)), timeToThrowS: round1(between(r, 2.2, 3.3)) }
          : group === 'RUSH'
            ? { pressures: Math.round(between(r, 12, 34)), sacks: Math.round(between(r, 1, 10)), hurries: Math.round(between(r, 8, 24)), topSpeedYdS: round1(between(r, 6.6, 8.1)) }
            : { blocksWonPct: round1(between(r, 80, 97)), pressuresAllowed: Math.round(between(r, 2, 16)), sacksAllowed: Math.round(between(r, 0, 4)), snaps: Math.round(between(r, 180, 330)) }
      out.push({
        nflId: 50000 + gi * 100 + i,
        displayName: `${String.fromCharCode(65 + gi * 6 + i)}. Sample`,
        officialPosition: pick(r, POSITIONS[group]),
        group,
        team: pick(r, TEAM_IDS),
        jersey: group === 'QB' ? Math.round(between(r, 1, 19)) : group === 'RUSH' ? Math.round(between(r, 90, 99)) : Math.round(between(r, 60, 79)),
        heightIn: Math.round(between(r, h0, h1)),
        weightLb: Math.round(between(r, w0, w1)),
        collegeName: 'Sample State',
        age: Math.round(between(r, 22, 36)),
        metrics,
      })
    }
  })
  return out
}

/** Una fila por duelo bloqueador contra pass rusher (pffScoutingData). */
export interface MatchupSample {
  id: number
  blocker: { name: string; team: string; pos: string }
  rusher: { name: string; team: string; pos: string }
  snaps: number
  blocksWonPct: number
  pressuresAllowed: number
  sacksAllowed: number
}

export function makeMatchups(): MatchupSample[] {
  const r = rng(303)
  return Array.from({ length: 16 }, (_, i) => {
    const snaps = Math.round(between(r, 18, 70))
    const won = round1(between(r, 74, 98))
    const allowed = Math.round(snaps * (1 - won / 100) * between(r, 0.8, 1.4))
    return {
      id: i + 1,
      blocker: { name: `${String.fromCharCode(65 + i)}. Block`, team: pick(r, TEAM_IDS), pos: pick(r, ['T', 'G', 'C']) },
      rusher: { name: `${String.fromCharCode(65 + i)}. Rush`, team: pick(r, TEAM_IDS), pos: pick(r, ['DE', 'OLB', 'DT']) },
      snaps,
      blocksWonPct: won,
      pressuresAllowed: allowed,
      sacksAllowed: Math.round(allowed * between(r, 0.1, 0.4)),
    }
  })
}
