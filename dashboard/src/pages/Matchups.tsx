import { useMemo, useState } from 'react'
import { CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, XAxis, YAxis } from 'recharts'
import { getMatchups } from '../data'
import { useLang } from '../i18n/LangContext'
import { sortMatchups, type MatchupKey } from '../lib/matchupsLogic'
import { PageHeader, Panel, Seg } from '../components/ui'

export default function Matchups() {
  const { t } = useLang()
  const rows = useMemo(getMatchups, [])
  const [key, setKey] = useState<MatchupKey>('blocksWonPct')
  const sorted = useMemo(() => sortMatchups(rows, key), [rows, key])
  const avg = rows.reduce((a, r) => a + r.blocksWonPct, 0) / rows.length
  const worst = new Set([...rows].sort((a, b) => b.pressuresAllowed - a.pressuresAllowed || a.id - b.id).slice(0, 3).map(r => r.id))
  const dots = rows.map(r => ({ x: r.blocksWonPct, y: r.pressuresAllowed, name: worst.has(r.id) ? r.blocker.name : '', bad: worst.has(r.id) }))
  const sorts: { value: MatchupKey; label: string }[] = [
    { value: 'blocksWonPct', label: t('mu.col.won') }, { value: 'pressuresAllowed', label: t('mu.col.allowed') },
    { value: 'sacksAllowed', label: t('mu.col.sacks') }, { value: 'snaps', label: t('mu.col.snaps') },
  ]
  const th = 'px-3 py-2 text-left text-xs font-semibold text-mute'
  return (
    <>
      <PageHeader title={t('nav.matchups')} sub={t('nav.matchups.d')} />
      <div className="mb-4 flex flex-col gap-1 text-xs text-mute">{t('mu.sort')}<Seg small label={t('mu.sort')} value={key} onChange={setKey} options={sorts} /></div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="overflow-auto rounded-[14px] border border-line">
          <table className="w-full min-w-[620px] border-collapse text-[13px] tabular-nums">
            <thead className="bg-[#14241d]"><tr>
              <th className={th}>{t('mu.col.blocker')}</th><th className={th}>{t('mu.col.rusher')}</th><th className={th}>{t('mu.col.snaps')}</th>
              <th className={th}>{t('mu.col.won')}</th><th className={th}>{t('mu.col.allowed')}</th><th className={th}>{t('mu.col.sacks')}</th>
            </tr></thead>
            <tbody>
              {sorted.map(r => (
                <tr key={r.id} className="border-t border-line">
                  <td className="px-3 py-1.5">{r.blocker.name} <span className="text-mute">{r.blocker.pos}, {r.blocker.team}</span></td>
                  <td className="px-3 py-1.5">{r.rusher.name} <span className="text-mute">{r.rusher.pos}, {r.rusher.team}</span></td>
                  <td className="px-3 py-1.5">{r.snaps}</td>
                  <td className={`px-3 py-1.5 ${key === 'blocksWonPct' ? 'font-semibold text-hl' : ''}`}>{r.blocksWonPct.toFixed(1)}%</td>
                  <td className={`px-3 py-1.5 ${key === 'pressuresAllowed' ? 'font-semibold text-hl' : ''}`}>{r.pressuresAllowed}</td>
                  <td className={`px-3 py-1.5 ${key === 'sacksAllowed' ? 'font-semibold text-hl' : ''}`}>{r.sacksAllowed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Panel title={t('mu.scatter')} sub={t('mu.scatterSub')}>
          <div role="img" aria-label={t('mu.scatter')}>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="rgba(238,241,234,0.08)" vertical={false} />
                <XAxis type="number" dataKey="x" domain={[70, 100]} tick={{ fill: '#9DB0A5', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#9DB0A5' }} unit="%" />
                <YAxis type="number" dataKey="y" tick={{ fill: '#9DB0A5', fontSize: 12 }} tickLine={false} axisLine={false} width={32} />
                <ReferenceLine x={avg} stroke="#4C8DFF" strokeWidth={2} label={{ value: `${t('mu.avgWon')} ${avg.toFixed(1)}%`, fill: '#4C8DFF', fontSize: 12, position: 'insideTopRight' }} />
                <Scatter data={dots} isAnimationActive={false}>
                  {dots.map((d, i) => <Cell key={i} fill={d.bad ? '#FF6B5E' : '#8FA398'} />)}
                  <LabelList dataKey="name" position="left" fill="#FF6B5E" fontSize={12} />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </>
  )
}
