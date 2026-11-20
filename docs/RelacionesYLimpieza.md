# Relaciones, complementos y limpieza de los datos

Documento complementario de [AnalisisData.md](AnalisisData.md), que describe las columnas de cada archivo. Aquí se explica cómo se conectan los archivos, qué se puede derivar al combinarlos y qué opciones hay para limpiarlos y normalizarlos antes de construir la página para el comentarista de la NFL.

> **Estado.** Las recomendaciones de este documento ya se aplicaron a `data/` con [scripts/limpiar_data.py](scripts/limpiar_data.py). Los originales están en `../data_original`. Qué cambió: `data/LEEME_datos_limpios.md`. El script `generar_analisis.py` y las cifras de este documento describen los datos originales: para regenerarlas, apunte `DATA` al respaldo.

## Cómo leer este documento

- Cada cifra sale de [scripts/generar_analisis.py](scripts/generar_analisis.py) y queda guardada en [datos_generados/](datos_generados/). Para regenerarlas (unos 25 s, solo lee `data/`): `.venv/bin/python docs/scripts/generar_analisis.py`
- **Verificado** significa comprobado con los datos. **Inferido** significa deducido, pendiente de confirmar con la documentación oficial.
- No se pudo obtener el diccionario oficial de la competencia (la página de datos de Kaggle no se puede leer sin navegador). Las definiciones de columnas siguen siendo las de [AnalisisData.md](AnalisisData.md). Detalle en el [Anexo B](#anexo-b-fuentes-y-límites).
- El código de la sección 5 se ejecutó contra los datos. No está en `backend/`: este documento no modifica el proyecto.

## Resumen

- Las cuatro tablas y los 122 archivos de tracking se conectan sin registros huérfanos. De 14 relaciones comprobadas, 12 cubren el 100% y las otras dos el 99.996% y el 99.87%.
- La llave de una jugada es `(gameId, playId)`. `playId` solo no sirve: hay 3,762 valores para 8,557 jugadas.
- Los datos no dicen en qué equipo juega cada jugador. Ese dato sale del tracking, por partido: 15 jugadores aparecen con dos equipos.
- Casi todos los nulos son estructurales: la columna no aplica a esa fila. Los datos realmente ausentes son pocos: 1 jugada en `plays` y las fechas de nacimiento (232) y universidades (224) en `players`.
- La opción de normalización recomendada es la ligera (sección 4): tablas pequeñas en memoria al arrancar y el tracking leído por partido.
- Este análisis corrigió cifras de `AnalisisData.md`. Los máximos de velocidad, aceleración y distancia pertenecían al balón y no a los jugadores. Los eventos `autoevent_*` no duplican a los manuales. Ver [Anexo C](#anexo-c-correcciones-a-analisisdatamd).

## 1. Mapa de relaciones

### 1.1 Diagrama

```
                  ┌────────────────────┐
                  │   games  (122)     │
                  └─────────┬──────────┘
                            │ gameId  (1 partido : ~70 jugadas)
                  ┌─────────▼──────────┐  foulNFLId1, 2, 3
                  │   plays  (8,557)   ├──────────────────────┐
                  └───┬────────────┬───┘                      │
      gameId+playId   │            │   gameId+playId          │
      (1 : 22)        │            │   (1 : ~42 cuadros       │
                      │            │    x 23 filas)           │
   ┌──────────────────▼──┐     ┌───▼──────────────────────┐   │
   │ pffScoutingData     │     │ tracking (122 archivos)  │   │
   │ (188,254)           │     │ (8,314,178)              │   │
   └──────────┬──────────┘     └───────────┬──────────────┘   │
              │ nflId                      │ nflId            │
              │ pff_nflIdBlockedPlayer     │                  │
              └──────────────┬─────────────┴──────────────────┘
                     ┌───────▼────────┐
                     │ players (1,679)│
                     └────────────────┘
```

El tracking tiene 361,486 cuadros: 22 jugadores y el balón en cada uno. Cada jugada dura entre 19 y 203 cuadros (mediana 39).

### 1.2 Relaciones verificadas

Fuente: [datos_generados/relaciones_verificadas.csv](datos_generados/relaciones_verificadas.csv). "Sin padre" cuenta las filas hijas cuyo valor no existe en la tabla padre.

| ID | Hija → padre | Columnas | Card. | Filas hija | Sin padre | Cobertura |
|---|---|---|---|---|---|---|
| R01 | plays → games | gameId | N:1 | 8,557 | 0 | 100% |
| R02 | pffScoutingData → plays | gameId + playId | N:1 | 188,254 | 0 | 100% |
| R03 | pffScoutingData → players | nflId | N:1 | 188,254 | 0 | 100% |
| R04 | pffScoutingData → players | pff_nflIdBlockedPlayer | N:1 | 46,526 | 0 | 100% |
| R05 | pffScoutingData → jugador de la misma jugada | pff_nflIdBlockedPlayer | N:1 | 46,526 | 2 | 99.996% |
| R06 | plays → players | foulNFLId1..3 | N:1 | 767 | 0 | 100% |
| R07 | plays → jugador de la misma jugada (PFF) | foulNFLId1..3 | N:1 | 767 | 1 | 99.87% |
| R08 | tracking → games | gameId (nombre del archivo) | N:1 | 122 | 0 | 100% |
| R09 | tracking → plays | gameId + playId | N:1 | 8,557 | 0 | 100% |
| R10 | tracking → players | nflId (jugadores por partido) | N:1 | 8,901 | 0 | 100% |
| R11 | plays → games | possessionTeam | N:1 | 8,557 | 0 | 100% |
| R12 | plays → games | defensiveTeam | N:1 | 8,557 | 0 | 100% |
| R13 | tracking ↔ pffScoutingData | gameId + playId + nflId | 1:1 | 188,254 | 0 | 100% |
| R14 | tracking.team → plays | team = possessionTeam o defensiveTeam según pff_role | N:1 | 188,254 | 0 | 100% |

Qué significan los casos que no llegan al 100%:

- **R05.** Los 2 bloqueos son de una misma jugada (partido 2021100311, jugada 2301). El bloqueado es Justin Madubuike (DT), que no figura entre los 22 de esa jugada.
- **R07.** Una de las 767 faltas la comete un jugador que no estaba entre los 22 en campo.
- **R13 y R14.** Los 22 jugadores de tracking son exactamente los 22 de PFF en cada jugada. Todo jugador con rol ofensivo (Pass, Pass Block, Pass Route) juega para `possessionTeam` y todo con rol defensivo (Pass Rush, Coverage) para `defensiveTeam`.
- Las 8,557 jugadas de `plays` tienen tracking y PFF. Los conjuntos de jugadas coinciden exactamente, porque los tres tienen 8,557 y no hay huérfanos.

### 1.3 Reglas de unión

| Regla | Evidencia |
|---|---|
| Unir jugadas por `(gameId, playId)`, nunca solo por `playId`. | `playId` tiene 3,762 valores distintos para 8,557 jugadas. |
| Ninguna llave se repite. | 0 duplicados en games, players, plays (gameId, playId), pffScoutingData (gameId, playId, nflId) ni tracking (gameId, playId, frameId, nflId). |
| El archivo de tracking se elige por el nombre: `tracking_<gameId>.csv`. | Un archivo por partido, 122 de 122. |
| El `gameId` empieza con la fecha del partido (AAAAMMDD). | Coincide en 122 de 122 partidos. |
| El balón es la fila con `team = football`. Quitarla antes de unir con `players`. | 361,486 filas con `nflId`, `jerseyNumber`, `o` y `dir` vacíos. |
| Los equipos son abreviaturas de texto. No existe tabla de equipos. | 32 abreviaturas. Los Rams aparecen como `LA` (247 jugadas con M.Stafford). |
| `players` no trae el equipo. | El equipo y el dorsal salen del tracking (sección 2.2). |

## 2. Complementos: qué aporta cada tabla a las demás

### 2.1 Matriz de aportes

| Tabla | Qué aporta a las otras | Qué le falta y de dónde sale |
|---|---|---|
| games | Calendario, local y visitante, semana, hora de inicio | Marcador final y nombres de equipo. Ninguno está en los datos. |
| players | Nombre, posición oficial, estatura, peso, universidad, nacimiento | **Equipo y dorsal**. Salen del tracking, por partido. |
| plays | Contexto (down, distancia, reloj, marcador previo, campo), resultado, faltas, formación, personal y cobertura | Receptor objetivo, longitud del pase y touchdown. Salen de `playDescription`. |
| pffScoutingData | Rol y alineación de los 22 jugadores de cada jugada, duelos de bloqueo y presión sobre el QB | Equipo del jugador. Sale del rol y de `plays`. |
| tracking | Posición y velocidad de los 22 jugadores y del balón a 10 cuadros por segundo, eventos, hora real, equipo y dorsal | Resultado de la jugada. Sale de `plays`. |

### 2.2 Campos derivables

Casi todos se comprobaron con los datos, y la columna "Verificación" muestra la prueba. Donde dice "Derivación directa" no hay contraste posible dentro de los datos.

| Campo derivado | Fuente | Regla | Verificación |
|---|---|---|---|
| Equipo y dorsal por partido | tracking | Tomar `team` y `jerseyNumber` de cada `(gameId, nflId)` | 8,901 pares partido-jugador. Sin conflictos dentro de un partido. 15 jugadores aparecen con 2 equipos y 11 con 2 dorsales entre partidos, así que la tabla es por partido. |
| Lado de cada jugador en la jugada | pffScoutingData | Pass, Pass Block y Pass Route son ofensa. Pass Rush y Coverage son defensa. | El equipo de tracking coincide con el lado en 188,254 de 188,254. Cada jugada tiene 11 y 11. |
| Yardas a la zona de anotación | plays + `playDirection` | Yardas desde la zona propia: `yardlineNumber` si `yardlineSide == possessionTeam`, si no `100 − yardlineNumber` (50 si `yardlineSide` es nulo). Yardas a la zona = 100 menos eso. | Reproduce `absoluteYardlineNumber` en 8,556 de 8,556. Con esta fórmula se recupera el único nulo de esa columna. |
| Zona roja | plays | Yardas a la zona de anotación ≤ 20 | 1,182 jugadas. Las 401 con cobertura "Red Zone" o "Goal Line" están todas dentro. |
| Segundo de juego y orden cronológico | plays | `(quarter − 1) × 900 + 900 − segundosDelReloj`. En el cuarto 5: `3600 + 600 − segundosDelReloj`. | Ordenar por `(gameId, segundo, playId)` deja 0 retrocesos de reloj y de marcador. Ordenar por `playId` deja 14 y 7. |
| Diferencia de marcador de la ofensiva | plays + games | Si `possessionTeam` es el local: local − visitante. Si no: visitante − local. | Derivación directa. |
| Touchdown | plays | El texto contiene `TOUCHDOWN` y no contiene `No Play`, `NULLIFIED` ni `REVERSED` | 380 jugadas. El texto ingenuo da 404. En 356 de 358 TD ofensivos con jugada siguiente, el marcador sube 6 puntos o más. En 12 de 12 intercepciones con TD, sube al rival. |
| Receptor objetivo | plays + pffScoutingData + players | Buscar en el texto, entre los jugadores ofensivos de esa jugada, el nombre abreviado tras `to` o `intended for` (`Aa.` es Aaron, `Am.` es Amari) | De 7,565 pases lanzados, 7,308 nombran objetivo. 7,290 se resuelven por nombre y 18 por inicial (el texto dice "D.Harris" y `players.csv` dice "Deonte Harty"). 0 ambiguos. |
| Longitud y zona del pase | plays | Palabras `short` o `deep` y `left`, `middle` o `right` tras "pass" | 7,527 y 7,530 de 7,565 pases lanzados (99.5%). |
| Personal en columnas | plays | Contar "n RB, n TE, n WR". En ofensiva, `OL` vale 5 y `QB` vale 1 cuando no aparecen. | Los conteos suman 11 jugadores en 8,556 de 8,556 jugadas con personal ofensivo y en 8,556 de 8,556 con personal defensivo. |
| Lado sancionado | plays | Signo de `penaltyYards`: negativo es ofensa, positivo es defensa, 0 es una penalización declinada, compensada o de 0 yardas | 604 de 604 coinciden con el lado del infractor según PFF. |
| Tiempo al lanzamiento | tracking | `(cuadro de pass_forward − cuadro de ball_snap) / 10`. Usar el evento manual y, si falta, el automático. | 7,583 jugadas. Mediana 2.7 s, percentil 10 en 1.9 s, percentil 90 en 4.2 s. Política de eventos en la sección 3.7. |
| Presión en la jugada | pffScoutingData | Alguna fila con `pff_hit`, `pff_hurry` o `pff_sack` en 1 | 3,216 de 8,557 jugadas (37.6%). |
| Hora real de la jugada | tracking | `time` está en UTC. El inicio programado está en hora del Este (UTC−4 en todos los partidos). | La primera jugada de pase ocurre, en la mediana, 3.6 min después del inicio programado (de 0.9 a 36.1 min). Entre la primera y la última jugada de pase pasan de 2.48 a 4.03 h (mediana 2.99 h). |
| Estatura en pulgadas y edad | players + games | `"6-4"` es 6 × 12 + 4 = 76. Edad = (fecha del partido − nacimiento) / 365.25. | Las 1,679 estaturas cumplen el patrón (de 66 a 81 pulgadas). La edad solo existe para los 1,447 jugadores con fecha. |

### 2.3 Lo que estos datos no permiten derivar

| Dato | Por qué no | Alternativa |
|---|---|---|
| Marcador final y ganador | `preSnapHomeScore` y `preSnapVisitorScore` se miden antes de cada pase. El máximo por partido es solo una cota inferior. | Fuente externa. |
| Carreras, patadas y series completas | `plays` solo contiene pases, sacks y scrambles. | Fuente externa. |
| Primer down | No hay bandera. `prePenaltyPlayResult ≥ yardsToGo` es una aproximación que estos datos no permiten validar. | Presentarlo como estimación. |
| Nombres, colores y logos de equipo | Solo hay abreviaturas. | Catálogo estático de 32 equipos. Las abreviaturas de los datos son ARI, ATL, BAL, BUF, CAR, CHI, CIN, CLE, DAL, DEN, DET, GB, HOU, IND, JAX, KC, LA, LAC, LV, MIA, MIN, NE, NO, NYG, NYJ, PHI, PIT, SEA, SF, TB, TEN y WAS. |
| Jugador que taclea | Aparece entre paréntesis en el texto. No se evaluó qué tan confiable es su extracción. | Evaluarlo antes de usarlo. |

### 2.4 De dónde sale cada función de la página

| Función para el comentarista | Tablas | Unión | Preparación previa |
|---|---|---|---|
| Elegir semana, partido y equipo | games | gameId | Catálogo de equipos |
| Lista de jugadas con su texto | plays | gameId | Orden por segundo de juego, bandera `esNoPlay` |
| Situación de la jugada (down, distancia, campo, marcador) | plays + games | gameId | Yardas a la zona, diferencia de marcador |
| Ficha de jugador | players + game_players | nflId | Equipo y dorsal por partido, estatura en pulgadas, edad |
| Estadísticas del QB (completos, yardas, TD, intercepciones, sacks) | plays + pffScoutingData (rol Pass) + players | gameId + playId, luego nflId | Excluir `esNoPlay`, regla de touchdown |
| Presión y duelos entre bloqueador y rusher | pffScoutingData + players | gameId + playId + nflId, `pff_nflIdBlockedPlayer` | Vistas por rol (sección 4.3) |
| Esquema defensivo y ofensivo | plays | gameId + playId | Personal en columnas, cobertura |
| Repetición de la jugada en el campo | tracking | gameId + playId | Orientar el ataque, leer un partido, recortar al campo |
| Tiempo al lanzamiento | tracking (eventos) | gameId + playId | Política de eventos (sección 3.7) |

## 3. Limpieza: hallazgos y opciones

### 3.1 Decisiones recomendadas

| # | Tema | Recomendación | Sección |
|---|---|---|---|
| 1 | Nulos | Son casi todos estructurales. No imputar. Crear banderas y vistas por rol. | 3.2 |
| 2 | Jugadas anuladas | Marcar `esNoPlay` (489) y excluirlas de las estadísticas. | 3.6 |
| 3 | Penalizaciones | Mantener `penaltyYards` nulo si no hubo y crear `hayPenalizacion`. | 3.2 |
| 4 | Tipos y formatos | Convertir fechas, estatura, reloj y personal. Usar enteros anulables. | 3.3 |
| 5 | Orden de jugadas | Ordenar por segundo de juego. No confiar en `playId`. | 3.6 |
| 6 | Tracking, atípicos | No filtrar. Recortar al campo solo al dibujar. Filtrar hasta 59 filas para velocidad máxima. | 3.5 |
| 7 | Tracking, eventos | Evento manual y, si falta, el automático. | 3.7 |
| 8 | Tracking, dirección | Orientar el ataque hacia la derecha al leer cada partido. | 3.7 |
| 9 | Normalización | Opción B: normalización ligera. | 4 |
| 10 | Carga en el servidor | Tablas pequeñas al arrancar. Tracking por partido, con caché. | 4.4 |

### 3.2 Nulos

Fuente: [datos_generados/perfil_columnas.csv](datos_generados/perfil_columnas.csv). 30 de las 77 columnas tienen nulos. Casi todos significan "no aplica".

**games.** Sin nulos.

**players.**

| Columna | Nulos | Hallazgo | Opciones | Recomendado |
|---|---|---|---|---|
| birthDate | 232 (13.8%) | 219 faltan junto con la universidad, 13 solo la fecha. 214 de los 232 están entre los 226 jugadores con `nflId` mayor a 53,000, es decir, los más recientes (inferido). | A) dejar nulo. B) imputar la mediana. C) excluir de los cálculos de edad. | A y C. Mostrar "N/D". Una edad imputada no sería un dato real. |
| collegeName | 224 (13.3%) | Mismo grupo. Solo 5 jugadores tienen fecha y no universidad. | A) dejar nulo. B) rellenar con "Sin universidad". | A. |

