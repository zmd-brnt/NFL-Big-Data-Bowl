import test from 'node:test'
import assert from 'node:assert/strict'
import { motionAttrs, DUR, S, T, C, E } from '../lib/fieldMarkup.ts'

test('los hitos de la jugada están en orden y dentro del ciclo', () => {
  assert.ok(0 < S && S < T && T < C && C < E && E < 1)
  assert.equal(DUR, 6.5)
  assert.equal((T * DUR).toFixed(1), '3.3')
})
test('un recorrido con pausa genera keyPoints y keyTimes crecientes de 0 a 1', () => {
  const m = motionAttrs([[0, 0], [10, 0], [10, 10]], [[0, 0], [0, S], [2, E], [2, 1]])
  const pts = m.keyPoints.split(';').map(Number)
  const times = m.keyTimes.split(';').map(Number)
  assert.equal(pts[0], 0)
  assert.equal(pts[pts.length - 1], 1)
  assert.equal(times[0], 0)
  assert.equal(times[times.length - 1], 1)
  for (let i = 1; i < times.length; i++) assert.ok(times[i] >= times[i - 1] && pts[i] >= pts[i - 1])
  assert.equal(m.path, 'M0 0 L10 0 L10 10')
})
test('keyPoints se calcula sobre la longitud del recorrido', () => {
  const m = motionAttrs([[0, 0], [30, 0], [30, 10]], [[0, 0], [1, 0.5], [2, 1]])
  assert.equal(m.keyPoints, '0.0000;0.7500;1.0000')
})
