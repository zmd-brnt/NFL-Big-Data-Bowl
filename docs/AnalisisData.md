# Análisis de la carpeta data: NFL Big Data Bowl (hackathon UNAM)

Ver también: [Relaciones, complementos y limpieza de los datos](RelacionesYLimpieza.md), que explica cómo se conectan estos archivos, qué se puede derivar de ellos y cómo prepararlos.

## 1. Resumen

- Temporada 2021, semanas 1 a 8: 122 partidos, 32 equipos y 1,679 jugadores.
- 8,557 jugadas de pase, que incluyen sacks, scrambles e intentos de 2 puntos. No hay carreras de running back ni pateos.
- Tracking: posición de los 22 jugadores y del balón en cada cuadro, a 10 cuadros por segundo (verificado: `dis` ≈ `s` × 0.1). Suma 8,314,178 filas en 122 archivos.
- Tamaño total: 826 MB. El tracking ocupa 811 MB.
- Las llaves cruzan entre tablas sin registros huérfanos (sección 3).
- El repositorio no tiene diccionario de datos. Las definiciones salen de nombres, valores y cruces entre tablas. Lo marcado como "inferido" debe confirmarse con la documentación oficial de la competencia, que no se pudo obtener ([RelacionesYLimpieza.md, anexo B](RelacionesYLimpieza.md#anexo-b-fuentes-y-límites)).

## 2. Inventario de archivos

| Archivo | Tamaño | Filas | Columnas | Una fila representa | Contenido |
|---|---|---|---|---|---|
| games.csv | 6.7 KB | 122 | 7 | Un partido | Calendario, semana y equipos |
| players.csv | 104 KB | 1,679 | 7 | Un jugador | Perfil físico, posición y universidad |
| plays.csv | 2.3 MB | 8,557 | 32 | Una jugada de pase | Situación, resultado, penalizaciones, formación y cobertura |
| pffScoutingData.csv | 13 MB | 188,254 | 15 | Un jugador en una jugada (22 por jugada) | Rol de cada jugador y duelos según PFF |
| tracking/tracking_<gameId>.csv | 811 MB en 122 archivos (4.9 a 9.5 MB cada uno) | 8,314,178 | 16 | Un jugador o el balón en un cuadro (23 por cuadro) | Posiciones, velocidad y eventos |

## 3. Llaves y relaciones

Detalle de las 14 relaciones comprobadas, con su cobertura: [RelacionesYLimpieza.md, sección 1](RelacionesYLimpieza.md#1-mapa-de-relaciones).

| Tabla | Llave | Nota |
|---|---|---|
| games | gameId | Único por partido |
| plays | gameId + playId | playId se repite entre partidos: 3,762 valores para 8,557 jugadas |
| pffScoutingData | gameId + playId + nflId | 22 filas por jugada |
| tracking | gameId + playId + frameId + nflId | Una fila de balón por cuadro, con nflId vacío |
| players | nflId | Único por jugador |

Verificado:
- Los 122 partidos de games.csv tienen su archivo de tracking, y no sobra ningún archivo.
- Las 8,557 jugadas de plays.csv coinciden exactamente con las de tracking y con las de pffScoutingData.
- Los 1,679 nflId de tracking y de pffScoutingData existen en players.csv. Los 500 nflId de faltas también.
- Los equipos de cada archivo de tracking coinciden con homeTeamAbbr y visitorTeamAbbr de su partido (122 de 122).
- El QB de cada jugada es la fila de pffScoutingData con pff_role = Pass (8,557 de 8,557). Su apellido aparece en la descripción de la jugada en el 100% de los casos, así que no hace falta extraerlo del texto.

## 4. Diccionario de datos

### 4.1 games.csv (un partido)

| Columna | Significado | Valores o formato |
|---|---|---|
| gameId | Identificador del partido | Entero. Empieza con la fecha del partido (AAAAMMDD) y termina con 2 dígitos de secuencia (verificado en 122 de 122), p. ej. 2021090900 |
| season | Temporada | 2021 en todas las filas |
| week | Semana | 1 a 8 |
| gameDate | Fecha | Texto MM/DD/AAAA |
| gameTimeEastern | Hora de inicio, hora del Este | HH:MM:SS |
| homeTeamAbbr | Abreviatura del local | 32 equipos |
| visitorTeamAbbr | Abreviatura del visitante | 32 equipos |

Sin nulos. No incluye marcador final, ganador ni nombres completos de equipos.

### 4.2 players.csv (un jugador)

| Columna | Significado | Valores o formato | Nulos |
|---|---|---|---|
| nflId | Identificador único del jugador | Entero | 0 |
| displayName | Nombre para mostrar | Texto, p. ej. "Tom Brady" | 0 |
| height | Estatura en pies y pulgadas | Texto, p. ej. "6-4" | 0 |
| weight | Peso | Libras, de 158 a 380 | 0 |
| birthDate | Fecha de nacimiento | AAAA-MM-DD (1,433) o MM/DD/AAAA (14) | 232 |
| collegeName | Universidad | Texto | 224 |
| officialPosition | Posición oficial | 19 valores: WR, CB, DE, OLB, RB, T, TE, DT, G, ILB, FS, SS, QB, C, NT, MLB, FB, LB, DB | 0 |

Edad aproximada en 2021: de 22 a 44 años, mediana 26.

### 4.3 plays.csv (una jugada de pase)

Situación:

| Columna | Significado | Valores o notas |
|---|---|---|
| gameId, playId | Llave de la jugada | Ver sección 3 |
| playDescription | Texto narrativo de la jugada | En inglés. Ejemplo: "(13:33) (Shotgun) T.Brady pass incomplete deep right to C.Godwin." |
| quarter | Cuarto | 1 a 4. El valor 5 aparece en 98 jugadas de 12 partidos, con reloj máximo de 10:00 (inferido: tiempo extra) |
| down | Intento | 1 a 4. El valor 0 aparece en 35 jugadas, todas intentos de 2 puntos |
| yardsToGo | Yardas para el primer down | 0 a 39 |
| possessionTeam, defensiveTeam | Equipo en ataque y equipo en defensa | Abreviaturas. Nunca son el mismo equipo |
| yardlineSide, yardlineNumber | Lado del campo y yarda de la línea de scrimmage | yardlineSide vacío en 125 jugadas, todas en la yarda 50 |
| absoluteYardlineNumber | Línea de scrimmage en la escala X de tracking (0 a 120) | 1 nulo. Coincide con la X del balón al snap en 84% de las jugadas (±1 yd) y en 98% (±2 yd) |
| gameClock | Tiempo restante del cuarto | MM:SS |
| preSnapHomeScore, preSnapVisitorScore | Marcador antes del snap | Enteros. No hay marcador final |

Resultado:

| Columna | Significado | Valores o notas |
|---|---|---|
| passResult | Resultado de la jugada | C completo: 4,620 (54.0%). I incompleto: 2,755 (32.2%). S sack: 543 (6.3%). R scramble: 449 (5.2%). IN intercepción: 190 (2.2%). Los códigos I, S, R e IN coinciden con el texto de la jugada en el 100% de los casos |
| playResult | Yardas ganadas o perdidas | De −34 a 91, media 6.6. Incluye penalizaciones. En intercepciones vale 0 (sección 6) |
| prePenaltyPlayResult | Yardas antes de penalizaciones | Úsala para medir la jugada sin castigo |

Penalizaciones:

| Columna | Significado | Valores o notas |
|---|---|---|
| penaltyYards | Yardas de penalización | Vacío en 7,801 jugadas. Hay 756 con penalización. El signo indica el lado sancionado: negativo es la ofensa (217), positivo es la defensa (399) y 0 es declinada, compensada o de 0 yardas (140). Verificado en 604 de 604 faltas con infractor en campo |
| foulName1, foulName2, foulName3 | Nombre de la falta | Texto en inglés, p. ej. "Defensive Pass Interference". Hay 736, 30 y 1 jugadas respectivamente |
| foulNFLId1, foulNFLId2, foulNFLId3 | nflId del jugador que cometió la falta | Entero. Se vincula con players.csv |

Formación y personal:

| Columna | Significado | Valores o notas |
|---|---|---|
| offenseFormation | Formación ofensiva | SHOTGUN, EMPTY, SINGLEBACK, I_FORM, PISTOL, JUMBO, WILDCAT. 7 nulos |
| personnelO | Personal ofensivo | Ej. "1 RB, 1 TE, 3 WR" (la más común, en 5,750 jugadas) |
| personnelD | Personal defensivo | Ej. "4 DL, 2 LB, 5 DB" |
| defendersInBox | Defensores en la caja al snap | 1 a 11. 7 nulos |
| dropBackType | Tipo de retroceso del QB | TRADITIONAL, SCRAMBLE, DESIGNED_ROLLOUT_LEFT/RIGHT, SCRAMBLE_ROLLOUT_LEFT/RIGHT, DESIGNED_RUN, UNKNOWN. 528 nulos (sección 6) |
| pff_playAction | Jugada de engaño (play action) | 1 en 2,038 jugadas |
| pff_passCoverage | Cobertura defensiva según PFF | 12 categorías. Las más comunes: Cover-3 (2,665), Cover-1 (2,011), Cover-2 (1,085) |
| pff_passCoverageType | Tipo de cobertura | Zone 5,588. Man 2,481. Other 488 |

### 4.4 pffScoutingData.csv (un jugador en una jugada)

Cada jugada tiene exactamente 22 filas, una por jugador en el campo (188,254 = 8,557 × 22).

| Columna | Significado | Valores o notas |
|---|---|---|
| gameId, playId, nflId | Llave | Único por jugador y jugada |
| pff_role | Rol del jugador en la jugada | Pass (QB, 8,557), Pass Block (46,057), Pass Route (39,513), Pass Rush (36,362), Coverage (57,765) |
| pff_positionLinedUp | Alineación según PFF | 56 valores, p. ej. QB, C, LT, RG, RCB, DLT, LEO, FSL, HB-L, TE-R, SRWR. Sin diccionario |
| pff_hit, pff_hurry, pff_sack | El defensor golpeó, presionó o sacó al QB | 1 o 0. Con valor 1 en Pass Rush: 823, 2,824 y 585. En Coverage: 20, 53 y 17 |
| pff_beatenByDefender | El bloqueador fue superado por el defensor | 1 o 0. Solo en Pass Block y en 2,030 filas Pass Route. Suma: 1,944 |
| pff_hitAllowed, pff_hurryAllowed, pff_sackAllowed | El bloqueador permitió golpe, presión o sack | 1 o 0. Sumas: 544, 2,083 y 370 |
| pff_nflIdBlockedPlayer | nflId del defensor que enfrentó el bloqueador | 46,526 filas con dato, 665 nflId distintos. En 46,524 es un jugador de la misma jugada (Pass Rush 46,095, Coverage 429) |
| pff_blockType | Tipo de bloqueo | 12 códigos: PP, PA, PT, SW, CL, CH, NB, PU, SR, BH, UP, PR. Sin diccionario |
| pff_backFieldBlock | Bloqueo desde la zona de backfield | 1 o 0. Probablemente un RB u otro jugador detrás de la línea (inferido) |

### 4.5 tracking/tracking_<gameId>.csv (un jugador o balón por cuadro)

Hay un archivo por partido (122). Cada cuadro tiene 23 filas: 22 jugadores y el balón. Hay 361,486 cuadros en total.

| Columna | Significado | Valores o notas |
|---|---|---|
| gameId, playId, frameId, nflId | Llave de la fila | nflId vacío en el balón |
| frameId | Número de cuadro dentro de la jugada | 1 a 203. Sirve para medir tiempos a 10 cuadros por segundo (verificado: el cociente mediano de `dis` entre `s` × 0.1 es 1.002) |
| time | Marca de tiempo en UTC | Resolución de 1 segundo: hay 8.2 cuadros por marca en promedio. No sirve para tiempos finos. Sí da la hora real de la jugada. En 15 cuadros, la fila del balón trae una marca distinta a la de los jugadores |
| jerseyNumber | Dorsal | Vacío en el balón |
| team | Equipo | Abreviatura, o football para el balón |
| playDirection | Dirección de ataque de la jugada | left o right. Con right, el ataque avanza hacia X mayor. Verificado: el QB está detrás de la línea de scrimmage en el 100% de los snaps |
| x, y | Posición en yardas (yd) | X de 0 a 120 (incluye zonas de anotación). Y de 0 a 53.3. Fuera de cancha: en jugadores, X de −3.55 a 121.15 (112 filas) e Y de −4.21 a 56.59 (857 filas). En el balón, Y de −4.53 a 57.72 (204 filas) |
| s | Velocidad | yd/s. Máximo de jugadores 11.18. Máximo del balón 29.34 (≈ 60 mph, un pase en vuelo) |
| a | Aceleración | yd/s². Nunca es negativa (mínimo 0), así que parece una magnitud. Máximo de jugadores 21.92 (10 filas con más de 15). Máximo del balón 50.69 |
| dis | Distancia desde el cuadro anterior | yd por cuadro. Máximo de jugadores 3.45 (49 filas con más de 1.3). El balón llega a 10.45 y tiene 5,660 filas con más de 3: coinciden con su desplazamiento real entre cuadros, son saltos de posición del balón en vuelo y no un error de cálculo de `dis` |
| o | Orientación del cuerpo | Grados, de 0 a 360. Se asume la misma convención que `dir` (inferido) |
| dir | Dirección de movimiento | Grados, de 0 a 360. 0° apunta hacia +Y y crece en sentido horario (90° es +X). Verificado: error mediano de 1.3° contra el desplazamiento |
| event | Evento etiquetado en ese cuadro | El texto None significa sin evento, y pandas lo lee como nulo por defecto. Un evento aparece en las 23 filas de su cuadro |

### 4.6 Eventos de tracking

Jugadas con cada evento, sobre 8,557. Los nombres vienen del archivo. Los significados son inferidos.

| Evento | Jugadas | Significado (inferido) |
|---|---|---|
| ball_snap | 8,532 (99.7%) | Snap del balón |
| pass_forward | 7,547 (88.2%) | Lanzamiento del pase |
| autoevent_ballsnap / autoevent_passforward | 3,757 / 3,734 | Mismos hitos, generados automáticamente. No son copias: en ninguna jugada con ambos coinciden en cuadro (mediana de 1 cuadro antes, hasta 167 antes en el snap) |
| play_action | 1,971 (23.0%) | Engaño |
| run | 474 | Carrera, probablemente del QB |
| qb_sack / qb_strip_sack | 451 / 58 | Sack, o sack con balón suelto |
| pass_arrived | 367 (4.3%) | Llegada del balón |
| pass_tipped | 111 | Pase desviado |
| pass_outcome_caught / pass_outcome_incomplete | 23 (0.3%) / 40 (0.5%) | Resultado del pase |
| fumble | 17 | Balón suelto |
| man_in_motion, shift, line_set | 177, 132, 114 | Movimientos antes del snap |
| tackle, out_of_bounds | 3, 1 | Tacleada, salida del campo |

## 5. Cobertura y alcance

- Temporada 2021, semanas 1 a 8. La temporada regular 2021 tuvo 272 partidos en 18 semanas. Faltan las semanas 9 a 18 y los playoffs.
- Semanas 1 a 5: 16 partidos cada una, con los 32 equipos.
- Semana 6: 14 partidos. Sin juego: ATL, NO, NYJ y SF.
- Semana 7: 13 partidos. Sin juego: BUF, DAL, JAX, LAC, MIN y PIT.
- Semana 8: 15 partidos. Sin juego: BAL y LV.
- Los 12 equipos con 7 partidos son exactamente los 12 ausentes en las semanas 6 a 8. Es coherente con semanas de descanso. No se verificó contra el calendario oficial.
- 8,557 jugadas de pase, unas 70 por partido. Todas las descripciones contienen pass, sack o scramble, y passResult no tiene nulos. Las carreras del QB aparecen como scramble.

## 6. Calidad de datos

Opciones de limpieza y normalización para cada hallazgo: [RelacionesYLimpieza.md, sección 3](RelacionesYLimpieza.md#3-limpieza-hallazgos-y-opciones).

| # | Hallazgo | Evidencia | Qué hacer |
|---|---|---|---|
| 1 | Nulos escritos como texto "NA" | En las cuatro tablas | Declarar NA como nulo al leer, porque algunos lectores no lo hacen por defecto |
| 2 | playId no es único | 3,762 valores para 8,557 jugadas | Usar gameId + playId |
| 3 | Nombres repetidos | 8 nombres en 16 jugadores, p. ej. Josh Allen (QB y OLB) | Buscar por nflId y mostrar equipo y posición |
| 4 | Dos formatos de fecha de nacimiento | 1,433 en AAAA-MM-DD, 14 en MM/DD/AAAA, 232 nulos | Leer ambos formatos |
| 5 | Tiempo con resolución de 1 segundo | 8.2 cuadros por marca de tiempo en promedio | Medir tiempos con frameId |
| 6 | Eventos escasos | pass_outcome_caught aparece en 23 jugadas (0.3%) | Tomar el resultado de passResult |
| 7 | Eventos generados automáticamente | autoevent_ballsnap en 3,757 jugadas y autoevent_passforward en 3,734. Difieren del evento manual en todas las jugadas que tienen ambos | Usar el manual y, si falta, el automático |
| 8 | Valores fuera de cancha y picos | Jugadores: 112 filas con X y 857 con Y fuera del campo, y hasta 59 filas con aceleración o distancia atípicas. Balón: 204 filas con Y fuera y saltos de hasta 10.45 yd por cuadro | Recortar al campo solo al dibujar. Excluir las filas atípicas solo para velocidades máximas |
| 9 | Balón en el mismo archivo | 361,486 filas con nflId y jerseyNumber vacíos | Excluirlo de las listas de jugadores |
| 10 | playResult cambia con penalizaciones | Difiere de prePenaltyPlayResult en 616 jugadas, 585 de ellas con penalización | Usar prePenaltyPlayResult para la jugada limpia |
| 11 | Yardas de regreso fuera de playResult | En las 190 intercepciones playResult = 0. Los regresos solo aparecen en el texto, en 115 descripciones | Tomar las yardas de regreso del texto o excluir las intercepciones de métricas de yardas |
| 12 | dropBackType vacío en jugadas anuladas | 528 nulos: 487 jugadas anuladas ("No Play"), 34 intentos de 2 puntos y 7 sin explicación | No tratarlo como dato faltante al azar |
| 13 | Penalización sin nombre de falta | 20 jugadas con penaltyYards y sin foulName1. Son faltas de equipo: Illegal Formation (9), Illegal Shift (7) y Defensive Too Many Men on Field (4) | Leer el nombre del texto de la jugada |
| 14 | pff_role no es exclusivo | 2,030 filas Pass Route tienen datos de bloqueo, sobre todo TE, RB y WR | No usar pff_role como etiqueta única |
| 15 | Presión en filas Coverage | 20 hits, 53 presiones y 17 sacks con rol Coverage | Posible blitz etiquetado como cobertura (inferido) |
| 16 | Dos fuentes para play action | 2,038 jugadas en pff_playAction y 1,971 con evento play_action. Coinciden en 1,945. Solo PFF: 93. Solo el evento: 26 | Usar pff_playAction, que cubre todas las jugadas |
| 17 | Códigos sin diccionario | pff_blockType (12), pff_positionLinedUp (56), eventos, UNKNOWN en dropBackType | Pedir el diccionario oficial |
| 18 | Descripciones en inglés | 100% de playDescription | Traducir o armar el texto desde campos estructurados |
| 19 | down = 0 | 35 intentos de 2 puntos | Excluirlos de análisis por intento |

## 7. Datos primordiales para el comentarista

### Prioridad 1: base de la página (disponibles y directos)

- games.csv: selector de partido por semana y equipo, con fecha y hora.
- plays.csv: qué pasó (playDescription, passResult, playResult, prePenaltyPlayResult), en qué situación (quarter, gameClock, down, yardsToGo, yardlineNumber, yardlineSide, marcador previo) y con qué esquema (offenseFormation, personnelO, personnelD, pff_passCoverage, pff_playAction, dropBackType).
- players.csv: nombre, posición, estatura, peso, universidad y edad, para las fichas de jugador.

### Prioridad 2: duelos (alto valor narrativo)

- pffScoutingData.csv: quién presionó, golpeó o sacó al QB (pff_hit, pff_hurry, pff_sack), qué bloqueador fue superado y por quién (pff_beatenByDefender, pff_nflIdBlockedPlayer). El QB de cada jugada sale de la fila con pff_role = Pass.

### Prioridad 3: visual y métricas finas (costo alto)

- tracking: reproducción de la jugada a 10 cuadros por segundo, tiempo al lanzamiento (mediana 2.7 s, p10 1.9 s, p90 4.2 s; 7,583 jugadas con snap y pase, evento manual y, si falta, automático), velocidades máximas y distancia recorrida. Pesa 811 MB, así que conviene leerlo por partido.

### Métricas calculables con estos datos

| Métrica | Cálculo | Fuente |
|---|---|---|
| Porcentaje de completos | C / (C + I + IN). Da 61.1% en este conjunto | plays |
| Yardas por intento | Media de playResult en los intentos (C, I, IN) | plays |
| Presión sobre el QB | Eventos de presión por jugada: suma de pff_hit, pff_hurry y pff_sack en Pass Rush, dividida entre 8,557 jugadas de pase | pffScoutingData |
| Rendimiento por cobertura | Completos y yardas por intento según pff_passCoverage | plays |
| Primer down en pases | Aproximación: primer down si prePenaltyPlayResult ≥ yardsToGo, separado por down. No hay bandera de primer down para validarla | plays |
| Bloqueos ganados | Porcentaje de bloqueos con pff_beatenByDefender = 0 | pffScoutingData |
| Tiempo al lanzamiento | (cuadro de pass_forward − cuadro de ball_snap) / 10. Usar el evento manual y, si falta, el automático | tracking |

## 8. Datos adicionales necesarios

Sí. Estos datos faltan para una página de comentarista completa:

| Dato | Para qué sirve | Impacto si falta |
|---|---|---|
| Marcador final y ganador por partido | Resúmenes, tablas de posiciones y récords. Solo hay el marcador previo a cada pase | Alto |
| Jugadas de carrera, pateos y especiales (play-by-play completo) | Estadísticas por equipo y resumen de partido completo | Alto si el comentarista cubre partidos enteros |
| Semanas 9 a 18 y playoffs | Cobertura de la temporada | Alto si el alcance es toda la temporada |
| Diccionario oficial de la competencia | Confirmar códigos de PFF, eventos, dropBackType, UNKNOWN y quarter 5 | Medio. Evita interpretaciones erróneas |
| Receptor objetivo por jugada | Separación, profundidad del pase y duelo entre receptor y defensa. Hoy hay que extraerlo del texto en inglés | Medio |
| Nombres completos, colores y logos de equipos | Interfaz. Hoy solo hay abreviaturas | Bajo. Puede resolverse con un catálogo fijo pequeño |
| Métricas de valor esperado (EPA) o de probabilidad de victoria | Análisis avanzado. No están en los datos; habría que calcularlas o traer una fuente externa | Bajo |
| Fotos, titulares y lesionados por partido | Enriquecer las fichas | Opcional |

## 9. Restricciones técnicas del proyecto

Fuente: .kiro/steering/rules.md.

- Stack fijo: FastAPI, React 18, Vite, Tailwind 3 y Recharts. No usar Streamlit, Flask, notebooks como app ni Docker.
- data/ es solo lectura. Leer con rutas relativas a la raíz del proyecto.
- El servidor es efímero. No depender de escribir archivos en disco. Calcular al arrancar o al responder.
- Las tablas pequeñas (plays, pffScoutingData, players y games, unos 15 MB en disco y unos 55 MB en memoria) pueden cargarse al arrancar. El tracking (811 MB) debe leerse por partido, de 4.9 a 9.5 MB cada archivo, o resumirse en memoria.
- Las llamadas del dashboard a la API usan rutas relativas sin diagonal inicial, por ejemplo fetch('api/...').

## 10. Preguntas abiertas

1. ¿El comentarista narra en español? Si es así, hay que traducir las descripciones.
2. ¿El alcance es solo las semanas 1 a 8, o se espera la temporada completa?
3. ¿El tracking entra en el MVP, o solo se usan los datos tabulares?
4. ¿La herramienta se usa en vivo, antes del partido o después?
5. ¿Existe el diccionario oficial de la competencia?
