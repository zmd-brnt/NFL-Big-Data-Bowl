interface Props {
  values: number[]
  /** Índice del punto seleccionado (amarillo). Por defecto el último. */
  sel?: number
  min?: number
  max?: number
  w?: number
  h?: number
  /** Marca el mínimo y el máximo con puntos pequeños. */
  extremes?: boolean
  line?: string
  label: string
}

export default function Sparkline({ values, sel, min, max, w = 120, h = 34, extremes = true, line = '#B9C7BF', label }: Props) {
  const pad = 4
  const last = values.length - 1
  const lo = min ?? Math.min(...values)
  const hi = max ?? Math.max(...values)
  const x = (i: number) => pad + (i * (w - 2 * pad)) / last
  const y = (v: number) => h - pad - ((v - lo) / (hi - lo || 1)) * (h - 2 * pad)
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const s = sel ?? last
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${label}: ${values.join(', ')}`} className="block h-auto w-full overflow-visible">
      <polyline points={pts} fill="none" stroke={line} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      {extremes && [values.indexOf(Math.min(...values)), values.indexOf(Math.max(...values))].map(i => (
        <circle key={i} cx={x(i)} cy={y(values[i])} r={1.8} fill="#6F8478" />
      ))}
      <circle cx={x(s)} cy={y(values[s])} r={3} fill="#FFD43B" />
    </svg>
  )
}
