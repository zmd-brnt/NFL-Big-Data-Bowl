import { useMemo, useState } from 'react'
import { getSituations } from '../data'
import { useLang } from '../i18n/LangContext'
import type { DictKey } from '../i18n/dict'
import { formatPct } from '../i18n/format'
import DotPlot from '../components/DotPlot'
import HeatGrid from '../components/HeatGrid'
import { PageHeader, Panel, Seg } from '../components/ui'

type Metric = 'compPct' | 'yardsPerAttempt' | 'firstDownPct'
const BUCKETS = ['1-3', '4-6', '7-10', '11+']

export default function Situations() {
  const { t, lang } = useLang()
  const data = useMemo(getSituations, [])
  const [metric, setMetric] = useState<Metric>('firstDownPct')
  const label = metric === 'compPct' ? t('kpi.comp') : metric === 'yardsPerAttempt' ? t('kpi.ya') : t('st.fd')
  const format = metric === 'yardsPerAttempt' ? (n: number) => n.toFixed(1) : formatPct
  const downLabel = (d: number) => `${d}${lang === 'es' ? '.º' : d === 1 ? 'st' : d === 2 ? 'nd' : 'rd'} ${t('pl.down')}`
  const cells = data.matrix.map(c => ({ row: downLabel(c.down), col: c.bucket, value: c[metric], note: t('sc.plays', { n: c.plays }) }))
  const rest = data.special.find(s => s.id === 'rest')!
  const rows = data.special.filter(s => s.id !== 'rest').map(s => ({ label: t(`st.${s.id}` as DictKey), value: s.compPct }))
  const worst = data.special.filter(s => s.id !== 'rest').reduce((a, b) => (b.compPct < a.compPct ? b : a))
  const th = 'px-3 py-2 text-left text-xs font-semibold text-mute'
  return (
    <>
      <PageHeader title={t('nav.situations')} sub={t('nav.situations.d')} />
      <div className="mb-4 flex flex-col gap-1 text-xs text-mute">{t('st.metric')}
        <Seg label={t('st.metric')} value={metric} onChange={setMetric}
          options={[{ value: 'firstDownPct', label: t('st.fd') }, { value: 'compPct', label: t('kpi.comp') }, { value: 'yardsPerAttempt', label: t('kpi.ya') }]} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
        <Panel title={t('st.matrix', { metric: label })} sub={t('st.matrixSub')}>
          <HeatGrid rows={[1, 2, 3].map(downLabel)} cols={BUCKETS} cells={cells} format={format} corner={t('st.dtg')} label={t('st.matrix', { metric: label })} />
        </Panel>
        <Panel title={t('st.special')} sub={t('st.specialSub')}>
          <DotPlot rows={rows} reference={rest.compPct} referenceLabel={t('st.rest')} highlight={t(`st.${worst.id}` as DictKey)} title={t('st.special')} domain={[50, 70]} format={n => n.toFixed(1)} />
          <table className="mt-3 w-full text-[13px] tabular-nums">
            <thead><tr><th className={th} /><th className={th}>{t('st.table.plays')}</th><th className={th}>{t('kpi.ya')}</th><th className={th}>{t('st.table.sack')}</th></tr></thead>
            <tbody>
              {data.special.map(s => (
                <tr key={s.id} className="border-t border-line">
                  <th scope="row" className="px-3 py-1.5 text-left font-medium text-mute">{t(`st.${s.id}` as DictKey)}</th>
                  <td className="px-3 py-1.5">{s.plays}</td><td className="px-3 py-1.5">{s.yardsPerAttempt.toFixed(1)}</td><td className="px-3 py-1.5">{formatPct(s.sackPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </>
  )
}
