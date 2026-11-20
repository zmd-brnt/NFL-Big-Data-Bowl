import test from 'node:test'
import assert from 'node:assert/strict'
import { distanceBucket, isFirstDown, filterPlays, ownYardLine } from '../lib/playsLogic.ts'
import { filterGames } from '../lib/gamesLogic.ts'
import { getPlays, getGames } from '../data/index.ts'

test('cubetas de distancia', () => {
  const got = [1, 3, 4, 6, 7, 10, 11, 25].map(distanceBucket)
  assert.deepEqual(got, ['1-3', '1-3', '4-6', '4-6', '7-10', '7-10', '11+', '11+'])
})
test('primer down solo en completos o scrambles que alcanzan la distancia', () => {
  assert.equal(isFirstDown({ passResult: 'C', prePenaltyPlayResult: 8, yardsToGo: 8 }), true)
  assert.equal(isFirstDown({ passResult: 'C', prePenaltyPlayResult: 7, yardsToGo: 8 }), false)
  assert.equal(isFirstDown({ passResult: 'R', prePenaltyPlayResult: 12, yardsToGo: 10 }), true)
  assert.equal(isFirstDown({ passResult: 'I', prePenaltyPlayResult: 0, yardsToGo: 1 }), false)
  assert.equal(isFirstDown({ passResult: 'S', prePenaltyPlayResult: -6, yardsToGo: 1 }), false)
})
test('filtra por down, distancia y cuarto a la vez', () => {
  const plays = getPlays()
  const out = filterPlays(plays, { down: 3, bucket: '7-10', quarter: 'all' })
  assert.ok(out.every(p => p.down === 3 && distanceBucket(p.yardsToGo) === '7-10'))
  assert.equal(filterPlays(plays, { down: 'all', bucket: 'all', quarter: 'all' }).length, plays.length)
  const q2 = filterPlays(plays, { down: 'all', bucket: 'all', quarter: 2 })
  assert.ok(q2.length > 0 && q2.every(p => p.quarter === 2))
})
test('yarda desde la zona de gol propia', () => {
  assert.equal(ownYardLine({ yardlineSide: 'BUF', possessionTeam: 'BUF', yardlineNumber: 44 }), 44)
  assert.equal(ownYardLine({ yardlineSide: 'MIA', possessionTeam: 'BUF', yardlineNumber: 44 }), 56)
})
test('filtrar partidos por equipo', () => {
  const games = getGames(1)
  assert.equal(filterGames(games, 'all').length, 16)
  const team = games[3].home
  const out = filterGames(games, team)
  assert.equal(out.length, 1)
  assert.ok(out[0].home === team || out[0].away === team)
  assert.deepEqual(filterGames(games, 'XXX'), [])
})
