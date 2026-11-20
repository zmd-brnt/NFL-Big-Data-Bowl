import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPoints } from '../lib/talkingPoints.ts'
import { getOverview } from '../data/index.ts'

const points = buildPoints(getOverview())

test('hay tres puntos con id estable', () => {
  assert.deepEqual(points.map(p => p.id), ['n1', 'n2', 'n3'])
})
test('el primero usa la cobertura con menos completos y su diferencia con el promedio', () => {
  assert.ok(points[0].en.includes('{cover0|Cover-0}'))
  assert.ok(points[0].en.includes('**55.1%**'))
  assert.ok(points[0].en.includes('6.0 points under'))
  assert.ok(points[0].es.includes('6.0 puntos por debajo'))
})
test('el segundo toma la semana de menor presión de los datos', () => {
  assert.ok(points[1].en.includes('week 8'))
  assert.ok(points[1].en.includes('**29.8%**'))
  assert.ok(points[1].es.includes('semana 8'))
})
test('el tercero cita la ganancia de play action', () => {
  assert.ok(points[2].en.includes('**1.9 yards**'))
})
