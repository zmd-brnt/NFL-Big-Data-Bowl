interface Props {
  /** Yarda de la línea de scrimmage medida desde la zona de gol propia (0 a 100). */
  los: number
  toGo: number
  label: string
}

/** Franja de 100 yardas con la línea de scrimmage (azul) y la línea de primer down (amarilla). */
export default function YardStrip({ los, toGo, label }: Props) {
  const x = (yd: number) => 20 + yd * 9.6
  const gain = Math.min(100, los + toGo)
  return (
    <svg viewBox="0 0 1000 64" role="img" aria-label={label} className="block h-auto w-full">
      <rect x={20} y={14} width={960} height={36} rx={6} fill="#112419" />
      {Array.from({ length: 21 }, (_, i) => (
        <line key={i} x1={x(i * 5)} x2={x(i * 5)} y1={14} y2={50} stroke="#EEF1EA" strokeOpacity={i % 2 ? 0.1 : 0.22} />
      ))}
      <line x1={x(los)} x2={x(los)} y1={6} y2={58} stroke="#4C8DFF" strokeWidth={4} />
      <line x1={x(gain)} x2={x(gain)} y1={6} y2={58} stroke="#FFD43B" strokeWidth={4} />
      {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(n => (
        <text key={n} x={x(n)} y={36} textAnchor="middle" fontSize={13} fill="#EEF1EA" fillOpacity={0.35}>{n > 50 ? 100 - n : n}</text>
      ))}
    </svg>
  )
}
