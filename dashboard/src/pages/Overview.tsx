import { useMemo } from 'react'
import { getOverview } from '../data'
import { useLang } from '../i18n/LangContext'
import { formatYards } from '../i18n/format'
import { buildPoints } from '../lib/talkingPoints'
import { FieldSvg, useFieldPlayback } from '../components/FieldPlay'
import DotPlot from '../components/DotPlot'
import TalkingPoints from '../components/TalkingPoints'
import { PageHeader, Panel } from '../components/ui'
import Highlights from './overview/Highlights'
import PlayPanel from './overview/PlayPanel'
import Pulse from './overview/Pulse'

export default function Overview() {
  const { t, unit } = useLang()
  const data = useMemo(getOverview, [])
  const points = useMemo(() => buildPoints(data), [data])
  const pb = useFieldPlayback()
  const low = data.coverage.reduce((a, b) => (b.compPct < a.compPct ? b : a))
  const rows = [...data.coverage].sort((a, b) => b.compPct - a.compPct).map(c => ({ label: c.pff_passCoverage, value: c.compPct }))
  const { featuredPlay: fp } = data
  return (
    <>
      <PageHeader title={t('app.title')} sub={t('app.sub')} />
      <section className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1.9fr)_minmax(300px,1fr)]">
        <figure className="self-start overflow-hidden rounded-[18px] border border-line bg-pitch">
          <FieldSvg pb={pb} offense={fp.offense} defense={fp.defense} gain={formatYards(fp.playResult, unit)} />
        </figure>
        <PlayPanel play={fp} pb={pb} />
      </section>
      <Highlights data={data} />
      <section className="grid gap-4 xl:grid-cols-[1.05fr_1.15fr_1fr]">
        <Pulse data={data} />
        <Panel title={t('ov.dotsTitle', { cov: low.pff_passCoverage, pct: `${Math.round(low.compPct)}%`, gap: (data.leagueComp - low.compPct).toFixed(1) })} sub={t('ov.dotsSub')}>
          <DotPlot rows={rows} reference={data.leagueComp} referenceLabel={t('ov.avg')} highlight={low.pff_passCoverage} title={t('ov.dotsSub')} format={n => n.toFixed(1)} />
        </Panel>
        <Panel title={t('ov.notes')}><TalkingPoints points={points} /></Panel>
      </section>
    </>
  )
}
