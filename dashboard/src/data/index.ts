/**
 * Capa de datos: una función por vista. Hoy devuelve datos de ejemplo.
 * Más adelante cada función llamará a fetch('api/...') con los mismos tipos.
 */
import { makeTeams, type TeamProfile } from '../sample/teams.ts'
import { makeGames, type GameSample } from '../sample/games.ts'
import { makePlays, type PlaySample } from '../sample/plays.ts'
import { makePlayers, makeMatchups, type PlayerSample, type MatchupSample } from '../sample/players.ts'
import { makeSchemes, makeSituations } from '../sample/schemes.ts'
import { makeOverview, type OverviewData } from '../sample/overview.ts'
import { GLOSSARY_A, type GlossaryEntry } from '../sample/glossary.ts'
import { GLOSSARY_B } from '../sample/glossary2.ts'

export const IS_SAMPLE = true

export type { TeamProfile, GameSample, PlaySample, PlayerSample, MatchupSample, OverviewData, GlossaryEntry }

export const getTeams = (): TeamProfile[] => makeTeams()
export const getGames = (week: number): GameSample[] => makeGames(week)
export const getPlays = (): PlaySample[] => makePlays()
export const getPlayers = (): PlayerSample[] => makePlayers()
export const getMatchups = (): MatchupSample[] => makeMatchups()
export const getSchemes = () => makeSchemes()
export const getSituations = () => makeSituations()
export const getOverview = (): OverviewData => makeOverview()
export const getGlossary = (): GlossaryEntry[] => [...GLOSSARY_A, ...GLOSSARY_B]
