import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts'

interface Side { name: string; value: number }
interface Props {
  label: string
  a: Side
  b: Side
  /** Si es true, gana el valor menor (presión, sacks). */
  lowerIsBetter?: boolean
  format?: (n: number) => string
}

/** Dos barras horizontales con etiqueta directa. La del mejor valor va en amarillo y el resto en gris. */
export default function PairBars({ label, a, b, lowerIsBetter = false, format = n => n.toFixed(1) }: Props) {
  const aWins = lowerIsBetter ? a.value < b.value : a.value > b.value
  const data = [a, b].map((s, i) => ({ ...s, win: i === 0 ? aWins : !aWins }))
  return (
    <div role="img" aria-label={`${label}: ${a.name} ${format(a.value)}, ${b.name} ${format(b.value)}`}>
      <div className="text-xs text-mute">{label}</div>
      <ResponsiveContainer width="100%" height={72}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 48, top: 2, bottom: 2 }}>
          <XAxis type="number" hide domain={[0, 'dataMax']} />
          <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={56} tick={{ fill: '#EEF1EA', fontSize: 12 }} />
          <Bar dataKey="value" barSize={14} radius={3} isAnimationActive={false}>
            {data.map(d => <Cell key={d.name} fill={d.win ? '#FFD43B' : '#8FA398'} />)}
            <LabelList dataKey="value" position="right" formatter={(v: unknown) => format(Number(v))} fill="#EEF1EA" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
