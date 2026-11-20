# Dashboard para comentaristas: plan de implementación

> **Para quien lo ejecute:** usar superpowers:executing-plans. Los pasos usan casillas `- [ ]`.

**Meta:** construir en `dashboard/` la parte visual (sin datos reales) de la dirección A con split-flap.
**Arquitectura:** React con navegación por hash, diccionario propio EN/ES, datos de ejemplo agregados por vista detrás de `src/data/`, componentes visuales en SVG propio y Recharts.
**Stack:** React 18.3.1, Vite 5.4.21, TypeScript 5.7.3, Tailwind 3.4.19, Recharts 3.10.1. Sin dependencias nuevas.
**Especificación:** [2026-11-20-dashboard-comentaristas-design.md](../specs/2026-11-20-dashboard-comentaristas-design.md)

## Restricciones globales

- Rutas del dashboard relativas y sin diagonal inicial. Nada de `localhost` ni URLs absolutas en `src/` (el proxy vive en `vite.config.ts`).
- `base: './'` en Vite. Sintaxis de Tailwind 3. No tocar `backend/`, `data/` ni `README.md`.
- Textos de interfaz solo vía `t()`. Términos que se quedan en inglés: quarterback, snap, sack, blitz, shotgun, play action, down, red zone, scramble, touchdown, pass rush, pass rusher, hurry, Cover-N, first down.
- Colores: césped `#10201A`, tiza `#EEF1EA`, secundario `#9DB0A5`, azul `#4C8DFF` (referencia), amarillo `#FFD43B` (destacado), coral `#FF6B5E` (presión).
- Respetar `prefers-reduced-motion` y `prefers-reduced-transparency`. Cada página muestra la etiqueta de datos de ejemplo.
- Pruebas de lógica pura con `node --test --experimental-strip-types` (sin dependencias). Los módulos probados no importan nada fuera de sí mismos salvo con extensión `.ts`.

## Review Focus

1. Hash desconocido o `#/glossary/idinexistente`: cae en Overview o en el glosario sin error (prueba de `parseHash`).
2. `localStorage` ausente o con JSON corrupto (idioma, unidad, notas): valores por defecto sin excepción (prueba de `parseNotes`).
3. Búsqueda sin resultados y consulta con mayúsculas o acentos: lista vacía con mensaje, coincidencia sin distinguir acentos (prueba de `filterItems`).
4. Cambiar idioma o unidad con una pieza interactiva abierta (semana, jugada, comparador): conserva el estado.
5. Ventana de 390 px: la barra lateral se superpone, las tablas hacen scroll horizontal y nada desborda.

## Estructura de archivos

```
dashboard/src/
  lib/        route.ts, notesStore.ts, search.ts, flap.ts, fieldMarkup.ts, useReducedMotion.ts
  i18n/       format.ts, dict.ts, LangContext.tsx
  sample/     teams.ts, overview.ts, games.ts, plays.ts, players.ts, glossary.ts
  data/       index.ts
  components/ ui.tsx, Sidebar.tsx, TopBar.tsx, CommandPalette.tsx, SplitFlap.tsx, Sparkline.tsx,
              DotPlot.tsx, FieldPlay.tsx, Term.tsx, TalkingPoints.tsx, YardStrip.tsx
  pages/      Overview, Games, Plays, Teams, Players, Matchups, Schemes, Situations, BoothNotes, Glossary, DataNotes
  tests/      *.test.ts
```

---

### Tarea 1: Base (configuración, rutas, formatos, diccionario)