**plays.**

| Columna | Nulos | Causa | Opciones | Recomendado |
|---|---|---|---|---|
| penaltyYards | 7,801 | No hubo penalización. | A) rellenar con 0. B) dejar nulo y crear `hayPenalizacion`. | B. El 0 ya significa algo: 140 penalizaciones declinadas, compensadas o de 0 yardas. |
| foulName1..3, foulNFLId1..3 | 7,821 / 8,527 / 8,556 | Una falta por columna. Hay 767 faltas en total (736, 30 y 1). | A) dejar las seis columnas. B) pasarlas a una tabla larga `play_fouls`. | B (sección 4.3). |
| foulName1 sin valor con penaltyYards | 20 | Faltas de equipo sin jugador: Illegal Formation (9), Illegal Shift (7) y Defensive Too Many Men on Field (4). Se leen del texto de la jugada. | A) dejar nulo. B) leer el nombre del texto. | B. Leer la primera penalización del texto coincide con `foulName1` en 716 de las 736 jugadas que lo traen. Las otras 20 tienen dos penalizaciones o más. De las 20 sin `foulName1`, 19 mencionan una sola. |
| yardlineSide | 125 | Mediocampo: todas están en la yarda 50. | A) rellenar con "MID". B) dejar nulo y usar 50 al calcular. | B. La fórmula de yardas a la zona ya lo trata. |
| dropBackType | 528 | 487 son jugadas anuladas, 34 son intentos de 2 puntos y 7 no tienen explicación. | A) rellenar con "UNKNOWN". B) dejar nulo. | B. `UNKNOWN` ya existe en 1 jugada y se confundiría. |
| offenseFormation, defendersInBox | 7 y 7 | Las mismas 7 jugadas. 6 son jugadas anuladas. | A) dejar nulo. B) estimar `defendersInBox` desde el tracking. | A. No hay una definición oficial de "en la caja" para validar B. |
| personnelO, personnelD, absoluteYardlineNumber | 1, 1 y 1 | La misma jugada (partido 2021091904, jugada 3676). Es la única con datos realmente ausentes. | A) dejar nulo. B) recalcular `absoluteYardlineNumber`. | B para esa columna. La fórmula acierta en 8,556 de 8,556. |

