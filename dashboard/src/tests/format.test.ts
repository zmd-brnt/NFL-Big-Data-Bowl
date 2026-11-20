import test from 'node:test'
import assert from 'node:assert/strict'
import { formatKickoff, formatHeight, formatWeight, formatSpeed, formatYards, formatDown, formatPct } from '../i18n/format.ts'

test('hora de inicio en español de México', () => {
  assert.equal(formatKickoff('2021-10-10T17:00:00Z', 'es'), 'dom 10/10/2021, 12:00 h (CDMX)')
})
test('hora de inicio en inglés', () => {
  assert.equal(formatKickoff('2021-10-10T17:00:00Z', 'en'), 'Sun, Oct 10, 2021, 1:00 PM ET')
})
test('lunes 1 de noviembre tiene 2 horas de diferencia con México', () => {
  assert.equal(formatKickoff('2021-11-02T00:15:00Z', 'es'), 'lun 01/11/2021, 18:15 h (CDMX)')
})
test('estatura', () => {
  assert.equal(formatHeight(76, 'es'), '1.93 m')
  assert.equal(formatHeight(76, 'en'), '6-4')
})
test('peso', () => {
  assert.equal(formatWeight(225, 'es'), '102 kg')
  assert.equal(formatWeight(225, 'en'), '225 lb')
})
test('velocidad', () => {
  assert.equal(formatSpeed(7.77, 'en'), '15.9 mph')
  assert.equal(formatSpeed(7.77, 'es'), '25.6 km/h')
})
test('yardas y metros', () => {
  assert.equal(formatYards(41, 'yd'), '41 yd')
  assert.equal(formatYards(41, 'm'), '37.5 m')
})
test('down y distancia', () => {
  assert.equal(formatDown(3, 8, 'es'), '3.º y 8')
  assert.equal(formatDown(3, 8, 'en'), '3rd & 8')
  assert.equal(formatDown(4, 1, 'en'), '4th & 1')
})
test('porcentaje con un decimal', () => {
  assert.equal(formatPct(62), '62.0%')
})
