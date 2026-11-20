import test from 'node:test'
import assert from 'node:assert/strict'
import { flapChars } from '../lib/flap.ts'

test('62.0 se separa en tres dígitos y un punto', () => {
  assert.deepEqual(flapChars('62.0'), [
    { ch: '6', dot: false }, { ch: '2', dot: false }, { ch: '.', dot: true }, { ch: '0', dot: false },
  ])
})
test('un entero no trae punto', () => {
  assert.equal(flapChars('29').some(c => c.dot), false)
})