**pffScoutingData.** Los nulos dependen del rol. Fuente: [datos_generados/nulos_pff_por_rol.csv](datos_generados/nulos_pff_por_rol.csv). La tabla cuenta filas con valor.

| Rol | Filas | hit, hurry, sack | beaten, hitAllowed, hurryAllowed, sackAllowed | blockedPlayer | blockType | backFieldBlock |
|---|---|---|---|---|---|---|
| Pass Rush | 36,362 | 36,362 | 0 | 0 | 0 | 0 |
| Coverage | 57,765 | 57,765 | 0 | 0 | 0 | 0 |
| Pass Block | 46,057 | 0 | 46,057 | 44,526 | 45,874 | 45,873 |
| Pass Route | 39,513 | 0 | 2,030 | 2,000 | 2,030 | 2,030 |
| Pass | 8,557 | 0 | 0 | 0 | 0 | 0 |

Un nulo en estas columnas casi siempre significa "no aplica al rol". Las excepciones reales son 183 bloqueadores sin `pff_blockType` y 1,531 sin `pff_nflIdBlockedPlayer`.

| Opción | Qué hace | Cuándo conviene |
|---|---|---|
| A | Dejar los nulos y filtrar por rol en cada cálculo. | Prototipo rápido. Es fácil olvidar el filtro y sumar mal. |
| B | Convertir a 0 y 1 solo donde el rol aplica, y exponer una vista por rol. | Recomendada. Se pueden sumar presiones sin `fillna`. |
| C | Partir la tabla por rol (sección 4.3). | Cuando se normalice. |

