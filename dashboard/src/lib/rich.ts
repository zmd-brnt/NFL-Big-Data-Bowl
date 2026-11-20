export type RichToken =
  | { type: 'text'; text: string }
  | { type: 'term'; id: string; text: string }
  | { type: 'strong'; text: string }

/** Marcas: {id|texto} es un término del glosario y **texto** es el dato clave. */
export function parseRich(input: string): RichToken[] {
  const out: RichToken[] = []
  const re = /\{([\w-]+)\|([^}]+)\}|\*\*([^*]+)\*\*/g
  let last = 0
  for (let m = re.exec(input); m; m = re.exec(input)) {
    if (m.index > last) out.push({ type: 'text', text: input.slice(last, m.index) })
    out.push(m[1] ? { type: 'term', id: m[1], text: m[2] } : { type: 'strong', text: m[3] })
    last = m.index + m[0].length
  }
  if (last < input.length) out.push({ type: 'text', text: input.slice(last) })
  return out
}
export const plainText = (input: string): string => parseRich(input).map(t => t.text).join('')

/** Texto que sale de la página (copiar, imprimir): lleva la marca mientras los datos sean de ejemplo. */
export const withSampleMark = (text: string, mark: string, sample: boolean): string => (sample ? `${text} ${mark}` : text)
