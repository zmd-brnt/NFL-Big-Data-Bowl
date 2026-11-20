export type Lang = 'en' | 'es'
export type Unit = 'yd' | 'm'

const clean = (s: string) => s.replace(/[\u202f\u00a0]/g, ' ')

/** Hora de inicio: en inglés hora del Este; en español hora de CDMX en 24 h. */
export function formatKickoff(iso: string, lang: Lang): string {
  const d = new Date(iso)
  const es = lang === 'es'
  const loc = es ? 'es-MX' : 'en-US'
  const timeZone = es ? 'America/Mexico_City' : 'America/New_York'
  const f = (o: Intl.DateTimeFormatOptions) => clean(new Intl.DateTimeFormat(loc, { timeZone, ...o }).format(d))
  const wd = f({ weekday: 'short' }).replace('.', '')
  if (es) {
    return `${wd} ${f({ day: '2-digit', month: '2-digit', year: 'numeric' })}, ${f({ hour: '2-digit', minute: '2-digit', hour12: false })} h (CDMX)`
  }
  return `${wd}, ${f({ month: 'short', day: 'numeric', year: 'numeric' })}, ${f({ hour: 'numeric', minute: '2-digit' })} ET`
}

export function formatHeight(inches: number, lang: Lang): string {
  if (lang === 'en') return `${Math.floor(inches / 12)}-${inches % 12}`
  return `${((inches * 2.54) / 100).toFixed(2)} m`
}

export function formatWeight(lb: number, lang: Lang): string {
  return lang === 'en' ? `${lb} lb` : `${Math.round(lb * 0.45359237)} kg`
}

/** Velocidad a partir de yardas por segundo (columna s del tracking). */
export function formatSpeed(ydPerSec: number, lang: Lang): string {
  return lang === 'en' ? `${(ydPerSec * 2.045454545).toFixed(1)} mph` : `${(ydPerSec * 3.29184).toFixed(1)} km/h`
}

export function formatYards(yd: number, unit: Unit): string {
  return unit === 'yd' ? `${yd} yd` : `${(yd * 0.9144).toFixed(1)} m`
}

const ORD = ['', '1st', '2nd', '3rd', '4th']
export function formatDown(down: number, toGo: number, lang: Lang): string {
  return lang === 'en' ? `${ORD[down] ?? `${down}th`} & ${toGo}` : `${down}.º y ${toGo}`
}

export function formatPct(v: number): string {
  return `${v.toFixed(1)}%`
}