**tracking.** Las columnas `nflId`, `jerseyNumber`, `o` y `dir` están vacías en las 361,486 filas del balón y en ninguna fila de jugador. La columna `event` contiene el texto `None` en 7,673,352 filas (92.3%). Con `pd.read_csv` en pandas 2.2.3, `None` se lee como nulo. Con `keep_default_na=False`, se conserva como texto.

| Opción | Efecto | Recomendado |
|---|---|---|
| A) Lectura por defecto | `event` nulo significa "sin evento" | Sí. Es lo más simple y permite el tipo `category`. |
| B) `keep_default_na=False, na_values=["NA"]` | `event` conserva "None" como texto | Solo si hace falta distinguirlo de un evento ausente. |

### 3.3 Tipos y formatos

| Columna | Problema | Conversión recomendada |
|---|---|---|
| games.gameDate + gameTimeEastern | Fecha `MM/DD/AAAA` y hora en columnas separadas. | Un solo `datetime` en hora del Este. El horario de verano termina el 7 de noviembre de 2021 y el último partido es del 1 de noviembre, así que todos son UTC−4. |
| players.height | Texto `"6-4"` (las 1,679 cumplen el patrón). | Pulgadas: `6 × 12 + 4 = 76`. Rango de 66 a 81. |
| players.birthDate | Dos formatos: 1,433 en `AAAA-MM-DD` y 14 en `MM/DD/AAAA`. 232 nulos. | Leer cada formato por separado y combinar. Quedan 1,447 fechas válidas. |
| plays.gameClock | Texto `MM:SS` (8,557 de 8,557). Es el tiempo restante del cuarto. Coincide con el reloj entre paréntesis del texto en 8,522 de 8,522 jugadas que lo traen. | Segundos del cuarto y segundo de juego (sección 2.2). |
| plays.personnelO, personnelD | Varios valores en una celda: `"1 RB, 1 TE, 3 WR"`. | Una columna por posición. Ofensivas: RB, TE, WR, OL, QB y LB. Defensivas: DL, LB y DB. |
| plays.penaltyYards, foulNFLId1..3, defendersInBox, absoluteYardlineNumber | Enteros guardados como decimales porque tienen nulos. | `Int16` o `Int32` anulables de pandas. |
| tracking, tipos | Se lee con enteros y decimales de 64 bits y texto. | `gameId` int32, `playId` uint16, `frameId` uint8, `team`, `playDirection` y `event` categóricos, el resto float32. Ver la sección 4.4. |
| tracking.time | Texto ISO en UTC con resolución de un segundo. | No cargarlo en las filas de tracking. Si hace falta, guardar la hora de inicio de cada jugada. |

Los máximos de `gameId` (2021110100), `playId` (5223), `frameId` (203) y `nflId` (54038) caben en los tipos propuestos.

### 3.4 Duplicados y nombres

- No hay llaves duplicadas (sección 1.3). Dos textos de `playDescription` se repiten, pero son jugadas distintas.
- Hay 8 nombres repetidos en 16 jugadores. Por ejemplo, hay dos Josh Allen: un QB y un OLB. Las pantallas deben identificar al jugador por `nflId` y mostrar posición y equipo.
- Los nombres de `players.csv` y los del texto no siempre coinciden. En 18 jugadas de Nueva Orleans el texto dice "D.Harris" y el único receptor cuyo nombre empieza por D es "Deonte Harty" en `players.csv`. Probablemente es el mismo jugador con otro apellido (inferido). Por eso la resolución del receptor usa el roster de la jugada y un respaldo por inicial.
- `pff_positionLinedUp` no equivale a `officialPosition`. En 26 de los 56 códigos, la posición oficial más frecuente cubre menos del 60% de las filas (el mínimo es `SCBiL`, con 26% de CB). Ver [datos_generados/catalogo_posiciones_pff.csv](datos_generados/catalogo_posiciones_pff.csv).
- Solo 7 de los 56 códigos de alineación tienen un único rol: C, LG, RG, RT, FSL, FSR y SS. No se puede deducir el rol desde la alineación.
- Hay una jugada donde el jugador con rol `Pass` no es QB: Jarvis Landry (WR), en una jugada de scramble.

### 3.5 Valores atípicos

El tracking mezcla jugadores y balón. Medirlos juntos da máximos engañosos, por eso se separan.

| Medida | Jugadores | Balón |
|---|---|---|
| Velocidad máxima `s` (yd/s) | 11.18 | 29.34 |
| Aceleración máxima `a` (yd/s²) | 21.92 | 50.69 |
| Distancia máxima `dis` (yd por cuadro) | 3.45 | 10.45 |
| Filas con `x` fuera de [0, 120] | 112 | 0 |
| Filas con `y` fuera de [0, 53.3] | 857 | 204 |
| Filas con `s` mayor a 13 yd/s | 0 | no aplica |
| Filas con `a` mayor a 15 yd/s² | 10 | no aplica |
| Filas con `dis` mayor a 1.3 yd | 49 | 5,660 con más de 3 yd |

- `a` nunca es negativa (mínimo 0). Es una magnitud, no una aceleración con signo.
- `dis` del balón coincide con su desplazamiento real entre cuadros. Los saltos grandes son saltos de posición del balón, probablemente en pases en vuelo (inferido), y no errores de cálculo.
- Fuera de la cancha hay pocas filas: hasta 969 de 7.95 millones de filas de jugadores (0.01%). Son jugadores que pisan la banda o la línea de fondo.

| Opción | Efecto | Recomendado |
|---|---|---|
| A) No filtrar y recortar `x` e `y` al campo solo al dibujar | No se pierden filas | Sí, para la repetición de jugadas. |
| B) Excluir las filas de jugadores con `a > 15` o `dis > 1.3` antes de calcular velocidad o aceleración máxima | Quita hasta 59 filas | Sí, solo para métricas de máximos. |
| C) Recortar `x` e `y` en los datos | Cambia posiciones reales | No. |

### 3.6 Consistencia entre columnas y tablas

