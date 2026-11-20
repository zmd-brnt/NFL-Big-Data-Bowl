import test from 'node:test'
import assert from 'node:assert/strict'
import { dict, interpolate } from '../i18n/dict.ts'

test('inglés y español tienen las mismas claves', () => {
  assert.deepEqual(Object.keys(dict.en).sort(), Object.keys(dict.es).sort())
})
test('ningún texto está vacío', () => {
  for (const lang of ['en', 'es'] as const)
    for (const [k, v] of Object.entries(dict[lang])) assert.ok(v.trim().length > 0, `${lang}.${k}`)
})
test('interpolate reemplaza variables y deja las que faltan', () => {
  assert.equal(interpolate('Semana {n} de {m}', { n: 3 }), 'Semana 3 de {m}')
})
