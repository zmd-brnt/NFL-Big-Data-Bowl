import type { GameSample } from '../sample/games.ts'

export const filterGames = (games: GameSample[], team: string): GameSample[] =>
  team === 'all' ? games : games.filter(g => g.home === team || g.away === team)
