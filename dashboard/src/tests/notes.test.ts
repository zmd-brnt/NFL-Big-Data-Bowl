import test from 'node:test'
import assert from 'node:assert/strict'
import { parseNotes, addNote, removeNote, serializeNotes, type Note } from '../lib/notesStore.ts'

const n = (id: string): Note => ({ id, en: 'a', es: 'b', sample: true })
test('JSON corrupto o nulo da lista vacía', () => {
  assert.deepEqual(parseNotes('{{'), [])
  assert.deepEqual(parseNotes(null), [])
  assert.deepEqual(parseNotes('{"a":1}'), [])
})
test('descarta elementos inválidos y conserva los buenos', () => {
  const raw = JSON.stringify([n('x'), { bad: 1 }, { id: 3, en: 'a', es: 'b', sample: true }])
  assert.deepEqual(parseNotes(raw), [n('x')])
})
test('agregar el mismo id dos veces no duplica', () => {
  assert.equal(addNote(addNote([], n('x')), n('x')).length, 1)
})
test('quitar elimina por id y serializar es reversible', () => {
  const list = addNote(addNote([], n('x')), n('y'))
  assert.deepEqual(removeNote(list, 'x'), [n('y')])
  assert.deepEqual(parseNotes(serializeNotes(list)), list)
})
