import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { dict, interpolate, type DictKey } from './dict'
import type { Lang, Unit } from './format'

function readStored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = window.localStorage.getItem(key)
    return allowed.includes(v as T) ? (v as T) : fallback
  } catch {
    return fallback
  }
}
function store(key: string, value: string) {
  try { window.localStorage.setItem(key, value) } catch { /* sin almacenamiento: se usa solo en memoria */ }
}

interface LangCtx {
  lang: Lang
  setLang: (l: Lang) => void
  unit: Unit
  setUnit: (u: Unit) => void
  t: (key: DictKey, vars?: Record<string, string | number>) => string
}
const Ctx = createContext<LangCtx | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => readStored('lang', ['en', 'es'] as const, 'en'))
  const [unit, setUnitState] = useState<Unit>(() => readStored('unit', ['yd', 'm'] as const, 'yd'))
  useEffect(() => { document.documentElement.lang = lang }, [lang])
  const setLang = useCallback((l: Lang) => { setLangState(l); store('lang', l) }, [])
  const setUnit = useCallback((u: Unit) => { setUnitState(u); store('unit', u) }, [])
  const t = useCallback((key: DictKey, vars?: Record<string, string | number>) => interpolate(dict[lang][key] ?? key, vars), [lang])
  const value = useMemo(() => ({ lang, setLang, unit, setUnit, t }), [lang, setLang, unit, setUnit, t])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useLang(): LangCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useLang debe usarse dentro de LangProvider')
  return c
}
