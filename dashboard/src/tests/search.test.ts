import test from 'node:test'
import assert from 'node:assert/strict'
import { filterItems } from '../lib/search.ts'

const items = [{ label: 'Sección' }, { label: 'Cover-0' }, { label: 'Glosario', keywords: 'wiki terms' }]
test('coincide sin distinguir acentos', () => {
  assert.deepEqual(filterItems('seccion', items), [items[0]])
})
test('coincide sin distinguir mayúsculas', () => {
  assert.deepEqual(filterItems('COVER', items), [items[1]])
})
test('busca también en palabras clave', () => {
  assert.deepEqual(filterItems('wiki', items), [items[2]])
})
test('consulta vacía devuelve todo y sin coincidencias devuelve vacío', () => {
  assert.equal(filterItems('  ', items).length, 3)
  assert.deepEqual(filterItems('zzz', items), [])
})
