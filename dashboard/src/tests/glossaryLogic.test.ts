import test from 'node:test'
import assert from 'node:assert/strict'
import { groupByLetter, filterGlossary, findEntry } from '../lib/glossaryLogic.ts'
import { g } from '../sample/glossary.ts'
import { getGlossary } from '../data/index.ts'

const all = getGlossary()

test('agrupa por letra, ordena y manda lo que no es letra a # al final', () => {
  const entries = [g('b', 'plays', 'Blitz', 'x', 'Blitz', 'x'), g('t', 'plays', '2-Man', 'x', '2-Man', 'x'), g('a', 'plays', 'Árbol', 'x', 'Árbol', 'x'), g('a2', 'plays', 'Apple', 'x', 'Apple', 'x')]
  const groups = groupByLetter(entries, 'es')
  assert.deepEqual(groups.map(x => x.letter), ['A', 'B', '#'])
  assert.deepEqual(groups[0].entries.map(e => e.id), ['a2', 'a'])
})
test('buscar "cobertura" en español encuentra términos y definiciones sin distinguir acentos', () => {
  const ids = filterGlossary(all, 'es', 'COBERTURA', 'all').map(e => e.id)
  assert.ok(ids.includes('man'))
  assert.ok(ids.includes('cover0'))
})
test('filtrar por categoría data trae solo códigos inferidos', () => {
  const data = filterGlossary(all, 'en', '', 'data')
  assert.equal(data.length, 5)
  assert.ok(data.every(e => e.inferred === true))
})
test('findEntry devuelve undefined para un id inexistente', () => {
  assert.equal(findEntry(all, 'no-existe'), undefined)
  assert.equal(findEntry(all, 'cover0')?.id, 'cover0')
})