| Tema | Hallazgo | Qué hacer |
|---|---|---|
| Jugadas anuladas | 489 jugadas dicen `No Play` y todas tienen `penaltyYards`. En 474 de ellas `playResult` es igual a `penaltyYards`. | Marcar `esNoPlay` y excluirlas de las estadísticas de la jugada. Mostrarlas en la línea de tiempo con su etiqueta. |
| playResult y prePenaltyPlayResult | Difieren en 616 jugadas (585 con `penaltyYards`, 31 sin). La diferencia es igual a `penaltyYards` solo en 399. Las demás dependen de dónde se aplica la sanción. | No reconstruir una columna desde la otra. Para el rendimiento de la jugada, usar `prePenaltyPlayResult` y descartar `esNoPlay`. |
| Signo de penaltyYards | Negativo en 217 jugadas, positivo en 399 y cero en 140. Los ceros son penalizaciones declinadas (121), compensadas (12) o sancionadas con 0 yardas (7, por ejemplo "Illegal Touch Pass"). | Usar el signo como lado sancionado (sección 2.2). |
| Intercepciones | `playResult` es 0 en las 190. El regreso solo está en el texto. | No calcular yardas por pase con las intercepciones sin tratarlas aparte. |
| Sacks | 543 jugadas tienen `passResult = S`. De ellas, 536 tienen un `pff_sack`, 508 tienen el evento `qb_sack` o `qb_strip_sack` y 348 tienen un `pff_sackAllowed`. Ninguna jugada que no sea sack tiene `pff_sack`. 66 jugadas tienen un sack compartido. | Contar sacks con `passResult`. Usar `pff_sack` solo para atribuirlos a un defensor. |
| Play action | `pff_playAction` marca 2,038 jugadas. El evento `play_action` marca 1,971. Coinciden en 1,945. Solo PFF: 93. Solo el evento: 26. | Usar `pff_playAction`, porque cubre todas las jugadas. |
| Orden de las jugadas | Ordenar por `playId` produce 14 retrocesos de reloj y 7 caídas de marcador. Ordenar por segundo de juego produce 0 y 0. Hay 20 jugadas que comparten segundo con otra del mismo partido. | Ordenar por `(gameId, segundo de juego, playId)`. |
| Tiempo extra | `quarter = 5` en 98 jugadas de 12 partidos. El reloj máximo es 10:00. | Usar 600 segundos para el cuarto 5. |
| Intentos de 2 puntos | 35 jugadas con `down = 0` y `yardsToGo = 0`, todas intentos de 2 puntos. | Excluirlas de las estadísticas por down. |
| Faltas y lado | 186 de 187 faltas cuyo nombre empieza con "Offensive" las comete un jugador ofensivo. 280 de 280 que empiezan con "Defensive" las comete uno defensivo. | Atribuir la falta al equipo con el rol del infractor. |
| Receptor del texto | 257 pases lanzados no nombran objetivo en el texto (por ejemplo, "pass incomplete short right."). | Dejar `receptorObjetivo` nulo. |

### 3.7 Tracking: decisiones específicas

**Estructura.** Todas las dependencias que se probaron se cumplen en los 122 partidos: `playDirection` es único por jugada, hay un solo evento por cuadro, `team` y `jerseyNumber` son únicos por jugador y partido, cada cuadro tiene 23 filas, cada jugada tiene 22 jugadores y los cuadros son consecutivos desde 1. La única excepción es `time`: 15 cuadros tienen una fila con marca distinta, y las 15 son del balón.

**Frecuencia y ángulos.** Hay 10 cuadros por segundo: `dis` es aproximadamente `s × 0.1` (cociente mediano 1.002). En `dir`, 0° apunta hacia +Y y el ángulo crece en sentido horario (90° es +X). Contra el desplazamiento real, `dir` tiene un error mediano de 1.3°. Con la convención contraria sale 92.2°. Se asume la misma convención para `o` (inferido).

**Eventos manuales y automáticos.** Los `autoevent_*` no son copias de los manuales:

| Pareja | Jugadas con ambos | Iguales | Diferencia (auto − manual) |
|---|---|---|---|
| ball_snap y autoevent_ballsnap | 3,756 | 0 | Mediana −1 cuadro. De −167 a +6. |
| pass_forward y autoevent_passforward | 3,677 | 0 | Mediana −1 cuadro. De −5 a +5. |

Hay 57 jugadas con pase solo automático, 1 con snap solo automático y 24 sin ningún evento de snap (no tienen tiempo al lanzamiento). Medir el tiempo al lanzamiento con "el menor de los dos cuadros" da un máximo de 19.2 s. Con "manual y, si falta, automático" el máximo es 9.8 s. Las dos políticas difieren 0.5 s o más en 35 jugadas (hasta 16.6 s). Las medianas son iguales (2.7 s).

| Opción | Efecto | Recomendado |
|---|---|---|
| A) El menor de ambos cuadros | Simple, pero un automático tardío o temprano contamina el valor. | No. |
| B) Manual y, si falta, automático | 7,583 jugadas con tiempo al lanzamiento. | Sí. |
| C) Solo manual | 7,525 jugadas. Pierde 58. | Si se quiere máxima pureza. |

Disponibilidad por resultado (jugadas con evento de pase, manual o automático): completos 4,618 de 4,620, incompletos 2,754 de 2,755, intercepciones 190 de 190, sacks 30 de 543 y scrambles 12 de 449. El tiempo al lanzamiento aplica a los pases lanzados.

**Dirección del ataque.** En las jugadas con `playDirection = left`, el ataque avanza hacia X menor. Orientar todas las jugadas con el ataque hacia la derecha simplifica el dibujo: `x' = 120 − x`, `y' = 53.3 − y`, y se suman 180° a `o` y `dir`. Probado: el QB queda detrás de la línea de scrimmage en 65 de 65 jugadas de un partido, y aplicar la transformación dos veces restituye los valores originales.

| Opción | Efecto | Recomendado |
|---|---|---|
| A) Datos crudos y girar al dibujar | Cada gráfico debe conocer `playDirection`. | No. |
| B) Orientar al leer cada partido | La orientación se resuelve en un solo lugar y todos los gráficos comparten el mismo sentido. | Sí. |
| C) Guardar una copia orientada | `data/` es de solo lectura y el servidor no debe depender de escribir en disco. | No. |

## 4. Normalización

### 4.1 Diagnóstico por tabla

| Tabla | Problema | Evidencia |
|---|---|---|
| games | Cumple la forma normal. La fecha y la hora van en dos columnas y los equipos son texto. | 0 llaves duplicadas. |
| players | La estatura es un valor compuesto (`"6-4"`). No tiene equipo. | 1,679 de 1,679 cumplen el patrón. El equipo solo existe en tracking. |
| plays | Grupo repetido: `foulName1..3` y `foulNFLId1..3` guardan hasta 3 faltas por jugada. Dos columnas empaquetan varios valores: `personnelO` y `personnelD`. Dependencia entre columnas: `pff_passCoverageType` depende de `pff_passCoverage`. Una columna se deduce de otras: `absoluteYardlineNumber`. | 767 faltas en 3 pares de columnas. Cada una de las 12 coberturas tiene un solo tipo. La fórmula reproduce `absoluteYardlineNumber` en 8,556 de 8,556. |
| pffScoutingData | Tabla dispersa: cada rol usa un subconjunto de columnas. | 10 de 15 columnas tienen entre 50% y 75.3% de nulos. |
| tracking | Atributos que no dependen de toda la llave. `playDirection` depende solo de la jugada. `event` y `time` dependen solo del cuadro y se repiten en 23 filas. `team` y `jerseyNumber` dependen solo del partido y el jugador. El balón comparte tabla con los jugadores. | 0 violaciones en 122 partidos. Hay 27,862 eventos únicos repartidos en 640,826 filas (7.7%). El balón son 361,486 filas con 4 columnas vacías. |

### 4.2 Opciones

