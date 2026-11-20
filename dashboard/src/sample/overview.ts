import type { MetricKey } from './teams.ts'

export const KPI_KEYS: MetricKey[] = ['comp', 'ya', 'press', 'sack']

export interface OverviewData {
  weeklyKpi: Record<MetricKey, number[]>
  coverage: { pff_passCoverage: string; compPct: number }[]
  leagueComp: number
  best: { away: string; home: string; week: number; kickoffIso: string; passYards: number; bigPlays: number }
  player: { name: string; pos: string; team: string; jersey: number; college: string; yardsPerAttempt: number; compPct: number; heightIn: number; weightLb: number }
  team: { id: string; yardsPerAttempt: number; pressedPct: number }
  rusher: { name: string; pos: string; team: string; jersey: number; pressures: number; sacks: number; topSpeedYdS: number }
  featuredPlay: { down: number; yardsToGo: number; yardlineSide: string; yardlineNumber: number; offenseFormation: string; pff_passCoverage: string; rushers: number; timeToThrowS: number; playResult: number; offense: string; defense: string }
  playActionGain: number
  pressureLowWeek: number
}

export function makeOverview(): OverviewData {
  return {
    weeklyKpi: {
      comp: [59.8, 60.4, 61.0, 60.1, 61.7, 61.9, 62.4, 62.0],
      ya: [6.4, 6.5, 6.6, 6.3, 6.8, 6.7, 6.9, 6.8],
      press: [32.1, 31.5, 33.0, 32.8, 31.2, 30.9, 31.4, 29.8],
      sack: [6.7, 6.1, 6.8, 6.5, 6.0, 5.9, 6.2, 5.6],
    },
    coverage: [
      { pff_passCoverage: 'Cover-2', compPct: 65.4 }, { pff_passCoverage: 'Quarters', compPct: 63.8 },
      { pff_passCoverage: 'Cover-3', compPct: 61.9 }, { pff_passCoverage: 'Cover-1', compPct: 59.4 },
      { pff_passCoverage: '2-Man', compPct: 57.2 }, { pff_passCoverage: 'Cover-0', compPct: 55.1 },
    ],
    leagueComp: 61.1,
    best: { away: 'KC', home: 'BUF', week: 5, kickoffIso: '2021-10-10T17:00:00Z', passYards: 612, bigPlays: 9 },
    player: { name: 'J. Sample', pos: 'QB', team: 'DAL', jersey: 12, college: 'Sample State', yardsPerAttempt: 9.1, compPct: 68.4, heightIn: 76, weightLb: 225 },
    team: { id: 'TB', yardsPerAttempt: 8.2, pressedPct: 21 },
    rusher: { name: 'M. Sample', pos: 'DE', team: 'LV', jersey: 97, pressures: 31, sacks: 9, topSpeedYdS: 7.77 },
    featuredPlay: { down: 3, yardsToGo: 8, yardlineSide: 'BUF', yardlineNumber: 44, offenseFormation: 'SHOTGUN', pff_passCoverage: 'Cover-1', rushers: 5, timeToThrowS: 2.7, playResult: 41, offense: 'BUF', defense: 'MIA' },
    playActionGain: 1.9,
    pressureLowWeek: 8,
  }
}
