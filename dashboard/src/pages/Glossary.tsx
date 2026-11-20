import { useEffect, useMemo, useState } from 'react'
import { getGlossary } from '../data'
import { useLang } from '../i18n/LangContext'
import type { DictKey } from '../i18n/dict'
import { filterGlossary, findEntry, groupByLetter } from '../lib/glossaryLogic'
import { useReducedMotion } from '../lib/useReducedMotion'
import type { GlossaryCat } from '../sample/glossary'
import { PageHeader, Seg } from '../components/ui'
import type { PageProps } from './index'

const CATS: GlossaryCat[] = ['positions', 'plays', 'schemes', 'metrics', 'data']

export default function Glossary({ param }: PageProps) {
  const { t, lang } = useLang()
  const reduced = useReducedMotion()
  const all = useMemo(getGlossary, [])
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<GlossaryCat | 'all'>('all')
  const target = findEntry(all, param)

  useEffect(() => { if (param) { setQ(''); setCat('all') } }, [param])
  useEffect(() => {
    if (!target) return
    const id = window.setTimeout(() => document.getElementById(`term-${target.id}`)?.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' }), 60)
    return () => window.clearTimeout(id)
  }, [target, lang, reduced])

  const shown = useMemo(() => filterGlossary(all, lang, q, cat), [all, lang, q, cat])
  const groups = useMemo(() => groupByLetter(shown, lang), [shown, lang])
  const catOptions = [{ value: 'all' as const, label: t('gl.cat.all') }, ...CATS.map(c => ({ value: c, label: t(`gl.cat.${c}` as DictKey) }))]

  return (
    <>
      <PageHeader title={t('nav.glossary')} sub={`${t('nav.glossary.d')}. ${t('gl.count', { n: shown.length })}`} />
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t('gl.search')} aria-label={t('gl.search')}
          className="min-w-[240px] flex-1 rounded-[10px] border border-line bg-pitch px-3 py-2 text-sm placeholder:text-mute"
        />
        <Seg label={t('gl.cat.all')} value={cat} onChange={setCat} options={catOptions} small />
      </div>
      <nav aria-label={t('gl.letters')} className="mb-4 flex flex-wrap gap-1">
        {groups.map(gr => (
          <button
            key={gr.letter} type="button" onClick={() => document.getElementById(`letter-${gr.letter}`)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })}
            className="h-8 w-8 rounded-lg border border-line text-sm font-semibold hover:bg-chalk/10"
          >{gr.letter}</button>
        ))}
      </nav>
      {groups.length === 0 && <p className="py-10 text-center text-mute">{t('gl.empty')}</p>}
      {groups.map(gr => (
        <section key={gr.letter} id={`letter-${gr.letter}`} className="grid gap-4 border-t border-line py-4 sm:grid-cols-[56px_1fr]">
          <div className="text-[34px] font-semibold leading-none text-hl">{gr.letter}</div>
          <div className="grid gap-5 md:grid-cols-2">
            {gr.entries.map(e => (
              <article key={e.id} id={`term-${e.id}`} className={`rounded-xl p-3 ${target?.id === e.id ? 'bg-hl/10 ring-1 ring-hl' : ''}`}>
                <h3 className="text-base font-semibold">{e[lang].term}</h3>
                <div className="mb-1 mt-0.5 flex flex-wrap gap-1.5 text-[11.5px] text-mute">
                  <span className="rounded-full border border-line px-2">{t(`gl.cat.${e.cat}` as DictKey)}</span>
                  {e.inferred && <span className="rounded-full border border-coral/60 px-2 text-coral">{t('gl.inferred')}</span>}
                </div>
                <p className="text-[14px] leading-snug text-[#C5D1CA]">{e[lang].def}</p>
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}