| Opción | Qué es | Ventajas | Desventajas |
|---|---|---|---|
| A) Sin normalizar | Cargar los CSV con los tipos corregidos y trabajar con las columnas originales. | No hay código de preparación. | El tracking completo ocupa unos 2.5 GB con los tipos por defecto. Las reglas de rol y de faltas se repiten en cada consulta. |
| **B) Normalización ligera** | Separar solo lo que molesta: `play_fouls`, `game_players`, `play_events`, vistas `pass_rush` y `pass_block` y banderas derivadas. | Entra en pandas sin dependencias nuevas. Unos 3 MB por partido y unos 55 MB para las tablas pequeñas. Las consultas del comentarista quedan simples. | Unas 70 líneas de preparación al arrancar (sección 5). |
| C) Modelo en estrella completo | Dimensiones (equipos, jugadores, posiciones, coberturas, formaciones, eventos) y hechos (jugadas, rol del jugador, cuadros) con claves sustitutas. | Máxima consistencia. | Excesivo para 8,557 jugadas sin base de datos. El stack fija pandas y el servidor es efímero. Solo tendría sentido al pasar a SQL. |

**Recomendación: B.** Resuelve los problemas que sí afectan a la página y no obliga a mantener un esquema de base de datos.

### 4.3 Esquema propuesto (opción B)

| Tabla | Grano | Llave | Origen | Filas | Notas |
|---|---|---|---|---|---|
| teams | un equipo | team | catálogo estático | 32 | Nombres y divisiones vienen de fuera de los datos. |
| games | un partido | gameId | games.csv | 122 | Más la hora de inicio como `datetime`. |
| players | un jugador | nflId | players.csv | 1,679 | Más estatura en pulgadas, fecha de nacimiento y grupo de posición. |
| game_players | un jugador en un partido | gameId + nflId | tracking | 8,901 | `team` y `jerseyNumber`. |
| plays | una jugada | gameId + playId | plays.csv | 8,557 | Sin las columnas `foul*`. Con personal en columnas y los campos de la sección 2.2. |
| play_fouls | una falta | gameId + playId + orden | plays.csv | 767 | Nombre, `nflId` y lado sancionado. |
| play_players | un jugador en una jugada | gameId + playId + nflId | pffScoutingData | 188,254 | Rol y alineación. |
| pass_rush | un defensor en una jugada | gameId + playId + nflId | pffScoutingData (Pass Rush y Coverage) | 94,127 | `hit`, `hurry` y `sack`. |
| pass_block | un bloqueo | gameId + playId + nflId | pffScoutingData (Pass Block y Pass Route con bloqueo) | 48,087 | `beaten`, `allowed`, `blockType`, `blockedPlayer` y `backFieldBlock`. |
| play_events | un evento | gameId + playId + frameId + evento | tracking | 27,862 | Más una bandera `esAuto`. |
| tracking_frames | un jugador en un cuadro | gameId + playId + frameId + nflId | tracking | 7,952,692 | Sin `time`, `event` ni `playDirection`. El balón va aparte, en una fila por cuadro. |

Las filas de `pass_rush` (36,362 + 57,765) y `pass_block` (46,057 + 2,030) son exactamente las que tienen valor en esas columnas. En el tracking, 8,314,178 − 361,486 = 7,952,692 filas son de jugadores.

### 4.4 Costo medido

Medido en un partido de tamaño mediano (`tracking_2021092700.csv`, 67,390 filas) en esta máquina. Los tiempos son orientativos.

| Medida | Tipos por defecto | Tipos ajustados y sin `time` |
|---|---|---|
| Lectura de un partido | 0.09 s | 0.10 s |
| Memoria de un partido | 20.5 MB (304.7 bytes por fila) | 3.1 MB (46.0 bytes por fila) |
| Los 122 partidos (extrapolado por filas) | unos 2,533 MB | unos 383 MB |

Memoria de las tablas pequeñas: games 0.03 MB, players 0.49 MB, plays 8.5 MB y pffScoutingData 45.7 MB.

| Estrategia | Memoria | Cuándo conviene |
|---|---|---|
| Cargar todo el tracking al arrancar | Unos 383 MB con tipos ajustados | Si el servicio de hospedaje tiene memoria sobrada. Se desconoce su límite. |
| **Leer un partido bajo demanda con caché de unos pocos partidos** | Unos 3 MB por partido | Recomendada. Leer un partido tarda unos 0.1 s. |
| Calcular un resumen por jugada al arrancar (tiempo al lanzamiento, cuadros de eventos) | Pequeña | Si la página lo muestra en listas. Recorrer los 122 archivos con las columnas mínimas tardó unos 8 s en esta máquina. |

## 5. Orden de limpieza y código probado

Orden recomendado, aplicado al arrancar el backend y en memoria:

1. Leer con `NA` como nulo y con los tipos de la sección 3.3.
2. `games` y `players`: fechas y estatura.
3. `plays`: banderas, segundo de juego, orden, derivados, personal y faltas.
4. `pffScoutingData`: vistas por rol.
5. Tracking, una sola pasada: `game_players` y `play_events`.
6. Tracking, bajo demanda: un partido con ataque orientado a la derecha.

El código se ejecutó contra los datos desde la raíz del proyecto. Las cifras de verificación están al final de la sección. Hace falta `import re`, `import numpy as np`, `import pandas as pd` y `from pathlib import Path`.

```python
def preparar_games_players():
    g = pd.read_csv("data/games.csv")
    g["inicio"] = pd.to_datetime(g.gameDate + " " + g.gameTimeEastern, format="%m/%d/%Y %H:%M:%S")  # hora del Este
    pl = pd.read_csv("data/players.csv")
    h = pl.height.str.extract(r"^(\d)-(\d{1,2})$").astype(int)
    pl["alturaPulg"] = h[0] * 12 + h[1]
    iso = pd.to_datetime(pl.birthDate, format="%Y-%m-%d", errors="coerce")
    pl["birthDate"] = iso.fillna(pd.to_datetime(pl.birthDate, format="%m/%d/%Y", errors="coerce"))
    return g, pl
```

