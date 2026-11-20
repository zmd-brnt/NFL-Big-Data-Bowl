import { useLang } from '../i18n/LangContext'
import { plainText, withSampleMark } from '../lib/rich'
import { useNotes } from '../lib/useNotes'
import { Rich } from '../components/Term'
import { Icon, PageHeader, Panel } from '../components/ui'

export default function BoothNotes() {
  const { t, lang } = useLang()
  const { notes, unpin } = useNotes()
  const mark = t('app.sampleSuffix')
  return (
    <>
      <div className="no-print">
        <PageHeader title={t('nav.notes')} sub={`${t('nav.notes.d')}. ${t('bn.count', { n: notes.length })}`} />
        <div className="mb-4">
          <button
            type="button" onClick={() => window.print()} disabled={notes.length === 0}
            className="flex items-center gap-2 rounded-[10px] bg-hl px-3.5 py-2 text-sm font-semibold text-turf disabled:opacity-40"
          >
            <Icon name="print" className="h-4 w-4" />{t('bn.print')}
          </button>
        </div>
        {notes.length === 0 ? (
          <Panel>
            <p className="font-semibold">{t('bn.empty')}</p>
            <p className="mb-3 text-sm text-mute">{t('bn.hint')}</p>
            <a href="#/overview" className="text-sm font-semibold text-hl underline">{t('bn.goOverview')}</a>
          </Panel>
        ) : (
          <Panel>
            <ul className="grid gap-3">
              {notes.map(n => (
                <li key={n.id} className="grid grid-cols-[1fr_auto] items-start gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
                  <span className="text-[14.5px] leading-snug"><Rich text={n[lang]} />{n.sample && <span className="ml-2 text-xs text-mute">{mark}</span>}</span>
                  <button type="button" onClick={() => unpin(n.id)} aria-label={`${t('bn.remove')}: ${plainText(n[lang])}`} className="flex items-center gap-1 rounded-[7px] px-2 py-1 text-xs text-mute hover:bg-chalk/10 hover:text-chalk">
                    <Icon name="trash" className="h-[15px] w-[15px]" />{t('bn.remove')}
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
      <div className="print-only print-sheet" data-mark={t('bn.mark')}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>{t('bn.sheetTitle')}</h1>
        <p style={{ marginBottom: 16 }}>{t('bn.sheetSub')}</p>
        <ol style={{ paddingLeft: 20, fontSize: 16, lineHeight: 1.5 }}>
          {notes.map(n => <li key={n.id} style={{ marginBottom: 10 }}>{withSampleMark(plainText(n[lang]), mark, n.sample)}</li>)}
        </ol>
      </div>
    </>
  )
}
