import { defineArea } from '../define.ts'

export const analysis = defineArea(
  {
    'mu.sort': 'Sort by', 'mu.col.blocker': 'Blocker', 'mu.col.rusher': 'Pass rusher', 'mu.col.snaps': 'Snaps', 'mu.col.won': 'Blocks won %',
    'mu.col.allowed': 'Pressures allowed', 'mu.col.sacks': 'Sacks allowed',
    'mu.scatter': 'Blockers who win more allow fewer pressures', 'mu.scatterSub': 'Each dot is one duel. The line is the average of blocks won. The three worst are labeled.',
    'mu.avgWon': 'Average',
    'sc.metric': 'Metric', 'sc.heat': '{metric} by formation and coverage', 'sc.heatSub': 'Darker means a higher value. Each cell also shows how many plays it has.',
    'sc.plays': '{n} plays', 'sc.formation': 'Formation', 'sc.paTitle': 'Play action beats a standard dropback', 'sc.paSub': 'PA is play action. No PA is every other pass play.',
    'sc.withPA': 'PA', 'sc.withoutPA': 'No PA',
    'st.metric': 'Metric', 'st.fd': 'First down %', 'st.matrix': '{metric} by down and yards to go', 'st.matrixSub': 'Yards to go is in yards. Darker means a higher value.',
    'st.dtg': 'Yards to go', 'st.special': 'Red zone passing is the hardest spot to complete', 'st.specialSub': 'Completion % by situation. The line is the rest of the plays.',
    'st.redZone': 'Red zone', 'st.twoMinute': 'Last 2 min', 'st.rest': 'Rest of plays', 'st.table.plays': 'Plays', 'st.table.sack': 'Sack %',
  },
  {
    'mu.sort': 'Ordenar por', 'mu.col.blocker': 'Bloqueador', 'mu.col.rusher': 'Pass rusher', 'mu.col.snaps': 'Snaps', 'mu.col.won': '% de bloqueos ganados',
    'mu.col.allowed': 'Presiones permitidas', 'mu.col.sacks': 'Sacks permitidos',
    'mu.scatter': 'Los bloqueadores que ganan más permiten menos presiones', 'mu.scatterSub': 'Cada punto es un duelo. La línea es el promedio de bloqueos ganados. Los tres peores llevan nombre.',
    'mu.avgWon': 'Promedio',
    'sc.metric': 'Métrica', 'sc.heat': '{metric} por formación y cobertura', 'sc.heatSub': 'Más oscuro significa un valor más alto. Cada celda muestra también cuántas jugadas tiene.',
    'sc.plays': '{n} jugadas', 'sc.formation': 'Formación', 'sc.paTitle': 'El play action supera al dropback tradicional', 'sc.paSub': 'PA es play action. Sin PA es cualquier otra jugada de pase.',
    'sc.withPA': 'PA', 'sc.withoutPA': 'Sin PA',
    'st.metric': 'Métrica', 'st.fd': '% de primer down', 'st.matrix': '{metric} por down y yardas por avanzar', 'st.matrixSub': 'Las yardas por avanzar van en yardas. Más oscuro significa un valor más alto.',
    'st.dtg': 'Yardas por avanzar', 'st.special': 'Completar pases en la red zone es lo más difícil', 'st.specialSub': '% de completos por situación. La línea es el resto de las jugadas.',
    'st.redZone': 'Red zone', 'st.twoMinute': 'Últimos 2 min', 'st.rest': 'Resto de jugadas', 'st.table.plays': 'Jugadas', 'st.table.sack': '% de sacks',
  },
)
