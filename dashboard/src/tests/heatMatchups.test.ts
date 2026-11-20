import test from 'node:test'
import assert from 'node:assert/strict'
import { heatAlpha } from '../lib/heat.ts'
import { sortMatchups } from '../lib/matchupsLogic.ts'
import { getMatchups } from '../data/index.ts'

test('el mínimo y el máximo caen en los extremos de la rampa', () => {
  assert.equal(heatAlpha(10, 10, 20), 0.08)
  assert.equal(heatAlpha(20, 10, 20), 0.75)
  assert.equal(heatAlpha(15, 10, 20), 0.415)
})
test('sin rango usa un valor medio y los fuera de rango se recortan', () => {
  assert.equal(heatAlpha(5, 5, 5), 0.4)
  assert.equal(heatAlpha(99, 10, 20), 0.75)
  assert.equal(heatAlpha(-1, 10, 20), 0.08)
})
test('ordena duelos de mayor a menor y desempata por id', () => {
  const rows = getMatchups()
  const byWon = sortMatchups(rows, 'blocksWonPct')
  for (let i = 1; i < byWon.length; i++) assert.ok(byWon[i - 1].blocksWonPct >= byWon[i].blocksWonPct)
  const byAllowed = sortMatchups(rows, 'pressuresAllowed')
  for (let i = 1; i < byAllowed.length; i++) {
    const [p, c] = [byAllowed[i - 1], byAllowed[i]]
    assert.ok(p.pressuresAllowed > c.pressuresAllowed || (p.pressuresAllowed === c.pressuresAllowed && p.id < c.id))
  }
})
test('ordenar no modifica la lista original', () => {
  const rows = getMatchups()
  const ids = rows.map(r => r.id)
  sortMatchups(rows, 'snaps')
  assert.deepEqual(rows.map(r => r.id), ids)
})
