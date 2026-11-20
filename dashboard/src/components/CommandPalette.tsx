import { useEffect, useMemo, useRef, useState } from 'react'
import { getGlossary, getPlayers, getTeams } from '../data'
import { useLang } from '../i18n/LangContext'
import type { DictKey } from '../i18n/dict'
import { ROUTES } from '../lib/route'
import { filterItems } from '../lib/search'

interface Item { label: string; keywords?: string; kind: DictKey; href: string }

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useLang()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement>(null)

  const items = useMemo<Item[]>(() => [
    ...ROUTES.map(r => ({ label: t(`nav.${r.id}` as DictKey), keywords: t(`nav.${r.id}.d` as DictKey), kind: 'pal.page' as DictKey, href: `#/${r.id}` })),
    ...getTeams().map(x => ({ label: x.id, kind: 'pal.team' as DictKey, href: `#/teams/${x.id}` })),
    ...getPlayers().map(p => ({ label: p.displayName, keywords: `${p.team} ${p.officialPosition}`, kind: 'pal.player' as DictKey, href: `#/players/${p.nflId}` })),
    ...getGlossary().map(e => ({ label: e[lang].term, keywords: e.id, kind: 'pal.term' as DictKey, href: `#/glossary/${e.id}` })),
  ], [t, lang])

  const results = useMemo(() => filterItems(q, items).slice(0, 30), [q, items])

  useEffect(() => { if (open) { setQ(''); setActive(0); input.current?.focus() } }, [open])
  useEffect(() => setActive(0), [q])

  if (!open) return null
  const go = (it: Item | undefined) => { if (it) { window.location.hash = it.href; onClose() } }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter') go(results[active])
    else if (e.key === 'Escape') onClose()
  }
  return (
    <div className="no-print fixed inset-0 z-50 flex items-start justify-center bg-black/55 p-4 pt-[12vh] backdrop-blur-sm" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={t('app.search')} className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-[#14241d] shadow-2xl" onMouseDown={e => e.stopPropagation()} onKeyDown={onKey}>
        <input ref={input} value={q} onChange={e => setQ(e.target.value)} placeholder={t('pal.hint')} aria-label={t('app.search')} className="w-full border-b border-line bg-transparent px-4 py-3 text-[15px] outline-none placeholder:text-mute" />
        <ul className="max-h-[50vh] overflow-auto p-1.5" role="listbox">
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-mute">{t('pal.empty')}</li>}
          {results.map((it, i) => (
            <li key={it.href + it.label} role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onClick={() => go(it)}
              className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm ${i === active ? 'bg-hl/15 text-hl' : ''}`}>
              <span>{it.label}</span><span className="text-xs text-mute">{t(it.kind)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
