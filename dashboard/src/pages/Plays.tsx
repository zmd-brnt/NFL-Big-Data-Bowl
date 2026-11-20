import { useMemo, useState } from 'react'
import { getPlays } from '../data'
import { useLang } from '../i18n/LangContext'
import type { DictKey } from '../i18n/dict'
import { formatDown, formatYards } from '../i18n/format'
import { filterPlays, isFirstDown, ownYardLine, type Bucket } from '../lib/playsLogic'
import YardStrip from '../components/YardStrip'
import { PageHeader, Panel, Seg } from '../components/ui'

type DownF = number | 'all'
type BucketF = Bucket | 'all'

export default function Plays() {
  const { t, lang, unit } = useLang()
  const plays = useMemo(getPlays, [])
  const [down, setDown] = useState<DownF>('all')
  const [bucket, setBucket] = useState<BucketF>('all')
  const [quarter, setQuarter] = useState<DownF>('all')
  const [sel, setSel] = useState(0)
  const rows = useMemo(() => filterPlays(plays, { down, bucket, quarter }), [plays, down, bucket, quarter])
  const current = rows[Math.min(sel, rows.length - 1)]
  const all = { value: 'all' as const, label: t('common.all') }
  const nums = (n: number) => Array.from({ length: n }, (_, i) => ({ value: i + 1, label: String(i + 1) }))
  const buckets: { value: BucketF; label: string }[] = [all, ...(['1-3', '4-6', '7-10', '11+'] as const).map(b => ({ value: b, label: b }))]
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setSel(0) }
  const th = 'px-3 py-2 text-left text-xs font-semibold text-mute'

  return (
    <>
      <PageHeader title={t('nav.plays')} sub={`${t('nav.plays.d')}. ${t('pl.count', { n: rows.length })}`} />
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1 text-xs text-mute">{t('pl.down')}<Seg small label={t('pl.down')} value={down} onChange={reset(setDown)} options={[all, ...nums(4)]} /></div>
        <div className="flex flex-col gap-1 text-xs text-mute">{t('pl.distance')}<Seg small label={t('pl.distance')} value={bucket} onChange={reset(setBucket)} options={buckets} /></div>
        <div className="flex flex-col gap-1 text-xs text-mute">{t('pl.quarter')}<Seg small label={t('pl.quarter')} value={quarter} onChange={reset(setQuarter)} options={[all, ...nums(4)]} /></div>
      </div>
      {rows.length === 0 && <Panel><p className="text-mute">{t('pl.empty')}</p></Panel>}
      {rows.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">
          <div className="max-h-[560px] overflow-auto rounded-[14px] border border-line">
            <table className="w-full min-w-[760px] border-collapse text-[13px]">
              <thead className="sticky top-0 bg-[#14241d]">
                <tr>{(['q', 'clock', 'dd', 'team', 'line', 'form', 'cov', 'res', 'gain', 'fd'] as const).map(k => <th key={k} className={th}>{t(`pl.col.${k}` as DictKey)}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((p, i) => (
                  <tr key={`${p.gameId}-${p.playId}`} tabIndex={0} aria-selected={current === p} onClick={() => setSel(i)} onKeyDown={e => e.key === 'Enter' && setSel(i)}
                    className={`cursor-pointer border-t border-line tabular-nums ${current === p ? 'bg-hl/10' : 'hover:bg-chalk/5'}`}>
                    <td className="px-3 py-1.5">{p.quarter}</td>
                    <td className="px-3 py-1.5">{p.gameClock}</td>
                    <td className="px-3 py-1.5">{formatDown(p.down, p.yardsToGo, lang)}</td>
                    <td className="px-3 py-1.5">{p.possessionTeam}</td>
                    <td className="px-3 py-1.5">{p.yardlineSide} {p.yardlineNumber}</td>
                    <td className="px-3 py-1.5">{p.offenseFormation}</td>
                    <td className="px-3 py-1.5">{p.pff_passCoverage}</td>
                    <td className={`px-3 py-1.5 ${p.passResult === 'S' || p.passResult === 'IN' ? 'text-coral' : ''}`}>{t(`pl.res.${p.passResult}` as DictKey)}</td>
                    <td className="px-3 py-1.5">{formatYards(p.prePenaltyPlayResult, unit)}</td>
                    <td className="px-3 py-1.5 text-hl">{isFirstDown(p) ? '✓' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {current && (
            <Panel title={t('pl.detail')} sub={`${current.possessionTeam} vs. ${current.defensiveTeam}, ${t('pl.quarter')} ${current.quarter}, ${current.gameClock}`}>
              <YardStrip los={ownYardLine(current)} toGo={current.yardsToGo} label={t('pl.stripAria')} />
              <dl className="my-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
                <dt className="text-mute">{t('pl.col.dd')}</dt><dd>{formatDown(current.down, current.yardsToGo, lang)}</dd>
                <dt className="text-mute">{t('pl.col.form')}</dt><dd>{current.offenseFormation}</dd>
                <dt className="text-mute">{t('pl.col.cov')}</dt><dd>{current.pff_passCoverage}</dd>
                <dt className="text-mute">{t('pl.playAction')}</dt><dd>{current.pff_playAction ? t('pl.yes') : t('pl.no')}</dd>
                <dt className="text-mute">{t('pl.col.gain')}</dt><dd>{formatYards(current.prePenaltyPlayResult, unit)}</dd>
              </dl>
              <p className="text-xs text-mute">{t('pl.original')}</p>
              <p className="mt-0.5 text-[13.5px] italic text-[#C5D1CA]">{current.playDescription}</p>
            </Panel>
          )}
        </div>
      )}
    </>
  )
}
