import { useMemo, useState } from 'react'
import { getGames, getTeams } from '../data'
import { useLang } from '../i18n/LangContext'
import { formatKickoff, formatPct } from '../i18n/format'
import { filterGames } from '../lib/gamesLogic'
import PairBars from '../components/PairBars'
import { PageHeader, Panel, Select, Seg } from '../components/ui'

export default function Games() {
  const { t, lang } = useLang()
  const [week, setWeek] = useState(1)
  const [team, setTeam] = useState('all')
  const [selected, setSelected] = useState<number | null>(null)
  const teams = useMemo(() => getTeams().map(x => x.id), [])
  const games = useMemo(() => filterGames(getGames(week), team), [week, team])
  const current = games.find(g => g.gameId === selected) ?? games[0]
  const weeks = Array.from({ length: 8 }, (_, i) => ({ value: i + 1, label: `${t('common.weekShort')}${i + 1}` }))
  const teamOptions = [{ value: 'all', label: t('gm.allTeams') }, ...teams.map(id => ({ value: id, label: id }))]

  return (
    <>
      <PageHeader title={t('nav.games')} sub={t('nav.games.d')} />
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <Seg label={t('common.week')} value={week} onChange={setWeek} options={weeks} />
        <Select label={t('gm.team')} value={team} onChange={setTeam} options={teamOptions} />
      </div>
      {games.length === 0 && <Panel><p className="text-mute">{t('gm.noGame', { team, n: week })}</p></Panel>}
      {games.length > 0 && current && (
        <div className="grid gap-4 lg:grid-cols-[minmax(280px,1fr)_minmax(0,1.6fr)]">
          <Panel title={t('gm.list')}>
            <ul className="grid gap-1.5">
              {games.map(g => {
                const on = g.gameId === current.gameId
                return (
                  <li key={g.gameId}>
                    <button type="button" aria-pressed={on} onClick={() => setSelected(g.gameId)}
                      className={`w-full rounded-[10px] border px-3 py-2 text-left ${on ? 'border-hl bg-hl/10' : 'border-line hover:bg-chalk/10'}`}>
                      <span className="block text-[15px] font-semibold">{g.away} @ {g.home}</span>
                      <span className="block text-xs text-mute">{formatKickoff(g.kickoffIso, lang)}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Panel>
          <Panel title={`${current.away} @ ${current.home}`} sub={`${t('ov.week', { n: current.week })}, ${formatKickoff(current.kickoffIso, lang)}`}>
            <div className="grid gap-3 sm:grid-cols-2">
              <PairBars label={t('kpi.comp')} a={{ name: current.away, value: current.stats.away.comp }} b={{ name: current.home, value: current.stats.home.comp }} format={n => formatPct(n)} />
              <PairBars label={t('kpi.ya')} a={{ name: current.away, value: current.stats.away.ya }} b={{ name: current.home, value: current.stats.home.ya }} />
              <PairBars label={t('kpi.press')} lowerIsBetter a={{ name: current.away, value: current.stats.away.press }} b={{ name: current.home, value: current.stats.home.press }} format={n => formatPct(n)} />
              <PairBars label={t('kpi.sack')} lowerIsBetter a={{ name: current.away, value: current.stats.away.sack }} b={{ name: current.home, value: current.stats.home.sack }} format={n => formatPct(n)} />
            </div>
            <p className="mt-3 text-[12.5px] text-mute">
              {t('gm.attempts')}: {current.away} {current.stats.away.attempts}, {current.home} {current.stats.home.attempts}. {t('gm.detailHint')}
            </p>
          </Panel>
        </div>
      )}
    </>
  )
}
