const LO = 0.08
const HI = 0.75

/** Opacidad de una celda del mapa de calor (rampa de un solo tono). Fuera de rango se recorta. */
export function heatAlpha(value: number, min: number, max: number): number {
  if (max <= min) return 0.4
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)))
  return Math.round((LO + t * (HI - LO)) * 1000) / 1000
}
