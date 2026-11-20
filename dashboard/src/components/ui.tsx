import type { ReactNode } from 'react'
import { IS_SAMPLE } from '../data'
import { useLang } from '../i18n/LangContext'

export function Panel({ title, sub, children, className = '' }: { title?: string; sub?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-[14px] border border-line bg-chalk/[0.04] p-4 ${className}`}>
      {title && <h3 className="mb-1 text-[15px] font-semibold tracking-tight">{title}</h3>}
      {sub && <p className="mb-3 text-[12.5px] text-mute">{sub}</p>}
      {children}
    </section>
  )
}

export function SampleChip() {
  const { t } = useLang()
  if (!IS_SAMPLE) return null
  return <span className="inline-block rounded-full border border-mute px-2 py-0.5 text-xs text-mute">{t('app.sample')}</span>
}

export function PageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="mb-5">
      <h1 className="text-[27px] font-semibold leading-tight tracking-display">{title}</h1>
      <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-[13px] text-mute">
        <SampleChip />
        {sub && <span>{sub}</span>}
      </div>
    </header>
  )
}

interface SegProps<T extends string | number> {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
  small?: boolean
}
/** Control segmentado. Cada botón expone aria-pressed. */
export function Seg<T extends string | number>({ value, options, onChange, label, small }: SegProps<T>) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap overflow-hidden rounded-[10px] border border-line">
      {options.map(o => (
        <button
          key={String(o.value)} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}
          className={`${small ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-[13px]'} font-semibold transition-colors ${o.value === value ? 'bg-hl text-turf' : 'text-chalk hover:bg-chalk/10'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

interface SelectProps { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }
export function Select({ label, value, options, onChange }: SelectProps) {
  return (
    <label className="flex flex-col gap-1 text-xs text-mute">
      {label}
      <select
        value={value} onChange={e => onChange(e.target.value)}
        className="rounded-[10px] border border-line bg-pitch px-2.5 py-1.5 text-[13px] text-chalk"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

export function Icon({ name, className = 'h-[22px] w-[22px]' }: { name: string; className?: string }) {
  return (
    <svg className={`${className} flex-none fill-none stroke-current`} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      {PATHS[name]}
    </svg>
  )
}

const PATHS: Record<string, ReactNode> = {
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>,
  overview: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  games: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  plays: <><circle cx="12" cy="12" r="9" /><path d="M10 8.5v7l6-3.5z" /></>,
  teams: <path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z" />,
  players: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>,
  matchups: <path d="M4 8h14l-3-3M20 16H6l3 3" />,
  schemes: <><path d="M4 4l7 7M11 4l-7 7" /><circle cx="16.5" cy="16.5" r="4.5" /></>,
  situations: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  notes: <><path d="M5 3h10l4 4v14H5z" /><path d="M9 12h6M9 16h6" /></>,
  glossary: <><path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3z" /><path d="M5 17a3 3 0 013-3h11" /></>,
  data: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.01" /></>,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 012-2h9" /></>,
  pin: <path d="M12 17v5M8 3h8l-1 7 3 3H6l3-3z" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  print: <><path d="M7 9V3h10v6" /><rect x="4" y="9" width="16" height="8" rx="2" /><path d="M7 14h10v7H7z" /></>,
  trash: <path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13" />,
}
