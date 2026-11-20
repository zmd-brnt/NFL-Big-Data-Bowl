import { useEffect, useMemo, useState } from 'react'
import { getPlayers } from '../data'
import { useLang } from '../i18n/LangContext'
import type { DictKey } from '../i18n/dict'
import { formatHeight, formatSpeed, formatWeight } from '../i18n/format'
import { betterSide, playersOfGroup, scaleMax } from '../lib/playersLogic'
import { METRIC_KEYS, type PlayerGroup, type PlayerSample } from '../sample/players'
import { PageHeader, Panel, Select, Seg } from '../components/ui'
import type { PageProps } from './index'

const GROUPS: PlayerGroup[] = ['QB', 'RUSH', 'BLOCK']
const PCT = new Set(['compPct', 'pressuredPct', 'blocksWonPct'])

function ProfileCard({ p, tag }: { p: PlayerSample; tag: string }) {
  const { t, lang } = useLang()
  return (
    <Panel>
      <div className="text-xs text-mute">{tag}</div>
      <div className="flex items-baseline gap-2.5">
        <span className="text-[34px] font-extrabold leading-none tracking-tight text-hl">{t('pr.jersey', { n: p.jersey })}</span>
        <span className="text-xl font-semibold tracking-display">{p.displayName}</span>
      </div>
      <div className="mt-1 text-[13px] text-mute">{p.officialPosition}, {p.team}</div>
      <div className="mt-2 text-[13px]">{formatHeight(p.heightIn, lang)}, {formatWeight(p.weightLb, lang)}</div>
      <div className="text-[13px] text-mute">{p.collegeName}, {t('pr.age', { n: p.age })}</div>
    </Panel>
  )
}

export default function Players({ param }: PageProps) {
  const { t, lang } = useLang()
  const all = useMemo(getPlayers, [])
  const fromParam = all.find(p => String(p.nflId) === param)
  const [group, setGroup] = useState<PlayerGroup>(fromParam?.group ?? 'QB')
  const list = useMemo(() => playersOfGroup(all, group), [all, group])
  const [aId, setAId] = useState(fromParam ? String(fromParam.nflId) : String(list[0].nflId))
  const [bId, setBId] = useState(String(list[1].nflId))

  useEffect(() => { if (fromParam) { setGroup(fromParam.group); setAId(String(fromParam.nflId)) } }, [fromParam])
  useEffect(() => {
    if (!list.some(p => String(p.nflId) === aId)) setAId(String(list[0].nflId))
    if (!list.some(p => String(p.nflId) === bId) || bId === aId) setBId(String(list.find(p => String(p.nflId) !== aId)!.nflId))
  }, [list, aId, bId])

  const a = list.find(p => String(p.nflId) === aId) ?? list[0]
  const b = list.find(p => String(p.nflId) === bId) ?? list[1]
  const options = list.map(p => ({ value: String(p.nflId), label: `${p.displayName} (${p.team})` }))
  const show = (k: string, v: number) =>
    k === 'topSpeedYdS' ? formatSpeed(v, lang) : k === 'timeToThrowS' ? `${v.toFixed(1)} s` : PCT.has(k) ? `${v.toFixed(1)}%` : k === 'yardsPerAttempt' ? v.toFixed(1) : String(v)

  return (
    <>
      <PageHeader title={t('nav.players')} sub={t('nav.players.d')} />
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1 text-xs text-mute">{t('pr.group')}
          <Seg label={t('pr.group')} value={group} onChange={setGroup} options={GROUPS.map(g => ({ value: g, label: t(`pr.g.${g}` as DictKey) }))} />
        </div>
        <Select label={t('pr.a')} value={String(a.nflId)} onChange={setAId} options={options} />
        <Select label={t('pr.b')} value={String(b.nflId)} onChange={setBId} options={options.filter(o => o.value !== String(a.nflId))} />
      </div>
      <div className="mb-4 grid gap-4 md:grid-cols-2">
        <ProfileCard p={a} tag={t('pr.a')} />
        <ProfileCard p={b} tag={t('pr.b')} />
      </div>
      <Panel title={t('pr.compare')} sub={t('pr.hint')}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[13.5px]">
            <thead><tr><td /><th className="px-3 pb-1 text-left text-xs text-mute">{a.displayName}</th><th className="px-3 pb-1 text-left text-xs text-mute">{b.displayName}</th></tr></thead>
            <tbody>
              {METRIC_KEYS[group].map(k => {
                const max = scaleMax(list, k)
                const win = betterSide(k, a.metrics[k], b.metrics[k])
                const cell = (p: PlayerSample, side: 'a' | 'b') => {
                  const v = p.metrics[k]
                  const on = win === side
                  return (
                    <td className="w-[34%] px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-3 flex-1 rounded-[3px] bg-chalk/[0.06]">
                          <div className="h-3 rounded-[3px]" style={{ width: `${(v / max) * 100}%`, background: on ? '#FFD43B' : '#8FA398' }} />
                        </div>
                        <span className={`w-20 text-right tabular-nums ${on ? 'font-semibold text-hl' : ''}`}>{show(k, v)}</span>
                      </div>
                    </td>
                  )
                }
                return (
                  <tr key={k} className="border-t border-line first:border-t-0">
                    <th scope="row" className="px-3 py-2.5 text-left font-medium text-mute">{t(`pr.m.${k}` as DictKey)}</th>
                    {cell(a, 'a')}{cell(b, 'b')}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  )
}
