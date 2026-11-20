import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts'

interface Props {
  rows: { name: string; share: number }[]
  label: string
  /** Máximo del eje: se comparte entre gráficas que se comparan. */
  max?: number
}

/** Barras horizontales de participación (%), con etiqueta directa. Solo la mayor va en amarillo. */
export default function ShareBars({ rows, label, max = 70 }: Props) {
  const sorted = [...rows].sort((a, b) => b.share - a.share)
  return (
    <div role="img" aria-label={`${label}: ${sorted.map(r => `${r.name} ${r.share.toFixed(1)}%`).join(', ')}`}>
      <ResponsiveContainer width="100%" height={sorted.length * 28 + 8}>
        <BarChart data={sorted} layout="vertical" margin={{ left: 0, right: 44, top: 0, bottom: 0 }}>
          <XAxis type="number" hide domain={[0, max]} />
          <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={84} tick={{ fill: '#EEF1EA', fontSize: 12 }} />
          <Bar dataKey="share" barSize={12} radius={3} isAnimationActive={false}>
            {sorted.map((r, i) => <Cell key={r.name} fill={i === 0 ? '#FFD43B' : '#8FA398'} />)}
            <LabelList dataKey="share" position="right" formatter={(v: unknown) => `${Number(v).toFixed(1)}%`} fill="#EEF1EA" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
