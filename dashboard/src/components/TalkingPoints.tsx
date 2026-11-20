import { useEffect, useRef, useState } from 'react'
import { IS_SAMPLE } from '../data'
import { useLang } from '../i18n/LangContext'
import { plainText, withSampleMark } from '../lib/rich'
import type { TalkingPoint } from '../lib/talkingPoints'
import { useNotes } from '../lib/useNotes'
import { Rich } from './Term'
import { Icon } from './ui'

/** Copia el texto con la marca de datos de ejemplo mientras los datos sean de ejemplo. */
export async function copyWithMark(text: string, mark: string): Promise<void> {
  try { await navigator.clipboard.writeText(withSampleMark(plainText(text), mark, IS_SAMPLE)) } catch { /* sin permiso de portapapeles */ }
}

export default function TalkingPoints({ points }: { points: TalkingPoint[] }) {
  const { t, lang } = useLang()
  const notes = useNotes()
  const [copied, setCopied] = useState<string | null>(null)
  const timer = useRef<number>()
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = (p: TalkingPoint) => {
    void copyWithMark(p[lang], t('app.sampleSuffix'))
    setCopied(p.id)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(null), 1400)
  }
  const btn = 'flex items-center gap-1 rounded-[7px] px-2 py-1 text-xs text-mute hover:bg-chalk/10 hover:text-chalk'
  return (
    <ul className="grid gap-3">
      {points.map(p => {
        const pinned = notes.has(p.id)
        return (
          <li key={p.id} className="grid grid-cols-[1fr_auto] items-start gap-2.5 border-b border-line pb-3 last:border-0 last:pb-0">
            <span className="text-[14.5px] leading-snug"><Rich text={p[lang]} /></span>
            <span className="flex gap-0.5">
              <button type="button" className={btn} onClick={() => copy(p)} aria-label={t('common.copy')}>
                <Icon name={copied === p.id ? 'check' : 'copy'} className="h-[15px] w-[15px]" />
                {copied === p.id && <span role="status">{t('common.copied')}</span>}
              </button>
              <button
                type="button" aria-pressed={pinned} aria-label={pinned ? t('common.unpin') : t('common.pin')}
                className={`${btn} ${pinned ? '!text-hl' : ''}`}
                onClick={() => (pinned ? notes.unpin(p.id) : notes.pin({ id: p.id, en: p.en, es: p.es, sample: IS_SAMPLE }))}
              >
                <Icon name="pin" className="h-[15px] w-[15px]" />
              </button>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
