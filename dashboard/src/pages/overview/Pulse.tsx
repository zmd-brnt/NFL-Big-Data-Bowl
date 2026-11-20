import { useState } from 'react'
import { useLang } from '../../i18n/LangContext'
import type { DictKey } from '../../i18n/dict'
import { KPI_KEYS } from '../../sample/overview'
import type { OverviewData } from '../../data'
import SplitFlap from '../../components/SplitFlap'
import Sparkline from '../../components/Sparkline'
import { Panel, Seg } from '../../components/ui'

const UNIT: Record<string, string> = { comp: '%', ya: '', press: '%', sack: '%' }

export default function Pulse({ data }: { data: OverviewData }) {
  const { t } = useLang()
  const [week, setWeek] = useState(8)
  const weeks = [1, 2, 3, 4, 5, 6, 7, 8].map(w => ({ value: w, label: `${t('common.weekShort')}${w}` }))
  return (
    <Panel title={t('ov.pulse')} sub={t('ov.pulseHint')}>
      <div className="mb-2"><Seg small label={t('common.week')} value={week} onChange={setWeek} options={weeks} /></div>
      {KPI_KEYS.map(k => {
        const v = data.weeklyKpi[k]
        const i = week - 1
        const prior = v.slice(0, i)
        const d = prior.length ? v[i] - prior.reduce((a, b) => a + b) / prior.length : null
        const unit = k === 'ya' ? t('ov.yd') : t('ov.pts')
        const vs = i === 1 ? t('ov.vsWeek1') : t('ov.vsWeeks', { n: i })
        const delta = d === null ? t('ov.noPrior') : `${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(1)} ${unit} ${vs}`
        const label = t(`kpi.${k}` as DictKey)
        return (
          <div key={k} className="grid grid-cols-[minmax(0,1fr)_64px_auto] items-center gap-3 sm:grid-cols-[minmax(0,1fr)_90px_auto] sm:gap-3.5 border-t border-line py-2.5 first-of-type:border-t-0">
            <div><div className="font-semibold">{label}</div><div className="text-xs text-mute">{delta}</div></div>
            <Sparkline values={v} sel={i} label={label} />
            <SplitFlap value={v[i].toFixed(1)} unit={UNIT[k]} label={label} rollKey={week} />
          </div>
        )
      })}
    </Panel>
  )
}
