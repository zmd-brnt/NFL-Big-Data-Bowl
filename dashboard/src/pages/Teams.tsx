import { useEffect, useMemo, useState } from 'react'
import { getTeams } from '../data'
import { useLang } from '../i18n/LangContext'
import type { DictKey } from '../i18n/dict'
import { formatPct } from '../i18n/format'
import type { MetricKey } from '../sample/teams'
import PairBars from '../components/PairBars'
import ShareBars from '../components/ShareBars'
import Sparkline from '../components/Sparkline'
import { PageHeader, Panel, Select } from '../components/ui'
import type { PageProps } from './index'

const METRICS: MetricKey[] = ['comp', 'ya', 'press', 'sack']
const fmt = (k: MetricKey) => (k === 'ya' ? (n: number) => n.toFixed(1) : formatPct)

export default function Teams({ param }: PageProps) {
  const { t } = useLang()
  const teams = useMemo(getTeams, [])
  const ids = teams.map(x => x.id)
  const [a, setA] = useState(ids.includes(param ?? '') ? (param as string) : 'BUF')
  const [b, setB] = useState('none')
  useEffect(() => { if (param && ids.includes(param)) setA(param) }, [param])
  const ta = teams.find(x => x.id === a)!
  const tb = teams.find(x => x.id === b)
  const options = ids.map(id => ({ value: id, label: id }))

  return (
    <>
      <PageHeader title={t('nav.teams')} sub={t('nav.teams.d')} />
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <Select label={t('tm.team')} value={a} onChange={setA} options={options} />
        <Select label={t('tm.compare')} value={b} onChange={setB} options={[{ value: 'none', label: t('tm.none') }, ...options.filter(o => o.value !== a)]} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title={t('tm.avg')} sub={tb ? t('tm.hint') : t('tm.trend')}>
          {tb ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {METRICS.map(k => (
                <PairBars key={k} label={t(`kpi.${k}` as DictKey)} lowerIsBetter={k === 'press' || k === 'sack'} format={fmt(k)}
                  a={{ name: ta.id, value: ta.avg[k] }} b={{ name: tb.id, value: tb.avg[k] }} />
              ))}
            </div>
          ) : (
            METRICS.map(k => (
              <div key={k} className="grid grid-cols-[minmax(0,1fr)_80px_auto] items-center gap-3 sm:grid-cols-[minmax(0,1fr)_110px_auto] sm:gap-3.5 border-t border-line py-2.5 first-of-type:border-t-0">
                <span className="font-semibold">{t(`kpi.${k}` as DictKey)}</span>
                <Sparkline values={ta.weekly[k]} label={t(`kpi.${k}` as DictKey)} />
                <span className="text-[22px] font-semibold tabular-nums tracking-tight">{fmt(k)(ta.avg[k])}</span>
              </div>
            ))
          )}
        </Panel>
        <Panel title={t('tm.formations')} sub={t('tm.share')}>
          <div className={tb ? 'grid gap-4 sm:grid-cols-2' : ''}>
            {[ta, ...(tb ? [tb] : [])].map(tm => (
              <div key={tm.id}>
                {tb && <div className="mb-1 text-sm font-semibold">{tm.id}</div>}
                <ShareBars rows={tm.formations} label={`${tm.id} ${t('tm.formations')}`} />
              </div>
            ))}
          </div>
        </Panel>
        <Panel title={t('tm.coverages')} sub={t('tm.share')} className="xl:col-span-2">
          <div className={tb ? 'grid gap-4 md:grid-cols-2' : 'max-w-xl'}>
            {[ta, ...(tb ? [tb] : [])].map(tm => (
              <div key={tm.id}>
                {tb && <div className="mb-1 text-sm font-semibold">{tm.id}</div>}
                <ShareBars rows={tm.coverages} label={`${tm.id} ${t('tm.coverages')}`} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  )
}
