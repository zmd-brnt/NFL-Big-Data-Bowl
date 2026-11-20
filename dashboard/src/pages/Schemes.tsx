import { useMemo, useState } from 'react'
import { getSchemes } from '../data'
import { useLang } from '../i18n/LangContext'
import { formatPct } from '../i18n/format'
import { COVERAGES, FORMATIONS } from '../sample/teams'
import HeatGrid from '../components/HeatGrid'
import PairBars from '../components/PairBars'
import { PageHeader, Panel, Seg } from '../components/ui'

type Metric = 'compPct' | 'yardsPerAttempt'

export default function Schemes() {
  const { t } = useLang()
  const data = useMemo(getSchemes, [])
  const [metric, setMetric] = useState<Metric>('compPct')
  const label = metric === 'compPct' ? t('kpi.comp') : t('kpi.ya')
  const format = metric === 'compPct' ? formatPct : (n: number) => n.toFixed(1)
  const cells = data.cells.map(c => ({ row: c.formation, col: c.coverage, value: c[metric], note: t('sc.plays', { n: c.plays }) }))
  const { withPlayAction: pa, without } = data.playAction
  return (
    <>
      <PageHeader title={t('nav.schemes')} sub={t('nav.schemes.d')} />
      <div className="mb-4 flex flex-col gap-1 text-xs text-mute">{t('sc.metric')}
        <Seg label={t('sc.metric')} value={metric} onChange={setMetric}
          options={[{ value: 'compPct', label: t('kpi.comp') }, { value: 'yardsPerAttempt', label: t('kpi.ya') }]} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)]">
        <Panel title={t('sc.heat', { metric: label })} sub={t('sc.heatSub')}>
          <HeatGrid rows={[...FORMATIONS]} cols={[...COVERAGES]} cells={cells} format={format} corner={t('sc.formation')} label={t('sc.heat', { metric: label })} />
        </Panel>
        <Panel title={t('sc.paTitle')} sub={t('sc.paSub')}>
          <div className="grid gap-3">
            <PairBars label={t('kpi.comp')} format={formatPct} a={{ name: t('sc.withPA'), value: pa.compPct }} b={{ name: t('sc.withoutPA'), value: without.compPct }} />
            <PairBars label={t('kpi.ya')} a={{ name: t('sc.withPA'), value: pa.yardsPerAttempt }} b={{ name: t('sc.withoutPA'), value: without.yardsPerAttempt }} />
            <p className="text-[12.5px] text-mute">{t('sc.plays', { n: pa.plays })} / {t('sc.plays', { n: without.plays })}</p>
          </div>
        </Panel>
      </div>
    </>
  )
}
