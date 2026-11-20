import { defineArea } from '../define.ts'

export const teamsPlayers = defineArea(
  {
    'tm.team': 'Team', 'tm.compare': 'Compare with', 'tm.none': 'No comparison', 'tm.avg': 'Weeks 1–8 averages', 'tm.trend': 'Weekly trend',
    'tm.formations': 'Offensive formations', 'tm.coverages': 'Coverages faced', 'tm.share': 'Share of pass plays',
    'tm.hint': 'The highlighted bar is the better value in each metric.',
    'pr.group': 'Group', 'pr.g.QB': 'Quarterbacks', 'pr.g.RUSH': 'Pass rushers', 'pr.g.BLOCK': 'Blockers',
    'pr.a': 'Player A', 'pr.b': 'Player B', 'pr.profile': 'Profile', 'pr.college': 'College', 'pr.age': 'Age {n}', 'pr.jersey': '#{n}',
    'pr.compare': 'Comparison', 'pr.hint': 'Bars share one scale for the whole group. Highlighted: better value.',
    'pr.m.compPct': 'Completion %', 'pr.m.yardsPerAttempt': 'Yards per attempt', 'pr.m.pressuredPct': 'Pressured %', 'pr.m.timeToThrowS': 'Time to throw',
    'pr.m.pressures': 'Pressures', 'pr.m.sacks': 'Sacks', 'pr.m.hurries': 'Hurries', 'pr.m.topSpeedYdS': 'Top speed',
    'pr.m.blocksWonPct': 'Blocks won %', 'pr.m.pressuresAllowed': 'Pressures allowed', 'pr.m.sacksAllowed': 'Sacks allowed', 'pr.m.snaps': 'Pass-block snaps',
  },
  {
    'tm.team': 'Equipo', 'tm.compare': 'Comparar con', 'tm.none': 'Sin comparación', 'tm.avg': 'Promedios de las semanas 1–8', 'tm.trend': 'Tendencia semanal',
    'tm.formations': 'Formaciones ofensivas', 'tm.coverages': 'Coberturas enfrentadas', 'tm.share': 'Porcentaje de jugadas de pase',
    'tm.hint': 'La barra resaltada es el mejor valor de cada métrica.',
    'pr.group': 'Grupo', 'pr.g.QB': 'Quarterbacks', 'pr.g.RUSH': 'Pass rushers', 'pr.g.BLOCK': 'Bloqueadores',
    'pr.a': 'Jugador A', 'pr.b': 'Jugador B', 'pr.profile': 'Ficha', 'pr.college': 'Universidad', 'pr.age': '{n} años', 'pr.jersey': '#{n}',
    'pr.compare': 'Comparación', 'pr.hint': 'Las barras comparten una escala para todo el grupo. Resaltado: mejor valor.',
    'pr.m.compPct': '% de completos', 'pr.m.yardsPerAttempt': 'Yardas por intento', 'pr.m.pressuredPct': '% de presión recibida', 'pr.m.timeToThrowS': 'Tiempo para lanzar',
    'pr.m.pressures': 'Presiones', 'pr.m.sacks': 'Sacks', 'pr.m.hurries': 'Hurries', 'pr.m.topSpeedYdS': 'Velocidad máxima',
    'pr.m.blocksWonPct': '% de bloqueos ganados', 'pr.m.pressuresAllowed': 'Presiones permitidas', 'pr.m.sacksAllowed': 'Sacks permitidos', 'pr.m.snaps': 'Snaps de bloqueo de pase',
  },
)
