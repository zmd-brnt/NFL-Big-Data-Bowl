import test from 'node:test'
import assert from 'node:assert/strict'
import { betterSide, playersOfGroup, scaleMax } from '../lib/playersLogic.ts'
import { getPlayers } from '../data/index.ts'

test('más es mejor en completos y menos es mejor en presión recibida', () => {
  assert.equal(betterSide('compPct', 60, 65), 'b')
  assert.equal(betterSide('pressuredPct', 20, 30), 'a')
  assert.equal(betterSide('pressuresAllowed', 9, 3), 'b')
})
test('métricas sin sentido de mejor o peor no resaltan a nadie', () => {
  assert.equal(betterSide('timeToThrowS', 2, 3), null)
  assert.equal(betterSide('snaps', 100, 200), null)
})
test('un empate se reporta como tie', () => {
  assert.equal(betterSide('sacks', 5, 5), 'tie')
})
test('playersOfGroup devuelve solo ese grupo, ordenado por nombre', () => {
  const qbs = playersOfGroup(getPlayers(), 'QB')
  assert.equal(qbs.length, 6)
  assert.ok(qbs.every(p => p.group === 'QB'))
  assert.deepEqual(qbs.map(p => p.displayName), [...qbs.map(p => p.displayName)].sort())
})
test('scaleMax es el mayor valor de la métrica en el grupo y nunca cero', () => {
  const rush = playersOfGroup(getPlayers(), 'RUSH')
  assert.equal(scaleMax(rush, 'pressures'), Math.max(...rush.map(p => p.metrics.pressures)))
  assert.equal(scaleMax([], 'pressures'), 1)
})
