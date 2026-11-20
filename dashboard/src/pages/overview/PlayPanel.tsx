import { Fragment } from 'react'
import { useLang } from '../../i18n/LangContext'
import { formatDown, formatYards } from '../../i18n/format'
import type { OverviewData } from '../../data'
import { PlayControls, type Playback } from '../../components/FieldPlay'
import { Panel } from '../../components/ui'

const title = (s: string) => s.charAt(0) + s.slice(1).toLowerCase()

export default function PlayPanel({ play, pb }: { play: OverviewData['featuredPlay']; pb: Playback }) {
  const { t, lang, unit } = useLang()
  const gain = formatYards(play.playResult, unit)
  const dd = formatDown(play.down, play.yardsToGo, lang)
  const rows: [string, string][] = [
    [t('ov.fDown'), dd],
    [t('ov.fForm'), title(play.offenseFormation)],
    [t('ov.fCov'), play.pff_passCoverage],
    [t('ov.fRush'), t('ov.vRush', { n: play.rushers })],
    [t('ov.fTtt'), `${play.timeToThrowS.toFixed(1)} s`],
    [t('ov.fRes'), t('ov.vRes', { gain })],
  ]
  return (
    <Panel>
      <h2 className="mb-2 text-[19px] font-semibold tracking-tight">{t('ov.playTitle')}</h2>
      <p className="mb-3 text-[#C5D1CA]">
        {t('ov.playDesc', { dd, side: play.yardlineSide, yd: play.yardlineNumber, formation: title(play.offenseFormation), coverage: play.pff_passCoverage, rushers: play.rushers, gain })}
      </p>
      <dl className="mb-3.5 grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1.5 text-[13px]">
        {rows.map(([k, v]) => (<Fragment key={k}><dt className="text-mute">{k}</dt><dd className="tabular-nums">{v}</dd></Fragment>))}
      </dl>
      <PlayControls pb={pb} />
    </Panel>
  )
}
