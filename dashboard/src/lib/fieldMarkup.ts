/** Campo de 1200 × 533 (10 unidades por yarda) y una jugada de pase animada con SMIL. */
export const DUR = 6.5
/** Hitos como fracción del ciclo: snap, lanzamiento, recepción y fin del movimiento. */
export const S = 0.092
export const T = 0.508
export const C = 0.723
export const E = 0.862

type Pt = [number, number]
type Stop = [number, number]

/** stops: [índice del punto, fracción del ciclo]. keyPoints se calcula por longitud recorrida. */
export function motionAttrs(pts: Pt[], stops: Stop[]) {
  const cum = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  const total = cum[cum.length - 1]
  return {
    keyPoints: stops.map(s => (cum[s[0]] / total).toFixed(4)).join(';'),
    keyTimes: stops.map(s => s[1]).join(';'),
    path: 'M' + pts.map(p => p.join(' ')).join(' L'),
  }
}

const mo = (pts: Pt[], stops: Stop[]) => {
  const m = motionAttrs(pts, stops)
  return `<animateMotion dur="${DUR}s" repeatCount="indefinite" calcMode="linear" keyPoints="${m.keyPoints}" keyTimes="${m.keyTimes}" path="${m.path}"/>`
}
const an = (attr: string, values: string, times: number[]) =>
  `<animate attributeName="${attr}" values="${values}" keyTimes="${times.join(';')}" dur="${DUR}s" repeatCount="indefinite"/>`

const arc = (x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, n: number): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const u = (i + 1) / n
    return [(1 - u) ** 2 * x0 + 2 * (1 - u) * u * cx + u * u * x1, (1 - u) ** 2 * y0 + 2 * (1 - u) * u * cy + u * u * y1].map(Math.round) as Pt
  })

const CH = '#EEF1EA'
const O = (x: number, y: number, a = '') =>
  `<g${a ? '' : ` transform="translate(${x} ${y})"`}><circle r="8" fill="#10201A" stroke="${CH}" stroke-width="2.6"/>${a}</g>`
const X = (x: number, y: number, a = '', c = '#9DB0A5') =>
  `<g${a ? '' : ` transform="translate(${x} ${y})"`}><path d="M-6.5-6.5L6.5 6.5M6.5-6.5L-6.5 6.5" stroke="${c}" stroke-width="3" stroke-linecap="round"/>${a}</g>`
const hold = (x: number, y: number, dx: number) => mo([[x, y], [x + dx, y]], [[0, 0], [0, S], [1, T], [1, 1]])