**Archivos:** modificar `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `index.css`, `index.html`, `package.json` (solo agregar el script `test`); crear `lib/route.ts`, `i18n/format.ts`, `i18n/dict.ts`, `i18n/LangContext.tsx`, `tests/route.test.ts`, `tests/format.test.ts`, `tests/dict.test.ts`.

**Interfaces — produce:**
- `type RouteId = 'overview'|'games'|'plays'|'teams'|'players'|'matchups'|'schemes'|'situations'|'notes'|'glossary'|'data'`
- `ROUTES: {id: RouteId; icon: string; group: 0|1|2}[]`, `parseHash(hash: string): {id: RouteId; param?: string}`
- `type Lang = 'en'|'es'`, `type Unit = 'yd'|'m'`
- `formatKickoff(iso, lang)`, `formatHeight(inches, lang)`, `formatWeight(lb, lang)`, `formatSpeed(ydPerSec, lang)`, `formatYards(yd, unit)`, `formatDown(down, toGo, lang)`, `formatPct(v)`
- `dict: Record<Lang, Record<DictKey, string>>`, `useLang(): {lang, setLang, unit, setUnit, t(key, vars?)}`

- [ ] Pruebas: `parseHash('')` y `parseHash('#/nope')` dan `overview`; `parseHash('#/glossary/cover0')` da `{id:'glossary', param:'cover0'}`. `formatKickoff('2021-10-10T17:00:00Z','es')` = `dom 10/10/2021, 12:00 h (CDMX)` y en inglés `Sun, Oct 10, 2021, 1:00 PM ET`. `formatHeight(76,'es')`=`1.93 m` y `'en'`=`6-4`. `formatWeight(225,'es')`=`102 kg`. `formatSpeed(7.77,'en')`=`15.9 mph` y `'es'`=`25.6 km/h`. `formatYards(41,'m')`=`37.5 m`. `formatDown(3,8,'es')`=`3.º y 8`. Las claves de `dict.en` y `dict.es` son idénticas.
- [ ] Ejecutar `npm test` y ver que falla; implementar; ver que pasa.
- [ ] `vite.config.ts`: proxy `/api` a `http://localhost:8000`, conservar `base: './'`. `tsconfig.json`: `allowImportingTsExtensions` y excluir `src/tests`. `index.html`: `lang="en"`, título. `tailwind.config.js`: colores del sistema. `index.css`: variables, reducción de movimiento y reglas de impresión.
- [ ] `npm run build` pasa.

### Tarea 2: Datos de ejemplo y capa `data/`

**Archivos:** crear `sample/*.ts`, `data/index.ts`, `tests/sample.test.ts`.

**Interfaces — produce:** `IS_SAMPLE = true`; funciones síncronas `getOverview()`, `getGames(week)`, `getPlays()`, `getTeams()`, `getPlayers()`, `getMatchups()`, `getSchemes()`, `getSituations()`, `getGlossary()` con tipos que usan nombres de columna reales (`passResult`, `prePenaltyPlayResult`, `pff_passCoverage`, `offenseFormation`). Datos deterministas (generador con semilla).

- [ ] Prueba: 32 equipos; 8 semanas por equipo; `getGames(1)` devuelve 16 partidos; todo `passResult` pertenece a `C|I|S|R|IN`; el glosario tiene al menos 40 entradas, cada una con `en` y `es`.
- [ ] Fallar, implementar, pasar.

### Tarea 3: Componentes visuales base

**Archivos:** crear `lib/flap.ts`, `lib/search.ts`, `lib/notesStore.ts`, `lib/useReducedMotion.ts`, `components/{ui,SplitFlap,Sparkline,DotPlot,Term,YardStrip}.tsx`, `tests/{flap,search,notes}.test.ts`.

**Interfaces — produce:**
- `flapChars(value: string): {ch: string; dot: boolean}[]`
- `filterItems<T extends {label: string}>(q: string, items: T[]): T[]` (sin distinguir mayúsculas ni acentos)
- `parseNotes(raw: string|null): Note[]` (JSON corrupto da `[]`), `addNote`, `removeNote`, tipo `Note {id: string; text: string; sample: boolean}`
- `<SplitFlap value label unit? rollKey? />`, `<Sparkline values sel? min? max? />`, `<DotPlot rows ref highlight title />`, `<Term id>text</Term>`, `<Panel>`, `<Seg>`

- [ ] Pruebas: `flapChars('62.0')` = cuatro elementos con el punto marcado. `filterItems('seccion',[{label:'Sección'}])` coincide. `parseNotes('{{')` = `[]`.
- [ ] Implementar `SplitFlap`: 7 giros de 70 ms con desfase de 90 ms por mosaico, `role="img"` con `aria-label`, sin giro con movimiento reducido.

