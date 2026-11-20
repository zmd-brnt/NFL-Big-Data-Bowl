import { useLang } from '../i18n/LangContext'
import type { DictKey } from '../i18n/dict'
import { PageHeader, Panel } from '../components/ui'

const IMPACT = ['high', 'high', 'high', 'medium', 'medium', 'low', 'low'] as const
const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1)

export default function DataNotes() {
  const { t } = useLang()
  const k = (s: string) => t(s as DictKey)
  return (
    <>
      <PageHeader title={t('nav.data')} sub={t('dn.source')} />
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title={t('dn.scope')}>
          <ul className="grid gap-2 text-[14px] leading-snug">{range(5).map(i => <li key={i} className="border-b border-line pb-2 last:border-0 last:pb-0">{k(`dn.s${i}`)}</li>)}</ul>
        </Panel>
        <Panel title={t('dn.quality')}>
          <ul className="grid gap-2 text-[14px] leading-snug">{range(8).map(i => <li key={i} className="border-b border-line pb-2 last:border-0 last:pb-0">{k(`dn.q${i}`)}</li>)}</ul>
        </Panel>
        <Panel title={t('dn.missing')} className="xl:col-span-2">
          <ul className="grid gap-2 text-[14px] leading-snug md:grid-cols-2">
            {range(7).map(i => (
              <li key={i} className="flex items-start justify-between gap-3 border-b border-line pb-2">
                <span>{k(`dn.m${i}`)}</span>
                <span className={`shrink-0 rounded-full border px-2 text-xs ${IMPACT[i - 1] === 'high' ? 'border-coral/70 text-coral' : IMPACT[i - 1] === 'medium' ? 'border-hl/70 text-hl' : 'border-line text-mute'}`}>
                  {t('dn.impact')}: {k(`dn.impact.${IMPACT[i - 1]}`)}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  )
}
