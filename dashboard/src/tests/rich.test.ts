import test from 'node:test'
import assert from 'node:assert/strict'
import { parseRich, plainText, withSampleMark } from '../lib/rich.ts'

const s = 'Against {cover0|Cover-0}, passers complete **55.1%**.'
test('separa texto, término y énfasis', () => {
  assert.deepEqual(parseRich(s), [
    { type: 'text', text: 'Against ' }, { type: 'term', id: 'cover0', text: 'Cover-0' },
    { type: 'text', text: ', passers complete ' }, { type: 'strong', text: '55.1%' }, { type: 'text', text: '.' },
  ])
})
test('texto plano sin marcas', () => {
  assert.equal(plainText(s), 'Against Cover-0, passers complete 55.1%.')
})
test('el texto copiado lleva la marca de datos de ejemplo', () => {
  assert.equal(withSampleMark('Hola', '(sample data)', true), 'Hola (sample data)')
  assert.equal(withSampleMark('Hola', '(sample data)', false), 'Hola')
})