```python
def preparar_plays(g):
    p = pd.read_csv("data/plays.csv")                      # 'NA' se lee como nulo
    t = p.playDescription
    p["esNoPlay"] = t.str.contains("No Play", regex=False)
    p["esDosPuntos"] = p.down.eq(0)
    p["hayPenalizacion"] = p.penaltyYards.notna()
    p["ladoSancionado"] = np.sign(p.penaltyYards).map({-1.0: "ofensa", 1.0: "defensa"})
    mm = p.gameClock.str.extract(r"^(\d{2}):(\d{2})$").astype(int)
    seg = mm[0] * 60 + mm[1]
    p["segJuego"] = np.where(p.quarter < 5, (p.quarter - 1) * 900 + 900 - seg, 3600 + 600 - seg)
    p["esTouchdown"] = t.str.contains("TOUCHDOWN", regex=False) & ~t.str.contains("No Play|NULLIFIED|REVERSED")
    propia = np.where(p.yardlineSide.isna(), 50, np.where(p.yardlineSide == p.possessionTeam, p.yardlineNumber, 100 - p.yardlineNumber))
    p["yardasAZona"] = 100 - propia
    p = p.merge(g[["gameId", "homeTeamAbbr"]], on="gameId")
    local = p.possessionTeam == p.homeTeamAbbr
    p["difMarcador"] = np.where(local, p.preSnapHomeScore - p.preSnapVisitorScore, p.preSnapVisitorScore - p.preSnapHomeScore)
    return p.sort_values(["gameId", "segJuego", "playId"], ignore_index=True)


def contar_personal(serie, ofensivo):
    cuentas = serie.map(lambda s: {k: int(v) for v, k in re.findall(r"(\d+) ([A-Z]{2})", s)} if isinstance(s, str) else {})
    cols = pd.DataFrame(cuentas.tolist(), index=serie.index).fillna(0).astype(int)
    if ofensivo:                                           # OL y QB se omiten cuando valen 5 y 1
        cols["OL"] = cols["OL"].replace(0, 5) if "OL" in cols else 5
        cols["QB"] = cols["QB"].replace(0, 1) if "QB" in cols else 1
    return cols.where(serie.notna())


def faltas_largas(p):
    partes = [p[["gameId", "playId", f"foulName{i}", f"foulNFLId{i}"]].set_axis(["gameId", "playId", "falta", "nflId"], axis=1).assign(orden=i) for i in (1, 2, 3)]
    return pd.concat(partes).dropna(subset=["nflId"]).astype({"nflId": "int32"})
```

```python
def vistas_pff():
    f = pd.read_csv("data/pffScoutingData.csv")
    llave = ["gameId", "playId", "nflId"]
    presion = f[f.pff_role.isin(["Pass Rush", "Coverage"])][llave + ["pff_hit", "pff_hurry", "pff_sack"]].astype({"pff_hit": "int8", "pff_hurry": "int8", "pff_sack": "int8"})
    marcas = ["pff_beatenByDefender", "pff_hitAllowed", "pff_hurryAllowed", "pff_sackAllowed", "pff_backFieldBlock"]
    bloqueo = f[f.pff_beatenByDefender.notna()][llave + marcas + ["pff_blockType", "pff_nflIdBlockedPlayer"]].astype({c: "Int8" for c in marcas})
    return f[llave + ["pff_role", "pff_positionLinedUp"]], presion, bloqueo
```

```python
def jugadores_y_eventos():
    jug, ev = [], []
    for fn in sorted(Path("data/tracking").glob("tracking_*.csv")):
        t = pd.read_csv(fn, usecols=["gameId", "playId", "nflId", "frameId", "team", "jerseyNumber", "event"])
        jug.append(t.dropna(subset=["nflId"]).drop_duplicates(["gameId", "nflId"])[["gameId", "nflId", "team", "jerseyNumber"]])
        ev.append(t.dropna(subset=["event"])[["gameId", "playId", "frameId", "event"]].drop_duplicates())
    game_players = pd.concat(jug, ignore_index=True).astype({"nflId": "int32", "jerseyNumber": "int8"})
    play_events = pd.concat(ev, ignore_index=True)
    play_events["esAuto"] = play_events.event.str.startswith("autoevent_")
    return game_players, play_events


def tiempo_al_lanzamiento(play_events):                    # manual y, si falta, automático
    f = play_events.pivot_table(index=["gameId", "playId"], columns="event", values="frameId", aggfunc="min")
    snap = f["ball_snap"].fillna(f["autoevent_ballsnap"])
    pase = f["pass_forward"].fillna(f["autoevent_passforward"])
    return ((pase - snap) / 10).dropna()
```

```python
TIPOS = {"gameId": "int32", "playId": "uint16", "frameId": "uint8", "team": "category", "playDirection": "category", "event": "category",
         "nflId": "float32", "jerseyNumber": "float32", **{c: "float32" for c in ("x", "y", "s", "a", "dis", "o", "dir")}}


def leer_partido(game_id):
    t = pd.read_csv(f"data/tracking/tracking_{game_id}.csv", usecols=lambda c: c != "time", dtype=TIPOS)   # event nulo = sin evento
    izq = t.playDirection.eq("left")                       # orientar el ataque hacia la derecha
    t.loc[izq, "x"] = 120 - t.loc[izq, "x"]
    t.loc[izq, "y"] = 53.3 - t.loc[izq, "y"]
    for c in ("o", "dir"):
        t.loc[izq, c] = (t.loc[izq, c] + 180) % 360
    es_balon = t.team.eq("football")
    return t[~es_balon], t[es_balon].drop(columns=["nflId", "jerseyNumber", "o", "dir"])
```

**Verificación del código.** Se extrajo el código de este documento y se ejecutó con 25 comprobaciones. Todas dieron el valor esperado:

| Función | Resultado |
|---|---|
| preparar_games_players | 122 partidos, estaturas de 66 a 81 pulgadas, 1,447 fechas de nacimiento válidas. |
| preparar_plays | 8,557 jugadas, 489 `esNoPlay`, 380 touchdowns, 217 sanciones a la ofensa y 399 a la defensa, 756 con penalización, 0 retrocesos de reloj y de marcador, 1,182 jugadas a 20 yardas o menos. |
| contar_personal | Suma 11 en 8,556 de 8,556 jugadas, ofensivas y defensivas. |
| faltas_largas | 767 filas. |
| vistas_pff | 188,254, 94,127 y 48,087 filas. Los sacks de `pass_rush` suman 602. |
| jugadores_y_eventos | 8,901 pares partido-jugador y 27,862 eventos. Leer los 122 archivos tardó 8 s. |
| tiempo_al_lanzamiento | 7,583 jugadas, mediana 2.7 s. |
| leer_partido | Jugadores y balón suman las filas del archivo (64,460 + 2,930). Tras orientar, el QB queda detrás de la línea en 65 de 65 jugadas. |

## 6. Decisiones que necesita el equipo

| # | Pregunta | Por defecto en este documento |
|---|---|---|
| 1 | ¿Se adopta la normalización ligera (opción B)? | Sí. |
| 2 | ¿Cuánta memoria permite el hospedaje? | Se desconoce. Se asume leer el tracking por partido. |
| 3 | ¿Las jugadas anuladas (`No Play`) se excluyen de las estadísticas? | Sí. Se muestran en la línea de tiempo con su etiqueta. |
| 4 | ¿El comentarista necesita el texto en español? | `playDescription` está en inglés. Se puede armar una frase desde las columnas estructurales. |
| 5 | ¿Quién provee nombres, colores y logos de equipo? | Un catálogo estático de 32 equipos. |
| 6 | ¿Las reglas del hackathon permiten datos externos (marcador final, carreras)? | No se asume. La página se diseña solo con `data/`. |

## Anexo A. Prompt mejorado

Versión del prompt original, para regenerar o ampliar este análisis.