### Tarea 4: Estructura de la app (barra lateral, barra superior, paleta de comandos)

**Archivos:** crear `components/{Sidebar,TopBar,CommandPalette}.tsx`; modificar `App.tsx`, `main.tsx`.

**Interfaces — consume:** `ROUTES`, `parseHash`, `useLang`, `filterItems`, `getTeams`, `getPlayers`, `getGlossary`.

- [ ] Barra lateral de 68 px que se expande a 272 px superpuesta, con vidrio translúcido, descripciones, separadores por grupo, Esc y clic fuera para cerrar.
- [ ] Barra superior: título, etiqueta de datos de ejemplo, búsqueda (Ctrl K), interruptor EN/ES e interruptor yd/m.
- [ ] Paleta: páginas, equipos, jugadores y términos; flechas y Enter; mensaje sin resultados.
- [ ] `npm run build` y revisión visual con una captura.

### Tarea 5: Overview

**Archivos:** crear `components/{FieldPlay,TalkingPoints}.tsx`, `lib/fieldMarkup.ts`, `pages/Overview.tsx`.

- [ ] `FieldPlay`: SVG de 1200 × 533 con ciclo de 6.5 s (snap 0.6 s, lanzamiento 3.3 s, recepción 4.7 s), pausa, repetición, línea de tiempo y cuadro final con movimiento reducido.
- [ ] Overview según la sección 6 de la especificación: campo y datos de la jugada, cuatro destacados, pulso con split-flap y selector W1 a W8, gráfica de puntos por cobertura, puntos para comentar con copiar y fijar.
- [ ] Copiar agrega "(sample data)" o "(datos de ejemplo)".

### Tarea 6: Glosario y Notas de cabina

**Archivos:** crear `pages/{Glossary,BoothNotes}.tsx`.

- [ ] Glosario: búsqueda, cinco categorías, navegación por letra, entrada enlazada por `#/glossary/<id>` resaltada, códigos inferidos marcados.
- [ ] Notas de cabina: lista de puntos fijados (`localStorage`), quitar, imprimir con `window.print()` y marca de agua de datos de ejemplo.

### Tarea 7: Partidos y Jugadas

**Archivos:** crear `pages/{Games,Plays}.tsx`.

- [ ] Partidos: selector de semana y equipo, tarjetas con hora local formateada, detalle con barras comparativas (Recharts).
- [ ] Jugadas: filtros por down, distancia y cuarto, tabla con scroll horizontal, detalle con `YardStrip` y descripción.

### Tarea 8: Equipos y Jugadores

**Archivos:** crear `pages/{Teams,Players}.tsx`.

- [ ] Equipos: selector principal y de comparación, barras de cinco métricas, mezcla de formaciones y coberturas enfrentadas.
- [ ] Jugadores: dos selectores, fichas con estatura y peso según idioma, comparación en tabla con barras.

### Tarea 9: Duelos, Esquemas y Situaciones

**Archivos:** crear `pages/{Matchups,Schemes,Situations}.tsx`.

- [ ] Duelos: orden por bloqueos ganados o presiones permitidas, dispersión en Recharts.
- [ ] Esquemas: mapa de calor formación por cobertura con selector de métrica, y play action contra sin play action.
- [ ] Situaciones: matriz down por distancia con selector de métrica, red zone y últimos 2 minutos.

### Tarea 10: Notas de datos y verificación final

**Archivos:** crear `pages/DataNotes.tsx`.

- [ ] Alcance, calidad y faltantes tomados de las secciones 5, 6 y 8 de `AnalisisData.md`.
- [ ] `npm test`, `npm run build` y `sh .hackathon/setup.sh --check` pasan.
- [ ] Búsqueda de `"/api`, `'/`, `localhost` y `http` en `src/`: cero resultados problemáticos.
- [ ] Capturas a 1440 y 390 px, en inglés y en español, de cada apartado. Se corrige lo que se vea roto.
