export type GlossaryCat = 'positions' | 'plays' | 'schemes' | 'metrics' | 'data'
export interface GlossaryEntry {
  id: string
  cat: GlossaryCat
  en: { term: string; def: string }
  es: { term: string; def: string }
  /** El significado se infirió de los datos; falta el diccionario oficial. */
  inferred?: boolean
}

export const g = (id: string, cat: GlossaryCat, enTerm: string, enDef: string, esTerm: string, esDef: string, inferred = false): GlossaryEntry =>
  ({ id, cat, en: { term: enTerm, def: enDef }, es: { term: esTerm, def: esDef }, ...(inferred ? { inferred: true } : {}) })

export const GLOSSARY_A: GlossaryEntry[] = [
  g('qb', 'positions', 'Quarterback (QB)', 'The offensive player who takes the snap and throws the pass.', 'Quarterback (QB)', 'Jugador ofensivo que recibe el snap y lanza el pase.'),
  g('rb', 'positions', 'Running back (RB)', 'Offensive player who runs with the ball, blocks or catches short passes.', 'Corredor (RB)', 'Jugador ofensivo que corre con el balón, bloquea o recibe pases cortos.'),
  g('wr', 'positions', 'Wide receiver (WR)', 'Offensive player who lines up wide and runs routes to catch passes.', 'Receptor abierto (WR)', 'Jugador ofensivo que se alinea abierto y corre rutas para recibir pases.'),
  g('te', 'positions', 'Tight end (TE)', 'Hybrid player who blocks like a lineman or catches like a receiver.', 'Ala cerrada (TE)', 'Jugador híbrido que bloquea como liniero o recibe como receptor.'),
  g('ol', 'positions', 'Offensive line (OL)', 'Tackles (T), guards (G) and the center (C). They protect the passer.', 'Línea ofensiva (OL)', 'Tackles (T), guards (G) y center (C). Protegen al pasador.'),
  g('dl', 'positions', 'Defensive line (DL)', 'Defensive ends (DE) and tackles (DT or NT). Their job is the pass rush.', 'Línea defensiva (DL)', 'Defensive ends (DE) y tackles (DT o NT). Su tarea es el pass rush.'),
  g('lb', 'positions', 'Linebacker (LB)', 'Defender behind the line who covers, rushes or stops the run.', 'Apoyador (LB)', 'Defensivo detrás de la línea que cubre, presiona o frena la carrera.'),
  g('cb', 'positions', 'Cornerback (CB)', 'Defender who covers the wide receivers.', 'Esquinero (CB)', 'Defensivo que cubre a los receptores abiertos.'),
  g('s', 'positions', 'Safety (FS, SS)', 'Last line of the defense. Free safety (FS) and strong safety (SS).', 'Safety (FS, SS)', 'Última línea de la defensiva. Free safety (FS) y strong safety (SS).'),
  g('snap', 'plays', 'Snap', 'The moment the center passes the ball back and the play starts.', 'Snap', 'Momento en que el center pasa el balón hacia atrás y empieza la jugada.'),
  g('down', 'plays', 'Down', 'One of four attempts the offense has to gain 10 yards.', 'Down', 'Uno de los cuatro intentos que tiene la ofensiva para avanzar 10 yardas.'),
  g('yards-to-go', 'plays', 'Yards to go', 'Yards still needed for a first down.', 'Yardas por avanzar', 'Yardas que faltan para el primer down.'),
  g('first-down', 'plays', 'First down', 'A new set of four downs, earned by reaching the line to gain.', 'Primer down', 'Nuevo set de cuatro downs, que se gana al llegar a la línea de primer down.'),
  g('red-zone', 'plays', 'Red zone', 'The area from the opponent 20-yard line to the goal line.', 'Red zone', 'Zona entre la yarda 20 del rival y la línea de gol.'),
  g('sack', 'plays', 'Sack', 'The passer is tackled behind the line of scrimmage before throwing.', 'Sack', 'El pasador es derribado detrás de la línea de scrimmage antes de lanzar.'),
  g('scramble', 'plays', 'Scramble', 'The quarterback leaves the pocket and runs when the pass breaks down.', 'Scramble', 'El quarterback sale de la bolsa y corre cuando la jugada de pase se rompe.'),
  g('interception', 'plays', 'Interception', 'A pass caught by the defense. The ball changes hands.', 'Intercepción', 'Pase atrapado por la defensiva. El balón cambia de equipo.'),
  g('touchdown', 'plays', 'Touchdown', 'Six points for carrying or catching the ball in the end zone.', 'Touchdown', 'Seis puntos por llevar o recibir el balón en la zona de anotación.'),
  g('two-minute', 'plays', 'Two-minute drill', 'Hurry-up offense in the last two minutes of a half.', 'Dos minutos', 'Ofensiva de emergencia en los últimos dos minutos de cada mitad.'),
  g('dropback', 'plays', 'Dropback', 'The quarterback steps back from the line to set up a pass.', 'Dropback', 'El quarterback retrocede desde la línea para preparar un pase.'),
]
