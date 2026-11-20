# Datos limpios

Estos archivos se limpiaron con `docs/scripts/limpiar_data.py`, siguiendo `docs/RelacionesYLimpieza.md`.
Los originales están en `../data_original` (fuera del proyecto, con sumas en `../data_original.md5`).
Para regenerar o volver al original: `.venv/bin/python docs/scripts/limpiar_data.py` (lee del respaldo), o copiar `../data_original` sobre `data/`.

**Convenciones.** Nulo = celda vacía (ya no hay `NA` ni `None`). Banderas = 0/1. Fechas = `AAAA-MM-DD`. Las llaves son las de siempre: jugada = `(gameId, playId)`.

**Tracking orientado.** En todo `tracking/` el ataque avanza hacia X creciente: `x' = 120 − x`, `y' = 53.3 − y` y `o`, `dir` + 180° cuando `playDirection = left`. `playDirection` conserva la dirección original, así que es reversible. La línea de scrimmage ya orientada está en `plays.lineaX`. `event` vacío = sin evento. `time` del balón corregido (15 cuadros).

| Archivo | Cambios |
|---|---|
| games.csv | `gameDate` ISO. Nueva `kickoffEastern`. |
| players.csv | Nuevas `heightInches`, `positionGroup` (QB, RB, WR, TE, OL, DL, LB, DB) y `nameLabel` (único: añade la posición si el nombre se repite). `birthDate` unificada (recupera 14 fechas). |
| plays.csv | Ordenada cronológicamente (`orden`, `segJuego`). Nuevas: `playDirection`, `lineaX`, `passResultTexto`, `esNoPlay`, `esDosPuntos`, `hayPenalizacion`, `ladoSancionado`, `esTouchdown`, `yardasAZona`, `difMarcador`, `persO_*`, `persD_*`, `longitudPase`, `zonaPase`, `qbId`, `receptorId`, `tiempoAlLanzamiento`. `foulName1` completado en 20 faltas de equipo. `absoluteYardlineNumber` completado. Enteros sin `.0`. |
| pffScoutingData.csv | Nuevas `lado` (ofensa/defensa) y `team`. Banderas como enteros. |
| play_fouls.csv (nuevo) | Una fila por falta (787): `falta`, `nflId`, `orden`, `ladoInfractor`. |
| game_players.csv (nuevo) | Equipo y dorsal por partido y jugador (8,901). |
| play_events.csv (nuevo) | Eventos únicos de tracking (27,862), con `esAuto`. |
| teams.csv (nuevo) | Catálogo de 32 equipos: nombre, conferencia, división. |

**Reglas de uso.** Excluir `esNoPlay = 1` de estadísticas de la jugada. Excluir `esDosPuntos = 1` de estadísticas por down. Para yardas de la jugada sin sanción usar `prePenaltyPlayResult`. `tiempoAlLanzamiento` (s) usa el evento manual y, si falta, el automático.
