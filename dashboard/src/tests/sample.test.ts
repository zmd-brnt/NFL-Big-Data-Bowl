import test from 'node:test'
import assert from 'node:assert/strict'
import { IS_SAMPLE, getTeams, getGames, getPlays, getPlayers, getMatchups, getSchemes, getSituations, getGlossary, getOverview } from '../data/index.ts'

test('los datos son de ejemplo', () => {
  assert.equal(IS_SAMPLE, true)
})
test('32 equipos con 8 semanas por métrica', () => {
  const teams = getTeams()
  assert.equal(teams.length, 32)
  for (const t of teams) for (const k of ['comp', 'ya', 'press', 'sack'] as const) assert.equal(t.weekly[k].length, 8)
})
test('partidos por semana suman 122', () => {
  const counts = [1, 2, 3, 4, 5, 6, 7, 8].map(w => getGames(w).length)
  assert.deepEqual(counts, [16, 16, 16, 16, 16, 14, 13, 15])
  assert.equal(counts.reduce((a, b) => a + b), 122)
})
test('el partido del lunes de la semana 8 es el 1 de noviembre a las 8:15 p.m. ET', () => {
  const g = getGames(8)
  assert.equal(g[g.length - 1].kickoffIso, '2021-11-02T00:15:00Z')
})
test('ningún equipo juega dos veces en la misma semana', () => {
  for (let w = 1; w <= 8; w++) {
    const ids = getGames(w).flatMap(g => [g.home, g.away])
    assert.equal(new Set(ids).size, ids.length)
  }
})
test('resultados de pase válidos y jugadas con equipos distintos', () => {
  const plays = getPlays()
  assert.ok(plays.length >= 60)
  for (const p of plays) {
    assert.ok(['C', 'I', 'S', 'R', 'IN'].includes(p.passResult))
    assert.notEqual(p.possessionTeam, p.defensiveTeam)
    assert.ok(p.down >= 1 && p.down <= 4)
  }
})
test('hay jugadores de tres grupos', () => {
  const groups = new Set(getPlayers().map(p => p.group))
  assert.deepEqual([...groups].sort(), ['BLOCK', 'QB', 'RUSH'])
})
test('duelos, esquemas y situaciones traen datos', () => {
  assert.ok(getMatchups().length >= 12)
  assert.equal(getSchemes().cells.length, 5 * 6)
  assert.equal(getSituations().matrix.length, 3 * 4)
})
test('glosario con 40 términos o más, bilingüe y con ids únicos', () => {
  const g = getGlossary()
  assert.ok(g.length >= 40)
  assert.equal(new Set(g.map(e => e.id)).size, g.length)
  for (const e of g) {
    assert.ok(e.en.term && e.en.def && e.es.term && e.es.def, e.id)
    assert.ok(['positions', 'plays', 'schemes', 'metrics', 'data'].includes(e.cat), e.id)
  }
})
test('la jugada destacada gana 41 yardas', () => {
  assert.equal(getOverview().featuredPlay.playResult, 41)
})
