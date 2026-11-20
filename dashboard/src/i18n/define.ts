/** Una área de textos con las mismas claves en inglés y español (TypeScript lo exige). */
export function defineArea<K extends string>(en: Record<K, string>, es: Record<K, string>) {
  return { en, es }
}
