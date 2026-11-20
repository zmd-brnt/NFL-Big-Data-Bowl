import type { ReactNode } from 'react'
import { getGlossary } from '../data'
import { useLang } from '../i18n/LangContext'
import { parseRich } from '../lib/rich'

const ENTRIES = new Map(getGlossary().map(e => [e.id, e]))

/** Término con definición emergente. Al hacer clic abre su entrada del glosario. */
export function Term({ id, children }: { id: string; children: ReactNode }) {
  const { lang } = useLang()
  const entry = ENTRIES.get(id)
  if (!entry) return <>{children}</>
  return (
    <a href={`#/glossary/${id}`} className="term" aria-describedby={undefined}>
      {children}
      <span className="term-pop" role="tooltip">{entry[lang].def}</span>
    </a>
  )
}

/** Texto con marcas: {id|término} y **dato clave**. */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {parseRich(text).map((tk, i) =>
        tk.type === 'text' ? <span key={i}>{tk.text}</span>
          : tk.type === 'strong' ? <mark key={i}>{tk.text}</mark>
            : <Term key={i} id={tk.id}>{tk.text}</Term>,
      )}
    </>
  )
}
