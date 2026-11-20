"""Rutas de la API, todas bajo /api. Son funciones síncronas: pandas es de CPU y FastAPI las corre en su pool de hilos."""
from fastapi import APIRouter, Query, Response

from . import vistas
from .esquemas import (GameSample, MatchupSample, OverviewData, PlayerSample, PlaySample, Schemes, Situations,
                       TeamProfile)

router = APIRouter(prefix="/api")


@router.get("/plays", response_model=list[PlaySample])
def plays(
    response: Response,
    down: int | None = Query(None, ge=1, le=4),
    quarter: int | None = Query(None, ge=1, le=5),
    bucket: vistas.Bucket | None = None,
    limit: int | None = Query(None, ge=1),
    offset: int = Query(0, ge=0),
):
    """Jugadas válidas en orden cronológico. El total sin paginar va en la cabecera X-Total-Count."""
    filas = vistas.plays(down, quarter, bucket)
    response.headers["X-Total-Count"] = str(len(filas))
    return filas[offset:] if limit is None else filas[offset:offset + limit]


@router.get("/games", response_model=list[GameSample])
def games(week: int = Query(..., ge=1, le=8)):
    return vistas.games(week)


@router.get("/overview", response_model=OverviewData)
def overview():
    return vistas.overview()


@router.get("/teams", response_model=list[TeamProfile])
def teams():
    return vistas.teams()


@router.get("/players", response_model=list[PlayerSample])
def players():
    return vistas.players()


@router.get("/matchups", response_model=list[MatchupSample])
def matchups(min_snaps: int = Query(vistas.MIN_SNAPS_DUELO, ge=1), limit: int = Query(200, ge=1, le=2000)):
    return vistas.matchups(min_snaps, limit)


@router.get("/schemes", response_model=Schemes)
def schemes():
    return vistas.schemes()


@router.get("/situations", response_model=Situations)
def situations():
    return vistas.situations()
