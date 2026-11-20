export interface FlapChar { ch: string; dot: boolean }

/** Separa un valor como "62.0" en mosaicos: cada dígito es uno y el punto va aparte. */
export function flapChars(value: string): FlapChar[] {
  return [...value].map(ch => ({ ch, dot: ch === '.' }))
}