```text
Rol: analista de datos para una herramienta web que usará un comentarista de la NFL.

Contexto
- Los datos están en data/ y son de solo lectura: games.csv, players.csv, plays.csv, pffScoutingData.csv y tracking/ (un archivo por partido).
- El diccionario de columnas está en docs/AnalisisData.md.
- El stack es fijo (.kiro/steering/rules.md): Python con pandas y numpy, FastAPI y React. No se agregan dependencias.
- El servidor es efímero: la limpieza se hace en memoria al arrancar. No se guardan copias limpias de los datos.

Tarea
1. Analiza todos los archivos de data/. Parte de docs/AnalisisData.md y corrige lo que los datos contradigan.
2. Crea docs/RelacionesYLimpieza.md con:
   a. Relaciones entre tablas: llaves, cardinalidad y cobertura medida (filas sin padre).
   b. Complementos: qué aporta cada tabla a las demás, qué campos se pueden derivar al combinarlas y qué datos faltan.
   c. Limpieza: nulos (estructurales o faltantes), tipos y formatos, duplicados, valores atípicos y consistencia entre columnas y tablas.
   d. Normalización: diagnóstico por tabla y opciones con ventajas y desventajas.
   Cada hallazgo lleva evidencia numérica, opciones y una recomendación.
3. Enlaza docs/RelacionesYLimpieza.md y docs/AnalisisData.md entre sí.
4. Guarda las cifras del análisis en docs/datos_generados/ y el script que las genera en docs/scripts/.

Reglas
- No modifiques data/. No agregues dependencias. Usa el Python de .venv.
- Cada cifra sale de una consulta ejecutada. Marca como "inferido" lo que no puedas comprobar.
- Ejecuta todo código que incluyas en el documento.
- Si algo contradice docs/AnalisisData.md, corrígelo y registra el cambio.
- Escribe en español y sin rayas largas.

Criterios de aceptación
- Todas las tablas y relaciones tienen cobertura medida.
- Cada nulo está clasificado con su causa y sus opciones.
- Los enlaces entre los dos documentos funcionan.
- El script se ejecuta sin errores y reproduce las cifras.
```

Qué cambió respecto al original:

- Las rutas son relativas a la raíz del proyecto (`docs/AnalisisData.md`). Con la diagonal inicial (`/docs/...`) apuntarían a la raíz del sistema de archivos. Además se fijó dónde va cada archivo.
- "Relaciones y complementos" se definió como llaves, cardinalidad, cobertura medida y campos derivables.
- "Enlace directo" se concretó como enlaces relativos en ambos sentidos.
- "Generar y guardar los datos" se entendió como guardar las cifras del análisis y su script, no copias limpias del dataset. `data/` es de solo lectura y el servidor no debe depender de escribir en disco.
- Para normalización y nulos se pidió siempre evidencia, opciones y una recomendación.
- Se añadieron las restricciones del stack y criterios de aceptación comprobables.

## Anexo B. Fuentes y límites

- **Origen.** El conjunto corresponde al Big Data Bowl 2023, cuyo tema fue el análisis del bloqueo y la presión al pasador ([NFL Football Operations](https://nfl-ops-stg-umbraco.azurewebsites.net/gameday/analytics/big-data-bowl/), dirección de pruebas de su sitio). El tracking lo provee Next Gen Stats y el scouting Pro Football Focus ([README de un repositorio de la comunidad](https://github.com/ThompsonJamesBliss/nfl-big-data-bowl-regional-event-data/blob/main/README.md)). Content was rephrased for compliance with licensing restrictions.
- **Diccionario oficial.** No se obtuvo. La página de datos de Kaggle no se puede leer sin navegador y las búsquedas no devolvieron la descripción de columnas. Por eso siguen como inferidos el significado de la mayoría de los eventos, los códigos de `pff_blockType` y `pff_positionLinedUp`, `pff_backFieldBlock`, `quarter = 5` como tiempo extra y que los `nflId` altos sean jugadores recientes.
- **Semanas 6 a 8.** Los 12 equipos con 7 partidos son exactamente los 12 ausentes en esas semanas. Es coherente con semanas de descanso, pero no se comparó con el calendario oficial.
- **Hora.** La conversión de hora del Este a UTC usa UTC−4 para todos los partidos (el horario de verano termina el 7 de noviembre de 2021).
- **Tiempos y memoria.** Se midieron en una sola máquina y un solo archivo. Son orientativos. Los 2,533 MB y 383 MB son extrapolaciones por número de filas.
- **Unidades.** `dis` en yardas por cuadro y `s` en yardas por segundo son consistentes con 10 cuadros por segundo. No se confirmó la unidad contra documentación.

## Anexo C. Correcciones a AnalisisData.md

Al contrastar [AnalisisData.md](AnalisisData.md) con los datos aparecieron errores propios del primer análisis. Ya están corregidos en ese archivo. `git diff docs/AnalisisData.md` muestra todos los cambios.

| Qué decía | Qué es | Motivo |
|---|---|---|
| Velocidad máxima 29.34 yd/s, aceleración máxima 50.69 y distancia máxima 10.45 yd por cuadro, como valores de "tracking". | Son del balón. En jugadores los máximos son 11.18, 21.92 y 3.45. | Se medían juntos jugadores y balón. |
| `dis` de 10.45 yd es "físicamente imposible, probable error de medición". | Es un salto de posición del balón en vuelo. Coincide con su desplazamiento real entre cuadros. | Se comparó `dis` con la distancia entre cuadros consecutivos. |
| `a` es una aceleración. | Nunca es negativa (mínimo 0). Parece una magnitud. | Mínimo observado en 8.3 millones de filas. |
| Fórmula del tiempo al lanzamiento: `(snap − pase) / 10`, con "el primero de los eventos manuales o automáticos". | La fórmula estaba invertida y la política mezclaba eventos que no son equivalentes. Ahora: `(pase − snap) / 10`, manual y, si falta, automático. | Los `autoevent_*` difieren de los manuales (sección 3.7). La mediana no cambia (2.7 s). El máximo baja de 19.2 s a 9.8 s. |
| Los `autoevent_*` son "mismos hitos, generados automáticamente". | No son copias. No coinciden en cuadro con el manual en ninguna jugada que tiene ambos. | Comparación jugada por jugada. |
| Las ausencias de las semanas 6 a 8 "parecen descansos". | Los 12 equipos con 7 partidos son exactamente los 12 ausentes en esas semanas. | Cruce entre partidos por equipo y por semana. |
| `dropBackType` vacío en 528 jugadas, 487 con "No Play". | 487 anuladas, 34 intentos de 2 puntos y 7 sin explicación. | Desglose completo. |
| 20 penalizaciones sin nombre de falta: "revisar caso por caso". | Son faltas de equipo y el nombre se lee del texto. | Ver sección 3.2. |
| `pff_playAction` y el evento `play_action` son dos fuentes distintas. | Coinciden en 1,945 jugadas. Solo PFF: 93. Solo el evento: 26. | Cruce jugada por jugada. |
| `penaltyYards`: yardas de penalización. | Además, el signo indica el lado sancionado. | 604 de 604 coinciden con el lado del infractor. |
| 10 cuadros por segundo, el patrón del `gameId` y `pff_nflIdBlockedPlayer`, marcados como inferidos. | Verificados. | Cociente `dis / (s × 0.1)` de 1.002, 122 de 122 y 46,524 de 46,526. |
| Sin convención de ángulos. | `dir` mide desde +Y en sentido horario. | Error mediano de 1.3° contra el desplazamiento. |

Además se añadieron enlaces a este documento en la cabecera y en las secciones 3 y 6, y se aclaró en la sección 9 que las tablas pequeñas ocupan unos 15 MB en disco y unos 55 MB en memoria.
