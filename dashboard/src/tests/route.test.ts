import test from 'node:test'
import assert from 'node:assert/strict'
import { parseHash, ROUTES } from '../lib/route.ts'

test('hash vacío cae en overview', () => {
  assert.deepEqual(parseHash(''), { id: 'overview' })
})
test('hash desconocido cae en overview', () => {
  assert.deepEqual(parseHash('#/nope'), { id: 'overview' })
})
test('glosario con parámetro', () => {
  assert.deepEqual(parseHash('#/glossary/cover0'), { id: 'glossary', param: 'cover0' })
})
test('hay once rutas y overview es la primera', () => {
  assert.equal(ROUTES.length, 11)
  assert.equal(ROUTES[0].id, 'overview')
})