export function buildFieldMarkup(offense: string, defense: string): string {
  const W = 1200
  const H = 533
  let s = ''
  for (let i = 0; i < 20; i++) s += `<rect x="${100 + i * 50}" width="50" height="${H}" fill="${i % 2 ? '#142A21' : '#112419'}"/>`
  s += `<rect width="100" height="${H}" fill="#0C1812"/><rect x="1100" width="100" height="${H}" fill="#0C1812"/>`
  for (let x = 100; x <= 1100; x += 50) s += `<line x1="${x}" x2="${x}" y2="${H}" stroke="${CH}" stroke-opacity="${x % 100 ? 0.1 : 0.24}" stroke-width="${x === 100 || x === 1100 ? 3 : 1.5}"/>`
  for (let x = 110; x < 1100; x += 10) for (const y of [0, 196, 331, H - 8]) s += `<line x1="${x}" x2="${x}" y1="${y}" y2="${y + 8}" stroke="${CH}" stroke-opacity=".16"/>`
  ;[10, 20, 30, 40, 50, 40, 30, 20, 10].forEach((n, i) => {
    for (const y of [96, 455]) s += `<text x="${200 + i * 100}" y="${y}" text-anchor="middle" font-size="34" font-weight="700" fill="${CH}" fill-opacity=".14">${n}</text>`
  })
  s += `<text transform="translate(58 ${H / 2}) rotate(-90)" text-anchor="middle" font-size="40" font-weight="700" letter-spacing="10" fill="${CH}" fill-opacity=".2">${offense}</text>`
  s += `<text transform="translate(${W - 58} ${H / 2}) rotate(90)" text-anchor="middle" font-size="40" font-weight="700" letter-spacing="10" fill="${CH}" fill-opacity=".2">${defense}</text>`
  s += `<line x1="540" x2="540" y2="${H}" stroke="#4C8DFF" stroke-width="4"/><line x1="620" x2="620" y2="${H}" stroke="#FFD43B" stroke-width="4"/>`
  const ARC = arc(490, 266, 670, 60, 840, 150, 16)
  s += `<polyline pathLength="1" points="490,266 ${ARC.map(p => p.join(',')).join(' ')}" fill="none" stroke="${CH}" stroke-width="3" stroke-dasharray="1" stroke-dashoffset="1" stroke-linecap="round" opacity=".8">${an('stroke-dashoffset', '1;1;0;0', [0, T, C, 1])}</polyline>`
  for (const y of [234, 250, 266, 282, 298]) s += O(528, y, hold(528, y, -7))
  s += O(490, 266) + O(505, 284, mo([[505, 284], [524, 278]], [[0, 0], [0, S], [1, T], [1, 1]]))
  s += O(528, 322, mo([[528, 322], [580, 334], [606, 362]], [[0, 0], [0, S], [2, 0.55], [2, 1]]))
  s += O(538, 70, mo([[538, 70], [700, 66], [900, 76]], [[0, 0], [0, S], [2, E], [2, 1]]))
  s += O(536, 160, mo([[536, 160], [600, 158], [700, 152], [840, 150], [900, 158], [950, 164]], [[0, 0], [0, S], [3, C], [5, E], [5, 1]]))
  s += O(538, 470, mo([[538, 470], [640, 466], [700, 404], [760, 384]], [[0, 0], [0, S], [3, 0.8], [3, 1]]))
  s += X(552, 238, mo([[552, 238], [535, 246], [512, 258], [496, 264]], [[0, 0], [0, S], [3, T], [3, 1]]), '#FF6B5E')
  for (const y of [258, 278, 298]) s += X(552, y, hold(552, y, -14))
  s += X(580, 226, mo([[580, 226], [610, 214], [650, 206]], [[0, 0], [0, S], [2, 0.6], [2, 1]]))
  s += X(580, 266, mo([[580, 266], [562, 266], [546, 270]], [[0, 0], [0, S], [2, T - 0.06], [2, 1]]))
  s += X(580, 306, mo([[580, 306], [612, 318], [650, 330]], [[0, 0], [0, S], [2, 0.6], [2, 1]]))
  s += X(560, 66, mo([[560, 66], [720, 70], [900, 84]], [[0, 0], [0, S], [2, E], [2, 1]]))
  s += X(560, 160, mo([[560, 160], [620, 162], [720, 157], [815, 155], [880, 166], [925, 172]], [[0, 0], [0, S], [3, C], [5, E], [5, 1]]))
  s += X(560, 470, mo([[560, 470], [660, 468], [720, 414], [770, 394]], [[0, 0], [0, S], [3, 0.8], [3, 1]]))
  s += X(700, 266, mo([[700, 266], [730, 226], [790, 190]], [[0, 0], [0, S], [2, C], [2, 1]]))
  const ball: Pt[] = [[540, 266], [490, 266], ...ARC, [950, 164]]
  s += `<g><ellipse rx="7" ry="4.5" fill="#C58A4B" stroke="${CH}" stroke-width="1"/>${mo(ball, [[0, 0], [0, S], [1, S + 0.04], [1, T], [17, C], [18, E], [18, 1]])}</g>`
  s += `<circle cx="840" cy="150" r="10" fill="none" stroke="#FFD43B" stroke-width="3" opacity="0">${an('opacity', '0;0;1;1', [0, C, C + 0.01, 1])}${an('r', '10;10;30;30', [0, C, C + 0.07, 1])}</circle>`
  return s
}
