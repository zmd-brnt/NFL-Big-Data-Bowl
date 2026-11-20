import { rng, between, pick } from './rng.ts'
import { TEAM_IDS, FORMATIONS, COVERAGES } from './teams.ts'

export type PassResult = 'C' | 'I' | 'S' | 'R' | 'IN'

/** Columnas con los nombres de plays.csv. */
export interface PlaySample {
  gameId: number
  playId: number
  quarter: number
  gameClock: string
  down: number
  yardsToGo: number
  possessionTeam: string
  defensiveTeam: string
  yardlineSide: string
  yardlineNumber: number
  offenseFormation: string
  pff_passCoverage: string
  pff_playAction: 0 | 1
  passResult: PassResult
  prePenaltyPlayResult: number
  playDescription: string
}

const WEIGHTS: [PassResult, number][] = [['C', 0.54], ['I', 0.322], ['S', 0.063], ['R', 0.052], ['IN', 0.022]]
const NAMES = ['J.Sample', 'M.Sample', 'T.Sample', 'D.Sample', 'K.Sample']
const TARGETS = ['A.Sample', 'B.Sample', 'C.Sample', 'E.Sample', 'F.Sample']

function result(r: () => number): PassResult {
  let x = r()
  for (const [k, w] of WEIGHTS) { if ((x -= w) < 0) return k }
  return 'C'
}

function describe(p: Omit<PlaySample, 'playDescription'>, qb: string, target: string, r: () => number): string {
  const lane = pick(r, ['short left', 'short middle', 'short right', 'deep left', 'deep middle', 'deep right'])
  const shotgun = p.offenseFormation === 'SHOTGUN' ? '(Shotgun) ' : ''
  const head = `(${p.gameClock}) ${shotgun}${qb}`
  switch (p.passResult) {
    case 'C': return `${head} pass ${lane} to ${target} for ${p.prePenaltyPlayResult} yards.`
    case 'I': return `${head} pass incomplete ${lane} to ${target}.`
    case 'S': return `${head} sacked for ${Math.abs(p.prePenaltyPlayResult)} yards.`
    case 'R': return `${head} scrambles for ${p.prePenaltyPlayResult} yards.`
    default: return `${head} pass ${lane} intended for ${target} is intercepted.`
  }
}

export function makePlays(count = 80): PlaySample[] {
  const r = rng(2021)
  return Array.from({ length: count }, (_, i) => {
    const poss = pick(r, TEAM_IDS)
    let def = pick(r, TEAM_IDS)
    while (def === poss) def = pick(r, TEAM_IDS)
    const down = Math.min(4, 1 + Math.floor(r() * r() * 4 + r() * 1.6))
    const pr = result(r)
    const gain = pr === 'C' ? Math.round(between(r, 0, 1) ** 1.8 * 42) : pr === 'S' ? -Math.round(between(r, 3, 11)) : pr === 'R' ? Math.round(between(r, 0, 12)) : 0
    const minutes = Math.floor(r() * 15)
    const base = {
      gameId: 2021090900 + Math.floor(r() * 8) * 100 + Math.floor(r() * 14),
      playId: 40 + i * 37,
      quarter: 1 + Math.floor(r() * 4),
      gameClock: `${String(minutes).padStart(2, '0')}:${String(Math.floor(r() * 60)).padStart(2, '0')}`,
      down,
      yardsToGo: down === 1 ? 10 : Math.max(1, Math.round(between(r, 1, 14))),
      possessionTeam: poss,
      defensiveTeam: def,
      yardlineSide: r() < 0.5 ? poss : def,
      yardlineNumber: Math.round(between(r, 5, 50)),
      offenseFormation: pick(r, FORMATIONS),
      pff_passCoverage: pick(r, COVERAGES),
      pff_playAction: (r() < 0.24 ? 1 : 0) as 0 | 1,
      passResult: pr,
      prePenaltyPlayResult: gain,
    }
    return { ...base, playDescription: describe(base, pick(r, NAMES), pick(r, TARGETS), r) }
  })
}
