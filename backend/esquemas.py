"""Formas de las respuestas. Los nombres de campo son los de dashboard/src/sample/*.ts (camelCase y pff_*)."""
from typing import Literal

from pydantic import BaseModel


class PlaySample(BaseModel):
    gameId: int
    playId: int
    quarter: int
    gameClock: str
    down: int
    yardsToGo: int
    possessionTeam: str
    defensiveTeam: str
    yardlineSide: str
    yardlineNumber: int
    offenseFormation: str
    pff_passCoverage: str
    pff_playAction: Literal[0, 1]
    passResult: Literal["C", "I", "S", "R", "IN"]
    prePenaltyPlayResult: int
    playDescription: str


class TeamGameStats(BaseModel):
    comp: float
    ya: float
    press: float
    sack: float
    attempts: int


class GameStats(BaseModel):
    home: TeamGameStats
    away: TeamGameStats


class GameSample(BaseModel):
    gameId: int
    week: int
    home: str
    away: str
    kickoffIso: str
    stats: GameStats


MetricKey = Literal["comp", "ya", "press", "sack"]


class Share(BaseModel):
    name: str
    share: float


class TeamProfile(BaseModel):
    id: str
    weekly: dict[MetricKey, list[float]]
    avg: dict[MetricKey, float]
    formations: list[Share]
    coverages: list[Share]


class CoverageComp(BaseModel):
    pff_passCoverage: str
    compPct: float


class BestGame(BaseModel):
    away: str
    home: str
    week: int
    kickoffIso: str
    passYards: int
    bigPlays: int


class OverviewPlayer(BaseModel):
    name: str
    pos: str
    team: str
    jersey: int
    college: str | None
    yardsPerAttempt: float
    compPct: float
    heightIn: int
    weightLb: int


class OverviewTeam(BaseModel):
    id: str
    yardsPerAttempt: float
    pressedPct: float


class OverviewRusher(BaseModel):
    name: str
    pos: str
    team: str
    jersey: int
    pressures: int
    sacks: int
    topSpeedYdS: float


class FeaturedPlay(BaseModel):
    down: int
    yardsToGo: int
    yardlineSide: str
    yardlineNumber: int
    offenseFormation: str
    pff_passCoverage: str
    rushers: int
    timeToThrowS: float
    playResult: int
    offense: str
    defense: str


class OverviewData(BaseModel):
    weeklyKpi: dict[MetricKey, list[float]]
    coverage: list[CoverageComp]
    leagueComp: float
    best: BestGame
    player: OverviewPlayer
    team: OverviewTeam
    rusher: OverviewRusher
    featuredPlay: FeaturedPlay
    playActionGain: float
    pressureLowWeek: int


class PlayerSample(BaseModel):
    nflId: int
    displayName: str
    officialPosition: str
    group: Literal["QB", "RUSH", "BLOCK"]
    team: str
    jersey: int
    heightIn: int
    weightLb: int
    collegeName: str | None  # vacío en los datos para 224 jugadores
    age: int | None  # sin fecha de nacimiento para 232 jugadores
    metrics: dict[str, float]


class Person(BaseModel):
    name: str
    team: str
    pos: str


class MatchupSample(BaseModel):
    id: int
    blocker: Person
    rusher: Person
    snaps: int
    blocksWonPct: float
    pressuresAllowed: int
    sacksAllowed: int


class SchemeCell(BaseModel):
    formation: str
    coverage: str
    plays: int
    compPct: float
    yardsPerAttempt: float


class PlayActionStats(BaseModel):
    plays: int
    compPct: float
    yardsPerAttempt: float


class PlayActionSplit(BaseModel):
    withPlayAction: PlayActionStats
    without: PlayActionStats


class Schemes(BaseModel):
    cells: list[SchemeCell]
    playAction: PlayActionSplit


class SituationCell(BaseModel):
    down: int
    bucket: Literal["1-3", "4-6", "7-10", "11+"]
    plays: int
    compPct: float
    yardsPerAttempt: float
    firstDownPct: float


class SituationRow(BaseModel):
    id: Literal["redZone", "twoMinute", "rest"]
    plays: int
    compPct: float
    yardsPerAttempt: float
    sackPct: float


class Situations(BaseModel):
    matrix: list[SituationCell]
    special: list[SituationRow]
