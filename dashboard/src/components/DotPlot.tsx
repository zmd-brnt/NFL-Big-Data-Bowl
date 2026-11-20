interface Row { label: string; value: number }
interface Props {
  rows: Row[]
  reference: number
  referenceLabel: string
  highlight?: string
  title: string
  domain?: [number, number]
  format?: (n: number) => string
}

/** Gráfica de puntos con línea de referencia: cada fila muestra su distancia al promedio. */
export default function DotPlot({ rows, reference, referenceLabel, highlight, title, domain = [52, 68], format = n => n.toFixed(1) }: Props) {
  const [d0, d1] = domain
  const X = (v: number) => 150 + ((v - d0) / (d1 - d0)) * 260
  const Y = (i: number) => 58 + i * 32
  const axisY = Y(rows.length - 1) + 30
  const vals = rows.map(r => r.value)
  const tickStart = Math.floor(Math.min(...vals) / 5) * 5
  const ticks: number[] = []
  for (let t = tickStart; t <= Math.max(...vals); t += 5) ticks.push(t)
  return (
    <svg viewBox={`0 0 440 ${axisY + 22}`} role="img" aria-label={title} className="block h-auto w-full text-xs">
      <line x1={X(reference)} x2={X(reference)} y1={38} y2={Y(rows.length - 1) + 16} stroke="#4C8DFF" strokeWidth={2} />
      <text x={X(reference)} y={28} textAnchor="middle" fill="#4C8DFF" fontWeight={600}>{referenceLabel} {format(reference)}</text>
      {rows.map((r, i) => {
        const hi = r.label === highlight
        const right = r.value >= reference
        const color = hi ? '#FFD43B' : '#8FA398'
        const delta = hi ? ` (${(r.value - reference >= 0 ? '+' : '−')}${Math.abs(r.value - reference).toFixed(1)})` : ''
        return (
          <g key={r.label}>
            <text x={0} y={Y(i) + 4} fill="#EEF1EA">{r.label}</text>
            <line x1={X(reference)} x2={X(r.value)} y1={Y(i)} y2={Y(i)} stroke={color} strokeWidth={1.5} />
            <circle cx={X(r.value)} cy={Y(i)} r={5.5} fill={color} />
            <text x={X(r.value) + (right ? 11 : -11)} y={Y(i) + 4} textAnchor={right ? 'start' : 'end'} fill={hi ? '#FFD43B' : '#9DB0A5'} fontWeight={hi ? 600 : 400}>
              {format(r.value)}{delta}
            </text>
          </g>
        )
      })}
      {ticks.length > 0 && (
        <g fill="#9DB0A5">
          <line x1={X(ticks[0])} x2={X(ticks[ticks.length - 1])} y1={axisY} y2={axisY} stroke="#9DB0A5" />
          {ticks.map(t => <text key={t} x={X(t)} y={axisY + 15} textAnchor="middle">{t}</text>)}
        </g>
      )}
    </svg>
  )
}
