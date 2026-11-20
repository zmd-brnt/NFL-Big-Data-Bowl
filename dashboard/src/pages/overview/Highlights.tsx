import { useLang } from '../../i18n/LangContext'
import { formatHeight, formatKickoff, formatPct, formatSpeed, formatWeight, formatYards } from '../../i18n/format'
import type { OverviewData } from '../../data'
import { Rich } from '../../components/Term'

export default function Highlights({ data }: { data: OverviewData }) {
  const { t, lang, unit } = useLang()
  const { best, player, team, rusher } = data
  const cells = [
    {
      label: t('ov.hlBest'), name: `${best.away} @ ${best.home}`,
      sub: `${t('ov.week', { n: best.week })}, ${formatKickoff(best.kickoffIso, lang)}`,
      metric: t('ov.mBest', { yds: formatYards(best.passYards, unit), big: best.bigPlays, long: formatYards(20, unit) }), extra: '',
    },
    {
      label: t('ov.hlPlayer'), name: player.name, sub: `${player.pos}, ${player.team}`,
      metric: t('ov.mPlayer', { ya: player.yardsPerAttempt.toFixed(1), comp: formatPct(player.compPct) }),
      extra: `${formatHeight(player.heightIn, lang)}, ${formatWeight(player.weightLb, lang)}`,
    },
    {
      label: t('ov.hlTeam'), name: team.id, sub: t('ov.passOffense'),
      metric: t('ov.mTeam', { ya: team.yardsPerAttempt.toFixed(1), press: `${team.pressedPct}%` }), extra: '',
    },
    {
      label: t('ov.hlRusher'), name: rusher.name, sub: `${rusher.pos}, ${rusher.team}`,
      metric: t('ov.mRusher', { p: rusher.pressures, s: rusher.sacks }), extra: t('ov.topSpeed', { v: formatSpeed(rusher.topSpeedYdS, lang) }),
    },
  ]
  return (
    <section className="mb-4 grid overflow-hidden rounded-[14px] border border-line bg-chalk/[0.04] sm:grid-cols-2 xl:grid-cols-4">
      {cells.map(c => (
        <div key={c.label} className="border-line p-4 sm:border-l sm:first:border-l-0 xl:[&:nth-child(3)]:border-l">
          <div className="text-[12.5px] text-mute">{c.label}</div>
          <div className="my-0.5 text-[23px] font-semibold tracking-display">{c.name}</div>
          <div className="text-[12.5px] text-mute">{c.sub}</div>
          <div className="mt-2"><Rich text={c.metric} /></div>
          {c.extra && <div className="text-[12.5px] text-mute">{c.extra}</div>}
        </div>
      ))}
    </section>
  )
}
