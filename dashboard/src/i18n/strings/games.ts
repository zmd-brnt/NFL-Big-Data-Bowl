import { defineArea } from '../define.ts'

export const games = defineArea(
  {
    'gm.team': 'Team', 'gm.allTeams': 'All teams', 'gm.noGame': '{team} has no game in week {n} (bye or not in this sample).',
    'gm.detailHint': 'The highlighted bar is the better value in each metric.', 'gm.attempts': 'Attempts',
    'gm.kickoff': 'Kickoff', 'gm.list': 'Games of the week',
    'pl.down': 'Down', 'pl.distance': 'Yards to go', 'pl.quarter': 'Quarter', 'pl.count': '{n} plays', 'pl.empty': 'No plays match these filters.',
    'pl.col.q': 'Q', 'pl.col.clock': 'Clock', 'pl.col.dd': 'Down & dist.', 'pl.col.team': 'Offense', 'pl.col.line': 'Yard line',
    'pl.col.form': 'Formation', 'pl.col.cov': 'Coverage', 'pl.col.res': 'Result', 'pl.col.gain': 'Gain', 'pl.col.fd': '1st down',
    'pl.res.C': 'Complete', 'pl.res.I': 'Incomplete', 'pl.res.S': 'Sack', 'pl.res.R': 'Scramble', 'pl.res.IN': 'Interception',
    'pl.original': 'Original description (English)', 'pl.stripAria': 'Line of scrimmage and line to gain on a 100-yard field',
    'pl.playAction': 'Play action', 'pl.yes': 'Yes', 'pl.no': 'No', 'pl.detail': 'Play detail',
  },
  {
    'gm.team': 'Equipo', 'gm.allTeams': 'Todos los equipos', 'gm.noGame': '{team} no juega en la semana {n} (descanso o fuera de esta muestra).',
    'gm.detailHint': 'La barra resaltada es el mejor valor de cada métrica.', 'gm.attempts': 'Intentos',
    'gm.kickoff': 'Inicio', 'gm.list': 'Partidos de la semana',
    'pl.down': 'Down', 'pl.distance': 'Yardas por avanzar', 'pl.quarter': 'Cuarto', 'pl.count': '{n} jugadas', 'pl.empty': 'Ninguna jugada coincide con estos filtros.',
    'pl.col.q': 'C', 'pl.col.clock': 'Reloj', 'pl.col.dd': 'Down y dist.', 'pl.col.team': 'Ofensiva', 'pl.col.line': 'Yarda',
    'pl.col.form': 'Formación', 'pl.col.cov': 'Cobertura', 'pl.col.res': 'Resultado', 'pl.col.gain': 'Ganancia', 'pl.col.fd': '1.er down',
    'pl.res.C': 'Completo', 'pl.res.I': 'Incompleto', 'pl.res.S': 'Sack', 'pl.res.R': 'Scramble', 'pl.res.IN': 'Intercepción',
    'pl.original': 'Descripción original (en inglés)', 'pl.stripAria': 'Línea de scrimmage y línea de primer down en un campo de 100 yardas',
    'pl.playAction': 'Play action', 'pl.yes': 'Sí', 'pl.no': 'No', 'pl.detail': 'Detalle de la jugada',
  },
)
