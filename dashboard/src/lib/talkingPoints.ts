import { dict, interpolate } from '../i18n/dict.ts'
import { formatPct } from '../i18n/format.ts'
import type { OverviewData } from '../sample/overview.ts'

export interface TalkingPoint { id: 'n1' | 'n2' | 'n3'; en: string; es: string }

const TERM_BY_COVERAGE: Record<string, string> = {
  'Cover-0': 'cover0', 'Cover-1': 'cover1', 'Cover-2': 'cover2', 'Cover-3': 'cover3', Quarters: 'quarters', '2-Man': 'man',
}

/** Puntos para comentar generados con reglas sobre los datos (sin IA). */
export function buildPoints(data: OverviewData): TalkingPoint[] {
  const low = data.coverage.reduce((a, b) => (b.compPct < a.compPct ? b : a))
  const press = data.weeklyKpi.press
  const lowPress = Math.min(...press)
  const vars1 = {
    term: `{${TERM_BY_COVERAGE[low.pff_passCoverage] ?? 'man'}|${low.pff_passCoverage}}`,
    pct: formatPct(low.compPct),
    gap: (data.leagueComp - low.compPct).toFixed(1),
  }
  const vars2 = { wk: press.indexOf(lowPress) + 1, v: formatPct(lowPress) }
  const vars3 = { gain: data.playActionGain.toFixed(1) }
  const make = (id: TalkingPoint['id'], vars: Record<string, string | number>): TalkingPoint => ({
    id,
    en: interpolate(dict.en[`tp.${id}`], vars),
    es: interpolate(dict.es[`tp.${id}`], vars),
  })
  return [make('n1', vars1), make('n2', vars2), make('n3', vars3)]
}
