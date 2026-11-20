import { heatAlpha } from '../lib/heat'

interface Cell { row: string; col: string; value: number; note?: string }
interface Props {
  rows: string[]
  cols: string[]
  cells: Cell[]
  format: (n: number) => string
  corner: string
  label: string
}

/** Mapa de calor de un solo tono (amarillo). Cada celda trae su valor y, si se pide, una nota. */
export default function HeatGrid({ rows, cols, cells, format, corner, label }: Props) {
  const values = cells.map(c => c.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const find = (r: string, c: string) => cells.find(x => x.row === r && x.col === c)
  return (
    <div className="overflow-x-auto" role="table" aria-label={label}>
      <table className="w-full min-w-[620px] border-separate border-spacing-1 text-center text-[13px] tabular-nums">
        <thead><tr>
          <th className="px-2 py-1 text-left text-xs font-semibold text-mute">{corner}</th>
          {cols.map(c => <th key={c} scope="col" className="px-2 py-1 text-xs font-semibold text-mute">{c}</th>)}
        </tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r}>
              <th scope="row" className="px-2 py-1 text-left text-xs font-semibold text-mute">{r}</th>
              {cols.map(c => {
                const cell = find(r, c)
                if (!cell) return <td key={c} />
                const a = heatAlpha(cell.value, min, max)
                return (
                  <td key={c} className="rounded-md px-2 py-2" style={{ background: `rgba(255,212,59,${a})`, color: a > 0.5 ? '#10201A' : '#EEF1EA' }}>
                    <div className="font-semibold">{format(cell.value)}</div>
                    {cell.note && <div className="text-[11px] opacity-75">{cell.note}</div>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
