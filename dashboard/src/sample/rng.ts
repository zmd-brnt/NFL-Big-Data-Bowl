/** Generador con semilla (mulberry32): los datos de ejemplo son siempre los mismos. */
export function rng(seed: number): () => number {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let x = Math.imul(a ^ (a >>> 15), 1 | a)
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}
export const between = (r: () => number, lo: number, hi: number): number => lo + (hi - lo) * r()
export const round1 = (n: number): number => Math.round(n * 10) / 10
export const pick = <T>(r: () => number, arr: readonly T[]): T => arr[Math.floor(r() * arr.length)]
