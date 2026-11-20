import type { GlossaryCat, GlossaryEntry } from '../sample/glossary.ts'
import { filterItems } from './search.ts'

type Lang = 'en' | 'es'
export interface LetterGroup { letter: string; entries: GlossaryEntry[] }

const strip = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

/** Letra de agrupación: A a Z sin acentos. Cualquier otro inicio va a "#". */
export function letterOf(term: string): string {
  const c = strip(term).charAt(0).toUpperCase()
  return /[A-Z]/.test(c) ? c : '#'
}

export function groupByLetter(entries: GlossaryEntry[], lang: Lang): LetterGroup[] {
  const map = new Map<string, GlossaryEntry[]>()
  for (const e of entries) {
    const l = letterOf(e[lang].term)
    map.set(l, [...(map.get(l) ?? []), e])
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b)))
    .map(([letter, list]) => ({ letter, entries: [...list].sort((a, b) => strip(a[lang].term).localeCompare(strip(b[lang].term), lang)) }))
}

export function filterGlossary(entries: GlossaryEntry[], lang: Lang, query: string, cat: GlossaryCat | 'all'): GlossaryEntry[] {
  const byCat = cat === 'all' ? entries : entries.filter(e => e.cat === cat)
  const wrapped = byCat.map(e => ({ label: e[lang].term, keywords: `${e[lang].def} ${e.id}`, entry: e }))
  return filterItems(query, wrapped).map(w => w.entry)
}

export const findEntry = (entries: GlossaryEntry[], id: string | undefined): GlossaryEntry | undefined =>
  id ? entries.find(e => e.id === id) : undefined
