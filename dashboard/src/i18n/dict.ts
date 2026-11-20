import { common } from './strings/common.ts'
import { overview } from './strings/overview.ts'
import { glossary } from './strings/glossary.ts'
import { games } from './strings/games.ts'
import { teamsPlayers } from './strings/teamsPlayers.ts'
import { analysis } from './strings/analysis.ts'
import { dataNotes } from './strings/dataNotes.ts'

const areas = [common, overview, glossary, games, teamsPlayers, analysis, dataNotes]

type Merged = Record<keyof typeof common.en | keyof typeof overview.en | keyof typeof glossary.en | keyof typeof games.en | keyof typeof teamsPlayers.en | keyof typeof analysis.en | keyof typeof dataNotes.en, string>

function merge(lang: 'en' | 'es'): Merged {
  return Object.assign({}, ...areas.map(a => a[lang])) as Merged
}

export const dict = { en: merge('en'), es: merge('es') }
export type DictKey = keyof typeof dict.en

/** Reemplaza {nombre} por su valor. Las variables ausentes se dejan igual. */
export function interpolate(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m))
}
