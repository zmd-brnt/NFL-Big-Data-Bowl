import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLang } from '../i18n/LangContext'
import { useReducedMotion } from '../lib/useReducedMotion'
import { DUR, S, T, C, E, buildFieldMarkup } from '../lib/fieldMarkup'

export interface Playback {
  svgRef: React.RefObject<SVGSVGElement>
  scrubRef: React.RefObject<HTMLInputElement>
  playing: boolean
  setPlaying: (p: boolean) => void
  replay: () => void
  seek: (t: number) => void
}

/** Control de reproducción de la jugada. Con movimiento reducido arranca en el cuadro final. */
export function useFieldPlayback(): Playback {
  const svgRef = useRef<SVGSVGElement>(null)
  const scrubRef = useRef<HTMLInputElement>(null)
  const reduced = useReducedMotion()
  const [playing, setPlaying] = useState(!reduced)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    if (playing) svg.unpauseAnimations()
    else svg.pauseAnimations()
  }, [playing])

  useEffect(() => {
    const svg = svgRef.current
    if (reduced && svg) { svg.pauseAnimations(); svg.setCurrentTime(DUR * (E + 0.03)); setPlaying(false) }
  }, [reduced])

  useEffect(() => {
    let id = 0
    const tick = () => {
      if (playing && svgRef.current && scrubRef.current) scrubRef.current.value = (svgRef.current.getCurrentTime() % DUR).toFixed(2)
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [playing])

  const replay = useCallback(() => { svgRef.current?.setCurrentTime(0); setPlaying(true) }, [])
  const seek = useCallback((time: number) => { setPlaying(false); svgRef.current?.setCurrentTime(time) }, [])
  return { svgRef, scrubRef, playing, setPlaying, replay, seek }
}

interface FieldProps { pb: Playback; offense: string; defense: string; gain: string }

export function FieldSvg({ pb, offense, defense, gain }: FieldProps) {
  const { t } = useLang()
  const markup = useMemo(() => buildFieldMarkup(offense, defense), [offense, defense])
  const dur = `${DUR}s`
  return (
    <svg ref={pb.svgRef} viewBox="0 0 1200 533" role="img" aria-label={t('ov.fieldAria')} className="block h-auto w-full">
      <g dangerouslySetInnerHTML={{ __html: markup }} />
      <text x={530} y={26} textAnchor="end" fontSize={17} fontWeight={600} fill="#4C8DFF">{t('ov.los')}</text>
      <text x={632} y={26} fontSize={17} fontWeight={600} fill="#FFD43B">{t('ov.ltg')}</text>
      <text x={950} y={124} textAnchor="middle" fontSize={30} fontWeight={700} fill="#FFD43B" opacity={0}>
        +{gain}
        <animate attributeName="opacity" values="0;0;1;1" keyTimes={`0;${E - 0.02};${E + 0.03};1`} dur={dur} repeatCount="indefinite" />
      </text>
      <text x={468} y={224} textAnchor="middle" fontSize={16} fontWeight={600} fill="#FF6B5E" opacity={0}>
        {t('ov.hurry')}
        <animate attributeName="opacity" values="0;0;1;1" keyTimes={`0;${T - 0.01};${T + 0.02};1`} dur={dur} repeatCount="indefinite" />
      </text>
    </svg>
  )
}

export function PlayControls({ pb }: { pb: Playback }) {
  const { t } = useLang()
  const btn = 'rounded-[10px] bg-chalk/10 px-3 py-[7px] text-[13px] font-semibold hover:bg-chalk/20'
  const mark = (at: number, label: string) => (
    <span key={label} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${at * 100}%` }}>{label}</span>
  )
  return (
    <div>
      <div className="mb-2.5 flex gap-2">
        <button type="button" className={btn} aria-pressed={pb.playing} onClick={() => pb.setPlaying(!pb.playing)}>{pb.playing ? t('ov.pause') : t('ov.play')}</button>
        <button type="button" className={btn} onClick={pb.replay}>{t('ov.replay')}</button>
      </div>
      <input ref={pb.scrubRef} type="range" min={0} max={DUR} step={0.01} defaultValue={0} aria-label={t('ov.timeline')} onChange={e => pb.seek(Number(e.target.value))} className="w-full accent-hl" />
      <div className="relative h-4 text-[11.5px] text-mute">{mark(S, t('ov.snap'))}{mark(T, t('ov.throw'))}{mark(C, t('ov.catch'))}</div>
    </div>
  )
}
