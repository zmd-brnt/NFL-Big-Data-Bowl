import { useLayoutEffect, useRef } from 'react'
import { flapChars } from '../lib/flap'
import { useReducedMotion } from '../lib/useReducedMotion'

interface Props {
  value: string
  unit?: string
  label: string
  /** Cambia cuando los mosaicos deben girar aunque el valor sea el mismo. */
  rollKey?: string | number
}

/** Valor numérico en mosaicos split-flap. Gira al montarse y cuando cambia value o rollKey. */
export default function SplitFlap({ value, unit, label, rollKey }: Props) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const chars = flapChars(value)

  useLayoutEffect(() => {
    if (reduced || !ref.current) return
    const tiles = Array.from(ref.current.querySelectorAll<HTMLElement>('[data-flap]'))
    const timers: number[] = []
    tiles.forEach((el, i) => {
      const final = el.dataset.flap ?? ''
      el.textContent = String(Math.floor(Math.random() * 10))
      timers.push(window.setTimeout(() => {
        let n = 0
        const id = window.setInterval(() => {
          n++
          if (n >= 7) {
            window.clearInterval(id)
            el.getAnimations().forEach(a => a.cancel())
            el.textContent = final
            return
          }
          el.textContent = String(Math.floor(Math.random() * 10))
          el.animate([{ transform: 'rotateX(-80deg)', opacity: 0.4 }, { transform: 'none', opacity: 1 }], { duration: 140 })
        }, 70)
        timers.push(id)
      }, i * 90))
    })
    return () => {
      timers.forEach(id => { window.clearTimeout(id); window.clearInterval(id) })
      tiles.forEach(el => { el.textContent = el.dataset.flap ?? '' })
    }
  }, [value, rollKey, reduced])

  return (
    <div ref={ref} role="img" aria-label={`${label}: ${value}${unit ?? ''}`} className="flex items-end justify-end gap-[3px]">
      {chars.map((c, i) =>
        c.dot
          ? <span key={i} aria-hidden className="mx-px mb-1.5 h-1.5 w-1.5 rounded-full bg-hl" />
          : <span key={i} aria-hidden data-flap={c.ch} className="flap-tile">{c.ch}</span>,
      )}
      {unit && <span aria-hidden className="mb-1 ml-0.5 text-[15px] font-semibold text-hl">{unit}</span>}
    </div>
  )
}
